import { Navigate } from 'react-router-dom';
import { getUserSession } from '../../utils/sessionManager';

export default function UserRoute({ children }) {
  return getUserSession() ? children : <Navigate to="/app/login" replace />;
}
