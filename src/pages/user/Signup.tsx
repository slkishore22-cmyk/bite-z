import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ensureRazorpayCustomer, signupUser } from "@/lib/userAuth";
import { BitezBloom, btnStyle, lgStyle } from "./Login";

type Field = {
  icon: string;
  placeholder: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
  key: keyof FormState;
  autoComplete?: string;
};

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  collegeName: string;
  pin: string;
  password: string;
};

const Signup = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>({
    fullName: "",
    email: "",
    phone: "",
    collegeName: "",
    pin: "",
    password: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof FormState, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const fields: Field[] = [
    { icon: "person", placeholder: "Full Name", key: "fullName", autoComplete: "name" },
    { icon: "mail", placeholder: "Email Address", key: "email", type: "email", autoComplete: "email" },
    { icon: "call", placeholder: "Phone Number", key: "phone", type: "tel", inputMode: "numeric", maxLength: 10, autoComplete: "tel" },
    { icon: "school", placeholder: "College Name", key: "collegeName" },
  ];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { fullName, email, phone, collegeName, pin, password } = form;
    if (fullName.trim().length < 2) return toast.error("Enter your full name");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()))
      return toast.error("Enter a valid email");
    if (!/^\d{10}$/.test(phone)) return toast.error("Phone must be 10 digits");
    if (!collegeName.trim()) return toast.error("Enter your college");
    if (!/^\d{4}$/.test(pin)) return toast.error("PIN must be 4 digits");
    if (password.length < 8)
      return toast.error("Password must be at least 8 characters");

    setLoading(true);
    try {
      await signupUser({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone,
        collegeName: collegeName.trim(),
        pin,
        password,
      });
      // Try to provision Razorpay customer (fire-and-forget; needs verified session
      // for RLS, so this often runs after first login instead).
      ensureRazorpayCustomer(fullName.trim(), phone).catch(() => null);
      localStorage.setItem(
        "bitez_pending_verification",
        JSON.stringify({ email: email.trim().toLowerCase(), full_name: fullName.trim() }),
      );
      navigate("/app/verify-pending", { replace: true });
    } catch (err) {
      toast.error((err as Error).message || "Could not create account");
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
        <span className="material-symbols-outlined" style={{ fontSize: 22, color: "#1D1D1F" }}>
          arrow_back
        </span>
      </button>

      <div className="mx-auto px-6 pt-24 pb-12" style={{ maxWidth: 448 }}>
        <div className="px-2 mb-10">
          <h1
            className="font-semibold leading-tight mb-1"
            style={{ fontSize: 34, color: "#1D1D1F", letterSpacing: "-0.022em" }}
          >
            Create Account
          </h1>
          <p style={{ fontSize: 17, color: "#6E6E73" }}>Join Bitez today</p>
        </div>

        <form
          onSubmit={submit}
          className="bg-white p-6 space-y-5"
          style={{
            borderRadius: 20,
            boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
          }}
        >
          {fields.map((f) => (
            <div key={f.key} className="lg-input flex items-center px-5" style={lgStyle}>
              <span
                className="material-symbols-outlined mr-4"
                style={{ color: "#6E6E73", fontSize: 22 }}
              >
                {f.icon}
              </span>
              <input
                type={f.type ?? "text"}
                inputMode={f.inputMode}
                maxLength={f.maxLength}
                autoComplete={f.autoComplete}
                placeholder={f.placeholder}
                value={form[f.key]}
                onChange={(e) => {
                  let v = e.target.value;
                  if (f.key === "phone") v = v.replace(/\D/g, "").slice(0, 10);
                  set(f.key, v);
                }}
                className="flex-1 bg-transparent outline-none border-none"
                style={{ fontSize: 17, color: "#1D1D1F" }}
              />
            </div>
          ))}

          <div className="lg-input flex items-center px-5" style={lgStyle}>
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
              placeholder="Set Login PIN"
              value={form.pin}
              onChange={(e) =>
                set("pin", e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              className="flex-1 bg-transparent outline-none border-none font-medium"
              style={{ fontSize: 17, letterSpacing: "0.5em", color: "#1D1D1F" }}
            />
          </div>

          <div className="lg-input flex items-center px-5" style={lgStyle}>
            <span
              className="material-symbols-outlined mr-4"
              style={{ color: "#6E6E73", fontSize: 22 }}
            >
              password
            </span>
            <input
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Create Password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              className="flex-1 bg-transparent outline-none border-none"
              style={{ fontSize: 17, color: "#1D1D1F" }}
            />
            <button
              type="button"
              aria-label="Toggle password"
              onClick={() => setShowPw((s) => !s)}
              className="ml-2 inline-flex items-center justify-center"
              style={{ width: 28, height: 28 }}
            >
              <span
                className="material-symbols-outlined"
                style={{ color: "#6E6E73", fontSize: 22 }}
              >
                {showPw ? "visibility_off" : "visibility"}
              </span>
            </button>
          </div>

          <p
            className="text-center pt-2"
            style={{ fontSize: 13, color: "#6E6E73" }}
          >
            By signing up you agree to our
            <br />
            <span style={{ color: "#0071E3", fontWeight: 500 }}>
              Terms &amp; Privacy Policy
            </span>
          </p>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full font-bold transition-all duration-200 active:scale-[0.98] disabled:opacity-60"
              style={btnStyle}
            >
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <span style={{ fontSize: 15, color: "#6E6E73" }}>
            Already have an account?
          </span>{" "}
          <Link
            to="/app/login"
            className="font-bold ml-1"
            style={{ color: "#0071E3", fontSize: 15 }}
          >
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
};

export default Signup;