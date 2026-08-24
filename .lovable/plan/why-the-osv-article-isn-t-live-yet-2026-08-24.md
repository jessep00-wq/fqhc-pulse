# Why the OSV article isn't live yet

## What I found

The published site at measurewise.org is still serving an older build. I fetched the live JavaScript bundle that carries the Resource Library content and it still contains the pre-rewrite version of the article — the "Content in review" placeholder, the old meta title, and seven articles still flagged as unpublished. The new Chapter 8 content, the FTCA callout, and the indexable metadata exist only in the preview build.

The URL itself works (returns 200), so nothing is broken in routing, the sitemap, or the article code. The published deployment simply predates the rewrite.

## Fix

Publish the project. That rebuilds and pushes the current code — including the rewritten article, the new callout styling, the removed noindex, and the updated sitemap entry — to measurewise.org.

No code changes are needed.

## After publishing

- Confirm https://measurewise.org/resources/hrsa-osv-qi-qa-documents shows the full article with the FTCA callout.
- Confirm the page source no longer carries a noindex tag.
- Optionally resubmit https://measurewise.org/sitemap.xml in Search Console so Google picks up the new URL sooner.
