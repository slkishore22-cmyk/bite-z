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
  const hideNav =
    pathname.startsWith("/app/menu/") ||
    pathname.startsWith("/app/payment") ||
    pathname.startsWith("/app/order-status");

  return (
    <>
      {children}
      {!hideNav && (
        <LiquidGlassNav activeId={active} onChange={(id) => navigate(tabToPath[id])} />
      )}
    </>
  );
};

export default UserLayout;
