import { supabase } from "@/integrations/supabase/client";
import { queryWithTimeout } from "@/utils/networkStatus";

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

export type OrderStatus = "Pending" | "Completed" | "Cancelled" | "Expired";
export type PaymentMethod = "Online" | "Cash";

export type Order = {
  id: string;          // short readable id, e.g. 2299
  uid: string;         // unique storage id
  createdAt: number;
  completedAt?: number;
  expiresAt?: number | null; // COD only; null/undefined for Online
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
  isSalesRecorded?: boolean;
};

const STORAGE_KEY = "bitez:orders";
const EVENT_NAME = "bitez:orders:change";
const ID_COUNTER_KEY = "bitez:orders:counter";

// COD orders soft-expire (status="Expired") after this duration.
// They are NOT deleted from storage/backend — sales/audit data is preserved.
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
  expireStaleCashOrders();
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
    expiresAt: m.expiresAt == null ? null : Number(m.expiresAt),
    payment: m.payment === "Online" ? "Online" : "Cash",
    status:
      m.status === "Completed" || m.status === "Cancelled" || m.status === "Expired"
        ? m.status
        : "Pending",
    paymentStatus: m.paymentStatus === "SUCCESS" || m.paymentStatus === "FAILED" ? m.paymentStatus : "PENDING",
    isSoundPlayed: Boolean(m.isSoundPlayed),
    isSalesRecorded: Boolean(m.isSalesRecorded),
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
  const { data, error } = await queryWithTimeout(query, 5000);
  if (error) {
    // Network slow or offline — return locally cached orders instead of throwing.
    return getOrders();
  }
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
  const now = Date.now();
  const isOnlineSuccess = payload.payment === "Online" && payload.paymentStatus === "SUCCESS";
  const expiresAt = payload.payment === "Cash" ? now + CASH_ORDER_TTL_MS : null;
  const order: Order = {
    id: nextShortId(),
    uid: uuid(),
    createdAt: now,
    status: "Pending",
    expiresAt,
    payment: payload.payment,
    paymentStatus: payload.paymentStatus ?? "PENDING",
    isSoundPlayed: Boolean(payload.isSoundPlayed),
    isSalesRecorded: isOnlineSuccess,
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
  // Mark sales recorded when an order completes (covers both COD-on-completion and online-already-recorded).
  const isSalesRecorded =
    status === "Completed"
      ? true
      : status === "Cancelled" || status === "Expired"
      ? Boolean(target?.isSalesRecorded && target?.payment === "Online")
      : target?.isSalesRecorded;
  const next = read().map((o) =>
    o.uid === uidOrId || o.id === uidOrId
      ? {
          ...o,
          status,
          completedAt,
          isSalesRecorded: isSalesRecorded ?? o.isSalesRecorded,
        }
      : o,
  );
  if (target) {
    const updated = { ...target, status, completedAt, isSalesRecorded: isSalesRecorded ?? target.isSalesRecorded };
    const { error } = await db
      .from("user_analytics")
      .update({ metadata: { ...updated, sellerId: target.items.find((i) => i.canteenId)?.canteenId ?? null } })
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
  if (readSoundPlayedSet().has(orderUidOrId)) return true;
  return read().some((o) => (o.uid === orderUidOrId || o.id === orderUidOrId) && o.isSoundPlayed === true);
}

export function markSoundPlayed(orderUidOrId: string) {
  if (typeof window === "undefined") return;
  const set = readSoundPlayedSet();
  set.add(orderUidOrId);
  window.localStorage.setItem(SOUND_PLAYED_KEY, JSON.stringify([...set]));
  // Also flag the order record itself.
  let updatedOrder: Order | undefined;
  const all = read().map((o) => {
    if (o.uid !== orderUidOrId && o.id !== orderUidOrId) return o;
    updatedOrder = { ...o, isSoundPlayed: true, paymentStatus: "SUCCESS" as const };
    return updatedOrder;
  });
  write(all);
  if (updatedOrder) {
    db.from("user_analytics")
      .update({ metadata: updatedOrder })
      .eq("session_id", updatedOrder.uid)
      .eq("event_type", "order")
      .then(() => undefined, () => undefined);
  }
}

/**
 * Soft-expire stale COD orders: set status to "Expired" instead of deleting.
 * Online orders never expire. Sales/audit data is preserved.
 */
export function expireStaleCashOrders(): Order[] {
  if (typeof window === "undefined") return [];
  const now = Date.now();
  const all = read();
  const stale = all.filter(
    (o) =>
      o.payment === "Cash" &&
      o.status === "Pending" &&
      now - o.createdAt >= CASH_ORDER_TTL_MS,
  );
  if (stale.length === 0) return [];
  const staleIds = new Set(stale.map((o) => o.uid));
  const next = all.map((o) =>
    staleIds.has(o.uid) ? { ...o, status: "Expired" as const } : o,
  );
  write(next);
  // Best-effort backend update — preserve the row, only flip status.
  stale.forEach((o) => {
    const updated = { ...o, status: "Expired" as const };
    db.from("user_analytics")
      .update({ metadata: { ...updated, sellerId: o.items.find((i) => i.canteenId)?.canteenId ?? null } })
      .eq("session_id", o.uid)
      .eq("event_type", "order")
      .then(() => undefined, () => undefined);
  });
  return stale;
}

/** @deprecated kept for backwards compatibility — now soft-expires. */
export const pruneExpiredCashOrders = expireStaleCashOrders;

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
      expireStaleCashOrders();
      schedule();
    }, Math.min(delay + 250, 2 ** 31 - 1));
  };
  // Run once on load + whenever orders change.
  expireStaleCashOrders();
  schedule();
  window.addEventListener(EVENT_NAME, schedule);
}