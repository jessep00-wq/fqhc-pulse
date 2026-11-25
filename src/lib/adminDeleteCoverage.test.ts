import { afterAll, describe, expect, it } from "vitest";
import postgres from "postgres";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

const databaseUrl = process.env["SUPABASE_DB_URL"];
const sql = databaseUrl ? postgres(databaseUrl, { max: 1, prepare: false }) : null;
const migration = readFileSync("drizzle/migrations/0008_guard_admin_organization_delete_coverage.sql", "utf8");

async function definitions() {
  if (!sql) return migration;
  const [row] = await sql`SELECT
    pg_get_functiondef('public.admin_delete_organization(uuid)'::regprocedure) AS deletion,
    pg_get_functiondef('public.admin_org_delete_coverage()'::regprocedure) AS coverage`;
  if (!row) throw new Error("Deletion functions not found");
  return `${row['coverage']};\n${row['deletion']};`;
}

function coveredTables(definition: string) {
  const array = definition.split("ARRAY[")[1]?.split("]::text[]")[0];
  if (!array) throw new Error("Coverage list not found");
  return [...array.matchAll(/'([a-z_]+)'/g)].map(match => String(match[1])).sort();
}

// The installed SQL runs unchanged inside a disposable PostgreSQL engine.
// Only auth identities and minimal fixture tables are supplied. No live writes.
async function withFixture(test: (db: PGlite, orgId: string, founderId: string) => Promise<void>) {
  const definition = await definitions();
  const founderId = randomUUID();
  const orgId = randomUUID();
  const db = new PGlite();
  try {
    await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
      CREATE SCHEMA auth;
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$
        SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      CREATE FUNCTION public.is_founder_admin(_id uuid) RETURNS boolean LANGUAGE sql AS $$
        SELECT _id = '${founderId}'::uuid $$;`);
    for (const table of coveredTables(definition)) {
      await db.exec(`CREATE TABLE public.${table} (id uuid, organization_id uuid)`);
    }
    await db.exec('CREATE TABLE public.organizations (id uuid)');
    await db.exec(definition);
    await db.query("SELECT set_config('request.jwt.claim.sub', $1, false)", [founderId]);
    await db.query('INSERT INTO public.organizations VALUES ($1)', [orgId]);
    await db.query('INSERT INTO public.tasks VALUES ($1, $2)', [randomUUID(), orgId]);
    await db.query('INSERT INTO public.profiles VALUES ($1, $2)', [founderId, orgId]);
    await test(db, orgId, founderId);
  } finally {
    await db.close();
  }
}

async function count(db: PGlite, table: string, column: string, value: string) {
  const result = await db.query<{ count: number }>(`SELECT count(*)::integer AS count FROM public.${table} WHERE ${column}=$1`, [value]);
  return result.rows[0]?.count;
}

describe("health center deletion database safety", () => {
  afterAll(async () => { await sql?.end(); });

  it("keeps the coverage list equal to the fixed handling statements without dynamic SQL", async () => {
    const definition = await definitions();
    const handled = [...definition.matchAll(/(?:DELETE FROM|UPDATE) public\.(\w+) (?:SET organization_id = NULL|WHERE organization_id = _org_id)/g)]
      .map(match => String(match[1])).sort();
    expect(coveredTables(definition)).toEqual(handled);
    // Ignore DDL grants in the offline migration, not function bodies.
    const bodies = [...definition.matchAll(/AS \$function\$([\s\S]*?)\$function\$/g)].map(match => match[1]).join('\n');
    expect(bodies).not.toMatch(/\bEXECUTE\b/i);
    await withFixture(async (db) => {
      expect((await db.query('SELECT * FROM public.admin_org_delete_coverage()')).rows).toHaveLength(0);
    });
  }, 30000);

  it.skipIf(!sql)("covers every live health center table", async () => {
    if (!sql) throw new Error('Database connection required');
    const tables = await sql`SELECT c.table_name FROM information_schema.columns c
      JOIN information_schema.tables t ON t.table_schema=c.table_schema AND t.table_name=c.table_name
      WHERE c.table_schema='public' AND c.column_name='organization_id' AND t.table_type='BASE TABLE'`;
    expect(tables.map(row => row['table_name']).sort()).toEqual(coveredTables(await definitions()));
  });

  it("stops before writes when a future health center table is missing from coverage", async () => {
    await withFixture(async (db, orgId, founderId) => {
      await db.exec('CREATE TABLE public.uncovered_data (organization_id uuid)');
      await db.query('INSERT INTO public.uncovered_data VALUES ($1)', [orgId]);
      expect((await db.query('SELECT * FROM public.admin_org_delete_coverage()')).rows)
        .toEqual([{ table_name: 'uncovered_data' }]);
      await db.exec('SET ROLE authenticated');
      await expect(db.query('SELECT public.admin_delete_organization($1::uuid)', [orgId]))
        .rejects.toMatchObject({ code: 'P0001' });
      await db.exec('RESET ROLE');
      expect(await count(db, 'organizations', 'id', orgId)).toBe(1);
      expect(await count(db, 'tasks', 'organization_id', orgId)).toBe(1);
      expect(await count(db, 'profiles', 'organization_id', orgId)).toBe(1);
      expect(await count(db, 'profiles', 'id', founderId)).toBe(1);
      expect(await count(db, 'uncovered_data', 'organization_id', orgId)).toBe(1);
    });
  }, 30000);

  it("allows a founder to delete covered records while retaining the user profile", async () => {
    await withFixture(async (db, orgId, founderId) => {
      await db.exec('SET ROLE authenticated');
      await db.query('SELECT public.admin_delete_organization($1::uuid)', [orgId]);
      await db.exec('RESET ROLE');
      expect(await count(db, 'organizations', 'id', orgId)).toBe(0);
      expect(await count(db, 'tasks', 'organization_id', orgId)).toBe(0);
      expect((await db.query('SELECT id FROM public.profiles WHERE id=$1 AND organization_id IS NULL', [founderId])).rows).toHaveLength(1);
    });
  }, 30000);

  it("refuses signed-in non-founders and preserves their target records", async () => {
    await withFixture(async (db, orgId) => {
      await db.query("SELECT set_config('request.jwt.claim.sub', $1, false)", [randomUUID()]);
      await db.exec('SET ROLE authenticated');
      await expect(db.query('SELECT * FROM public.admin_org_delete_coverage()')).rejects.toMatchObject({ code: '42501' });
      await expect(db.query('SELECT public.admin_delete_organization($1::uuid)', [orgId])).rejects.toMatchObject({ code: '42501' });
      await db.exec('RESET ROLE');
      expect(await count(db, 'organizations', 'id', orgId)).toBe(1);
    });
  }, 30000);

  it.skipIf(!sql)("grants authenticated but not anonymous execution of live functions", async () => {
    if (!sql) throw new Error('Database connection required');
    const [permissions] = await sql`SELECT
      has_function_privilege('anon', 'public.admin_org_delete_coverage()', 'EXECUTE') AS anon_coverage,
      has_function_privilege('anon', 'public.admin_delete_organization(uuid)', 'EXECUTE') AS anon_deletion,
      has_function_privilege('authenticated', 'public.admin_org_delete_coverage()', 'EXECUTE') AS auth_coverage,
      has_function_privilege('authenticated', 'public.admin_delete_organization(uuid)', 'EXECUTE') AS auth_deletion`;
    expect(permissions).toMatchObject({ anon_coverage: false, anon_deletion: false, auth_coverage: true, auth_deletion: true });
  });
});
