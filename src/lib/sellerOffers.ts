// Shared local store for seller-created offers. Used by the seller Offers page
// to persist offers and by the user Home page to display live offers.

export type OfferKind = "general" | "inventory";

export type SellerOffer = {
  id: string;
  sellerId: string | null;
  kind: OfferKind;
  name: string;
  discountPct: number;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  condition: string;
  itemIds: string[]; // for inventory offers
  createdAt: number;
};

const STORAGE_KEY = "bitez:seller:offers";
const EVENT_NAME = "bitez:seller:offers:change";

function read(): SellerOffer[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SellerOffer[]) : [];
  } catch {
    return [];
  }
}

function write(items: SellerOffer[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function getOffers(): SellerOffer[] {
  return read().sort((a, b) => b.createdAt - a.createdAt);
}

export function getActiveOffers(now = Date.now()): SellerOffer[] {
  return getOffers().filter((o) => {
    const start = o.startDate ? new Date(o.startDate + "T00:00:00").getTime() : -Infinity;
    const end = o.endDate ? new Date(o.endDate + "T23:59:59").getTime() : Infinity;
    return now >= start && now <= end;
  });
}

/** Return the highest active general-offer % for a given seller (0 if none). */
export function getActiveDiscountPctForSeller(sellerId?: string | null, now = Date.now()): number {
  if (!sellerId) return 0;
  const pct = getActiveOffers(now)
    .filter((o) => o.kind === "general" && o.sellerId === sellerId)
    .reduce((max, o) => Math.max(max, Number(o.discountPct) || 0), 0);
  return Math.max(0, Math.min(100, pct));
}

export function getActiveOfferForSeller(sellerId?: string | null, now = Date.now()): SellerOffer | null {
  if (!sellerId) return null;
  const list = getActiveOffers(now)
    .filter((o) => o.kind === "general" && o.sellerId === sellerId)
    .sort((a, b) => b.discountPct - a.discountPct);
  return list[0] ?? null;
}

export function addOffer(input: Omit<SellerOffer, "id" | "createdAt">): SellerOffer {
  const newOffer: SellerOffer = {
    ...input,
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `ofr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
  };
  write([newOffer, ...read()]);
  return newOffer;
}

export function updateOffer(id: string, patch: Partial<Omit<SellerOffer, "id" | "createdAt">>) {
  write(read().map((o) => (o.id === id ? { ...o, ...patch } : o)));
}

export function removeOffer(id: string) {
  write(read().filter((o) => o.id !== id));
}

export function subscribeOffers(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onLocal = () => cb();
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) cb();
  };
  window.addEventListener(EVENT_NAME, onLocal as EventListener);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT_NAME, onLocal as EventListener);
    window.removeEventListener("storage", onStorage);
  };
}
