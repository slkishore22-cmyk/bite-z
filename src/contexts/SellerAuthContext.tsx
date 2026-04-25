import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type SellerProfile = {
  id: string;
  business_name: string;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  status: string;
  address_line: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
};

type Ctx = {
  user: User | null;
  session: Session | null;
  sellerProfile: SellerProfile | null;
  loading: boolean;
  isSeller: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshSellerProfile: () => Promise<void>;
};

const SellerAuthContext = createContext<Ctx | undefined>(undefined);

export const SellerAuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSellerProfile = async (uid: string | undefined) => {
    if (!uid) {
      setSellerProfile(null);
      return;
    }
    const { data } = await supabase
      .from("seller_profiles")
      .select("id, business_name, description, logo_url, cover_url, status, address_line, city, state, pincode")
      .eq("user_id", uid)
      .maybeSingle();
    setSellerProfile(data ?? null);
  };

  useEffect(() => {
    // Listener first
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      // defer DB call
      setTimeout(() => {
        loadSellerProfile(s?.user?.id);
      }, 0);
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      loadSellerProfile(s?.user?.id).finally(() => setLoading(false));
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSellerProfile(null);
  };

  const refreshSellerProfile = async () => {
    await loadSellerProfile(user?.id);
  };

  return (
    <SellerAuthContext.Provider
      value={{
        user,
        session,
        sellerProfile,
        loading,
        isSeller: !!sellerProfile && sellerProfile.status === "approved",
        signIn,
        signOut,
        refreshSellerProfile,
      }}
    >
      {children}
    </SellerAuthContext.Provider>
  );
};

export const useSellerAuth = () => {
  const ctx = useContext(SellerAuthContext);
  if (!ctx) throw new Error("useSellerAuth must be used inside SellerAuthProvider");
  return ctx;
};