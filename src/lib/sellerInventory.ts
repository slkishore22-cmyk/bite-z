// Shared local store for seller-added inventory items.
// Persists to localStorage so the Inventory page (recently added) and the
// Menu Manager page see the exact same list without needing a backend yet.
// When auth is wired up later, swap this for a Supabase-backed store.

export type SellerCategory = "Food" | "Snacks" | "Drinks";
export type SellerStatus = "Active" | "Inactive";

export type SellerInventoryItem = {
  id: string;
  name: string;
  price: number;
  category: SellerCategory;
  icon: string;
  iconLabel: string;
  status: SellerStatus;
  createdAt: number;
};

const STORAGE_KEY = "bitez:seller:inventory";
const EVENT_NAME = "bitez:seller:inventory:change";

function read(): SellerInventoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SellerInventoryItem[]) : [];
  } catch {
    return [];
  }
}

function write(items: SellerInventoryItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function getInventory(): SellerInventoryItem[] {
  return read().sort((a, b) => b.createdAt - a.createdAt);
}

export function addInventoryItem(
  item: Omit<SellerInventoryItem, "id" | "createdAt">,
): SellerInventoryItem {
  const newItem: SellerInventoryItem = {
    ...item,
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `inv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
  };
  const next = [newItem, ...read()];
  write(next);
  return newItem;
}

export function updateInventoryItem(
  id: string,
  patch: Partial<Omit<SellerInventoryItem, "id" | "createdAt">>,
) {
  const next = read().map((it) => (it.id === id ? { ...it, ...patch } : it));
  write(next);
}

export function setInventoryStatus(id: string, status: SellerStatus) {
  updateInventoryItem(id, { status });
}

export function removeInventoryItem(id: string) {
  write(read().filter((it) => it.id !== id));
}

/** Subscribe to changes (same tab + cross-tab). Returns unsubscribe fn. */
export function subscribeInventory(cb: () => void): () => void {
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