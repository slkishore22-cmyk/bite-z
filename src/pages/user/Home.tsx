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

const offerAccent: Record<CampusOffer["accent"], string> = {
  primary: "from-primary/30 via-primary/10 to-transparent border-primary/40",
  warning: "from-amber-500/30 via-amber-500/10 to-transparent border-amber-500/40",
  success: "from-success/30 via-success/10 to-transparent border-success/40",
};

const offerHighlightTone: Record<CampusOffer["accent"], string> = {
  primary: "text-primary",
  warning: "text-amber-300",
  success: "text-success",
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
      <div className="mx-auto w-full max-w-md px-5 pb-28 pt-6">
        {/* Greeting */}
        <header className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-[0.25em] text-muted-foreground">
              {greeting}
            </p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
              Hey, Alex <span aria-hidden>👋</span>
            </h1>
          </div>
          <Link
            to="/"
            aria-label="Profile"
            className="grid h-11 w-11 place-items-center rounded-full bg-secondary text-foreground"
          >
            <span className="material-symbols-outlined">person</span>
          </Link>
        </header>

        {/* Today's Offers */}
        <section className="mt-7">
          <SectionHeader title={<>Today's Offers <span aria-hidden>🔥</span></>} action="See all" />
          <div className="-mx-5 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {offersQ.isLoading
              ? Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-40 w-72 shrink-0 rounded-2xl" />
                ))
              : offersQ.data?.map((o) => <OfferCard key={o.id} offer={o} />)}
          </div>
        </section>

        {/* Frequent Orders */}
        <section className="mt-7">
          <SectionHeader
            title="Your Frequent Orders"
            subtitle="Order your favorites quickly"
          />
          <div className="mt-3 space-y-3">
            {frequentQ.isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-2xl" />
              ))}
            {frequentQ.data?.map((it) => (
              <FrequentRow
                key={it.id}
                item={it}
                qty={cart[it.id] ?? 1}
                onChange={(n) => setQty(it.id, n)}
              />
            ))}
          </div>
        </section>

        {/* Canteens */}
        <section className="mt-7">
          <SectionHeader title="Our Canteens" subtitle="Tap to explore menu" />
          <div className="mt-3 space-y-3">
            {canteensQ.isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-2xl" />
              ))}
            {canteensQ.data?.map((c) => (
              <CanteenRow key={c.id} canteen={c} />
            ))}
          </div>
        </section>
      </div>

      {/* Bottom nav */}
      <BottomNav />
    </div>
  );
};

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
      <h2 className="text-lg font-extrabold tracking-tight">{title}</h2>
      {subtitle && (
        <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
      )}
    </div>
    {action && (
      <button className="text-[11px] font-bold tracking-[0.18em] text-primary">
        {action}
      </button>
    )}
  </div>
);

const OfferCard = ({ offer }: { offer: CampusOffer }) => (
  <article
    className={`relative w-72 shrink-0 snap-start overflow-hidden rounded-2xl border bg-gradient-to-br ${offerAccent[offer.accent]} bg-card p-4 shadow-card`}
  >
    <span
      className="material-symbols-outlined pointer-events-none absolute -right-3 -bottom-3 text-foreground/5"
      style={{ fontSize: 140 }}
    >
      local_fire_department
    </span>

    <div className="flex items-start justify-between">
      <p className="text-xs font-semibold text-muted-foreground">{offer.canteen}</p>
      {offer.active && (
        <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold tracking-[0.18em] text-success">
          ACTIVE
        </span>
      )}
    </div>

    <p className="mt-3 text-xl font-extrabold leading-tight text-foreground">
      {offer.title}
    </p>
    <p className={`mt-2 text-2xl font-extrabold ${offerHighlightTone[offer.accent]}`}>
      {offer.highlight}
    </p>
    <p className="mt-1 text-xs text-muted-foreground">{offer.subtitle}</p>
  </article>
);

const FrequentRow = ({
  item,
  qty,
  onChange,
}: {
  item: MenuItem;
  qty: number;
  onChange: (n: number) => void;
}) => {
  const emojiByCategory: Record<string, string> = {
    snacks: "🍔",
    food: "🍕",
    drinks: "☕",
    desserts: "🍰",
  };
  const emoji = emojiByCategory[item.categoryId] ?? "🍽️";
  const isHot = item.popular;

  return (
    <article className="flex items-center gap-3 rounded-2xl border border-border bg-gradient-card p-3 shadow-card">
      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-secondary text-3xl">
        {emoji}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-bold">{item.name}</p>
          {isHot && <span aria-hidden>🔥</span>}
        </div>
        <p className="mt-0.5 text-base font-extrabold">₹{item.price}</p>
      </div>

      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-1 rounded-full border border-border bg-secondary/60 px-1 py-0.5">
          <button
            onClick={() => onChange(qty - 1)}
            className="grid h-6 w-6 place-items-center rounded-full text-foreground"
            aria-label="Decrease"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              remove
            </span>
          </button>
          <span className="min-w-[1ch] text-center text-xs font-extrabold">{qty}</span>
          <button
            onClick={() => onChange(qty + 1)}
            className="grid h-6 w-6 place-items-center rounded-full text-foreground"
            aria-label="Increase"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              add
            </span>
          </button>
        </div>
        <button className="rounded-full bg-gradient-primary px-3 py-1 text-[11px] font-bold tracking-wide text-primary-foreground shadow-glow">
          Order Now
        </button>
      </div>
    </article>
  );
};

const CanteenRow = ({ canteen }: { canteen: Canteen }) => {
  const open = canteen.isOpen;
  return (
    <button
      type="button"
      disabled={!open}
      className={`flex w-full items-center gap-3 rounded-2xl border border-border bg-gradient-card p-3 text-left shadow-card transition ${
        open ? "hover:border-primary/40" : "opacity-60"
      }`}
    >
      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-secondary text-3xl">
        {canteen.emoji}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-bold">{canteen.name}</p>
          <span
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-[0.15em] ${
              open ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${open ? "bg-success" : "bg-muted-foreground"}`} />
            {open ? "Open now" : "Closed"}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{canteen.tagline}</p>
      </div>

      <span className="material-symbols-outlined text-muted-foreground" style={{ fontSize: 22 }}>
        {open ? "arrow_forward" : "lock"}
      </span>
    </button>
  );
};

const BottomNav = () => {
  const items = [
    { icon: "home", label: "Home", active: true },
    { icon: "receipt_long", label: "My Orders" },
    { icon: "shopping_cart", label: "My Cart", primary: true },
    { icon: "event", label: "Events" },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur">
      <div className="mx-auto grid w-full max-w-md grid-cols-4 px-3 pt-2 pb-3">
        {items.map((it) => {
          if (it.primary) {
            return (
              <div key={it.label} className="flex flex-col items-center -mt-7">
                <button className="grid h-14 w-14 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow">
                  <span className="material-symbols-outlined" style={{ fontSize: 28 }}>
                    {it.icon}
                  </span>
                </button>
                <span className="mt-1 text-[10px] font-bold tracking-[0.15em] text-foreground">
                  {it.label}
                </span>
              </div>
            );
          }
          return (
            <button
              key={it.label}
              className={`flex flex-col items-center gap-1 ${
                it.active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
                {it.icon}
              </span>
              <span className="text-[10px] font-bold tracking-[0.12em]">{it.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default UserHome;