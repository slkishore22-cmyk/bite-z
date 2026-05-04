// Send a Web Push notification to one or more recipients.
// Body: { to: { role: "customer"|"seller"|"admin", userId?: string, sellerId?: string },
//         title: string, body: string, url?: string, tag?: string }
// Auth: service-role only (called from edge functions or trusted contexts).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
// @ts-ignore -- Deno-style ESM
import webpush from "https://esm.sh/web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@bitez.app";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  // @ts-ignore -- web-push types are loose under Deno
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

type ToFilter = {
  role: "customer" | "seller" | "admin";
  userId?: string;
  sellerId?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return new Response(
      JSON.stringify({
        error:
          "VAPID keys not configured. Add VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY secrets.",
      }),
      {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  let payload: {
    to: ToFilter;
    title: string;
    body: string;
    url?: string;
    tag?: string;
  };
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid json" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { to, title, body, url = "/app/home", tag } = payload ?? {};
  if (!to?.role || !title || !body) {
    return new Response(
      JSON.stringify({ error: "to.role, title and body are required" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // Build the recipient query.
  let q = supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("role", to.role);
  if (to.role === "customer" && to.userId) q = q.eq("user_id", to.userId);
  if (to.role === "seller" && to.sellerId) q = q.eq("seller_id", to.sellerId);

  const { data: subs, error } = await q;
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const notif = JSON.stringify({ title, body, url, tag });

  let sent = 0;
  let failed = 0;
  const stale: string[] = [];
  await Promise.all(
    (subs ?? []).map(async (s: { endpoint: string; p256dh: string; auth: string }) => {
      try {
        // @ts-ignore
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          notif,
        );
        sent += 1;
      } catch (err) {
        failed += 1;
        // 404/410 = subscription gone — clean it up.
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) stale.push(s.endpoint);
      }
    }),
  );

  if (stale.length > 0) {
    await supabase.from("push_subscriptions").delete().in("endpoint", stale);
  }

  return new Response(
    JSON.stringify({ sent, failed, removed: stale.length }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});