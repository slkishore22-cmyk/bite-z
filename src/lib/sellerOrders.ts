// Shared local-first orders store. The customer creates orders here and the
// seller pages read from the same store — so dashboards, sales, and order
// queues all reflect real activity.
//
// Optimised for low-bandwidth campus networks: zero network round-trips,
// instant reads, optimistic writes, cross-tab sync via storage + CustomEvent.

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
};

const STORAGE_KEY = "bitez:orders";
const EVENT_NAME = "bitez:orders:change";
const ID_COUNTER_KEY = "bitez:orders:counter";

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

function nextShortId(): string {
  if (typeof window === "undefined") return "1000";
  const raw = window.localStorage.getItem(ID_COUNTER_KEY);
  const n = raw ? parseInt(raw, 10) || 1000 : 1000;
  const next = n + 1;
  window.localStorage.setItem(ID_COUNTER_KEY, String(next));
  return String(next);
}

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `o_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function getOrders(): Order[] {
  return read().sort((a, b) => b.createdAt - a.createdAt);
}

export function getOrderById(id: string): Order | undefined {
  return read().find((o) => o.id === id || o.uid === id);
}

export function createOrder(
  payload: Omit<Order, "id" | "uid" | "createdAt" | "status" | "subtotal" | "total"> & {
    subtotal?: number;
    total?: number;
  },
): Order {
  const subtotal =
    payload.subtotal ??
    payload.items.reduce((s, i) => s + i.price * i.qty, 0);
  const total = payload.total ?? subtotal;

  const order: Order = {
    id: nextShortId(),
    uid: uid(),
    createdAt: Date.now(),
    status: "Pending",
    payment: payload.payment,
    items: payload.items,
    subtotal,
    total,
  };
  write([order, ...read()]);
  return order;
}

export function setOrderStatus(uidOrId: string, status: OrderStatus) {
  const next = read().map((o) =>
    o.uid === uidOrId || o.id === uidOrId
      ? {
          ...o,
          status,
          completedAt:
            status === "Completed" ? o.completedAt ?? Date.now() : o.completedAt,
        }
      : o,
  );
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