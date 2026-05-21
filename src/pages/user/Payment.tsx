import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { clearCart, getCart } from "@/lib/userCart";
import { createOrder, hasSoundPlayed, markSoundPlayed } from "@/lib/sellerOrders";
import { pinItem } from "@/lib/userPins";
import { playOrderConfirmation } from "../../utils/orderConfirmation";
import { supabase } from "@/integrations/supabase/client";
import { getUserSession } from "@/utils/sessionManager";
import { getActiveDiscountPctForSeller, loadOffersFromBackend } from "@/lib/sellerOffers";
import UserLayout from "@/components/user/UserLayout";

type RazorpayPaymentResponse = Record<string, unknown>;
type RazorpayOptions = {
  key: string;
  amount: number | string;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  method: { upi: boolean; card: boolean; netbanking: boolean; wallet: boolean };
  prefill: { name: string; contact: string };
  theme: { color: string };
  handler: (response: RazorpayPaymentResponse) => void | Promise<void>;
  modal: { ondismiss: () => void };
};
type RazorpayInstance = {
  on: (event: "payment.failed", handler: (response: RazorpayPaymentResponse) => void) => void;
  open: () => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

const loadRazorpay = () =>
  new Promise<boolean>((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>('script[data-razorpay-checkout="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.dataset.razorpayCheckout = "true";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const releaseMobileScrollLocks = () => {
  if (typeof document === "undefined") return;
  [document.documentElement, document.body].forEach((node) => {
    node.style.overflow = "";
    node.style.position = "";
    node.style.top = "";
    node.style.left = "";
    node.style.right = "";
    node.style.height = "";
    node.style.touchAction = "";
  });
  document.querySelectorAll(".razorpay-container").forEach((node) => node.remove());
};

const liquidGlass: React.CSSProperties = {
  background: "hsl(var(--user-surface-raised))",
  borderRadius: 18,
  boxShadow: "none",
  position: "relative",
  overflow: "hidden",
  border: "1px solid hsl(var(--user-border) / 0.82)",
};

const glassHighlight: React.CSSProperties = {
  content: '""',
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: 0,
  background: "transparent",
  pointerEvents: "none",
  zIndex: 1,
};

const HERO_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCiwJoiptyTfJjocBll2nIls6RlxY48tdulifddR5Ese8rvs5cmf6-rAcmLqNJxycS-Dr7ud8C7bRLZRUD8N8A5ClckwSyiZ_53kZFF9u5ZDYD5J8K1_wyYKp6HVxKbxaknaAEVb8RLOCcRXNnp5rNMMv94vETDcFlU2eZrm_p6ruQmZFNwjJWcWWFNNfZGOR3CbPJ7D-ISlZkiKOjKJmaxhuWB07R05v80Qyr406FF2HO2IXveIpxwF4qF68gr1dwINcGXsEKikaWe";

const Payment = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [placing, setPlacing] = useState(false);
  const selectedCanteenId = params.get("canteenId");

  // Preload Razorpay SDK + active offers on mount. Safari blocks the payment
  // popup if too much async work happens between the user's tap and
  // rzp.open(); preloading makes the open call near-synchronous.
  useEffect(() => {
    void loadRazorpay();
    const cart = getCart();
    const sellerKey =
      (selectedCanteenId
        ? cart.find((c) => c.canteenId === selectedCanteenId)
        : cart[0])?.canteenId ?? null;
    void loadOffersFromBackend(sellerKey).catch(() => []);
  }, [selectedCanteenId]);

  const playOnlineSuccessOnce = useCallback((orderUid: string) => {
    if (hasSoundPlayed(orderUid)) return;
    markSoundPlayed(orderUid);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate?.(35);
    }
    void playOrderConfirmation();
  }, []);

  const placeOrder = async (method: "Online" | "Cash") => {
    const cart = getCart();
    const canteenKeys = new Set(cart.map((c) => c.canteenId ?? "__unknown__"));
    const activeCart = selectedCanteenId
      ? cart.filter((c) => (c.canteenId ?? "__unknown__") === selectedCanteenId)
      : canteenKeys.size <= 1
      ? cart
      : [];
    if (activeCart.length === 0) {
      navigate("/app/cart");
      return;
    }
    setPlacing(true);
    const subtotal = activeCart.reduce((s, c) => s + c.price * c.qty, 0);
    const sellerKey = activeCart[0]?.canteenId ?? null;
    // CRITICAL: Offers are valid for ONLINE payment only. Cash on Delivery
    // customers are always charged the full bill — no discount.
    const discountPct =
      method === "Online" ? getActiveDiscountPctForSeller(sellerKey) : 0;
    const totalAmount =
      method === "Online"
        ? Math.max(1, Math.round(subtotal * (1 - discountPct / 100)))
        : subtotal;

    const firstCartItem = activeCart[0];

    const finalize = async (paymentStatus: "PENDING" | "SUCCESS" | "FAILED" = "PENDING") => {
      const order = await createOrder({
        payment: method,
        paymentStatus,
        isSoundPlayed: false,
        sellerId: firstCartItem?.canteenId ?? null,
        sellerName: firstCartItem?.canteenName ?? null,
        subtotal,
        // Online: charge the discounted total. Cash: charge the full subtotal.
        total: totalAmount,
        items: activeCart.map((c) => ({
          itemId: c.itemId,
          name: c.name,
          icon: c.icon,
          category: c.category,
          price: c.price,
          qty: c.qty,
          canteenId: c.canteenId,
          canteenIcon: c.canteenIcon,
        })),
      });
      clearCart(firstCartItem?.canteenId ?? "__unknown__");
      activeCart.forEach((c) => pinItem(c.itemId));
      if (method === "Online" && paymentStatus === "SUCCESS") {
        playOnlineSuccessOnce(order.uid);
      }
      releaseMobileScrollLocks();
      setPlacing(false);
      navigate(`/app/order-status?method=${method === "Online" ? "upi" : "cod"}&id=${order.uid}`, {
        replace: true,
      });
    };
    try {
      if (method === "Cash") {
        // Cash on Delivery: NO sound, ever.
        await finalize("PENDING");
        return;
      }
      // Online (UPI / Razorpay)
      const { data, error } = await supabase.functions.invoke("create-razorpay-order", {
        // Send the raw subtotal + sellerId so the backend can re-validate the
        // active offer against the database and compute the chargeable total
        // server-side. We also send our client-computed total as a fallback.
        body: {
          subtotal,
          sellerId: sellerKey,
          amount: totalAmount,
          receipt: `bitez_${Date.now()}`,
        },
      });
      if (error || !data?.order_id) {
        alert("Unable to start payment. Please try again.");
        setPlacing(false);
        return;
      }
      const sdkReady = await loadRazorpay();
      if (!sdkReady || !window.Razorpay) {
        alert("Payment SDK not loaded. Please refresh and try again.");
        setPlacing(false);
        return;
      }
      const session = getUserSession();
      const rzp = new window.Razorpay({
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        order_id: data.order_id,
        name: "Bitez",
        description: firstCartItem?.canteenName ?? "Order",
        method: { upi: true, card: true, netbanking: true, wallet: true },
        prefill: {
          name: session?.full_name ?? session?.name ?? "",
          contact: session?.phone ?? "",
        },
        theme: { color: "#2563EB" },
        handler: async () => {
          // Razorpay success callback => Online payment SUCCESS => play once.
          await finalize("SUCCESS");
        },
        modal: {
          ondismiss: () => {
            releaseMobileScrollLocks();
            setPlacing(false);
          },
        },
      });
      rzp.on("payment.failed", () => {
        releaseMobileScrollLocks();
        alert("Payment failed. Please try again.");
        setPlacing(false);
      });
      rzp.open();
    } finally {
      // setPlacing reset by handler/modal callbacks for online
      if (method === "Cash") setPlacing(false);
    }
  };

  return (
    <UserLayout>
    <div
      className="user-page"
      style={{ color: "hsl(var(--user-text))", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {/* TopAppBar */}
      <header
        className="user-topbar z-50 flex items-center px-6"
        style={{
          height: "calc(64px + var(--ios-pwa-safe-top))",
          paddingTop: "var(--ios-pwa-safe-top)",
        }}
      >
        <div className="flex items-center w-full">
          <button
            onClick={() => navigate(-1)}
            className="transition-all duration-[400ms] ease-in-out p-2 rounded-full active:scale-95 mr-2"
          >
            <span className="material-symbols-outlined" style={{ color: "#1D1D1F" }}>
              arrow_back
            </span>
          </button>
          <h1
            className="font-bold text-lg tracking-tight"
            style={{ color: "#1D1D1F" }}
          >
            Select Payment Method
          </h1>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main
        className="user-content flex flex-col"
        style={{ paddingTop: 24, gap: 32 }}
      >
        {/* Branding Hero Moment */}
        <div
          className="relative overflow-hidden flex items-end"
          style={{
            borderRadius: 26,
            height: 256,
            padding: 32,
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          }}
        >
          <img
            alt="Premium Light Aesthetic"
            src={HERO_IMG}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(255,255,255,0.9), rgba(255,255,255,0.2), transparent)",
            }}
          />
          <div className="relative z-10">
            <span
              className="uppercase font-bold"
              style={{
                background: "#1D1D1F",
                color: "#FFFFFF",
                fontSize: 10,
                letterSpacing: "0.1em",
                padding: "4px 12px",
                borderRadius: 9999,
              }}
            >
              Secure Checkout
            </span>
            <h2
              className="font-extrabold tracking-tighter"
              style={{ fontSize: 30, marginTop: 8, color: "#1D1D1F" }}
            >
              Finalize Order
            </h2>
            <p
              className="font-medium"
              style={{ color: "#6E6E73", fontSize: 14, marginTop: 4 }}
            >
              Choose your preferred way to pay
            </p>
          </div>
        </div>

        {/* Payment Options Stack */}
        <section className="flex flex-col" style={{ gap: 14 }}>
          {/* UPI Card */}
          <button
            type="button"
            disabled={placing}
            onClick={() => placeOrder("Online")}
            className="text-left group active:scale-[0.98] transition-all duration-[400ms] ease-out flex items-center justify-between"
            style={{ ...liquidGlass, padding: 16, borderRadius: 20, opacity: placing ? 0.65 : 1 }}
          >
            <span style={glassHighlight} aria-hidden />
            <div className="flex items-center relative z-10" style={{ gap: 14 }}>
              <div
                className="flex items-center justify-center group-hover:scale-105 transition-transform duration-[400ms]"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "rgba(0,102,204,0.10)",
                  color: "#0066CC",
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}
                >
                  account_balance_wallet
                </span>
              </div>
              <div>
                <h3
                  className="font-bold tracking-tight"
                  style={{ color: "#1D1D1F", fontSize: 15 }}
                >
                  UPI Payment
                </h3>
                <p style={{ color: "#6E6E73", fontSize: 12, marginTop: 2 }}>
                  Pay via UPI
                </p>
              </div>
            </div>
            <div
              className="flex items-center justify-center transition-colors duration-[400ms] relative z-10 group-hover:bg-[#1D1D1F]"
              style={{
                width: 28,
                height: 28,
                borderRadius: 9999,
                background: "rgba(0,0,0,0.05)",
              }}
            >
              <span
                className="material-symbols-outlined group-hover:text-white"
                style={{ color: "#1D1D1F", fontSize: 18 }}
              >
                chevron_right
              </span>
            </div>
          </button>

          {/* Cash Card */}
          <button
            type="button"
            disabled={placing}
            onClick={() => placeOrder("Cash")}
            className="text-left group active:scale-[0.98] transition-all duration-[400ms] ease-out flex items-center justify-between"
            style={{ ...liquidGlass, padding: 16, borderRadius: 20, opacity: placing ? 0.65 : 1 }}
          >
            <span style={glassHighlight} aria-hidden />
            <div className="flex items-center relative z-10" style={{ gap: 14 }}>
              <div
                className="flex items-center justify-center group-hover:scale-105 transition-transform duration-[400ms]"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "rgba(52,199,89,0.10)",
                  color: "#34C759",
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}
                >
                  payments
                </span>
              </div>
              <div>
                <h3
                  className="font-bold tracking-tight"
                  style={{ color: "#1D1D1F", fontSize: 15 }}
                >
                  Cash on Delivery
                </h3>
                <p style={{ color: "#6E6E73", fontSize: 12, marginTop: 2 }}>
                  Pay with Cash
                </p>
              </div>
            </div>
            <div
              className="flex items-center justify-center transition-colors duration-[400ms] relative z-10 group-hover:bg-[#1D1D1F]"
              style={{
                width: 28,
                height: 28,
                borderRadius: 9999,
                background: "rgba(0,0,0,0.05)",
              }}
            >
              <span
                className="material-symbols-outlined group-hover:text-white"
                style={{ color: "#1D1D1F", fontSize: 18 }}
              >
                chevron_right
              </span>
            </div>
          </button>
        </section>

        {/* Extra padding at bottom */}
        <div style={{ height: 48 }} />
      </main>
    </div>
    </UserLayout>
  );
};

export default Payment;
