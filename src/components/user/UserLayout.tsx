import { useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import LiquidGlassNav from "@/components/LiquidGlassNav";

const tabs = ["home", "orders", "cart"] as const;
type UserTab = (typeof tabs)[number];

const tabToPath: Record<UserTab, string> = {
  home: "/app/home",
  orders: "/app/orders",
  cart: "/app/cart",
};

const SWIPE_DISTANCE = 64;
const SWIPE_AXIS_RATIO = 1.25;

const pathToTab = (pathname: string) => {
  const entry = Object.entries(tabToPath).find(([, p]) => pathname.startsWith(p));
  return (entry?.[0] as UserTab | undefined) ?? "home";
};

const isSwipeLockedTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  return !!target.closest(
    "[data-swipe-lock='true'], input, textarea, select, [contenteditable='true']",
  );
};

const isInteractiveTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  return !!target.closest("button, a, [role='button'], [role='link']");
};

const UserLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const active = pathToTab(pathname);
  const pointerStart = useRef<{
    x: number;
    y: number;
    pointerId: number;
    startedOnInteractive: boolean;
  } | null>(null);
  const suppressNextClick = useRef(false);
  const hideNav =
    pathname.startsWith("/app/menu/") ||
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

  const swipeToSiblingTab = useCallback(
    (dx: number, dy: number) => {
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      if (hideNav || absX < SWIPE_DISTANCE || absX < absY * SWIPE_AXIS_RATIO) return false;

    const currentIndex = tabs.indexOf(active);
      if (currentIndex < 0) return false;

    const nextIndex = currentIndex + (dx < 0 ? 1 : -1);
    const next = tabs[nextIndex];
      if (!next) return false;

      navigateToTab(next);
      return true;
    },
    [active, hideNav, navigateToTab],
  );

  return (
    <>
      <div
        className="user-shell"
        style={{
          paddingBottom: hideNav
            ? "var(--ios-pwa-safe-bottom)"
            : "calc(var(--user-bottom-nav-height) + var(--ios-pwa-safe-bottom))",
        }}
        onPointerDownCapture={(event) => {
          if (hideNav || !event.isPrimary || isSwipeLockedTarget(event.target)) {
            pointerStart.current = null;
            return;
          }
          pointerStart.current = {
            x: event.clientX,
            y: event.clientY,
            pointerId: event.pointerId,
            startedOnInteractive: isInteractiveTarget(event.target),
          };
        }}
        onPointerUpCapture={(event) => {
          const start = pointerStart.current;
          pointerStart.current = null;
          if (!start || start.pointerId !== event.pointerId) return;

          const didSwipe = swipeToSiblingTab(event.clientX - start.x, event.clientY - start.y);
          if (didSwipe && start.startedOnInteractive) {
            suppressNextClick.current = true;
            window.setTimeout(() => {
              suppressNextClick.current = false;
            }, 0);
            event.preventDefault();
            event.stopPropagation();
          }
        }}
        onPointerCancelCapture={() => {
          pointerStart.current = null;
        }}
        onClickCapture={(event) => {
          if (!suppressNextClick.current) return;
          suppressNextClick.current = false;
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        {children}
      </div>
      {!hideNav && (
        <LiquidGlassNav activeId={active} onChange={(id) => navigateToTab(id as UserTab)} />
      )}
    </>
  );
};

export default UserLayout;
