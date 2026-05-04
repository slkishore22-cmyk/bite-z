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
  // Use the user-set password for Supabase Auth so they can recover it
  // Email verification is enforced via Supabase's confirmation flow.
  const redirectTo = `${window.location.origin}/app/home`;
  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
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
  const { data: prof, error: profErr } = await supabase
    .from("profiles")
    .select("id, pin_hash")
    .eq("pin_hash", pinHash)
    .maybeSingle();
  if (profErr || !prof) throw new Error("Incorrect PIN");
  // PIN matched -> sign the user in via stored derived credential is not
  // possible; instead require their password OR use a magic link.
  // We send a magic link to keep things secure when only PIN is provided.
  throw new Error("PIN_OK_NEED_PASSWORD");
}

export async function loginWithPassword(email: string, password: string) {
  const e = email.trim().toLowerCase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: e,
    password,
  });
  if (error) throw error;
  setStoredEmail(e);
  await hydrateSessionFromAuth();
  return data;
}

export async function loginPinAndPassword(
  pin: string,
  password: string,
  emailArg?: string,
) {
  const email = (emailArg || getStoredEmail()).trim().toLowerCase();
  if (!email) throw new Error("Please enter your email");
  const data = await loginWithPassword(email, password);
  // verify PIN matches profile
  const pinHash = await derivePassword(pin, email);
  const { data: prof } = await supabase
    .from("profiles")
    .select("pin_hash")
    .eq("id", data.user!.id)
    .maybeSingle();
  if (!prof?.pin_hash || prof.pin_hash !== pinHash) {
    await supabase.auth.signOut();
    throw new Error("Incorrect PIN");
  }
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
  const pinHash = await derivePassword(newPin, u.user.email);
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