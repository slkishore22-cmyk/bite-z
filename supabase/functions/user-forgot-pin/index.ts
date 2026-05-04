import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function sha256Hex(input: string) {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });
  try {
    const { user_id, new_pin } = await req.json();
    const uid = String(user_id ?? "").trim().toLowerCase();
    const p = String(new_pin ?? "");
    if (!/^[a-z0-9_]+$/.test(uid))
      return json({ error: "Invalid user ID" }, 400);
    if (!/^\d{4}$/.test(p))
      return json({ error: "PIN must be 4 digits" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data } = await admin
      .from("users")
      .select("id")
      .eq("user_id", uid)
      .maybeSingle();
    if (!data) return json({ error: "User ID not found" }, 404);

    const pinHash = await sha256Hex(p + uid);
    const { error } = await admin
      .from("users")
      .update({ pin_hash: pinHash })
      .eq("id", data.id);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}