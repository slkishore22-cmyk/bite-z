import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchCampusOffers,
  fetchCanteens,
  fetchFrequentItems,
  type Canteen,
  type CampusOffer,
  type MenuItem,
} from "@/data/menu";

const greetingFor = (h: number) => {
  if (h < 12) return "GOOD MORNING";
  if (h < 17) return "GOOD AFTERNOON";
  return "GOOD EVENING";
};

const offerAccentBar: Record<CampusOffer["accent"], string> = {
  primary: "bg-primary",
  warning: "bg-amber-400",
  success: "bg-success",
};

const offerHighlight: Record<CampusOffer["accent"], string> = {
  primary: "text-primary",
  warning: "text-amber-300",
  success: "text-success",
};

const canteenImages: Record<string, string> = {
  c1: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&q=70&auto=format&fit=crop",
  c2: "https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=200&q=70&auto=format&fit=crop",
  c3: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&q=70&auto=format&fit=crop",
};

const itemEmoji: Record<string, string> = {
  m1: "🍔",
  m2: "🍕",
  m7: "☕",
};

const UserHome = () => {
  const [cart, setCart] = useState<Record<string, number>>({});

  const offersQ = useQuery({ queryKey: ["campus-offers"], queryFn: fetchCampusOffers });
  const frequentQ = useQuery({ queryKey: ["frequent-items"], queryFn: fetchFrequentItems });
  const canteensQ = useQuery({ queryKey: ["canteens"], queryFn: fetchCanteens });

  const greeting = useMemo(() => greetingFor(new Date().getHours()), []);

  const setQty = (id: string, next: number) =>
    setCart((c) => {
      const copy = { ...c };
      if (next <= 0) delete copy[id];
      else copy[id] = next;
      return copy;
    });

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="mx-auto w-full max-w-md px-5 pb-32 pt-8">
        {/* Greeting */}
        <header>
          <p className="text-[11px] font-extrabold tracking-[0.25em] text-primary">
            {greeting}
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
            Hey, Alex <span aria-hidden>👋</span>
          </h1>
        </header>

        {/* Today's Offers */}
        <section className="mt-8">
          <SectionHeader
            title={
              <>
                Today's Offers <span aria-hidden>🔥</span>
              </>
            }
            action="See all"
          />
          <div className="-mx-5 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {offersQ.isLoading
              ? Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-44 w-[280px] shrink-0 rounded-2xl" />
                ))
              : offersQ.data?.map((o) => <OfferCard key={o.id} offer={o} />)}
          </div>
        </section>

        {/* Frequent Orders */}
        <section className="mt-8">
          <SectionHeader title="Your Frequent Orders" subtitle="Order your favorites quickly" />
          <div className="-mx-5 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {frequentQ.isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-[260px] shrink-0 rounded-2xl" />
                ))
              : frequentQ.data?.map((it) => (
                  <FrequentCard
                    key={it.id}
                    item={it}
                    qty={cart[it.id] ?? 1}
                    onChange={(n) => setQty(it.id, n)}
                  />
                ))}
          </div>
        </section>

        {/* Canteens */}
        <section className="mt-8">
          <SectionHeader title="Our Canteens" subtitle="Tap to explore menu" />
          <div className="mt-4 space-y-3">
            {canteensQ.isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-2xl" />
              ))}
            {canteensQ.data?.map((c) => (
              <CanteenRow key={c.id} canteen={c} />
            ))}
          </div>
        </section>
      </div>

      <BottomNav />
    </div>
  );
};

/* ---------- Section header ---------- */
const SectionHeader = ({
  title,
  subtitle,
  action,
}: {
  title: React.ReactNode;
  subtitle?: string;
  action?: string;
}) => (
  <div className="flex items-end justify-between gap-3">
    <div className="min-w-0">
      <h2 className="text-xl font-extrabold tracking-tight">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
    {action && (
      <button className="shrink-0 text-sm font-bold text-primary">{action}</button>
    )}
  </div>
);

