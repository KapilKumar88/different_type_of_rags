import { Navigate } from "react-router-dom";

export function IndexRedirect() {
  return <Navigate to="/login" replace />;
}
