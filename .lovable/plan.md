## Goal
Replace emoji icons on blog posts and newsletters with uploadable image icons (with emoji as a fallback for legacy content).

## Storage
- Create a new public Supabase Storage bucket `content-icons` (founder-admin write, public read).
- Icons stored at `blog/{post-id-or-slug}.{ext}` and `newsletter/{id}.{ext}`.

## Database (migration)
- `blog_posts`: add `cover_image_url text` (nullable). Keep `cover_emoji` as fallback.
- `newsletters`: add `hero_image_url text` (nullable). Keep `hero_emoji` as fallback.

## Admin UI
- `src/pages/admin/AdminBlog.tsx`: replace the "Cover Emoji" input with an image uploader (file picker → upload to bucket → preview thumbnail → save URL). Allow "Remove image" to fall back to emoji.
- `src/pages/admin/AdminNewsletter.tsx`: same treatment for the hero icon field.
- Validate file type (png/jpg/svg/webp) and size (≤ 1 MB). Show preview at ~64px.

## Public rendering
Render image when `*_image_url` is set, otherwise the emoji (legacy):
- `src/pages/blog/BlogIndex.tsx` — list thumbnail.
- `src/pages/blog/BlogPostDynamic.tsx` — header.
- `src/pages/NewsletterIndex.tsx` — list thumbnail.
- `src/pages/NewsletterDetail.tsx` — header.
- Admin tables (`AdminBlog`, `AdminNewsletter`) — show image if present, else emoji.

A small `<ContentIcon url? emoji? size />` helper component will keep rendering consistent.

## Out of scope
- No changes to email templates / `send-newsletter` (still uses emoji unless you ask).
- No bulk migration of existing emoji to images.

Confirm and I'll implement.