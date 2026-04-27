import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchCampusOffers,
  fetchCanteens,
  fetchFrequentItems,
  type CampusOffer,
  type Canteen,
  type MenuItem,
} from "@/data/menu";
import UserLayout from "@/components/user/UserLayout";

const itemEmoji: Record<string, string> = { m1: "🍔", m2: "🍕", m7: "☕" };
const itemHot: Record<string, boolean> = { m1: true };

const canteenIcon: Record<string, string> = {
  c1: "restaurant",
  c2: "local_cafe",
  c3: "lock",
};

const Home = () => {
  const [cart, setCart] = useState<Record<string, number>>({});

  const offersQ = useQuery({ queryKey: ["campus-offers"], queryFn: fetchCampusOffers });
  const frequentQ = useQuery({ queryKey: ["frequent-items"], queryFn: fetchFrequentItems });
  const canteensQ = useQuery({ queryKey: ["canteens"], queryFn: fetchCanteens });

  const setQty = (id: string, n: number) =>
    setCart((c) => {
      const copy = { ...c };
      if (n <= 0) delete copy[id];
      else copy[id] = n;
      return copy;
    });

  return (
    <UserLayout>
    <div
      className="min-h-screen pb-32 antialiased"
      style={{
        background: "#F5F5F7",
        color: "#1D1D1F",
        fontFamily:
          "-apple-system, 'SF Pro Display', 'SF Pro Text', BlinkMacSystemFont, system-ui, sans-serif",
      }}
    >
      <main className="px-6 space-y-12 mx-auto w-full max-w-md">
        <h1
          className="text-2xl font-bold tracking-tight mt-12 mb-8"
          style={{ color: "#1D1D1F" }}
        >
          Hey, Alex 👋
        </h1>

        {/* Today's Offers */}
        <section>
          <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6 py-2 snap-x snap-mandatory">
            {(offersQ.data ?? []).map((o) => (
              <OfferCard key={o.id} offer={o} />
            ))}
          </div>
        </section>

        {/* Frequent Orders */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold tracking-tight" style={{ color: "#1D1D1F" }}>
              On Repeat!
            </h2>
          </div>
          <div className="flex overflow-x-auto no-scrollbar -mx-6 px-6 gap-6 pb-2">
            {(frequentQ.data ?? []).map((it) => (
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
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold tracking-tight" style={{ color: "#1D1D1F" }}>
              Pick a Spot?
            </h2>
          </div>
          <div className="flex flex-col gap-4">
            {(canteensQ.data ?? []).map((c) => (
              <CanteenRow key={c.id} canteen={c} />
            ))}
          </div>
        </section>
      </main>
    </div>
    </UserLayout>
  );
};

/* ---------- Offer card (rebuilt from scratch to match reference) ---------- */
const OfferCard = ({ offer }: { offer: CampusOffer }) => (
  <div
    className="shrink-0 snap-start flex flex-col justify-between"
    style={{
      width: 260,
      height: 170,
      padding: "20px 22px",
      borderRadius: 28,
      background: "#FFFFFF",
      boxShadow:
        "0 1px 0 rgba(255,255,255,0.9) inset, 0 8px 24px rgba(17, 24, 39, 0.05), 0 2px 6px rgba(17, 24, 39, 0.03)",
    }}
  >
    {/* Top row: canteen label + ACTIVE pill */}
    <div className="flex items-center justify-between">
      <span
        className="uppercase"
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.18em",
          color: "#8A8A8E",
        }}
      >
        {offer.canteen}
      </span>
      {offer.active && (
        <div
          className="flex items-center gap-1.5"
          style={{
            background: "#FFFFFF",
            border: "1px solid #ECECEE",
            borderRadius: 999,
            padding: "3px 10px",
            boxShadow: "0 1px 2px rgba(17, 24, 39, 0.04)",
          }}
        >
          <span
            className="rounded-full animate-pulse"
            style={{ width: 6, height: 6, background: "#2563EB" }}
          />
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.08em",
              color: "#1D1D1F",
            }}
          >
            ACTIVE
          </span>
        </div>
      )}
    </div>

    {/* Bottom: title + discount */}
    <div>
      <h3
        style={{
          fontSize: 19,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          color: "#1D1D1F",
          lineHeight: 1.15,
          marginBottom: 6,
        }}
      >
        {offer.title}
      </h3>
      <div
        style={{
          fontSize: 32,
          fontWeight: 800,
          letterSpacing: "-0.025em",
          color: "#22C55E",
          lineHeight: 1,
        }}
      >
        {offer.highlight}
      </div>
    </div>
  </div>
);

/* ---------- Frequent order card ---------- */
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
  const hot = itemHot[item.id];
  return (
    <div className="lg-card flex flex-col min-w-[240px] p-4 justify-center" style={{ height: "auto" }}>
      <div className="relative z-10 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 flex items-center justify-center rounded-full shrink-0 text-3xl leading-none"
            style={{
              background: "rgba(255,255,255,0.4)",
              backdropFilter: "blur(4px)",
              boxShadow: "inset 0 2px 4px rgba(0,0,0,0.04)",
            }}
          >
            {emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3
                className="glass-text truncate text-lg"
                style={{ color: "#1D1D1F", fontWeight: 600, letterSpacing: "-0.01em" }}
              >
                {item.name}
              </h3>
              {hot && <span className="text-base leading-none">🔥</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 mt-1">
          <div
            className="flex items-center rounded-full px-1.5 py-0.5 gap-2 shadow-sm"
            style={{
              background: "rgba(255,255,255,0.4)",
              backdropFilter: "blur(4px)",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            <button
              type="button"
              onClick={() => onChange(qty - 1)}
              className="w-7 h-7 flex items-center justify-center text-lg font-bold"
              style={{ color: "#6E6E73" }}
              aria-label="decrease"
            >
              -
            </button>
            <span className="text-[13px] font-bold" style={{ color: "#1D1D1F" }}>
              {qty}
            </span>
            <button
              type="button"
              onClick={() => onChange(qty + 1)}
              className="w-7 h-7 flex items-center justify-center text-lg font-bold"
              style={{ color: "#2563EB" }}
              aria-label="increase"
            >
              +
            </button>
          </div>
          <button
            type="button"
            className="text-[12px] font-bold px-3 py-2 rounded-full transition-all active:scale-95"
            style={{
              background: "#2563EB",
              color: "#FFFFFF",
              boxShadow: "0 8px 18px -6px rgba(37,99,235,0.45)",
            }}
          >
            Order Now
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------- Canteen row ---------- */
const CanteenRow = ({ canteen }: { canteen: Canteen }) => {
  const icon = canteenIcon[canteen.id] ?? "restaurant";
  return (
    <button
      type="button"
      className="lg-canteen flex justify-between items-center px-6 py-4 h-[88px] text-left w-full"
    >
      <div className="flex items-center gap-4 flex-1">
        <div
          className="overflow-hidden rounded-full shrink-0 flex items-center justify-center w-12 h-12"
          style={{
            background: "rgba(255,255,255,0.4)",
            border: "1px solid rgba(255,255,255,0.2)",
            backdropFilter: "blur(4px)",
            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.04)",
          }}
        >
          <span
            className="material-symbols-outlined text-2xl"
            style={{ color: "#2563EB" }}
          >
            {icon}
          </span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3
              className="font-semibold tracking-tight"
              style={{ color: "#1D1D1F" }}
            >
              {canteen.name}
            </h3>
          </div>
          <p className="text-sm" style={{ color: "#6E6E73" }}>
            {canteen.tagline}
          </p>
        </div>
      </div>
    </button>
  );
};

export default Home;
