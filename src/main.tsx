// The marketing homepage at "/" is pure static HTML+CSS (see index.html).
// To avoid downloading the React bundle on that route, we only boot the SPA
// for non-root paths. createRoot will replace the static homepage markup
// that lives inside <div id="root"> on every other route.
if (window.location.pathname !== "/") {
  import("./bootstrap").then((m) => m.start());
}
