import { Navigate } from "react-router-dom";

export function AppIndexRedirect() {
  return <Navigate to="/app/chat" replace />;
}
