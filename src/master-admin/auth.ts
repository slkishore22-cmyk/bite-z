import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "ma_session_v1";
const SESSION_MAX_MS = 8 * 60 * 60 * 1000;

export type MaSession = {
  role: "master_admin";
  authenticated: true;
  username: string;
  timestamp: number;
};

export function getSession(): MaSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as MaSession;
    if (!s?.authenticated) return null;
    if (Date.now() - s.timestamp > SESSION_MAX_MS) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

export function setSession(username: string) {
  const s: MaSession = {
    role: "master_admin",
    authenticated: true,
    username,
    timestamp: Date.now(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export async function loginMasterAdmin(username: string, password: string) {
  const { data, error } = await supabase.rpc("verify_master_admin", {
    p_username: username,
    p_password: password,
  });
  if (error) throw error;
  return Boolean(data);
}

export async function logAudit(
  action_type: string,
  target?: string,
  details?: Record<string, unknown>,
) {
  try {
    await supabase.from("admin_audit_log" as never).insert({
      action_type,
      target: target ?? null,
      details: (details ?? null) as never,
    } as never);
  } catch {
    /* fire and forget */
  }
}