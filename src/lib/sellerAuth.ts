import { supabase } from "@/integrations/supabase/client";
import { clearSellerScopedCaches } from "@/lib/sellerCaches";

const SESSION_KEY = "bitez_seller_session";
const LEGACY_SESSION_KEY = "bitez.seller.session.v1";
const SESSION_MAX_MS = 12 * 60 * 60 * 1000;

export type SellerSession = {
  id: string;
  username: string;
  name: string;
  email: string;
  canteen_name: string;
  timestamp: number;
};

export function getSellerSession(): SellerSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as SellerSession;
    if (!s?.id) return null;
    if (Date.now() - s.timestamp > SESSION_MAX_MS) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

export function clearSellerSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(LEGACY_SESSION_KEY);
  clearSellerScopedCaches();
}

export async function loginSeller(identifier: string, password: string): Promise<SellerSession> {
  const id = identifier.trim();
  // Look up seller by username OR email
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const { data: seller, error } = await sb
    .from("sellers")
    .select("id, username, name, email, canteen_name, is_suspended, is_active")
    .or(`username.eq.${id},email.eq.${id}`)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!seller) throw new Error("Invalid username or password");
  if (seller.is_suspended) throw new Error("Your account has been suspended. Contact admin.");
  if (seller.is_active === false) throw new Error("Account is inactive");

  const { data: ok, error: rpcErr } = await sb.rpc("verify_seller_password", {
    p_seller_id: seller.id,
    p_password: password,
  });
  if (rpcErr) throw new Error(rpcErr.message);
  if (!ok) throw new Error("Invalid username or password");

  // If a different seller was previously logged in on this device, wipe any
  // single-seller caches before storing the new session so the new canteen
  // never sees the previous canteen's profile / offers / staff / orders.
  try {
    const prevRaw = localStorage.getItem(SESSION_KEY);
    const prev = prevRaw ? (JSON.parse(prevRaw) as { id?: string }) : null;
    if (!prev?.id || prev.id !== seller.id) clearSellerScopedCaches();
  } catch {
    clearSellerScopedCaches();
  }

  const session: SellerSession = {
    id: seller.id,
    username: seller.username ?? "",
    name: seller.name ?? "",
    email: seller.email ?? "",
    canteen_name: seller.canteen_name ?? "",
    timestamp: Date.now(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));

  // Fire-and-forget session log
  try {
    await sb.from("seller_sessions").insert({ seller_id: seller.id });
  } catch { /* ignore */ }

  return session;
}