import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BitezBloom } from "./Login";

const VerifyPending = () => {
  const [info] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("bitez_pending_verification") || "{}",
      ) as { email?: string; full_name?: string };
    } catch {
      return {};
    }
  });
  const [cooldown, setCooldown] = useState(0);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!cooldown) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const resend = async () => {
    if (!info.email || cooldown || sending) return;
    setSending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: info.email,
        options: { emailRedirectTo: `${window.location.origin}/app/home` },
      });
      if (error) throw error;
      setSent(true);
      setCooldown(60);
      setTimeout(() => setSent(false), 3000);
    } catch (e) {
      toast.error((e as Error).message || "Could not resend email");
    } finally {
      setSending(false);
    }
  };

  return (
    <main
      className="min-h-screen relative flex items-center justify-center antialiased"
      style={{ background: "#F5F5F7", color: "#1D1D1F" }}
    >
      <BitezBloom />
      <div className="px-6 text-center" style={{ maxWidth: 390 }}>
        <span
          className="material-symbols-outlined mb-6 inline-block"
          style={{ fontSize: 64, color: "#0071E3" }}
        >
          mark_email_read
        </span>
        <h1 className="mb-3" style={{ fontSize: 28, fontWeight: 700 }}>
          Check your email
        </h1>
        <p style={{ fontSize: 15, color: "#86868B" }}>
          We sent a verification link to
        </p>
        <p
          className="mb-8"
          style={{ fontSize: 15, color: "#0071E3", fontWeight: 600 }}
        >
          {info.email || "your inbox"}
        </p>
        <p className="mb-10" style={{ fontSize: 14, color: "#86868B" }}>
          Tap the link in the email to verify your account
        </p>

        <button
          onClick={resend}
          disabled={!!cooldown || sending}
          className="w-full font-semibold transition-all duration-200 active:scale-[0.98]"
          style={{
            background: "transparent",
            border: "1.5px solid rgba(0,113,227,0.3)",
            borderRadius: 9999,
            color: "#0071E3",
            fontSize: 15,
            padding: "14px 0",
            opacity: cooldown ? 0.6 : 1,
          }}
        >
          {sent
            ? "Sent!"
            : cooldown
            ? `Resend in ${cooldown}s`
            : sending
            ? "Sending…"
            : "Resend Email"}
        </button>

        <div className="mt-6">
          <Link
            to="/app/login"
            style={{ fontSize: 14, color: "#86868B" }}
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </main>
  );
};

export default VerifyPending;