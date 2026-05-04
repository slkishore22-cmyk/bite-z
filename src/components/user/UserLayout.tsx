import { useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import LiquidGlassNav from "@/components/LiquidGlassNav";

const tabToPath: Record<string, string> = {
  home: "/app/home",
  orders: "/app/orders",
  cart: "/app/cart",
};

const pathToTab = (pathname: string) => {
  const entry = Object.entries(tabToPath).find(([, p]) => pathname.startsWith(p));
  return entry?.[0] ?? "home";
};

const UserLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const active = pathToTab(pathname);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const hideNav =
    pathname.startsWith("/app/menu/") ||
    pathname.startsWith("/app/payment") ||
    pathname.startsWith("/app/order-status");

  const swipeToSiblingTab = (dx: number, dy: number) => {
    if (hideNav || Math.abs(dx) < 80 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    const tabs = ["home", "orders", "cart"];
    const currentIndex = tabs.indexOf(active);
    const nextIndex = currentIndex + (dx < 0 ? 1 : -1);
    const next = tabs[nextIndex];
    if (next) navigate(tabToPath[next]);
  };

  return (
    <>
      <div
        onTouchStart={(event) => {
          const target = event.target as HTMLElement;
          if (target.closest("button,a,input,textarea,select,[data-swipe-lock='true']")) {
            touchStart.current = null;
            return;
          }
          const touch = event.touches[0];
          touchStart.current = { x: touch.clientX, y: touch.clientY };
        }}
        onTouchEnd={(event) => {
          const start = touchStart.current;
          touchStart.current = null;
          const touch = event.changedTouches[0];
          if (!start || !touch) return;
          swipeToSiblingTab(touch.clientX - start.x, touch.clientY - start.y);
        }}
      >
        {children}
      </div>
      {!hideNav && (
        <LiquidGlassNav activeId={active} onChange={(id) => navigate(tabToPath[id])} />
      )}
    </>
  );
};

export default UserLayout;
