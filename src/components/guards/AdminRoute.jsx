import { Navigate } from 'react-router-dom';
import { getAdminSession } from '../../utils/sessionManager';

export default function AdminRoute({ children }) {
  return getAdminSession() ? children : <Navigate to="/master-admin/login" replace />;
}