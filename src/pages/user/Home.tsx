import { useState } from "react";
import UserLayout from "@/components/user/UserLayout";

type Offer = { canteen: string; title: string; discount: string; active: boolean };
type Repeat = { emoji: string; name: string; tag: string | null };
type Spot = { icon: string; name: string; sub: string };

const offers: Offer[] = [
  { canteen: "THE MAIN SQUARE", title: "Mega Midnight Deal", discount: "40% OFF", active: true },
  { canteen: "NORTH CANTEEN", title: "Burger Bonanza", discount: "FREE SIDES", active: true },
];

const repeats: Repeat[] = [
  { emoji: "🍔", name: "Spicy Zinger", tag: "🔥" },
  { emoji: "🍕", name: "Cheese Burst", tag: null },
];

const spots: Spot[] = [
  { icon: "restaurant", name: "The Main Square", sub: "Fastest bites on campus" },
  { icon: "local_cafe", name: "The Main Square", sub: "Fastest bites on campus" },
];

const Home = () => {
  const [qty, setQty] = useState<Record<number, number>>({ 0: 1, 1: 1 });

  const setCount = (i: number, n: number) =>
    setQty((q) => ({ ...q, [i]: Math.max(0, n) }));

  return (
    <UserLayout>
      <div
        className="min-h-screen antialiased"
        style={{
          background: "#F5F5F7",
          color: "#1D1D1F",
          paddingBottom: 96,
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        }}
      >
        {/* Header */}
        <h1
          style={{
            paddingTop: 48,
            paddingLeft: 24,
            paddingRight: 24,
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "#1D1D1F",
            marginBottom: 24,
          }}
        >
          Hey, Alex 👋
        </h1>

        {/* Today's Offers — horizontal scroll */}
        <div
          className="no-scrollbar flex gap-4 overflow-x-auto"
          style={{ paddingLeft: 24, paddingRight: 24, paddingBottom: 8, marginBottom: 32 }}
        >
          {offers.map((o, i) => (
            <OfferCard key={i} offer={o} />
          ))}
        </div>

        {/* On Repeat! */}
        <h2
          style={{
            paddingLeft: 24,
            paddingRight: 24,
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "#1D1D1F",
            marginBottom: 16,
          }}
        >
          On Repeat!
        </h2>
        <div
          className="no-scrollbar flex gap-4 overflow-x-auto"
          style={{ paddingLeft: 24, paddingRight: 24, paddingBottom: 8, marginBottom: 32 }}
        >
          {repeats.map((r, i) => (
            <RepeatCard
              key={i}
              item={r}
              qty={qty[i] ?? 1}
              onChange={(n) => setCount(i, n)}
            />
          ))}
        </div>

        {/* Pick a Spot? */}
        <h2
          style={{
            paddingLeft: 24,
            paddingRight: 24,
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "#1D1D1F",
            marginBottom: 16,
          }}
        >
          Pick a Spot?
        </h2>
        <div
          className="flex flex-col gap-3"
          style={{ paddingLeft: 24, paddingRight: 24 }}
        >
          {spots.map((s, i) => (
            <CanteenCard key={i} spot={s} />
          ))}
        </div>
      </div>
    </UserLayout>
  );
};

/* ---------------- Offer Card ---------------- */
const OfferCard = ({ offer }: { offer: Offer }) => (
  <button
    type="button"
    className="cb-glass shrink-0 flex flex-col justify-between text-left"
    style={{ width: 260, height: 150, padding: "16px 20px" }}
  >
    <div className="relative z-10 flex items-center justify-between">
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.12em",
          color: "#6E6E73",
          textTransform: "uppercase",
        }}
      >
        {offer.canteen}
      </span>
      {offer.active && (
        <span
          className="flex items-center gap-1.5"
          style={{
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderRadius: 999,
            padding: "3px 10px",
          }}
        >
          <span
            className="rounded-full animate-pulse"
            style={{ width: 6, height: 6, background: "#2563EB" }}
          />
          <span
            style={{
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: "0.08em",
              color: "#1D1D1F",
            }}
          >
            ACTIVE
          </span>
        </span>
      )}
    </div>

    <div className="relative z-10">
      <div
        style={{
          fontSize: 17,
          fontWeight: 600,
          letterSpacing: "-0.01em",
          color: "#1D1D1F",
          marginBottom: 4,
        }}
      >
        {offer.title}
      </div>
      <div
        style={{
          fontSize: 30,
          fontWeight: 800,
          letterSpacing: "-0.02em",
          color: "#22C55E",
          lineHeight: 1,
        }}
      >
        {offer.discount}
      </div>
    </div>
  </button>
);

