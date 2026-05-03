import { Navigate } from "react-router-dom";
import { getSession } from "../auth";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const s = getSession();
  if (!s) return <Navigate to="/master-admin/login" replace />;
  return <>{children}</>;
}