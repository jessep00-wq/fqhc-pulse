// Signed unsubscribe token for OSV nurture emails.
// Token = base64url(HMAC-SHA256(lead_id, CRON_SECRET)).0..24. We keep the
// lead_id in plaintext in the URL and use the token to prove authenticity;
// this lets the endpoint look up the lead directly without a secondary table.

const enc = new TextEncoder();

async function hmacSha256(key: string, data: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(data));
  // base64url
  const bytes = new Uint8Array(sig);
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function signLeadToken(leadId: string, secret: string): Promise<string> {
  const full = await hmacSha256(secret, leadId);
  return full.slice(0, 32);
}

export async function verifyLeadToken(
  leadId: string,
  token: string,
  secret: string,
): Promise<boolean> {
  const expected = await signLeadToken(leadId, secret);
  if (expected.length !== token.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  }
  return diff === 0;
}

export async function buildUnsubUrl(leadId: string, secret: string): Promise<string> {
  const token = await signLeadToken(leadId, secret);
  const base = "https://eeyigxcwewdqfeidqbxk.supabase.co/functions/v1/osv-unsubscribe";
  const params = new URLSearchParams({ lead: leadId, token }).toString();
  return `${base}?${params}`;
}
