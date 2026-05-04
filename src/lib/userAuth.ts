import { supabase } from "@/integrations/supabase/client";

const EMAIL_KEY = "bitez_user_email";
const SESSION_KEY = "bitez_user_session";

export type UserSessionData = {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  college_name: string;
  razorpay_customer_id?: string | null;
  role: "user";
  savedAt: number;
};

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function derivePassword(pin: string, email: string) {
  const e = email.trim().toLowerCase();
  return await sha256Hex(`bitez:v1:${e}:${pin}`);
}

export function getStoredEmail() {
  return localStorage.getItem(EMAIL_KEY) || "";
}
export function setStoredEmail(email: string) {
  localStorage.setItem(EMAIL_KEY, email.trim().toLowerCase());
}

export function saveLocalSession(s: UserSessionData) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  setStoredEmail(s.email);
}

export function clearLocalSession() {
  localStorage.removeItem(SESSION_KEY);
}

export async function hydrateSessionFromAuth(): Promise<UserSessionData | null> {
  const { data } = await supabase.auth.getUser();
  const u = data.user;
  if (!u) return null;
  const { data: prof } = await supabase
    .from("profiles")
    .select("full_name, phone, college_name, razorpay_customer_id")
    .eq("id", u.id)
    .maybeSingle();
  const session: UserSessionData = {
    id: u.id,
    email: u.email ?? "",
    full_name: prof?.full_name ?? (u.user_metadata?.full_name as string) ?? "",
    phone: prof?.phone ?? "",
    college_name: prof?.college_name ?? "",
    razorpay_customer_id: prof?.razorpay_customer_id ?? null,
    role: "user",
    savedAt: Date.now(),
  };
  saveLocalSession(session);
  return session;
}

export type SignupInput = {
  fullName: string;
  email: string;
  phone: string;
  collegeName: string;
  pin: string;
  password: string;
};

export async function signupUser(input: SignupInput) {
  const email = input.email.trim().toLowerCase();
  const pinHash = await derivePassword(input.pin, email);
  // PIN-derived value is the Supabase Auth password so PIN-only login works.
  // The user-typed password is collected for UI fidelity but not used as the
  // primary credential. Email verification is enforced by Supabase.
  const redirectTo = `${window.location.origin}/app/home`;
  const { data, error } = await supabase.auth.signUp({
    email,
    password: pinHash,
    options: {
      emailRedirectTo: redirectTo,
      data: {
        full_name: input.fullName,
        phone: input.phone,
      },
    },
  });
  if (error) throw error;

  const userId = data.user?.id;
  if (userId) {
    // upsert extra profile fields (handle_new_user trigger creates the row)
    await supabase
      .from("profiles")
      .upsert(
        {
          id: userId,
          full_name: input.fullName,
          phone: input.phone,
          college_name: input.collegeName,
          pin_hash: pinHash,
        },
        { onConflict: "id" },
      );
  }

  setStoredEmail(email);
  return data;
}

export async function loginWithPin(pin: string, emailArg?: string) {
  const email = (emailArg || getStoredEmail()).trim().toLowerCase();
  if (!email) throw new Error("Please enter your email");
  const pinHash = await derivePassword(pin, email);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: pinHash,
  });
  if (error) {
    if (/email/i.test(error.message) && /confirm/i.test(error.message)) {
      throw new Error("Please verify your email first");
    }
    throw new Error("Incorrect PIN");
  }
  setStoredEmail(email);
  await hydrateSessionFromAuth();
  return data;
}

export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
    { redirectTo: `${window.location.origin}/app/reset-pin` },
  );
  if (error) throw error;
}

export async function updatePin(newPin: string) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user?.email) throw new Error("Not signed in");
  const email = u.user.email;
  const pinHash = await derivePassword(newPin, email);
  // Update Supabase Auth password (derived from PIN) and profile pin_hash.
  const { error: pwErr } = await supabase.auth.updateUser({ password: pinHash });
  if (pwErr) throw pwErr;
  const { error } = await supabase
    .from("profiles")
    .update({ pin_hash: pinHash })
    .eq("id", u.user.id);
  if (error) throw error;
}

export async function ensureRazorpayCustomer(name: string, phone: string) {
  try {
    const { data, error } = await supabase.functions.invoke(
      "create-razorpay-customer",
      { body: { name, phone } },
    );
    if (error) return null;
    return (data as { customer_id?: string })?.customer_id ?? null;
  } catch {
    return null;
  }
}

export async function logoutUser() {
  await supabase.auth.signOut().catch(() => null);
  clearLocalSession();
}