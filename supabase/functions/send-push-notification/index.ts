// Web Push sender — RFC 8291 / aes128gcm, hand-rolled with Web Crypto
// (works in Deno without the web-push npm dependency).
//
// Body: { user_id: string, payload: { title, body, url?, icon? } }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function base64UrlToUint8Array(input: string): Uint8Array {
  const cleaned = input.replace(/=+$/g, "");
  const base64 = cleaned.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(base64 + padding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function generateVapidJWT(
  endpoint: string,
  vapidPrivateKey: string,
  vapidPublicKey: string,
): Promise<string> {
  const audience = new URL(endpoint).origin;
  const subject = "mailto:admin@bitez.app";

  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = { aud: audience, exp: now + 12 * 60 * 60, sub: subject };

  const headerB64 = uint8ArrayToBase64Url(
    new TextEncoder().encode(JSON.stringify(header)),
  );
  const payloadB64 = uint8ArrayToBase64Url(
    new TextEncoder().encode(JSON.stringify(payload)),
  );
  const unsignedToken = `${headerB64}.${payloadB64}`;

  const publicKeyBytes = base64UrlToUint8Array(vapidPublicKey);
  const key = await crypto.subtle.importKey(
    "jwk",
    {
      kty: "EC",
      crv: "P-256",
      d: vapidPrivateKey,
      x: uint8ArrayToBase64Url(publicKeyBytes.slice(1, 33)),
      y: uint8ArrayToBase64Url(publicKeyBytes.slice(33, 65)),
    },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(unsignedToken),
  );
  const signatureB64 = uint8ArrayToBase64Url(new Uint8Array(signature));
  return `${unsignedToken}.${signatureB64}`;
}

async function hkdf(
  salt: Uint8Array,
  ikm: Uint8Array,
  info: Uint8Array,
  length: number,
): Promise<Uint8Array> {
  const saltKeyBytes = salt.length > 0 ? salt : new Uint8Array(32);
  const saltKey = await crypto.subtle.importKey(
    "raw",
    saltKeyBytes.buffer as ArrayBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const prk = new Uint8Array(
    await crypto.subtle.sign("HMAC", saltKey, ikm.buffer as ArrayBuffer),
  );
  const prkKey = await crypto.subtle.importKey(
    "raw",
    prk.buffer as ArrayBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const hashLen = 32;
  const n = Math.ceil(length / hashLen);
  let t = new Uint8Array(0);
  const okm = new Uint8Array(n * hashLen);
  for (let i = 0; i < n; i++) {
    const input = new Uint8Array(t.length + info.length + 1);
    input.set(t, 0);
    input.set(info, t.length);
    input[input.length - 1] = i + 1;
    t = new Uint8Array(
      await crypto.subtle.sign("HMAC", prkKey, input.buffer as ArrayBuffer),
    );
    okm.set(t, i * hashLen);
  }
  return okm.slice(0, length);
}

async function encryptPayload(
  payload: string,
  subscriberPublicKey: Uint8Array,
  subscriberAuth: Uint8Array,
): Promise<{ encrypted: Uint8Array }> {
  const serverKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"],
  );
  const serverPublicKey = new Uint8Array(
    await crypto.subtle.exportKey("raw", serverKeyPair.publicKey),
  );

  const subscriberKey = await crypto.subtle.importKey(
    "raw",
    subscriberPublicKey.buffer as ArrayBuffer,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "ECDH", public: subscriberKey },
      serverKeyPair.privateKey,
      256,
    ),
  );

  const salt = crypto.getRandomValues(new Uint8Array(16));

  const webPushInfo = new TextEncoder().encode("WebPush: info\0");
  const keyInfo = new Uint8Array(
    webPushInfo.length + subscriberPublicKey.length + serverPublicKey.length,
  );
  keyInfo.set(webPushInfo, 0);
  keyInfo.set(subscriberPublicKey, webPushInfo.length);
  keyInfo.set(serverPublicKey, webPushInfo.length + subscriberPublicKey.length);

  const ikm = await hkdf(subscriberAuth, sharedSecret, keyInfo, 32);
  const cek = await hkdf(
    salt,
    ikm,
    new TextEncoder().encode("Content-Encoding: aes128gcm\0"),
    16,
  );
  const nonce = await hkdf(
    salt,
    ikm,
    new TextEncoder().encode("Content-Encoding: nonce\0"),
    12,
  );

  const payloadBytes = new TextEncoder().encode(payload);
  const padded = new Uint8Array(payloadBytes.length + 1);
  padded.set(payloadBytes);
  padded[payloadBytes.length] = 2;

  const aesKey = await crypto.subtle.importKey(
    "raw",
    cek.buffer as ArrayBuffer,
    { name: "AES-GCM" },
    false,
    ["encrypt"],
  );
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonce.buffer as ArrayBuffer },
      aesKey,
      padded.buffer as ArrayBuffer,
    ),
  );

  const recordSize = 4096;
  const encrypted = new Uint8Array(
    16 + 4 + 1 + serverPublicKey.length + ciphertext.length,
  );
  let off = 0;
  encrypted.set(salt, off);
  off += 16;
  encrypted[off++] = (recordSize >>> 24) & 0xff;
  encrypted[off++] = (recordSize >>> 16) & 0xff;
  encrypted[off++] = (recordSize >>> 8) & 0xff;
  encrypted[off++] = recordSize & 0xff;
  encrypted[off++] = serverPublicKey.length;
  encrypted.set(serverPublicKey, off);
  off += serverPublicKey.length;
  encrypted.set(ciphertext, off);

  return { encrypted };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { user_id, payload } = await req.json();
    if (!user_id || !payload) {
      return new Response(
        JSON.stringify({ error: "user_id and payload are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    if (!vapidPublicKey || !vapidPrivateKey) {
      return new Response(
        JSON.stringify({ error: "VAPID keys not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", user_id);

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: "No subscriptions", sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const notif = JSON.stringify({
      title: payload.title || "Bitez",
      body: payload.body || "You have a new notification",
      icon: payload.icon || "/icon-192.png",
      badge: "/icon-192.png",
      url: payload.url || "/app/home",
    });

    let sent = 0;
    for (const sub of subscriptions) {
      try {
        const { encrypted } = await encryptPayload(
          notif,
          base64UrlToUint8Array(sub.p256dh),
          base64UrlToUint8Array(sub.auth),
        );
        const jwt = await generateVapidJWT(sub.endpoint, vapidPrivateKey, vapidPublicKey);
        const body = encrypted.buffer.slice(
          encrypted.byteOffset,
          encrypted.byteOffset + encrypted.byteLength,
        ) as ArrayBuffer;

        const res = await fetch(sub.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
            "Content-Encoding": "aes128gcm",
            "Content-Length": encrypted.length.toString(),
            TTL: "86400",
            Authorization: `vapid t=${jwt}, k=${vapidPublicKey}`,
          },
          body,
        });

        if (res.ok || res.status === 201) sent++;
        else if (res.status === 410 || res.status === 404) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        }
      } catch (err) {
        console.error("[push] send failed:", err);
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent, total: subscriptions.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});