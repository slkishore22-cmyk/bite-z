import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useMemo } from "react";

const OrderStatus = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const method = (params.get("method") || "cod").toLowerCase();

  const [revealed, setRevealed] = useState(false);
  const orderId = useMemo(() => {
    // Generate a 4-digit ID made of two repeating pairs (e.g. 1122, 3399, 0088)
    const d = () => Math.floor(Math.random() * 10);
    const a = d();
    let b = d();
    while (b === a) b = d();
    return `${a}${a}${b}${b}`;
  }, []);

  const paymentLabel = method === "upi" ? "Paid via UPI" : "Cash on Delivery";
  const paymentSub = method === "upi" ? "Transaction Successful" : "Pay at pickup";

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center"
      style={{
        background: "#F8FAFC",
        color: "#0F172A",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      }}
    >
      {/* Top AppBar */}
      <header className="w-full max-w-md px-6 h-16 flex items-center justify-start">
        <h1 className="font-bold text-lg" style={{ color: "#0F172A" }}>
          Order Status
        </h1>
      </header>

      <main className="flex-1 w-full max-w-md px-6 pt-6 flex flex-col items-center pb-12">
        {/* Success Indicator */}
        <div className="flex flex-col items-center mb-12 relative">
          <div
            className="rounded-full"
            style={{ boxShadow: "0 0 200px 80px rgba(34,197,94,0.12)" }}
          >
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center transition-all duration-400"
              style={{
                background: "rgba(34,197,94,0.20)",
                boxShadow: "0 0 20px 5px rgba(34,197,94,0.4)",
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  color: "#22C55E",
                  fontSize: 48,
                  fontVariationSettings: "'FILL' 1",
                }}
              >
                check_circle
              </span>
            </div>
          </div>
          <h2
            className="font-semibold mt-8 mb-2"
            style={{ fontSize: 22, color: "#0F172A" }}
          >
            Order Confirmed
          </h2>
          <p
            className="text-center px-8"
            style={{ fontSize: 14, color: "#64748B" }}
          >
            Your order has been placed successfully and is being shared with the chef.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 gap-4 w-full">
          {/* Order ID */}
          <div
            className="flex flex-col items-center justify-center transition-all duration-400"
            style={{
              background: "#FFFFFF",
              padding: 20,
              borderRadius: 16,
              boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)",
              border: "1px solid #F1F5F9",
            }}
          >
            <span
              className="uppercase mb-2"
              style={{
                color: "#64748B",
                fontSize: 12,
                letterSpacing: "0.1em",
              }}
            >
              Order ID
            </span>
            <div
              className="font-bold mb-4"
              style={{
                color: "#0F172A",
                fontSize: 24,
                letterSpacing: "0.1em",
              }}
            >
              {revealed ? orderId : "XXXX"}
            </div>
            <button
              onClick={() => setRevealed(true)}
              disabled={revealed}
              className="font-bold transition-all"
              style={{
                color: "#2563EB",
                fontSize: 13,
                padding: "8px 24px",
                borderRadius: 9999,
                border: "1px solid rgba(37,99,235,0.2)",
                background: "transparent",
                opacity: revealed ? 0.5 : 1,
                cursor: revealed ? "default" : "pointer",
              }}
            >
              {revealed ? "Revealed" : "Tap to reveal"}
            </button>
          </div>

          {/* Payment Info */}
          <div
            className="flex items-center justify-between"
            style={{
              background: "#FFFFFF",
              padding: 20,
              borderRadius: 16,
              boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)",
              border: "1px solid #F1F5F9",
            }}
          >
            <div className="flex items-center" style={{ gap: 12 }}>
              <div
                className="flex items-center justify-center rounded-full"
                style={{ width: 40, height: 40, background: "#F1F5F9" }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ color: "#64748B" }}
                >
                  {method === "upi" ? "account_balance_wallet" : "payments"}
                </span>
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 500, color: "#0F172A" }}>
                  {paymentLabel}
                </p>
                <p style={{ fontSize: 12, color: "#64748B" }}>{paymentSub}</p>
              </div>
            </div>
            <span
              className="material-symbols-outlined"
              style={{
                color: "#22C55E",
                fontVariationSettings: "'FILL' 1",
              }}
            >
              verified
            </span>
          </div>

          {/* Order Details */}
          <div
            className="relative overflow-hidden"
            style={{
              background: "#FFFFFF",
              padding: 24,
              borderRadius: 16,
              boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)",
              border: "1px solid #F1F5F9",
            }}
          >
            <div
              className="absolute rounded-full"
              style={{
                top: 0,
                right: 0,
                width: 128,
                height: 128,
                marginRight: -64,
                marginTop: -64,
                opacity: 0.1,
                filter: "blur(48px)",
                background:
                  "linear-gradient(135deg, #B4C5FF 0%, #2563EB 100%)",
              }}
            />
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div>
                <h3
                  className="font-bold mb-1"
                  style={{ fontSize: 18, color: "#0F172A" }}
                >
                  Canteen Central
                </h3>
                <p style={{ color: "#64748B", fontSize: 13 }}>
                  Main Block, Floor 2
                </p>
              </div>
              <div
                className="font-bold uppercase"
                style={{
                  background: "#EFF6FF",
                  padding: "4px 12px",
                  borderRadius: 9999,
                  fontSize: 11,
                  color: "#2563EB",
                  letterSpacing: "-0.02em",
                }}
              >
                3 Items
              </div>
            </div>
            <div className="space-y-3 mb-6 relative z-10">
              {[
                ["Veg Manchurian", "x1"],
                ["Schezwan Noodles", "x1"],
                ["Coke Zero 250ml", "x1"],
              ].map(([n, q]) => (
                <div
                  key={n}
                  className="flex justify-between"
                  style={{ fontSize: 14, color: "#64748B" }}
                >
                  <span>{n}</span>
                  <span>{q}</span>
                </div>
              ))}
            </div>
            <div
              className="flex justify-between items-center relative z-10"
              style={{
                paddingTop: 16,
                borderTop: "1px solid #F1F5F9",
              }}
            >
              <span style={{ color: "#64748B", fontSize: 14 }}>
                Total Paid Amount
              </span>
              <span
                className="font-extrabold"
                style={{ fontSize: 20, color: "#0F172A" }}
              >
                ₹482.00
              </span>
            </div>
          </div>
        </div>

        {/* Action */}
        <div className="mt-10 w-full flex flex-col gap-4">
          <button
            onClick={() => navigate("/home")}
            className="w-full font-bold transition-all duration-400"
            style={{
              background: "#FFFFFF",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
              border: "1px solid #E2E8F0",
              color: "#0F172A",
              padding: "16px 0",
              borderRadius: 9999,
              fontSize: 16,
            }}
          >
            Back to Home
          </button>
        </div>
      </main>
    </div>
  );
};

export default OrderStatus;