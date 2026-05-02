import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserLayout from "@/components/user/UserLayout";
import { getOrders, subscribeOrders } from "@/lib/sellerOrders";
import { addToCart, getCart, setCartQty, subscribeCart } from "@/lib/userCart";
import { getActiveOffers, subscribeOffers, type SellerOffer } from "@/lib/sellerOffers";

type Offer = { canteen: string; title: string; discount: string; active: boolean };
type Repeat = { itemId: string; emoji: string; name: string; price: number; category: "Food" | "Snacks" | "Drinks"; tag: string | null };
type Spot = { id: string; icon: string; name: string; sub: string };

const spots: Spot[] = [
  { id: "c1", icon: "restaurant", name: "The Main Square", sub: "Fastest bites on campus" },
  { id: "c2", icon: "local_cafe", name: "The Main Square", sub: "Fastest bites on campus" },
];

const toDisplayOffer = (o: SellerOffer): Offer => ({
  canteen: o.kind === "general" ? "ALL ITEMS" : "SELECTED ITEMS",
  title: o.name,
  discount: `${o.discountPct}% OFF`,
  active: true,
});

const Home = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState(() => getOrders());
  const [cart, setCart] = useState(() => getCart());
  const [liveOffers, setLiveOffers] = useState<SellerOffer[]>(() => getActiveOffers());
  useEffect(() => subscribeOrders(() => setOrders(getOrders())), []);
  useEffect(() => subscribeCart(() => setCart(getCart())), []);
  useEffect(() => subscribeOffers(() => setLiveOffers(getActiveOffers())), []);
  const offers: Offer[] = useMemo(() => liveOffers.map(toDisplayOffer), [liveOffers]);

  // Derive "On Repeat" from the user's most-ordered items in the last 30 days.
  const repeats: Repeat[] = useMemo(() => {
    const counts = new Map<string, Repeat & { count: number }>();
    for (const o of orders) {
      for (const i of o.items) {
        const cur = counts.get(i.itemId);
        if (cur) {
          cur.count += i.qty;
        } else {
          counts.set(i.itemId, {
            itemId: i.itemId,
            emoji: i.icon,
            name: i.name,
            price: i.price,
            category: i.category,
            tag: null,
            count: i.qty,
          });
        }
      }
    }
    const arr = Array.from(counts.values()).sort((a, b) => b.count - a.count);
    if (arr[0]) arr[0].tag = "🔥";
    return arr.slice(0, 6);
  }, [orders]);

  const qtyOf = (id: string) => cart.find((c) => c.itemId === id)?.qty ?? 0;
  const setCount = (r: Repeat, n: number) => {
    const cur = qtyOf(r.itemId);
    if (cur === 0 && n > 0) {
      addToCart(
        { itemId: r.itemId, name: r.name, price: r.price, icon: r.emoji, category: r.category },
        n,
      );
    } else {
      setCartQty(r.itemId, Math.max(0, n));
    }
  };

  return (
    <UserLayout>
      <div
        className="min-h-screen antialiased"
        style={{
          background: "#F5F5F7",
          color: "#1D1D1F",
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 120px)",
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

        {repeats.length > 0 && (
          <>
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
              {repeats.map((r) => (
                <RepeatCard
                  key={r.itemId}
                  item={r}
                  qty={qtyOf(r.itemId) || 1}
                  onChange={(n) => setCount(r, n)}
                  onOrder={() => navigate("/cart")}
                />
              ))}
            </div>
          </>
        )}

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
            <CanteenCard key={i} spot={s} onClick={() => navigate(`/canteen/${s.id}`)} />
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
  onOrder,
}: {
  item: Repeat;
  qty: number;
  onChange: (n: number) => void;
  onOrder?: () => void;
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
        onClick={onOrder}
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
const CanteenCard = ({ spot, onClick }: { spot: Spot; onClick?: () => void }) => (
  <button
    type="button"
    onClick={onClick}
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
