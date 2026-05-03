import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getSellerSession } from '../../utils/sessionManager';

export default function SellerRoute({ children }) {
  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);
  const session = getSellerSession();

  useEffect(() => {
    let alive = true;
    async function verify() {
      if (!session?.id || !String(session.id).includes('-')) {
        localStorage.removeItem('bitez_seller_session');
        localStorage.removeItem('bitez.seller.session.v1');
        if (alive) { setValid(false); setChecking(false); }
        return;
      }
      const { data } = await supabase
        .from('sellers')
        .select('id, is_active, is_suspended')
        .eq('id', session.id)
        .maybeSingle();
      const ok = Boolean(data?.id && data.is_active !== false && !data.is_suspended);
      if (!ok) {
        localStorage.removeItem('bitez_seller_session');
        localStorage.removeItem('bitez.seller.session.v1');
      }
      if (alive) { setValid(ok); setChecking(false); }
    }
    verify();
    return () => { alive = false; };
  }, [session?.id]);

  if (checking) {
    return <div className="min-h-screen bg-background text-foreground" />;
  }
  return valid ? children : <Navigate to="/seller/login" replace />;
}