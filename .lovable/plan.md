## Problem

Admin-authored posts publish to `/blog/:slug` (via `BlogPostDynamic.tsx`), but they render as **flat unstyled text** — no heading sizes, no list bullets, no paragraph spacing. The admin **Preview** tab shows the same flat output (visible in the screenshots: `# The Cost of Being Almost Audit-Ready` renders the same size as body text).

Root cause: `@tailwindcss/typography` is in `package.json` but **not registered** in `tailwind.config.ts` plugins. Every `prose` class on the page (admin preview *and* the public post page) is a no-op. GitHub-flavored markdown features (tables, autolinks, strikethrough) also aren't supported because `remark-gfm` isn't wired in.

## Changes

1. **`tailwind.config.ts`** — register the typography plugin:
   ```ts
   plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
   ```
   This activates all existing `prose ...` classes already in `BlogPostDynamic` and `AdminBlog`.

2. **Add `remark-gfm`** (`bun add remark-gfm`) and pass it to both `<ReactMarkdown>` instances:
   - `src/pages/blog/BlogPostDynamic.tsx`
   - `src/pages/admin/AdminBlog.tsx`
   So tables, task lists, autolinks, and `~strike~` render correctly.

3. **Make admin Preview mirror the published page.** Update the Preview tab in `AdminBlog.tsx` to render the same header (cover icon, title, date, read time, author, excerpt) above the body using the same wrapper classes as `BlogPostDynamic`:
   ```tsx
   <article className="max-w-3xl mx-auto">
     <header>… cover icon, title, meta, excerpt …</header>
     <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-headings:text-foreground prose-p:text-foreground/90 prose-a:text-primary prose-strong:text-foreground prose-li:text-foreground/90">
       <ReactMarkdown remarkPlugins={[remarkGfm]}>{form.content_md}</ReactMarkdown>
     </div>
   </article>
   ```
   The preview will then be a true WYSIWYG of what readers see at `/blog/:slug`.

## Out of scope

- No DB schema changes (the `blog_posts` table and admin save flow already work).
- No changes to the static legacy blog posts (`BlogPDSAGuide`, etc.) — they use hand-written JSX and are unaffected.
- No editor upgrade (still raw-markdown textarea). If you later want a richer editor (toolbar, image-in-body uploads), that's a separate task.

## Verification

After the change, in the admin Preview tab a draft using `# Heading`, `## Subheading`, `- bullets`, `**bold**`, and `[links](…)` will show proper hierarchy and spacing — and clicking Publish will produce an identical-looking page at `/blog/<slug>`.
