import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getAdminSession } from '../../utils/sessionManager';

export default function AdminRoute({ children }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState(null);
  useEffect(() => {
    const t = setTimeout(() => {
      setSession(getAdminSession());
      setReady(true);
    }, 50);
    return () => clearTimeout(t);
  }, []);
  if (!ready) return null;
  if (!session) return <Navigate to="/master-admin/login" replace />;
  return children;
}