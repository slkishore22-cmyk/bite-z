import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const PROFILE_STORAGE_KEY = "bitez.seller.profile";

const readCanteenIcon = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { icon?: string };
    return parsed.icon?.trim() ? parsed.icon : null;
  } catch {
    return null;
  }
};

const SellerHeader = () => {
  const [canteenIcon, setCanteenIcon] = useState<string | null>(() => readCanteenIcon());

  useEffect(() => {
    const refresh = () => setCanteenIcon(readCanteenIcon());
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  return (
    <header className="flex items-center justify-between">
      <Link to="/seller" className="flex items-center gap-2">
        <span className="material-symbols-outlined text-primary" style={{ fontSize: 26 }}>
          shield_lock
        </span>
        <h1 className="text-xl font-extrabold tracking-tight text-primary">
          Bitez Admin Panel
        </h1>
      </Link>
      <div className="flex items-center gap-3">
        <Link
          to="/seller/orders"
          aria-label="Orders"
          className="relative grid h-10 w-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-destructive" />
        </Link>
        <Link
          to="/seller/settings"
          aria-label="Profile & settings"
          className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-primary transition hover:bg-secondary/80"
        >
          {canteenIcon ? (
            <span className="text-xl leading-none">{canteenIcon}</span>
          ) : (
            <span className="material-symbols-outlined">restaurant</span>
          )}
        </Link>
      </div>
    </header>
  );
};

export default SellerHeader;