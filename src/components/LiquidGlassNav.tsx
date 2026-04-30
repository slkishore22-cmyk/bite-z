import { useState, useMemo, useRef, useEffect, useLayoutEffect } from "react";
import { motion, useMotionValue, animate, type PanInfo } from "framer-motion";
import { Home, ReceiptText, ShoppingCart, type LucideIcon } from "lucide-react";

type NavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: boolean;
};

const items: NavItem[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "orders", label: "Orders", icon: ReceiptText },
  { id: "cart", label: "Cart", icon: ShoppingCart, badge: true },
];

const iconSpring = { type: "spring" as const, stiffness: 500, damping: 18, mass: 0.7 };

const getDistanceSpring = (distance: number) => {
  const d = Math.max(1, Math.abs(distance));
  return {
    type: "spring" as const,
    stiffness: Math.max(220, 420 - d * 55),
    damping: Math.max(14, 24 - d * 2.5),
    mass: 0.85 + d * 0.08,
  };
};

export const LiquidGlassNav = ({
  activeId = "home",
  onChange,
}: {
  activeId?: string;
  onChange?: (id: string) => void;
}) => {
  const [active, setActive] = useState(activeId);
  const [distance, setDistance] = useState(0);
  const [rects, setRects] = useState<{ x: number; width: number }[]>([]);
  const [dragging, setDragging] = useState(false);

  const navRef = useRef<HTMLElement | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const x = useMotionValue(0);
  const width = useMotionValue(0);

  const indexById = useMemo(
    () => Object.fromEntries(items.map((it, i) => [it.id, i])),
    []
  );

  useLayoutEffect(() => {
    const measure = () => {
      const navEl = navRef.current;
      if (!navEl) return;
      const navRect = navEl.getBoundingClientRect();
      const next = tabRefs.current.map((el) => {
        if (!el) return { x: 0, width: 0 };
        const r = el.getBoundingClientRect();
        return { x: r.left - navRect.left, width: r.width };
      });
      setRects(next);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    if (dragging) return;
    const i = indexById[active];
    const r = rects[i];
    if (!r) return;
    const spring = getDistanceSpring(distance);
    animate(x, r.x, spring);
    animate(width, r.width, spring);
  }, [active, rects, dragging, distance, indexById, x, width]);

  const setActiveById = (id: string) => {
    if (id === active) return;
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate?.([10]);
    }
    setDistance(indexById[id] - indexById[active]);
    setActive(id);
    onChange?.(id);
  };

  // Keep internal active in sync with external activeId (e.g. route changes)
  useEffect(() => {
    if (activeId && activeId !== active && indexById[activeId] != null) {
      setDistance(indexById[activeId] - indexById[active]);
      setActive(activeId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    setDragging(false);
    if (rects.length === 0) return;
    const pillCenter = x.get() + width.get() / 2;
    const bias = Math.max(-1, Math.min(1, info.velocity.x / 800));
    let nearest = 0;
    let best = Infinity;
    rects.forEach((r, i) => {
      const c = r.x + r.width / 2 + bias * 30;
      const d = Math.abs(c - pillCenter);
      if (d < best) {
        best = d;
        nearest = i;
      }
    });
    setActiveById(items[nearest].id);
  };

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-50 w-[calc(100%-24px)] max-w-md"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}
    >
      <motion.nav
        ref={navRef}
        style={{
          WebkitBackdropFilter: "blur(36px) saturate(200%)",
          backdropFilter: "blur(36px) saturate(200%)",
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.7), rgba(255,255,255,0.45))",
          boxShadow:
            "0 22px 50px rgba(0,0,0,0.10), 0 1px 0 rgba(255,255,255,0.7) inset, 0 -1px 0 rgba(255,255,255,0.15) inset",
          touchAction: "pan-y",
        }}
        className="relative flex w-full items-center gap-1 p-1.5 rounded-full border border-white/50"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            padding: "1px",
            background:
              "conic-gradient(from 210deg at 50% 50%, rgba(255,255,255,0) 0deg, rgba(255,255,255,0.85) 60deg, rgba(255,255,255,0.15) 140deg, rgba(255,255,255,0) 200deg, rgba(255,255,255,0.5) 300deg, rgba(255,255,255,0) 360deg)",
            WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            mixBlendMode: "screen",
          }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-6 top-0 h-px rounded-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)",
          }}
        />

        {rects.length > 0 && (
          <motion.div
            drag="x"
            dragConstraints={{
              left: rects[0].x,
              right: rects[rects.length - 1].x + rects[rects.length - 1].width - width.get(),
            }}
            dragElastic={0.15}
            dragMomentum={false}
            onDragStart={() => setDragging(true)}
            onDrag={(_, info) => {
              const pillCenter = x.get() + width.get() / 2 + info.delta.x;
              let nearest = 0;
              let best = Infinity;
              rects.forEach((r, i) => {
                const c = r.x + r.width / 2;
                const d = Math.abs(c - pillCenter);
                if (d < best) {
                  best = d;
                  nearest = i;
                }
              });
              if (items[nearest].id !== active) {
                setDistance(nearest - indexById[active]);
                setActive(items[nearest].id);
                onChange?.(items[nearest].id);
              }
            }}
            onDragEnd={handleDragEnd}
            style={{
              x,
              width,
              top: 6,
              bottom: 6,
              WebkitBackdropFilter: "blur(20px) saturate(200%)",
              backdropFilter: "blur(20px) saturate(200%)",
              background:
                "linear-gradient(135deg, rgba(37,99,235,0.18), rgba(255,255,255,0.55))",
              boxShadow:
                "0 1px 0 rgba(255,255,255,0.7) inset, 0 -1px 0 rgba(0,0,0,0.05) inset, 0 8px 22px rgba(37,99,235,0.10)",
              touchAction: "none",
              cursor: dragging ? "grabbing" : "grab",
            }}
            className="absolute left-0 rounded-full border border-white/70"
            whileTap={{ scale: 0.97 }}
          />
        )}

        {items.map((item, i) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              ref={(el) => (tabRefs.current[i] = el)}
              onClick={() => setActiveById(item.id)}
              className="relative flex flex-1 items-center justify-center gap-1.5 px-3 py-2.5 rounded-full outline-none"
              aria-label={item.label}
            >
              <motion.span
                className="relative z-10 flex items-center gap-1.5 pointer-events-none"
                animate={
                  isActive
                    ? { scale: [1, 1.2, 1], opacity: 1 }
                    : { scale: 1, opacity: 0.7 }
                }
                transition={iconSpring}
              >
                <span className="relative">
                  <Icon
                    style={{ color: "#1D1D1F" }}
                    size={18}
                    strokeWidth={isActive ? 2.6 : 2.1}
                  />
                  {item.badge && (
                    <span
                      className="absolute -top-1 -right-1 h-2 w-2 rounded-full"
                      style={{ background: "#FF3B30", boxShadow: "0 0 0 2px rgba(255,255,255,0.9)" }}
                    />
                  )}
                </span>
                <span
                  className="text-[11px] font-bold uppercase tracking-[0.06em]"
                  style={{ color: "#1D1D1F" }}
                >
                  {item.label}
                </span>
              </motion.span>
            </button>
          );
        })}
      </motion.nav>
    </div>
  );
};

export default LiquidGlassNav;
