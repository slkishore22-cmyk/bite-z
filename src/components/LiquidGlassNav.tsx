import { useEffect, useState } from "react";
import { Home, ReceiptText, ShoppingCart, type LucideIcon } from "lucide-react";
import { getCart, subscribeCart } from "@/lib/userCart";
import { getOrders, subscribeOrders } from "@/lib/sellerOrders";

type NavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
};

const items: NavItem[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "orders", label: "Orders", icon: ReceiptText },
  { id: "cart", label: "Cart", icon: ShoppingCart },
];

export const LiquidGlassNav = ({
  activeId = "home",
  onChange,
}: {
  activeId?: string;
  onChange?: (id: string) => void;
}) => {
  const [hasActiveCart, setHasActiveCart] = useState(() => getCart().length > 0);
  const [hasActiveOrder, setHasActiveOrder] = useState(() =>
    getOrders().some((o) => o.status === "Pending"),
  );

  useEffect(() => {
    const refreshCart = () => setHasActiveCart(getCart().length > 0);
    const refreshOrders = () =>
      setHasActiveOrder(getOrders().some((o) => o.status === "Pending"));
    const unsubCart = subscribeCart(refreshCart);
    const unsubOrders = subscribeOrders(refreshOrders);
    refreshCart();
    refreshOrders();
    return () => {
      unsubCart();
      unsubOrders();
    };
  }, []);

  const handleSelect = (id: string) => {
    if (id === activeId) return;
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate?.([10]);
    }
    onChange?.(id);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex w-full items-stretch border-t border-white/40"
      style={{
        height: "calc(var(--user-bottom-nav-height) + var(--ios-pwa-safe-bottom))",
        paddingBottom: "var(--ios-pwa-safe-bottom)",
        WebkitBackdropFilter: "blur(36px) saturate(200%)",
        backdropFilter: "blur(36px) saturate(200%)",
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.7), rgba(255,255,255,0.45))",
        boxShadow:
          "0 -8px 30px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.7) inset",
      }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeId === item.id;
        const showBadge =
          (item.id === "cart" && hasActiveCart) ||
          (item.id === "orders" && hasActiveOrder);
        return (
          <button
            type="button"
            key={item.id}
            onClick={() => handleSelect(item.id)}
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
            className="relative flex flex-1 flex-col items-center justify-center gap-1 outline-none transition-colors"
            style={{ color: "#1D1D1F", opacity: isActive ? 1 : 0.6 }}
          >
            <span className="relative">
              <Icon size={24} strokeWidth={isActive ? 2.4 : 2} />
              {showBadge && (
                <span
                  className="absolute -top-1 -right-1 h-2 w-2 rounded-full"
                  style={{
                    background: "#FF3B30",
                    boxShadow: "0 0 0 2px rgba(255,255,255,0.9)",
                  }}
                />
              )}
            </span>
            <span className="text-[11px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default LiquidGlassNav;
