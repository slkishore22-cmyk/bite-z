import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "bitez_user_session";
const USERID_KEY = "bitez_user_id";

export type UserSessionData = {
  id: string;
  full_name: string;
  user_id: string;
  phone: string;
  college_name: string;
  razorpay_customer_id?: string | null;
  role: "user";
  savedAt: number;
};

export function getStoredUserId() {
  return localStorage.getItem(USERID_KEY) || "";
}

function persist(s: Omit<UserSessionData, "role" | "savedAt">) {
  const full: UserSessionData = { ...s, role: "user", savedAt: Date.now() };
  localStorage.setItem(SESSION_KEY, JSON.stringify(full));
  localStorage.setItem(USERID_KEY, s.user_id);
  return full;
}

export function clearLocalSession() {
  localStorage.removeItem(SESSION_KEY);
  // keep bitez_user_id for auto-fill on next login
}

export type SignupInput = {
  fullName: string;
  userId: string;
  phone: string;
  collegeName: string;
  pin: string;
};

async function unwrap(data: unknown, error: unknown, fallback: string) {
  const errMsg = (data as { error?: string })?.error;
  if (errMsg) throw new Error(errMsg);
  if (error) {
    try {
      const ctx = (error as { context?: Response }).context;
      if (ctx && typeof ctx.json === "function") {
        const j = await ctx.json();
        if (j?.error) throw new Error(j.error);
      }
    } catch (e) {
      if (e instanceof Error && e.message) throw e;
    }
    throw new Error((error as Error).message || fallback);
  }
}

export async function signupUser(input: SignupInput) {
  const { data, error } = await supabase.functions.invoke("user-signup", {
    body: {
      full_name: input.fullName,
      user_id: input.userId,
      phone: input.phone,
      college_name: input.collegeName,
      pin: input.pin,
    },
  });
  await unwrap(data, error, "Could not create account");
  const u = (data as { user: Omit<UserSessionData, "role" | "savedAt"> }).user;
  return persist(u);
}

export async function checkUserIdAvailable(userId: string) {
  const { data } = await supabase.functions.invoke("user-check-id", {
    body: { user_id: userId },
  });
  return Boolean((data as { available?: boolean })?.available);
}

export async function loginWithPin(userId: string, pin: string) {
  const { data, error } = await supabase.functions.invoke("user-login", {
    body: { user_id: userId, pin },
  });
  await unwrap(data, error, "Incorrect User ID or PIN");
  const u = (data as { user: Omit<UserSessionData, "role" | "savedAt"> }).user;
  return persist(u);
}

export async function resetPin(userId: string, newPin: string) {
  const { data, error } = await supabase.functions.invoke("user-forgot-pin", {
    body: { user_id: userId, new_pin: newPin },
  });
  await unwrap(data, error, "Could not reset PIN");
}

export async function logoutUser() {
  clearLocalSession();
}