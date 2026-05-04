import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { hydrateSessionFromAuth, clearLocalSession } from '@/lib/userAuth';
import { getUserSession } from '../../utils/sessionManager';

export default function UserRoute({ children }) {
  const [state, setState] = useState(() =>
    getUserSession() ? 'ok' : 'checking',
  );

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      if (data.session) {
        hydrateSessionFromAuth().finally(() => alive && setState('ok'));
      } else {
        clearLocalSession();
        setState('out');
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!alive) return;
      if (session) {
        hydrateSessionFromAuth();
        setState('ok');
      } else {
        clearLocalSession();
        setState('out');
      }
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (state === 'checking')
    return <div className="min-h-screen" style={{ background: '#F5F5F7' }} />;
  if (state === 'out') return <Navigate to="/app/login" replace />;
  return children;
}