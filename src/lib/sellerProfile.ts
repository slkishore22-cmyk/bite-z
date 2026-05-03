import { supabase } from "@/integrations/supabase/client";

export type SellerProfile = {
  id: string;
  canteenName: string;
  slogan: string;
  ownerPhone: string;
  icon: string;
  accountNumber: string;
  ifsc: string;
  upiId: string;
};

const STORAGE_KEY = "bitez.seller.profile";
const CANTEENS_STORAGE_KEY = "bitez:shared:canteens:v1";
const EVENT = "bitez:seller:profile:change";
const DEFAULT_ID = "main";
const SESSION_KEY = "bitez_seller_session";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

const empty: SellerProfile = {
  id: DEFAULT_ID,
  canteenName: "",
  slogan: "",
  ownerPhone: "",
  icon: "🍽️",
  accountNumber: "",
  ifsc: "",
  upiId: "",
};

export function getProfile(): SellerProfile {
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    return { ...empty, ...(JSON.parse(raw) as Partial<SellerProfile>), id: DEFAULT_ID };
  } catch {
    return empty;
  }
}

export function saveProfile(p: Omit<SellerProfile, "id">): SellerProfile {
  const next: SellerProfile = { ...p, id: DEFAULT_ID };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch {
    /* ignore */
  }
  return next;
}

export function isProfileComplete(p: SellerProfile): boolean {
  return Boolean(
    p.canteenName.trim() &&
      p.slogan.trim() &&
      p.ownerPhone.trim() &&
      p.accountNumber.trim() &&
      p.ifsc.trim() &&
      p.upiId.trim(),
  );
}

export function getRegisteredCanteens(): SellerProfile[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CANTEENS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SellerProfile[]) : [];
  } catch {
    return [];
  }
}

function writeProfile(p: SellerProfile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  window.dispatchEvent(new CustomEvent(EVENT));
}

function writeCanteens(rows: SellerProfile[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CANTEENS_STORAGE_KEY, JSON.stringify(rows));
  window.dispatchEvent(new CustomEvent(EVENT));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromSeller(row: any): SellerProfile {
  const rawIcon = String(row.canteen_type ?? "").trim();
  const icon = /^\p{Extended_Pictographic}/u.test(rawIcon) ? rawIcon : "🍽️";
  return {
    id: row.id,
    canteenName: row.canteen_name ?? "Canteen",
    slogan: row.canteen_location ?? row.canteen_type ?? "Open now",
    ownerPhone: row.phone ?? "",
    icon,
    accountNumber: row.bank_account_number ?? "",
    ifsc: row.bank_ifsc ?? "",
    upiId: row.upi_id ?? "",
  };
}

export async function getRegisteredCanteensFromBackend(): Promise<SellerProfile[]> {
  const { data, error } = await db
    .from("sellers")
    .select("id, canteen_name, canteen_location, canteen_type, phone, bank_account_number, bank_ifsc, upi_id, is_active, is_suspended")
    .eq("is_active", true)
    .eq("is_suspended", false)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const rows = (data ?? []).map(fromSeller);
  writeCanteens(rows);
  return rows;
}

export async function loadCurrentSellerProfile(): Promise<SellerProfile> {
  if (typeof window === "undefined") return empty;
  const raw = window.localStorage.getItem(SESSION_KEY);
  const session = raw ? (JSON.parse(raw) as { id?: string }) : null;
  if (!session?.id) return empty;
  const { data, error } = await db
    .from("sellers")
    .select("id, canteen_name, canteen_location, canteen_type, phone, bank_account_number, bank_ifsc, upi_id")
    .eq("id", session.id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return empty;
  const profile = fromSeller(data);
  writeProfile(profile);
  return profile;
}

export async function saveProfileToBackend(p: Omit<SellerProfile, "id">): Promise<SellerProfile> {
  if (typeof window === "undefined") return { ...p, id: DEFAULT_ID };
  const raw = window.localStorage.getItem(SESSION_KEY);
  const session = raw ? (JSON.parse(raw) as { id?: string }) : null;
  if (!session?.id) return saveProfile(p);
  const { data, error } = await db
    .from("sellers")
    .update({
      canteen_name: p.canteenName,
      canteen_location: p.slogan,
      canteen_type: p.icon,
      phone: p.ownerPhone,
      bank_account_number: p.accountNumber,
      bank_ifsc: p.ifsc,
      upi_id: p.upiId,
    })
    .eq("id", session.id)
    .select("id, canteen_name, canteen_location, canteen_type, phone, bank_account_number, bank_ifsc, upi_id")
    .single();
  if (error) throw new Error(error.message);
  const next = fromSeller(data);
  writeProfile(next);
  return next;
}

export function subscribeProfile(cb: () => void): () => void {
  const onLocal = () => cb();
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) cb();
  };
  window.addEventListener(EVENT, onLocal);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, onLocal);
    window.removeEventListener("storage", onStorage);
  };
}