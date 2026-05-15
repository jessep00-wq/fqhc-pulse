## Add Google Ads Conversion Tag (gtag.js)

### Goal
Install the Google Ads conversion tracking tag (`AW-18116909916`) on every page of the MeasureWise site, immediately after the `<head>` element opens.

### Why `index.html`
This is a React SPA built with Vite. There is only one HTML shell (`index.html`) that loads once; React handles all client-side routing. Placing the tag there ensures it fires on every route.

### Change Detail
Insert the following snippet directly after the opening `<head>` tag in `index.html`:

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=AW-18116909916"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'AW-18116909916');
</script>
```

### File to modify
- `index.html`

No other files need changes. No new dependencies are required.