import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { sendPasswordReset } from "@/lib/userAuth";
import { BitezBloom, btnStyle, lgStyle } from "./Login";

const ForgotPin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()))
      return toast.error("Enter a valid email");
    setLoading(true);
    try {
      await sendPasswordReset(email);
      setDone(true);
    } catch (err) {
      toast.error((err as Error).message || "Could not send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen relative antialiased"
      style={{ background: "#F5F5F7", color: "#1D1D1F" }}
    >
      <BitezBloom />
      <button
        type="button"
        onClick={() => navigate(-1)}
        aria-label="Back"
        className="fixed top-4 left-4 z-20 inline-flex items-center justify-center rounded-full"
        style={{
          width: 40,
          height: 40,
          background: "rgba(255,255,255,0.8)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
          arrow_back
        </span>
      </button>

      <div className="mx-auto px-6 pt-32" style={{ maxWidth: 390 }}>
        <h1
          className="mb-2"
          style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.022em" }}
        >
          Reset PIN
        </h1>
        <p className="mb-8" style={{ fontSize: 15, color: "#86868B" }}>
          Enter your email and we'll send a reset link
        </p>

        {done ? (
          <div
            className="bg-white p-6 text-center"
            style={{ borderRadius: 20, boxShadow: "0 8px 30px rgba(0,0,0,0.04)" }}
          >
            <span
              className="material-symbols-outlined mb-3 inline-block"
              style={{ fontSize: 48, color: "#0071E3" }}
            >
              mark_email_read
            </span>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>Check your email</h2>
            <p className="mt-2" style={{ fontSize: 14, color: "#86868B" }}>
              We sent a reset link to {email}
            </p>
            <Link
              to="/app/login"
              className="block mt-6 font-medium"
              style={{ color: "#0071E3", fontSize: 15 }}
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-6">
            <div className="lg-input flex items-center px-5" style={lgStyle}>
              <span
                className="material-symbols-outlined mr-4"
                style={{ color: "#6E6E73", fontSize: 22 }}
              >
                mail
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className="flex-1 bg-transparent outline-none border-none"
                style={{ fontSize: 17, color: "#1D1D1F" }}
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full font-bold transition-all duration-200 active:scale-[0.98] disabled:opacity-60"
              style={btnStyle}
            >
              {loading ? "Sending…" : "Send Reset Link"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
};

export default ForgotPin;