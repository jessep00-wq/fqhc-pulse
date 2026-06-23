import { Helmet } from "react-helmet-async";

// Audit fix 35: stopped logging every 404 to the console — bots and link
// rot make this noisy without giving us actionable info.
const NotFound = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <Helmet>
        <title>Page not found — MeasureWise</title>
        <meta name="robots" content="noindex,follow" />
      </Helmet>
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
