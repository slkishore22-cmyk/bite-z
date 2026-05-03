import { Navigate } from 'react-router-dom';
import { getActiveSession } from '../utils/sessionManager';

export default function RootRedirect() {
  const s = getActiveSession();
  if (!s) return <Navigate to="/app/login" replace />;
  if (s.role === 'master_admin') return <Navigate to="/master-admin/overview" replace />;
  if (s.role === 'seller') return <Navigate to="/seller/dashboard" replace />;
  return <Navigate to="/app/home" replace />;
}