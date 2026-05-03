import { supabase } from "@/integrations/supabase/client";

export type SellerCategory = "Food" | "Snacks" | "Drinks";
export type SellerStatus = "Active" | "Inactive";

export type SellerInventoryItem = {
  id: string;
  sellerId?: string | null;
  name: string;
  price: number;
  category: SellerCategory;
  icon: string;
  iconLabel: string;
  status: SellerStatus;
  createdAt: number;
};

const STORAGE_KEY = "bitez:shared:inventory:v2";
const EVENT_NAME = "bitez:seller:inventory:change";
const SESSION_KEY = "bitez_seller_session";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

function currentSellerId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { id?: string };
    return parsed.id ?? null;
  } catch {
    return null;
  }
}

function normalizeCategory(value: unknown): SellerCategory {
  return value === "Snacks" || value === "Drinks" ? value : "Food";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromProduct(row: any): SellerInventoryItem {
  return {
    id: row.id,
    sellerId: row.seller_id ?? null,
    name: row.product_name ?? "Untitled item",
    price: Number(row.price ?? 0),
    category: normalizeCategory(row.category),
    icon: row.emoji ?? "🍽️",
    iconLabel: row.category ?? "Food",
    status: row.is_active === false ? "Inactive" : "Active",
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
  };
}

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

export function getInventory(sellerId?: string | null): SellerInventoryItem[] {
  const rows = read();
  const scoped = sellerId ? rows.filter((it) => it.sellerId === sellerId) : rows;
  return scoped.sort((a, b) => b.createdAt - a.createdAt);
}

export async function loadInventoryFromBackend(sellerId?: string | null): Promise<SellerInventoryItem[]> {
  let query = db
    .from("seller_products")
    .select("id, seller_id, product_name, price, category, emoji, is_active, created_at")
    .order("created_at", { ascending: false });
  if (sellerId) query = query.eq("seller_id", sellerId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const incoming = (data ?? []).map(fromProduct);
  const others = sellerId ? read().filter((it) => it.sellerId !== sellerId) : [];
  write([...incoming, ...others]);
  return incoming;
}

export async function addInventoryItem(
  item: Omit<SellerInventoryItem, "id" | "createdAt">,
): Promise<SellerInventoryItem> {
  const sellerId = item.sellerId ?? currentSellerId();
  const { data, error } = await db
    .from("seller_products")
    .insert({
      seller_id: sellerId,
      product_name: item.name,
      price: item.price,
      category: item.category,
      emoji: item.icon,
      is_active: item.status === "Active",
    })
    .select("id, seller_id, product_name, price, category, emoji, is_active, created_at")
    .single();
  if (error) throw new Error(error.message);
  const newItem = fromProduct(data);
  write([newItem, ...read().filter((it) => it.id !== newItem.id)]);
  return newItem;
}

export async function updateInventoryItem(
  id: string,
  patch: Partial<Omit<SellerInventoryItem, "id" | "createdAt">>,
) {
  const payload: Record<string, unknown> = {};
  if (patch.name !== undefined) payload.product_name = patch.name;
  if (patch.price !== undefined) payload.price = patch.price;
  if (patch.category !== undefined) payload.category = patch.category;
  if (patch.icon !== undefined) payload.emoji = patch.icon;
  if (patch.status !== undefined) payload.is_active = patch.status === "Active";
  const { error } = await db.from("seller_products").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
  write(read().map((it) => (it.id === id ? { ...it, ...patch } : it)));
}

export async function setInventoryStatus(id: string, status: SellerStatus) {
  await updateInventoryItem(id, { status });
}

export async function removeInventoryItem(id: string) {
  const { error } = await db.from("seller_products").delete().eq("id", id);
  if (error) throw new Error(error.message);
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