import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Writes a row to admin_audit_log using the service role. The caller must
// pass the master-admin username+password; we re-verify before logging so
// a leaked client cannot forge audit entries.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { username, password, action_type, target, details } = await req.json();
    if (!username || !password || !action_type) return json({ error: "missing fields" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: ok, error: vErr } = await admin.rpc("verify_master_admin", {
      p_username: username,
      p_password: password,
    });
    if (vErr || !ok) return json({ error: "unauthorized" }, 401);

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
    const { error } = await admin.from("admin_audit_log").insert({
      action_type: String(action_type).slice(0, 100),
      target: target ? String(target).slice(0, 200) : null,
      details: details ?? null,
      ip_address: ip,
    });
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