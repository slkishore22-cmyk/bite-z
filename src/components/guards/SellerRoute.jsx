import { Navigate } from 'react-router-dom';
import { getSellerSession } from '../../utils/sessionManager';

export default function SellerRoute({ children }) {
  return getSellerSession() ? children : <Navigate to="/seller/login" replace />;
}