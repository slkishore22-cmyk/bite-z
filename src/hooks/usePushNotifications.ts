import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getUserSession } from "@/utils/sessionManager";

// Public VAPID key — safe to ship in client code.
const VAPID_PUBLIC_KEY =
  "BLlw-I229HpMzuZFl3qGqmVZ03o-KPk3inkEjeJM9vqVku52_DySDdgD1vVvks50DxoQHv0rhJw6SrNKTSRLmfE";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

function getCurrentUserId(): string | null {
  const s = getUserSession() as { id?: string; user_id?: string } | null;
  return s?.id || s?.user_id || null;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isLoading, setIsLoading] = useState(false);
  const [isiOS, setIsiOS] = useState(false);
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsiOS(isIOSDevice);

    const isPWAMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsPWA(isPWAMode);

    const hasSW = "serviceWorker" in navigator;
    const hasPM = "PushManager" in window;
    const hasN = "Notification" in window;
    if (isIOSDevice && !isPWAMode) setIsSupported(false);
    else setIsSupported(hasSW && hasPM && hasN);

    if ("Notification" in window) setPermission(Notification.permission);

    (async () => {
      try {
        if (!("serviceWorker" in navigator)) return;
        const reg = await navigator.serviceWorker.getRegistration("/sw-push.js");
        if (!reg) return setIsSubscribed(false);
        const sub = await reg.pushManager.getSubscription();
        setIsSubscribed(!!sub);
      } catch {
        setIsSubscribed(false);
      }
    })();
  }, []);

  const subscribe = useCallback(async () => {
    if (!isSupported) throw new Error("Push notifications are not supported");
    setIsLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") throw new Error("Notification permission denied");

      const registration = await navigator.serviceWorker.register("/sw-push.js", {
        scope: "/",
      });
      await navigator.serviceWorker.ready;

      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
      });

      const p256dhKey = subscription.getKey("p256dh");
      const authKey = subscription.getKey("auth");
      if (!p256dhKey || !authKey) throw new Error("Failed to get subscription keys");

      const p256dh = btoa(String.fromCharCode(...new Uint8Array(p256dhKey)));
      const auth = btoa(String.fromCharCode(...new Uint8Array(authKey)));

      const userId = getCurrentUserId();
      if (!userId) throw new Error("Please sign in first");

      const { error } = await supabase
        .from("push_subscriptions")
        .upsert(
          {
            user_id: userId,
            role: "customer",
            endpoint: subscription.endpoint,
            p256dh,
            auth,
            user_agent: navigator.userAgent,
            last_seen_at: new Date().toISOString(),
          },
          { onConflict: "endpoint" },
        );
      if (error) throw error;

      setIsSubscribed(true);
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw-push.js");
      if (!reg) return setIsSubscribed(false);
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
      }
      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isSupported,
    isSubscribed,
    permission,
    isLoading,
    isiOS,
    isPWA,
    subscribe,
    unsubscribe,
  };
}