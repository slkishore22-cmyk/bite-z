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
const EVENT = "bitez:seller:profile:change";
const DEFAULT_ID = "main";

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
  const p = getProfile();
  return isProfileComplete(p) ? [p] : [];
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