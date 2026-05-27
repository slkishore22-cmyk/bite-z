import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import LiquidGlassNav from "@/components/LiquidGlassNav";

const tabs = ["home", "orders", "cart"] as const;
type UserTab = (typeof tabs)[number];

const tabToPath: Record<UserTab, string> = {
  home: "/app/home",
  orders: "/app/orders",
  cart: "/app/cart",
};

const pathToTab = (pathname: string) => {
  const entry = Object.entries(tabToPath).find(([, p]) => pathname.startsWith(p));
  return (entry?.[0] as UserTab | undefined) ?? "home";
};

const UserLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const active = pathToTab(pathname);
  const isMenuPage = pathname.startsWith("/app/menu/");
  const hideNav =
    isMenuPage ||
    pathname.startsWith("/app/payment") ||
    pathname.startsWith("/app/order-status");

  const navigateToTab = useCallback(
    (tab: UserTab) => {
      const nextPath = tabToPath[tab];
      if (!nextPath || nextPath === pathname) return;
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.([10]);
      }
      navigate(nextPath);
    },
    [navigate, pathname],
  );

  return (
    <>
      {children}
      {!hideNav && (
        <LiquidGlassNav activeId={active} onChange={(id) => navigateToTab(id as UserTab)} />
      )}
    </>
  );
};

export default UserLayout;
