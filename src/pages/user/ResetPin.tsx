import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { updatePin } from "@/lib/userAuth";
import { BitezBloom, btnStyle, lgStyle } from "./Login";

const ResetPin = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase recovery flow signs the user in via the email link.
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        toast.error("Reset link expired or invalid");
        navigate("/app/forgot-pin", { replace: true });
      } else {
        setReady(true);
      }
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(pin)) return toast.error("PIN must be 4 digits");
    if (pin !== confirm) return toast.error("PINs don't match");
    setLoading(true);
    try {
      await updatePin(pin);
      toast.success("PIN updated");
      navigate("/app/home", { replace: true });
    } catch (err) {
      toast.error((err as Error).message || "Could not update PIN");
    } finally {
      setLoading(false);
    }
  };

  if (!ready)
    return <div className="min-h-screen" style={{ background: "#F5F5F7" }} />;

  return (
    <main
      className="min-h-screen relative antialiased"
      style={{ background: "#F5F5F7", color: "#1D1D1F" }}
    >
      <BitezBloom />
      <div className="mx-auto px-6 pt-32" style={{ maxWidth: 390 }}>
        <h1 className="mb-2" style={{ fontSize: 28, fontWeight: 700 }}>
          Set new PIN
        </h1>
        <p className="mb-8" style={{ fontSize: 15, color: "#86868B" }}>
          Choose a 4-digit PIN you'll remember
        </p>
        <form onSubmit={submit} className="space-y-5">
          {[
            { v: pin, set: setPin, ph: "New PIN" },
            { v: confirm, set: setConfirm, ph: "Confirm PIN" },
          ].map((f, i) => (
            <div key={i} className="lg-input flex items-center px-5" style={lgStyle}>
              <span
                className="material-symbols-outlined mr-4"
                style={{ color: "#6E6E73", fontSize: 22 }}
              >
                lock
              </span>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={f.v}
                onChange={(e) =>
                  f.set(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                placeholder={f.ph}
                className="flex-1 bg-transparent outline-none border-none font-medium"
                style={{ fontSize: 17, letterSpacing: "0.5em", color: "#1D1D1F" }}
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={loading}
            className="w-full font-bold transition-all duration-200 active:scale-[0.98] disabled:opacity-60"
            style={btnStyle}
          >
            {loading ? "Updating…" : "Set New PIN"}
          </button>
        </form>
      </div>
    </main>
  );
};

export default ResetPin;