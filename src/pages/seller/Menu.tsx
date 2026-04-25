import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

type Category = "Food" | "Snacks" | "Drinks";

type MenuItem = {
  id: string;
  name: string;
  price: number;
  icon: string;
  category: Category;
  group: string;
  active: boolean;
  stock: number;
  isNew?: boolean;
};

const initialItems: MenuItem[] = [
  { id: "1", name: "Signature Bento Box", price: 24, icon: "🍱", category: "Food", group: "Main Dishes", active: true, stock: 10 },
  { id: "2", name: "Spicy Tuna Roll", price: 18.5, icon: "🍣", category: "Food", group: "Main Dishes", active: false, stock: 0 },
  { id: "3", name: "Shoyu Ramen", price: 16, icon: "🍜", category: "Food", group: "Main Dishes", active: true, stock: 45, isNew: true },
  { id: "4", name: "French Fries", price: 6, icon: "🍟", category: "Snacks", group: "Sides", active: true, stock: 30 },
  { id: "5", name: "Crispy Spring Rolls", price: 8, icon: "🥟", category: "Snacks", group: "Sides", active: true, stock: 12 },
  { id: "6", name: "Iced Matcha Latte", price: 5.5, icon: "🍵", category: "Drinks", group: "Beverages", active: true, stock: 20 },
  { id: "7", name: "Cold Brew Coffee", price: 4.5, icon: "🥤", category: "Drinks", group: "Beverages", active: false, stock: 0 },
];

const CATEGORIES: { key: Category; label: string; emoji: string }[] = [
  { key: "Food", label: "Food", emoji: "🍛" },
  { key: "Snacks", label: "Snacks", emoji: "🍟" },
  { key: "Drinks", label: "Drinks", emoji: "🥤" },
];

const SellerMenu = () => {
  const [items, setItems] = useState<MenuItem[]>(initialItems);
  const [activeCat, setActiveCat] = useState<Category>("Food");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (i) =>
        i.category === activeCat &&
        (q === "" || i.name.toLowerCase().includes(q))
    );
  }, [items, activeCat, query]);

  const groups = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    for (const it of filtered) {
      if (!map.has(it.group)) map.set(it.group, []);
      map.get(it.group)!.push(it);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const setActive = (id: string, active: boolean) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, active, stock: active && i.stock === 0 ? 1 : i.stock }
          : i
      )
    );
  };

  const adjustStock = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const next = Math.max(0, i.stock + delta);
        return { ...i, stock: next, active: next === 0 ? false : i.active };
      })
    );
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
            No menu items found.
          </p>
        )}

        {groups.map(([group, list]) => (
          <section key={group} className="mt-6">
            <h2 className="mb-3 text-xs font-extrabold tracking-[0.18em] text-primary">
              {group.toUpperCase()}
            </h2>
            <div className="space-y-4">
              {list.map((item) => (
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
                        {item.isNew && (
                          <span className="ml-2 rounded-md bg-destructive/20 px-1.5 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wider text-destructive">
                            New
                          </span>
                        )}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-primary">
                        ${item.price.toFixed(2)}
                      </p>
                    </div>
                    <span
                      className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                        item.stock > 0
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-destructive/40 bg-destructive/10 text-destructive"
                      }`}
                    >
                      {item.stock > 0 ? "Available" : "Out of stock"}
                    </span>
                  </div>

                  {/* Active / Inactive toggle */}
                  <div className="mt-4 grid grid-cols-2 gap-1 rounded-full bg-secondary/60 p-1">
                    <button
                      type="button"
                      onClick={() => setActive(item.id, true)}
                      className={`rounded-full py-2 text-xs font-bold uppercase tracking-wider transition ${
                        item.active
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
                        !item.active
                          ? "bg-destructive/20 text-destructive"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Inactive
                    </button>
                  </div>

                  {/* Stock control */}
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Stock Level
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => adjustStock(item.id, -1)}
                        aria-label="Decrease stock"
                        className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-foreground transition hover:bg-secondary/80"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                          remove
                        </span>
                      </button>
                      <span className="w-8 text-center text-base font-bold tabular-nums">
                        {item.stock}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          adjustStock(item.id, 1);
                          if (item.stock === 0) toast.success(`${item.name} back in stock`);
                        }}
                        aria-label="Increase stock"
                        className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow transition hover:opacity-90"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                          add
                        </span>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default SellerMenu;
