import { Navigate } from "react-router-dom";

// Pipeline view has been consolidated into the Overview ("Accounts") page.
// Keep the route alive as a redirect for any external bookmarks.
export default function AdminPipeline() {
  return <Navigate to="/admin?view=pipeline" replace />;
}
