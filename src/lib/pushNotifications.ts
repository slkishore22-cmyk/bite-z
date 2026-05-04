// Web Push: prompt + subscribe + persist endpoint to push_subscriptions.
// Safe to call even when push isn't supported — all helpers no-op cleanly.

import { supabase } from "@/integrations/supabase/client";

const VAPID_PUBLIC_KEY =
  // Set this once you generate VAPID keys (see Phase 2 instructions).
  // Stored as a publishable key — safe to ship in client code.
  (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined) ?? "";

const isSupported = () =>
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

export type PushOwner =
  | { role: "customer"; userId: string }
  | { role: "seller"; sellerId: string }
  | { role: "admin" };

export async function ensurePushSubscription(owner: PushOwner): Promise<boolean> {
  if (!isSupported() || !VAPID_PUBLIC_KEY) return false;

  let permission = Notification.permission;
  if (permission === "default") permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    try {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    } catch {
      return false;
    }
  }

  const json = sub.toJSON();
  const endpoint = json.endpoint!;
  const p256dh = json.keys?.p256dh ?? "";
  const auth = json.keys?.auth ?? "";
  if (!p256dh || !auth) return false;

  const row = {
    role: owner.role,
    user_id: owner.role === "customer" ? owner.userId : null,
    seller_id: owner.role === "seller" ? owner.sellerId : null,
    endpoint,
    p256dh,
    auth,
    user_agent: navigator.userAgent,
    last_seen_at: new Date().toISOString(),
  };

  await supabase
    .from("push_subscriptions")
    .upsert(row, { onConflict: "endpoint" });

  return true;
}

export async function disablePushSubscription() {
  if (!isSupported()) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  const endpoint = sub.endpoint;
  await sub.unsubscribe();
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
}