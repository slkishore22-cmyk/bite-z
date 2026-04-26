import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchCategories,
  fetchMenuItems,
  fetchOffers,
  type MenuItem,
  type Offer,
} from "@/data/menu";

const accentClasses: Record<Offer["accent"], string> = {
  primary: "from-primary/30 to-primary/5 border-primary/40 text-primary",
  warning: "from-amber-500/30 to-amber-500/5 border-amber-500/40 text-amber-300",
  success: "from-success/30 to-success/5 border-success/40 text-success",
};

const UserHome = () => {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});

  const offersQ = useQuery({ queryKey: ["offers"], queryFn: fetchOffers });
  const categoriesQ = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const itemsQ = useQuery({ queryKey: ["menu-items"], queryFn: fetchMenuItems });

  const filtered = useMemo(() => {
    const items = itemsQ.data ?? [];
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      const inCat = activeCategory === "all" || i.categoryId === activeCategory;
      const matches = !q || i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q);
      return inCat && matches;
    });
  }, [itemsQ.data, activeCategory, query]);

  const popular = useMemo(
    () => (itemsQ.data ?? []).filter((i) => i.popular).slice(0, 6),
    [itemsQ.data]
  );

  const cartTotals = useMemo(() => {
    const items = itemsQ.data ?? [];
    let count = 0;
    let total = 0;
    for (const [id, qty] of Object.entries(cart)) {
      const it = items.find((m) => m.id === id);
      if (!it) continue;
      count += qty;
      total += it.price * qty;
    }
    return { count, total };
  }, [cart, itemsQ.data]);

  const updateQty = (id: string, delta: number) => {
    setCart((c) => {
      const next = { ...c };
      const v = (next[id] ?? 0) + delta;
      if (v <= 0) delete next[id];
      else next[id] = v;
      return next;
    });
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="mx-auto w-full max-w-md px-5 pb-32 pt-6">
        {/* Top bar */}
        <header className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground">
              DELIVER TO
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-base font-bold">
              Campus Block A
              <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>
                expand_more
              </span>
            </p>
          </div>
          <Link
            to="/"
            aria-label="Profile"
            className="grid h-11 w-11 place-items-center rounded-full bg-secondary text-foreground"
          >
            <span className="material-symbols-outlined">person</span>
          </Link>
        </header>

        {/* Greeting */}
        <div className="mt-5">
          <h1 className="text-2xl font-extrabold tracking-tight">
            Hungry? <span className="text-primary">Let's bite.</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Hot picks from your campus, delivered fast.
          </p>
        </div>

        {/* Search */}
        <div className="relative mt-4">
          <span
            className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            style={{ fontSize: 20 }}
          >
            search
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search burgers, biryani, drinks…"
            className="w-full rounded-full border border-border bg-secondary/60 py-3 pl-11 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Offers */}
        <section className="mt-6">
          <SectionHeader title="Offers for you" action="See all" />
          <div className="-mx-5 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {offersQ.isLoading
              ? Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 w-64 shrink-0 rounded-2xl" />
                ))
              : offersQ.data?.map((o) => (
                  <article
                    key={o.id}
                    className={`relative w-64 shrink-0 snap-start overflow-hidden rounded-2xl border bg-gradient-to-br p-4 shadow-card ${accentClasses[o.accent]}`}
                  >
                    <span className="material-symbols-outlined absolute -right-2 -top-2 opacity-30" style={{ fontSize: 96 }}>
                      local_offer
                    </span>
                    <p className="text-[10px] font-bold tracking-[0.2em] opacity-80">LIMITED</p>
                    <p className="mt-1 text-xl font-extrabold text-foreground">{o.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{o.subtitle}</p>
                    <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-background/60 px-3 py-1 text-[11px] font-bold tracking-[0.18em]">
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                        sell
                      </span>
                      {o.code}
                    </div>
                  </article>
                ))}
          </div>
        </section>

        {/* Categories */}
        <section className="mt-6">
          <SectionHeader title="Categories" />
          <div className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categoriesQ.isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-24 shrink-0 rounded-full" />
                ))
              : categoriesQ.data?.map((c) => {
                  const active = activeCategory === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setActiveCategory(c.id)}
                      className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${
                        active
                          ? "bg-gradient-primary text-primary-foreground shadow-glow"
                          : "border border-border bg-secondary/60 text-foreground"
                      }`}
                    >
                      <span>{c.emoji}</span>
                      {c.name}
                    </button>
                  );
                })}
          </div>
        </section>

        {/* Popular */}
        {activeCategory === "all" && !query && popular.length > 0 && (
          <section className="mt-6">
            <SectionHeader title="Popular now" action="See all" />
            <div className="-mx-5 mt-3 flex gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {popular.map((it) => (
                <PopularCard key={it.id} item={it} qty={cart[it.id] ?? 0} onAdd={() => updateQty(it.id, 1)} />
              ))}
            </div>
          </section>
        )}

        {/* Items list */}
        <section className="mt-6">
          <SectionHeader
            title={
              activeCategory === "all"
                ? "All items"
                : (categoriesQ.data?.find((c) => c.id === activeCategory)?.name ?? "Items")
            }
            action={`${filtered.length} item${filtered.length === 1 ? "" : "s"}`}
          />
          <div className="mt-3 space-y-3">
            {itemsQ.isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-2xl" />
              ))}
            {!itemsQ.isLoading && filtered.length === 0 && (
              <p className="rounded-2xl border border-dashed border-border bg-secondary/40 p-8 text-center text-sm text-muted-foreground">
                Nothing matches your search.
              </p>
            )}
            {filtered.map((it) => (
              <ItemRow
                key={it.id}
                item={it}
                qty={cart[it.id] ?? 0}
                onInc={() => updateQty(it.id, 1)}
                onDec={() => updateQty(it.id, -1)}
              />
            ))}
          </div>
        </section>
      </div>

      {/* Cart bar */}
      {cartTotals.count > 0 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 flex justify-center px-5">
          <button className="pointer-events-auto flex w-full max-w-md items-center justify-between rounded-2xl bg-gradient-primary px-5 py-3.5 text-primary-foreground shadow-glow">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-background/20">
                <span className="material-symbols-outlined">shopping_bag</span>
              </span>
              <div className="text-left">
                <p className="text-[10px] font-bold tracking-[0.18em] opacity-80">
                  {cartTotals.count} ITEM{cartTotals.count === 1 ? "" : "S"}
                </p>
                <p className="text-base font-extrabold">₹{cartTotals.total}</p>
              </div>
            </div>
            <span className="flex items-center gap-1 text-sm font-bold">
              View cart
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                arrow_forward
              </span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

const SectionHeader = ({ title, action }: { title: string; action?: string }) => (
  <div className="flex items-end justify-between">
    <h2 className="text-base font-extrabold tracking-tight">{title}</h2>
    {action && (
      <span className="text-[11px] font-bold tracking-[0.15em] text-primary">{action}</span>
    )}
  </div>
);

const VegBadge = ({ isVeg }: { isVeg: boolean }) => (
  <span
    className={`grid h-4 w-4 place-items-center rounded-sm border ${
      isVeg ? "border-success" : "border-destructive"
    }`}
  >
    <span
      className={`h-2 w-2 rounded-full ${isVeg ? "bg-success" : "bg-destructive"}`}
    />
  </span>
);

const PopularCard = ({
  item,
  qty,
  onAdd,
}: {
  item: MenuItem;
  qty: number;
  onAdd: () => void;
}) => (
  <article className="w-44 shrink-0 overflow-hidden rounded-2xl border border-border bg-gradient-card shadow-card">
    <div className="relative aspect-square w-full">
      <img
        src={item.image}
        alt={item.name}
        loading="lazy"
        className="h-full w-full object-cover"
      />
      <span className="absolute left-2 top-2 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-bold tracking-[0.15em] text-foreground backdrop-blur">
        ★ {item.rating}
      </span>
    </div>
    <div className="p-3">
      <div className="flex items-center gap-1.5">
        <VegBadge isVeg={item.isVeg} />
        <p className="truncate text-sm font-bold">{item.name}</p>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-base font-extrabold">₹{item.price}</p>
        <button
          onClick={onAdd}
          className="rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary"
        >
          {qty > 0 ? `${qty} in cart` : "ADD +"}
        </button>
      </div>
    </div>
  </article>
);

const ItemRow = ({
  item,
  qty,
  onInc,
  onDec,
}: {
  item: MenuItem;
  qty: number;
  onInc: () => void;
  onDec: () => void;
}) => (
  <article className="flex gap-3 rounded-2xl border border-border bg-gradient-card p-3 shadow-card">
    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl">
      <img
        src={item.image}
        alt={item.name}
        loading="lazy"
        className="h-full w-full object-cover"
      />
    </div>
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex items-center gap-1.5">
        <VegBadge isVeg={item.isVeg} />
        <p className="truncate text-sm font-bold">{item.name}</p>
      </div>
      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
        {item.description}
      </p>
      <div className="mt-auto flex items-center justify-between pt-2">
        <div className="flex items-baseline gap-2">
          <p className="text-base font-extrabold">₹{item.price}</p>
          {item.oldPrice && (
            <p className="text-xs font-semibold text-muted-foreground line-through">
              ₹{item.oldPrice}
            </p>
          )}
          <span className="text-[10px] font-bold tracking-[0.15em] text-muted-foreground">
            • {item.prepMinutes}m
          </span>
        </div>
        {qty === 0 ? (
          <button
            onClick={onInc}
            className="rounded-full bg-gradient-primary px-4 py-1.5 text-xs font-bold text-primary-foreground shadow-glow"
          >
            ADD +
          </button>
        ) : (
          <div className="flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-1 py-0.5">
            <button
              onClick={onDec}
              className="grid h-7 w-7 place-items-center rounded-full text-primary"
              aria-label="Decrease"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                remove
              </span>
            </button>
            <span className="min-w-[1ch] text-sm font-extrabold text-primary">{qty}</span>
            <button
              onClick={onInc}
              className="grid h-7 w-7 place-items-center rounded-full text-primary"
              aria-label="Increase"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                add
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  </article>
);

export default UserHome;