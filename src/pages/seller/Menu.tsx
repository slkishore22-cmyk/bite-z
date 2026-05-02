import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  getInventory,
  removeInventoryItem,
  setInventoryStatus,
  subscribeInventory,
  type SellerCategory,
  type SellerInventoryItem,
} from "@/lib/sellerInventory";

const CATEGORIES: { key: SellerCategory; label: string; emoji: string }[] = [
  { key: "Food", label: "Food", emoji: "🍛" },
  { key: "Snacks", label: "Snacks", emoji: "🍟" },
  { key: "Drinks", label: "Drinks", emoji: "🥤" },
];

// Items added within the last 24h get a "New" badge.
const NEW_WINDOW_MS = 24 * 60 * 60 * 1000;

const SellerMenu = () => {
  const [items, setItems] = useState<SellerInventoryItem[]>(() => getInventory());
  const [activeCat, setActiveCat] = useState<SellerCategory>("Food");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const unsub = subscribeInventory(() => setItems(getInventory()));
    return unsub;
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q !== "") {
      // Universal search — ignore active category, search across all items.
      return items.filter((i) => i.name.toLowerCase().includes(q));
    }
    return items.filter((i) => i.category === activeCat);
  }, [items, activeCat, query]);

  // When searching, group results by their actual category so users see
  // matches from every section. Otherwise keep the single active-category group.
  const groups = useMemo<[string, SellerInventoryItem[]][]>(() => {
    if (filtered.length === 0) return [];
    if (query.trim() === "") return [[`${activeCat} Items`, filtered]];
    const order: SellerCategory[] = ["Food", "Snacks", "Drinks"];
    return order
      .map((cat) => [`${cat} Items`, filtered.filter((i) => i.category === cat)] as [string, SellerInventoryItem[]])
      .filter(([, list]) => list.length > 0);
  }, [filtered, activeCat, query]);

  const setActive = (id: string, active: boolean) => {
    setInventoryStatus(id, active ? "Active" : "Inactive");
  };

  const handleRemove = (item: SellerInventoryItem) => {
    removeInventoryItem(item.id);
    toast.success(`${item.name} removed`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-md px-5 pb-12 pt-6">
        {/* Header — same style as Inventory */}
        <header className="flex items-center gap-3">
          <Link
            to="/seller"
            aria-label="Back to dashboard"
            className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-foreground transition-colors hover:bg-secondary/80"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
              arrow_back
            </span>
          </Link>
          <h1 className="text-lg font-extrabold tracking-tight">Menu Manager</h1>
        </header>

        {/* Search */}
        <div className="relative mt-6">
          <span
            className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            style={{ fontSize: 20 }}
          >
            search
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search menu items..."
            className="w-full rounded-full bg-secondary/70 py-3.5 pl-12 pr-5 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none focus:ring-2 focus:ring-primary/60"
          />
        </div>

        {/* Category chips */}
        <div className="mt-5 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CATEGORIES.map((c) => {
            const active = c.key === activeCat;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setActiveCat(c.key)}
                className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                  active
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "bg-secondary text-foreground/80 hover:bg-secondary/80"
                }`}
              >
                {c.label} {c.emoji}
              </button>
            );
          })}
        </div>

        {/* Groups */}
        {groups.length === 0 && (
          <p className="mt-10 text-center text-sm text-muted-foreground">
            {items.length === 0
              ? "No items yet. Add items from the Add Inventory page."
              : "No menu items found."}
          </p>
        )}

        {groups.map(([group, list]) => (
          <section key={group} className="mt-6">
            <h2 className="mb-3 text-xs font-extrabold tracking-[0.18em] text-primary">
              {group.toUpperCase()}
            </h2>
            <div className="space-y-4">
              {list.map((item) => {
                const isNew = Date.now() - item.createdAt < NEW_WINDOW_MS;
                const isActive = item.status === "Active";
                return (
                <article
                  key={item.id}
                  className="rounded-2xl border border-border bg-gradient-card p-4 shadow-card"
                >
                  <div className="flex items-start gap-3">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-secondary text-2xl">
                      {item.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-bold leading-tight">
                        {item.name}
                        {isNew && (
                          <span className="ml-2 rounded-md bg-destructive/20 px-1.5 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wider text-destructive">
                            New
                          </span>
                        )}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-primary">
                        ₹{item.price}
                      </p>
                    </div>
                    <span
                      className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                        isActive
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-destructive/40 bg-destructive/10 text-destructive"
                      }`}
                    >
                      {isActive ? "Available" : "Unavailable"}
                    </span>
                  </div>

                  {/* Active / Inactive toggle */}
                  <div className="mt-4 grid grid-cols-2 gap-1 rounded-full bg-secondary/60 p-1">
                    <button
                      type="button"
                      onClick={() => setActive(item.id, true)}
                      className={`rounded-full py-2 text-xs font-bold uppercase tracking-wider transition ${
                        isActive
                          ? "bg-success/20 text-success"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Active
                    </button>
                    <button
                      type="button"
                      onClick={() => setActive(item.id, false)}
                      className={`rounded-full py-2 text-xs font-bold uppercase tracking-wider transition ${
                        !isActive
                          ? "bg-destructive/20 text-destructive"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Inactive
                    </button>
                  </div>

                  {/* Footer: category label + delete */}
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {item.iconLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemove(item)}
                      aria-label={`Delete ${item.name}`}
                      className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-destructive transition hover:bg-destructive/15"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                        delete
                      </span>
                    </button>
                  </div>
                </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default SellerMenu;