/* ---------- Offer card ---------- */
const OfferCard = ({ offer }: { offer: CampusOffer }) => (
  <article className="relative w-[280px] shrink-0 snap-start overflow-hidden rounded-2xl bg-card shadow-card">
    {/* Left accent bar */}
    <span
      aria-hidden
      className={`absolute left-0 top-0 h-full w-1 ${offerAccentBar[offer.accent]}`}
    />
    <div className="p-4 pl-5">
      <div className="flex items-start justify-between gap-2">
        <span className="rounded-full bg-secondary px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-foreground">
          {offer.canteen}
        </span>
        {offer.active && (
          <span className="flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Active
          </span>
        )}
      </div>

      <p className="mt-4 text-lg font-extrabold leading-tight">{offer.title}</p>
      <p className={`mt-2 text-2xl font-extrabold tracking-tight ${offerHighlight[offer.accent]}`}>
        {offer.highlight}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{offer.subtitle}</p>
    </div>
  </article>
);

/* ---------- Frequent order card (horizontal scroll) ---------- */
const FrequentCard = ({
  item,
  qty,
  onChange,
}: {
  item: MenuItem;
  qty: number;
  onChange: (n: number) => void;
}) => {
  const emoji = itemEmoji[item.id] ?? "🍽️";
  const isHot = !!item.popular;

  return (
    <article className="flex w-[260px] shrink-0 snap-start flex-col rounded-2xl bg-card p-3 shadow-card">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-secondary text-2xl">
          {emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-extrabold">{item.name}</p>
            {isHot && <span aria-hidden>🔥</span>}
          </div>
          <p className="mt-0.5 text-sm font-extrabold text-primary">₹{item.price}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-full bg-secondary px-1.5 py-1">
          <button
            onClick={() => onChange(qty - 1)}
            aria-label="Decrease"
            className="grid h-6 w-6 place-items-center rounded-full text-primary"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              remove
            </span>
          </button>
          <span className="min-w-[1.25rem] text-center text-xs font-extrabold">{qty}</span>
          <button
            onClick={() => onChange(qty + 1)}
            aria-label="Increase"
            className="grid h-6 w-6 place-items-center rounded-full text-primary"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              add
            </span>
          </button>
        </div>
        <button className="flex-1 rounded-full bg-gradient-primary px-3 py-1.5 text-xs font-extrabold tracking-wide text-primary-foreground shadow-glow">
          Order Now
        </button>
      </div>
    </article>
  );
};

/* ---------- Canteen row ---------- */
const CanteenRow = ({ canteen }: { canteen: Canteen }) => {
  const open = canteen.isOpen;
  return (
    <button
      type="button"
      disabled={!open}
      className={`flex w-full items-center gap-3 rounded-2xl bg-card p-3 text-left shadow-card transition ${
        open ? "active:scale-[0.99]" : "opacity-70"
      }`}
    >
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-secondary">
        <img
          src={canteenImages[canteen.id]}
          alt={canteen.name}
          loading="lazy"
          className={`h-full w-full object-cover ${open ? "" : "grayscale"}`}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-base font-extrabold leading-tight">{canteen.name}</p>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.15em] ${
              open
                ? "bg-success/15 text-success"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {open ? "Open now" : "Closed"}
          </span>
        </div>
        <p className="mt-1 truncate text-xs text-muted-foreground">{canteen.tagline}</p>
      </div>

      {open ? (
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow">
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
            arrow_forward
          </span>
        </span>
      ) : (
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground">
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
            lock
          </span>
        </span>
      )}
    </button>
  );
};

/* ---------- Bottom nav (pill) ---------- */
const BottomNav = () => {
  const items = [
    { icon: "home", label: "HOME", active: true },
    { icon: "receipt_long", label: "MY ORDERS" },
    { icon: "shopping_cart", label: "MY CART", badge: true },
    { icon: "event", label: "EVENTS" },
  ];
  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-3 z-30 flex justify-center px-4">
      <div className="pointer-events-auto flex w-full max-w-md items-center justify-between gap-1 rounded-full border border-border bg-card/95 px-3 py-2 shadow-card backdrop-blur">
        {items.map((it) => (
          <button
            key={it.label}
            className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-full px-2 py-1.5 ${
              it.active ? "bg-secondary text-foreground" : "text-muted-foreground"
            }`}
          >
            <span className="relative">
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                {it.icon}
              </span>
              {it.badge && (
                <span className="absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-card" />
              )}
            </span>
            <span className="text-[9px] font-extrabold tracking-[0.12em]">
              {it.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default UserHome;