/* ---------------- Repeat Card ---------------- */
const RepeatCard = ({
  item,
  qty,
  onChange,
}: {
  item: Repeat;
  qty: number;
  onChange: (n: number) => void;
}) => (
  <div
    className="cb-glass shrink-0 flex flex-col"
    style={{ width: 240, padding: 16, gap: 14 }}
  >
    <div className="relative z-10 flex items-center gap-3">
      <div
        className="flex items-center justify-center shrink-0"
        style={{
          width: 48,
          height: 48,
          borderRadius: 999,
          background: "rgba(255,255,255,0.6)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          fontSize: 26,
          lineHeight: 1,
        }}
      >
        {item.emoji}
      </div>
      <div className="flex items-center gap-2 min-w-0">
        <span
          style={{
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "-0.01em",
            color: "#1D1D1F",
          }}
        >
          {item.name}
        </span>
        {item.tag && <span style={{ fontSize: 14 }}>{item.tag}</span>}
      </div>
    </div>

    <div className="relative z-10 flex items-center justify-between">
      <div
        className="flex items-center"
        style={{
          background: "rgba(255,255,255,0.6)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderRadius: 999,
          padding: "2px 6px",
          gap: 6,
        }}
      >
        <button
          type="button"
          onClick={() => onChange(qty - 1)}
          aria-label="decrease"
          style={{
            width: 26,
            height: 26,
            fontSize: 18,
            fontWeight: 700,
            color: "#6E6E73",
          }}
        >
          −
        </button>
        <span
          style={{
            minWidth: 14,
            textAlign: "center",
            fontSize: 13,
            fontWeight: 800,
            color: "#1D1D1F",
          }}
        >
          {qty}
        </span>
        <button
          type="button"
          onClick={() => onChange(qty + 1)}
          aria-label="increase"
          style={{
            width: 26,
            height: 26,
            fontSize: 18,
            fontWeight: 700,
            color: "#2563EB",
          }}
        >
          +
        </button>
      </div>
      <button
        type="button"
        style={{
          background: "#2563EB",
          color: "#FFFFFF",
          fontSize: 12,
          fontWeight: 700,
          padding: "8px 14px",
          borderRadius: 999,
          boxShadow: "0 8px 18px -6px rgba(37,99,235,0.45)",
        }}
      >
        Order Now
      </button>
    </div>
  </div>
);

/* ---------------- Canteen Card ---------------- */
const CanteenCard = ({ spot }: { spot: Spot }) => (
  <button
    type="button"
    className="cb-pill flex items-center justify-between text-left w-full"
    style={{
      height: 88,
      padding: "16px 24px",
      borderRadius: 48,
      background: "rgba(255,255,255,0.55)",
      backdropFilter: "blur(20px) saturate(180%)",
      WebkitBackdropFilter: "blur(20px) saturate(180%)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8), 0 6px 18px rgba(0,0,0,0.04)",
    }}
  >
    <div className="flex items-center gap-3 min-w-0">
      <div
        className="flex items-center justify-center shrink-0"
        style={{
          width: 48,
          height: 48,
          borderRadius: 999,
          background: "rgba(255,255,255,0.7)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 24, color: "#2563EB" }}
        >
          {spot.icon}
        </span>
      </div>
      <div className="min-w-0">
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "-0.01em",
            color: "#1D1D1F",
          }}
        >
          {spot.name}
        </div>
        <div style={{ fontSize: 13, color: "#6E6E73", marginTop: 2 }}>
          {spot.sub}
        </div>
      </div>
    </div>
    <span
      className="material-symbols-outlined"
      style={{ fontSize: 24, color: "#D2D2D7" }}
    >
      chevron_right
    </span>
  </button>
);

export default Home;
