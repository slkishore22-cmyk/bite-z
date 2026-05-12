import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getUserSession } from '../../utils/sessionManager';

export default function UserRoute({ children }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState(null);
  useEffect(() => {
    const t = setTimeout(() => {
      setSession(getUserSession());
      setReady(true);
    }, 50);
    return () => clearTimeout(t);
  }, []);
  if (!ready) return null;
  if (!session) return <Navigate to="/app/login" replace />;
  return children;
}