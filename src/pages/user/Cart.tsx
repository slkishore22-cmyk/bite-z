import { useState } from "react";
import { useNavigate } from "react-router-dom";
import UserLayout from "@/components/user/UserLayout";

const liquidGlass: React.CSSProperties = {
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(40px)",
  WebkitBackdropFilter: "blur(40px)",
  borderRadius: 26,
  position: "relative",
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.6)",
  boxShadow:
    "inset 0 1.5px 0 0 rgba(255,255,255,0.7), 0 8px 32px rgba(31,38,135,0.07)",
};

const glassHighlight: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "45%",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%)",
  pointerEvents: "none",
  zIndex: 1,
};

type Item = { id: string; name: string; price: number; emoji: string; qty: number };

const Cart = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([
    { id: "i1", name: "Midnight Miso Ramen", price: 14.5, emoji: "🍜", qty: 1 },
    { id: "i2", name: "Artisan Bento Box", price: 18.0, emoji: "🍱", qty: 1 },
  ]);
  const [expanded, setExpanded] = useState(false);

  const update = (id: string, delta: number) =>
    setItems((p) =>
      p
        .map((i) => (i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i))
        .filter((i) => i.qty > 0),
    );
  const remove = (id: string) => setItems((p) => p.filter((i) => i.id !== id));

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const platformFee = items.length ? 1.2 : 0;
  const total = subtotal + platformFee;
  const totalQty = items.reduce((s, i) => s + i.qty, 0);

  return (
    <UserLayout>
      <div
        className="min-h-screen pb-44 antialiased"
        style={{
          background: "#F8FAFC",
          color: "#1D1D1F",
          fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
        }}
      >
        {/* Fixed Header */}
        <header
          className="fixed top-0 left-0 w-full z-40"
          style={{
            background: "rgba(248,250,252,0.8)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          <div className="flex items-center gap-3 px-6 py-4 max-w-md mx-auto">
            <button
              onClick={() => navigate(-1)}
              className="active:scale-95 transition-transform p-1 -ml-1"
            >
              <span
                className="material-symbols-outlined"
                style={{ color: "#1D1D1F", fontSize: 24 }}
              >
                arrow_back
              </span>
            </button>
            <h1
              className="font-bold tracking-tight"
              style={{ fontSize: 20, color: "#1D1D1F" }}
            >
              Your Cart
            </h1>
          </div>
        </header>

        <main className="pt-20 px-6 max-w-md mx-auto space-y-6">
          {items.length === 0 ? (
            <section style={{ ...liquidGlass, padding: 24 }}>
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
              {/* Canteen group */}
              <section style={{ ...liquidGlass }}>
                <span style={glassHighlight} aria-hidden />
                {/* Header */}
                <button
                  onClick={() => setExpanded((v) => !v)}
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
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{
                          color: "#2563EB",
                          fontSize: 22,
                          fontVariationSettings: "'FILL' 1",
                        }}
                      >
                        restaurant
                      </span>
                    </div>
                    <div className="text-left">
                      <h2 className="font-bold" style={{ fontSize: 15, color: "#1D1D1F" }}>
                        Main Block Canteen
                      </h2>
                      <p
                        className="font-medium"
                        style={{ fontSize: 12, color: "#6E6E73", marginTop: 1 }}
                      >
                        {totalQty} Item{totalQty > 1 ? "s" : ""} • 1.2 km away
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
                  {items.map((it) => (
                    <div
                      key={it.id}
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
                        {it.emoji}
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
                            onClick={() => remove(it.id)}
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
                            ${(it.price * it.qty).toFixed(2)}
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
                              onClick={() => update(it.id, -1)}
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
                              onClick={() => update(it.id, 1)}
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
                </div>
                )}
              </section>

              {/* Price Summary */}
              {expanded && (
              <section className="space-y-3" style={{ paddingTop: 8, paddingLeft: 4, paddingRight: 4 }}>
                <Row label="Subtotal" value={`$${subtotal.toFixed(2)}`} />
                <Row label="Platform Fee" value={`$${platformFee.toFixed(2)}`} />
                <div className="flex justify-between items-center">
                  <span style={{ color: "#6E6E73", fontSize: 13, fontWeight: 500 }}>
                    Delivery
                  </span>
                  <span style={{ color: "#10B981", fontWeight: 700, fontSize: 13 }}>
                    FREE
                  </span>
                </div>
                <div style={{ height: 1, background: "rgba(0,0,0,0.08)", margin: "12px 0" }} />
                <div className="flex justify-between items-center">
                  <span className="font-bold" style={{ color: "#1D1D1F", fontSize: 15 }}>
                    Total Amount
                  </span>
                  <span className="font-extrabold" style={{ color: "#1D1D1F", fontSize: 18 }}>
                    ${total.toFixed(2)}
                  </span>
                </div>
              </section>
              )}
            </>
          )}
        </main>

        {/* Sticky Pay Now */}
        {items.length > 0 && expanded && (
          <div
            className="fixed left-1/2 -translate-x-1/2 z-30 px-6 w-full max-w-md"
            style={{ bottom: 96 }}
          >
            <button
              onClick={() => navigate("/payment")}
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
                <span className="font-bold" style={{ fontSize: 16 }}>
                  ${total.toFixed(2)}
                </span>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 22 }}
                >
                  arrow_forward
                </span>
              </div>
            </button>
          </div>
        )}
      </div>
    </UserLayout>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center">
    <span style={{ color: "#6E6E73", fontSize: 13, fontWeight: 500 }}>{label}</span>
    <span style={{ color: "#1D1D1F", fontSize: 13, fontWeight: 600 }}>{value}</span>
  </div>
);

export default Cart;
