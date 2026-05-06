## Fix: Scroll to top on navigation

**Problem**: When clicking links/buttons that navigate to a new route, the page renders at the bottom instead of the top.

**Solution**: Add a `ScrollToTop` component that listens to route changes via `useLocation` and calls `window.scrollTo(0, 0)` on every pathname change. Place it inside the Router in `App.tsx`.

### Changes

1. **Create `src/components/ScrollToTop.tsx`** — a small component using `useEffect` + `useLocation` to scroll to top on route change.

2. **Update `src/App.tsx`** — render `<ScrollToTop />` inside the `<BrowserRouter>` wrapper so it fires on every navigation.

This is a one-time fix that covers all current and future routes.