import { useEffect, useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useSellerAuth } from "@/contexts/SellerAuthContext";

const SellerLogin = () => {
  const { user, loading, signIn, sellerProfile } = useSellerAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user && sellerProfile) {
      const dest = (location.state as any)?.from?.pathname ?? "/seller";
      navigate(dest, { replace: true });
    }
  }, [user, sellerProfile, loading, navigate, location.state]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Enter email and password");
      return;
    }
    setSubmitting(true);
    const { error } = await signIn(email.trim(), password);
    setSubmitting(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Welcome back!");
  };

  if (user && sellerProfile) {
    return <Navigate to="/seller" replace />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-10">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-primary">shield_lock</span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight">Bitez Seller</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in with the credentials your admin provided</p>
        </div>

        <form onSubmit={submit} className="mt-10 space-y-5 rounded-3xl border border-border bg-gradient-card p-6 shadow-card">
          <label className="block">
            <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-muted-foreground">Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seller@bitez.test"
              className="mt-2 w-full rounded-full bg-secondary/70 px-5 py-3.5 text-sm outline-none focus:ring-2 focus:ring-primary/60"
            />
          </label>
          <label className="block">
            <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-muted-foreground">Password</span>
            <div className="mt-2 flex items-center rounded-full bg-secondary/70 px-5 py-3.5 focus-within:ring-2 focus-within:ring-primary/60">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-primary py-3.5 text-base font-extrabold text-primary-foreground shadow-glow transition hover:bg-primary/90 disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Test credentials: <b>seller@bitez.test</b> / <b>Bitez@1234</b>
        </p>
      </main>
    </div>
  );
};

export default SellerLogin;