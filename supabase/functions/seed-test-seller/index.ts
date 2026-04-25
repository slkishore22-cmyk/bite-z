import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TEST_EMAIL = "seller@bitez.test";
const TEST_PASSWORD = "Bitez@1234";
const BUSINESS_NAME = "Bitez Test Canteen";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    // Find or create user
    const { data: list } = await admin.auth.admin.listUsers();
    let user = list?.users.find((u) => u.email === TEST_EMAIL) ?? null;

    if (!user) {
      const { data, error } = await admin.auth.admin.createUser({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: "Test Seller" },
      });
      if (error) throw error;
      user = data.user;
    } else {
      // Reset password to known value
      await admin.auth.admin.updateUserById(user.id, { password: TEST_PASSWORD });
    }

    if (!user) throw new Error("Failed to create user");

    // Ensure seller role
    await admin.from("user_roles").upsert(
      { user_id: user.id, role: "seller" },
      { onConflict: "user_id,role" }
    );

    // Ensure approved seller_profile
    const { data: existingSeller } = await admin
      .from("seller_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existingSeller) {
      await admin.from("seller_profiles").insert({
        user_id: user.id,
        business_name: BUSINESS_NAME,
        status: "approved",
        approved_at: new Date().toISOString(),
      });
    } else {
      await admin
        .from("seller_profiles")
        .update({ status: "approved" })
        .eq("id", existingSeller.id);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        message: "Test seller is ready. Use the credentials above to log in.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});