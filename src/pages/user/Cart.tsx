import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserLayout from "@/components/user/UserLayout";
import {
  getCart,
  removeCartItem,
  setCartQty,
  subscribeCart,
  type CartItem,
} from "@/lib/userCart";
import { getActiveDiscountPctForSeller, loadOffersFromBackend, subscribeOffers } from "@/lib/sellerOffers";

const liquidGlass: React.CSSProperties = {
  background: "hsl(var(--user-surface) / 0.76)",
  backdropFilter: "blur(24px) saturate(135%)",
  WebkitBackdropFilter: "blur(24px) saturate(135%)",
  borderRadius: 26,
  position: "relative",
  overflow: "hidden",
  border: "1px solid hsl(var(--user-border) / 0.84)",
  boxShadow: "0 10px 28px hsl(220 25% 40% / 0.09)",
};

const glassHighlight: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "45%",
  background:
    "linear-gradient(180deg, hsl(var(--user-app-bg-soft) / 0.34) 0%, transparent 100%)",
  pointerEvents: "none",
  zIndex: 1,
};

const Cart = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>(() => getCart());
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  // Re-render whenever any offer changes so discount updates instantly.
  const [, setOffersTick] = useState(0);

  useEffect(() => subscribeCart(() => setItems(getCart())), []);
  useEffect(() => {
    const unsub = subscribeOffers(() => setOffersTick((n) => n + 1));
    loadOffersFromBackend().then(() => setOffersTick((n) => n + 1)).catch(() => null);
    return unsub;
  }, []);

  const update = (item: CartItem, delta: number) =>
    setCartQty(item.itemId, item.qty + delta, item.canteenId);
  const remove = (item: CartItem) => removeCartItem(item.itemId, item.canteenId);

  // Group cart items by canteen (seller). Each canteen is a different seller
  // and must be presented as its own section.
  const groups = (() => {
    const map = new Map<
      string,
      { canteenId: string; canteenName: string; canteenIcon: string; items: CartItem[] }
    >();
    for (const it of items) {
      const key = it.canteenId ?? "__unknown__";
      const existing = map.get(key);
      if (existing) {
        existing.items.push(it);
      } else {
        map.set(key, {
          canteenId: key,
          canteenName: it.canteenName ?? "Your Order",
          canteenIcon: it.canteenIcon ?? "🍽️",
          items: [it],
        });
      }
    }
    return Array.from(map.values());
  })();

  return (
    <UserLayout>
      <div
        className="user-page pb-44 antialiased"
        style={{
          color: "hsl(var(--user-text))",
          fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
        }}
      >
        <header
          className="user-topbar fixed top-0 left-0 w-full z-40"
          style={{
            paddingTop: "calc(var(--ios-pwa-safe-top) + var(--ios-pwa-top-breathing))",
          }}
        >
          <div className="user-content user-content-readable flex items-center gap-3 py-4">
            <button
              onClick={() => navigate(-1)}
              className="active:scale-95 transition-transform p-1 -ml-1"
            >
              <span
                className="material-symbols-outlined"
                style={{ color: "hsl(var(--user-text))", fontSize: 24 }}
              >
                arrow_back
              </span>
            </button>
            <h1
              className="font-bold tracking-tight"
              style={{ fontSize: 20, color: "hsl(var(--user-text))" }}
            >
              Your Cart
            </h1>
          </div>
        </header>

        <main
          className="user-content user-content-readable space-y-6"
          style={{ paddingTop: "calc(80px + var(--ios-pwa-safe-top) + var(--ios-pwa-top-breathing))" }}
        >
          {items.length === 0 ? (
            <section className="user-card" style={{ ...liquidGlass, padding: 24 }}>
              <span style={glassHighlight} aria-hidden />
              <div className="relative z-10">
                <p className="font-semibold" style={{ fontSize: 15 }}>
                  Your cart is empty
                </p>
                <p style={{ color: "#6E6E73", fontSize: 13, marginTop: 4 }}>
                  Tap items on Home to add them here.
                </p>
              </div>
            </section>
          ) : (
            <>
              {groups.map((group) => {
                const groupQty = group.items.reduce((s, i) => s + i.qty, 0);
                const groupSubtotal = group.items.reduce((s, i) => s + i.price * i.qty, 0);
                const discountPct = getActiveDiscountPctForSeller(group.canteenId);
                const groupTotal = Math.round(groupSubtotal * (1 - discountPct / 100));
                const hasDiscount = discountPct > 0;
                const expanded = !collapsed[group.canteenId];
                return (
              <section key={group.canteenId} style={{ ...liquidGlass }}>
                <span style={glassHighlight} aria-hidden />
                {/* Header */}
                <button
                  onClick={() =>
                    setCollapsed((c) => ({ ...c, [group.canteenId]: !c[group.canteenId] }))
                  }
                  className="w-full flex items-center justify-between relative z-10 active:scale-[0.99] transition-transform"
                  style={{ padding: "16px 20px" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex items-center justify-center"
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 9999,
                        background: "rgba(37,99,235,0.10)",
                        fontSize: 22,
                      }}
                    >
                      <span>{group.canteenIcon}</span>
                    </div>
                    <div className="text-left">
                      <h2 className="font-bold" style={{ fontSize: 15, color: "#1D1D1F" }}>
                        {group.canteenName}
                      </h2>
                      <p
                        className="font-medium"
                        style={{ fontSize: 12, color: "#6E6E73", marginTop: 1 }}
                      >
                        {groupQty} Item{groupQty > 1 ? "s" : ""} ·{" "}
                        {hasDiscount ? (
                          <>
                            <span style={{ textDecoration: "line-through", color: "#9CA3AF", marginRight: 6 }}>
                              ₹{groupSubtotal.toFixed(0)}
                            </span>
                            <span style={{ color: "#16A34A", fontWeight: 700 }}>₹{groupTotal.toFixed(0)}</span>
                            <span style={{ marginLeft: 6, color: "#16A34A", fontWeight: 700 }}>· {discountPct}% OFF</span>
                          </>
                        ) : (
                          <>₹{groupSubtotal.toFixed(0)}</>
                        )}
                      </p>
                    </div>
                  </div>
                  <span
                    className="material-symbols-outlined"
                    style={{
                      color: "#6E6E73",
                      fontSize: 22,
                      transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 300ms ease",
                    }}
                  >
                    expand_more
                  </span>
                </button>

                {/* Items */}
                {expanded && (
                <div
                  className="relative z-10 space-y-3"
                  style={{ padding: 12, paddingTop: 4 }}
                >
                  {group.items.map((it) => (
                    <div
                      key={it.itemId}
                      className="flex gap-3 items-center transition-all duration-[400ms]"
                      style={{
                        ...liquidGlass,
                        padding: 12,
                        borderRadius: 18,
                      }}
                    >
                      <span style={glassHighlight} aria-hidden />
                      <div
                        className="flex items-center justify-center relative z-10"
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 14,
                          background: "rgba(255,255,255,0.5)",
                          fontSize: 28,
                          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.4)",
                        }}
                      >
                        {it.icon}
                      </div>
                      <div className="flex-1 relative z-10">
                        <div className="flex justify-between items-start">
                          <h3
                            className="font-semibold"
                            style={{ fontSize: 14, color: "#1D1D1F" }}
                          >
                            {it.name}
                          </h3>
                          <button
                            onClick={() => remove(it)}
                            className="active:scale-90 transition-transform"
                            style={{ color: "#9CA3AF" }}
                          >
                            <span
                              className="material-symbols-outlined"
                              style={{ fontSize: 18 }}
                            >
                              close
                            </span>
                          </button>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span
                            className="font-bold"
                            style={{ fontSize: 14, color: "#1D1D1F" }}
                          >
                            ₹{(it.price * it.qty).toFixed(0)}
                          </span>
                          <div
                            className="flex items-center"
                            style={{
                              background: "rgba(255,255,255,0.6)",
                              backdropFilter: "blur(12px)",
                              borderRadius: 9999,
                              padding: "3px 10px",
                              gap: 12,
                              border: "1px solid rgba(255,255,255,0.5)",
                            }}
                          >
                            <button
                              onClick={() => update(it, -1)}
                              className="active:scale-90 transition-transform font-bold"
                              style={{ color: "#6E6E73", fontSize: 14, width: 16 }}
                            >
                              −
                            </button>
                            <span
                              className="font-extrabold"
                              style={{ fontSize: 12, color: "#1D1D1F" }}
                            >
                              {it.qty}
                            </span>
                            <button
                              onClick={() => update(it, 1)}
                              className="active:scale-90 transition-transform font-bold"
                              style={{ color: "#6E6E73", fontSize: 14, width: 16 }}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => navigate(`/app/payment?canteenId=${encodeURIComponent(group.canteenId)}`)}
                    className="w-full flex items-center justify-between relative overflow-hidden active:scale-[0.98] transition-all duration-[400ms]"
                    style={{
                      height: 52,
                      borderRadius: 18,
                      padding: "0 20px",
                      color: "#FFFFFF",
                      background: "linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)",
                      boxShadow: "0 10px 30px rgba(37,99,235,0.28)",
                    }}
                  >
                    <span className="font-bold relative z-20" style={{ fontSize: 15 }}>
                      Pay {group.canteenName}
                    </span>
                    <div className="flex items-center gap-2 relative z-20">
                      {hasDiscount && (
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", textDecoration: "line-through" }}>
                          ₹{groupSubtotal.toFixed(0)}
                        </span>
                      )}
                      <span className="font-bold" style={{ fontSize: 15 }}>
                        ₹{groupTotal.toFixed(0)}
                      </span>
                      <span className="material-symbols-outlined" style={{ fontSize: 21 }}>
                        arrow_forward
                      </span>
                    </div>
                  </button>
                </div>
                )}
              </section>
                );
              })}

            </>
          )}
        </main>

        {/* Sticky Pay Now */}
        {groups.length === 1 && (
          <div
            className="fixed left-1/2 -translate-x-1/2 z-30 px-6 w-full max-w-md"
            style={{ bottom: 96 }}
          >
            {(() => {
              const g = groups[0];
              const sub = g.items.reduce((s, i) => s + i.price * i.qty, 0);
              const pct = getActiveDiscountPctForSeller(g.canteenId);
              const total = Math.round(sub * (1 - pct / 100));
              const has = pct > 0;
              return (
              <button
              onClick={() => navigate(`/app/payment?canteenId=${encodeURIComponent(groups[0].canteenId)}`)}
              className="w-full flex items-center justify-between relative overflow-hidden active:scale-[0.98] transition-all duration-[400ms]"
              style={{
                height: 56,
                borderRadius: 18,
                padding: "0 24px",
                color: "#FFFFFF",
                background: "linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)",
                boxShadow: "0 10px 30px rgba(37,99,235,0.35)",
              }}
            >
              <div
                className="absolute top-0 left-0 right-0 z-10"
                style={{ height: 1.5, background: "rgba(255,255,255,0.5)" }}
              />
              <div
                className="absolute top-0 left-0 right-0 z-10"
                style={{
                  height: "50%",
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 100%)",
                }}
              />
              <span
                className="font-bold relative z-20"
                style={{ fontSize: 16 }}
              >
                Pay Now
              </span>
              <div className="flex items-center gap-2 relative z-20">
                {has && (
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", textDecoration: "line-through" }}>
                    ₹{sub.toFixed(0)}
                  </span>
                )}
                <span className="font-bold" style={{ fontSize: 16 }}>
                  ₹{total.toFixed(0)}
                </span>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 22 }}
                >
                  arrow_forward
                </span>
              </div>
              </button>
              );
            })()}
          </div>
        )}
      </div>
    </UserLayout>
  );
};

export default Cart;
