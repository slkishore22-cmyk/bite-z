import { supabase } from "@/integrations/supabase/client";

import type { SellerCategory } from "./sellerInventory";

export type OrderItem = {
  itemId: string;
  name: string;
  icon: string;
  category: SellerCategory;
  price: number;
  qty: number;
  canteenId?: string;
  canteenIcon?: string;
};

export type OrderStatus = "Pending" | "Completed" | "Cancelled";
export type PaymentMethod = "Online" | "Cash";

export type Order = {
  id: string;          // short readable id, e.g. 2299
  uid: string;         // unique storage id
  createdAt: number;
  completedAt?: number;
  payment: PaymentMethod;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  total: number;
  sellerId?: string | null;
  sellerName?: string | null;
  sellerIcon?: string | null;
  appUserId?: string | null;
  paymentStatus?: "PENDING" | "SUCCESS" | "FAILED";
  isSoundPlayed?: boolean;
};

const STORAGE_KEY = "bitez:orders";
const EVENT_NAME = "bitez:orders:change";
const ID_COUNTER_KEY = "bitez:orders:counter";

// Cash orders auto-expire & delete after this duration.
export const CASH_ORDER_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

function uuid(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}00000000-0000-4000-8000-000000000000`.slice(0, 36);
}

function read(): Order[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Order[]) : [];
  } catch {
    return [];
  }
}

function write(items: Order[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

function getCurrentUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("bitez_user_session");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { id?: string };
    return parsed.id ?? null;
  } catch {
    return null;
  }
}

function nextShortId(): string {
  if (typeof window === "undefined") return "1000";
  const raw = window.localStorage.getItem(ID_COUNTER_KEY);
  const n = raw ? parseInt(raw, 10) || 1000 : 1000;
  const next = n + 1;
  window.localStorage.setItem(ID_COUNTER_KEY, String(next));
  return String(next);
}

export function getOrders(): Order[] {
  pruneExpiredCashOrders();
  return read().sort((a, b) => b.createdAt - a.createdAt);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromAnalytics(row: any): Order | null {
  const m = row.metadata ?? {};
  if (!Array.isArray(m.items)) return null;
  return {
    id: String(m.id ?? row.session_id ?? "----"),
    uid: String(row.session_id ?? m.uid ?? row.id),
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Number(m.createdAt ?? Date.now()),
    completedAt: m.completedAt ? Number(m.completedAt) : undefined,
    payment: m.payment === "Online" ? "Online" : "Cash",
    status: m.status === "Completed" || m.status === "Cancelled" ? m.status : "Pending",
    items: m.items,
    subtotal: Number(m.subtotal ?? 0),
    total: Number(m.total ?? m.subtotal ?? 0),
    sellerId: m.sellerId ?? null,
    sellerName: m.sellerName ?? null,
    sellerIcon: m.sellerIcon ?? null,
    appUserId: m.appUserId ?? null,
  };
}

export async function loadOrdersFromBackend(sellerId?: string | null, userId = getCurrentUserId()): Promise<Order[]> {
  let query = db
    .from("user_analytics")
    .select("id, session_id, created_at, metadata, user_id")
    .eq("event_type", "order")
    .eq("screen_name", "order")
    .order("created_at", { ascending: false });
  if (sellerId) query = query.eq("metadata->>sellerId", sellerId);
  else if (userId && String(userId).includes("-")) query = query.eq("user_id", userId);
  else if (userId) query = query.eq("metadata->>appUserId", userId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const orders = (data ?? []).map(fromAnalytics).filter(Boolean) as Order[];
  write(orders);
  return orders;
}

export function getOrderById(id: string): Order | undefined {
  return read().find((o) => o.id === id || o.uid === id);
}

export async function createOrder(
  payload: Omit<Order, "id" | "uid" | "createdAt" | "status" | "subtotal" | "total"> & {
    subtotal?: number;
    total?: number;
  },
): Promise<Order> {
  const subtotal =
    payload.subtotal ??
    payload.items.reduce((s, i) => s + i.price * i.qty, 0);
  const total = payload.total ?? subtotal;

  const sellerId = payload.items.find((i) => i.canteenId)?.canteenId ?? null;
  const sellerIcon = payload.items.find((i) => i.canteenIcon)?.canteenIcon ?? null;
  const userId = getCurrentUserId();
  const order: Order = {
    id: nextShortId(),
    uid: uuid(),
    createdAt: Date.now(),
    status: "Pending",
    payment: payload.payment,
    items: payload.items,
    subtotal,
    total,
    sellerId,
    sellerName: payload.sellerName ?? null,
    sellerIcon,
    appUserId: userId,
  };
  const { error } = await db.from("user_analytics").insert({
    user_id: userId && String(userId).includes("-") ? userId : null,
    session_id: order.uid,
    screen_name: "order",
    event_type: "order",
    metadata: { ...order, sellerId, sellerName: payload.sellerName ?? null, sellerIcon, appUserId: userId },
  });
  if (error) throw new Error(error.message);
  write([order, ...read()]);
  return order;
}

export async function setOrderStatus(uidOrId: string, status: OrderStatus) {
  const target = read().find((o) => o.uid === uidOrId || o.id === uidOrId);
  const completedAt = status === "Completed" ? target?.completedAt ?? Date.now() : target?.completedAt;
  const next = read().map((o) =>
    o.uid === uidOrId || o.id === uidOrId
      ? {
          ...o,
          status,
          completedAt,
        }
      : o,
  );
  if (target) {
    const { error } = await db
      .from("user_analytics")
      .update({ metadata: { ...target, status, completedAt, sellerId: target.items.find((i) => i.canteenId)?.canteenId ?? null } })
      .eq("session_id", target.uid)
      .eq("event_type", "order");
    if (error) throw new Error(error.message);
  }
  write(next);
}

export function subscribeOrders(cb: () => void): () => void {
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

// ------------------------------------------------------------------
// Cash-order expiry: any Pending Cash order older than CASH_ORDER_TTL_MS
// is deleted (locally + backend). Online orders never expire here.
// ------------------------------------------------------------------

// ------------------------------------------------------------------
// One-time sound playback flag for Online orders. Persisted in
// localStorage so it survives reloads / re-opens of order pages.
// ------------------------------------------------------------------
const SOUND_PLAYED_KEY = "bitez:orders:soundPlayed";

function readSoundPlayedSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(SOUND_PLAYED_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function hasSoundPlayed(orderUidOrId: string): boolean {
  return readSoundPlayedSet().has(orderUidOrId);
}

export function markSoundPlayed(orderUidOrId: string) {
  if (typeof window === "undefined") return;
  const set = readSoundPlayedSet();
  if (set.has(orderUidOrId)) return;
  set.add(orderUidOrId);
  window.localStorage.setItem(SOUND_PLAYED_KEY, JSON.stringify([...set]));
  // Also flag the order record itself.
  const all = read().map((o) =>
    o.uid === orderUidOrId || o.id === orderUidOrId
      ? { ...o, isSoundPlayed: true, paymentStatus: "SUCCESS" as const }
      : o,
  );
  write(all);
}

export function pruneExpiredCashOrders(): Order[] {
  if (typeof window === "undefined") return [];
  const now = Date.now();
  const all = read();
  const expired = all.filter(
    (o) =>
      o.payment === "Cash" &&
      o.status === "Pending" &&
      now - o.createdAt >= CASH_ORDER_TTL_MS,
  );
  if (expired.length === 0) return [];
  const remaining = all.filter((o) => !expired.some((e) => e.uid === o.uid));
  write(remaining);
  // Best-effort backend delete; ignore failures (RLS, offline, etc.)
  expired.forEach((o) => {
    db.from("user_analytics")
      .delete()
      .eq("session_id", o.uid)
      .eq("event_type", "order")
      .then(() => undefined, () => undefined);
  });
  return expired;
}

// Returns ms until the next Cash order expires, or null if none pending.
export function nextCashExpiryDelayMs(): number | null {
  const now = Date.now();
  const pending = read().filter(
    (o) => o.payment === "Cash" && o.status === "Pending",
  );
  if (pending.length === 0) return null;
  const soonest = Math.min(
    ...pending.map((o) => o.createdAt + CASH_ORDER_TTL_MS - now),
  );
  return Math.max(0, soonest);
}

// Auto-start a global pruning timer in the browser. Re-arms after each run.
if (typeof window !== "undefined") {
  const w = window as unknown as { __bitezCashExpiryTimer?: number };
  const schedule = () => {
    if (w.__bitezCashExpiryTimer) {
      window.clearTimeout(w.__bitezCashExpiryTimer);
    }
    const delay = nextCashExpiryDelayMs();
    if (delay == null) {
      // Re-check periodically in case new orders are added.
      w.__bitezCashExpiryTimer = window.setTimeout(schedule, 60_000);
      return;
    }
    w.__bitezCashExpiryTimer = window.setTimeout(() => {
      pruneExpiredCashOrders();
      schedule();
    }, Math.min(delay + 250, 2 ** 31 - 1));
  };
  // Run once on load + whenever orders change.
  pruneExpiredCashOrders();
  schedule();
  window.addEventListener(EVENT_NAME, schedule);
}