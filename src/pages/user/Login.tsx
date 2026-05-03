import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getUserSession, saveUserSession } from "@/utils/sessionManager";

const UserLogin = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getUserSession()) navigate("/app/home", { replace: true });
  }, [navigate]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    const em = email.trim();
    if (!n || !em) {
      toast.error("Enter your name and email");
      return;
    }
    setLoading(true);
    try {
      const id = `u_${Date.now().toString(36)}`;
      saveUserSession({ id, name: n, email: em });
      toast.success(`Welcome, ${n.split(" ")[0]}`);
      navigate("/app/home", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-xl space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
            <span className="material-symbols-outlined text-primary-foreground" style={{ fontSize: 28 }}>
              person
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Welcome to Bitez</h1>
          <p className="text-sm text-muted-foreground">Sign in to start ordering.</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Name</label>
          <input
            autoFocus
            autoComplete="name"
            className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            autoComplete="email"
            className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@campus.edu"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-xl bg-gradient-primary font-semibold text-primary-foreground shadow-glow disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Continue"}
        </button>
      </form>
    </main>
  );
};

export default UserLogin;