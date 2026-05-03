import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SellerHeader from "@/components/seller/SellerHeader";
import { getOrders, loadOrdersFromBackend, subscribeOrders, type Order } from "@/lib/sellerOrders";
import { hourlySales, ordersInRange, rangeBounds, totalRevenue } from "@/lib/sellerStats";
import { getSellerSession } from "@/utils/sessionManager";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Tile = {
  icon: string;
  title: string;
  desc: string;
  to: string;
};

const tiles: Tile[] = [
  { icon: "inventory_2", title: "Inventory", desc: "Manage food items and stock", to: "/seller/inventory" },
  { icon: "restaurant_menu", title: "Manage Menu", desc: "Update dishes and categories", to: "/seller/menu" },
  { icon: "badge", title: "Create Staff", desc: "Add and manage staff members", to: "/seller/staff" },
  { icon: "local_offer", title: "Create Offer", desc: "Add discounts and promotions", to: "/seller/offers" },
];

const PIN_STORAGE_KEY = "bitez.seller.pinnedTiles";
const SWIPE_PIN_THRESHOLD = 60; // px to trigger pin
const SWIPE_REVEAL_MAX = 88; // px max drag reveal
const LONG_PRESS_MS = 500;

const SellerDashboard = () => {
  const navigate = useNavigate();
  const lastChartTap = useRef(0);

  const [orders, setOrders] = useState<Order[]>(() => getOrders());
  useEffect(() => {
    const sellerId = getSellerSession()?.id;
    const unsub = subscribeOrders(() => setOrders(getOrders()));
    loadOrdersFromBackend(sellerId).then(setOrders).catch(() => setOrders([]));
    return unsub;
  }, []);

  const { from, to } = useMemo(() => rangeBounds("today"), []);
  const todaysOrders = useMemo(() => ordersInRange(orders, from, to), [orders, from, to]);
  const todaysRevenue = useMemo(() => totalRevenue(todaysOrders), [todaysOrders]);
  const salesData = useMemo(() => hourlySales(todaysOrders), [todaysOrders]);

  const handleChartTap = () => {
    const now = Date.now();
    if (now - lastChartTap.current < 350) {
      navigate("/seller/sales");
      lastChartTap.current = 0;
    } else {
      lastChartTap.current = now;
    }
  };

  const today = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }).toUpperCase(),
    []
  );

  const [pinned, setPinned] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(PIN_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(pinned));
    } catch {
      /* ignore */
    }
  }, [pinned]);

  const togglePin = (title: string) => {
    setPinned((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [title, ...prev]
    );
  };

  const orderedTiles = useMemo(() => {
    const pinnedSet = new Set(pinned);
    const pinnedTiles = pinned
      .map((t) => tiles.find((x) => x.title === t))
      .filter((x): x is Tile => Boolean(x));
    const rest = tiles.filter((t) => !pinnedSet.has(t.title));
    return [...pinnedTiles, ...rest];
  }, [pinned]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* App shell — phone-first, max width on larger screens */}
      <div className="mx-auto w-full max-w-md px-5 pb-10 pt-6">
        {/* Top bar */}
        <SellerHeader />

        {/* Heading */}
        <section className="mt-7">
          <h2 className="text-3xl font-extrabold tracking-tight">Dashboard</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Overview of your canteen performance
          </p>

          <button className="mt-4 flex w-full items-center gap-2 rounded-full bg-secondary/70 px-4 py-2.5 text-sm font-medium text-foreground/90 backdrop-blur transition hover:bg-secondary">
            <span className="material-symbols-outlined text-muted-foreground" style={{ fontSize: 18 }}>
              calendar_today
            </span>
            <span>{today}</span>
          </button>
        </section>

        {/* Sales card */}
        <section
          className="mt-5 overflow-hidden rounded-3xl border border-border bg-gradient-card p-5 shadow-card"
          aria-label="Today's sales"
        >
          <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground">
            TODAY&apos;S SALES
          </p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <p className="text-4xl font-extrabold tracking-tight">
              ₹{todaysRevenue.toLocaleString("en-IN")}
            </p>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                receipt_long
              </span>
              {todaysOrders.length} orders
            </span>
          </div>

          <div
            className="mt-4 h-40 w-full cursor-pointer select-none"
            onClick={handleChartTap}
            onTouchEnd={handleChartTap}
            role="button"
            aria-label="Open sales dashboard"
            title="Double-tap to open Sales Dashboard"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" hide />
                <YAxis hide />
                <Tooltip
                  cursor={{ stroke: "hsl(var(--primary))", strokeOpacity: 0.3 }}
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12,
                    color: "hsl(var(--popover-foreground))",
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                  formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Sales"]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  fill="url(#salesFill)"
                  dot={{ r: 3, stroke: "hsl(var(--primary))", strokeWidth: 2, fill: "hsl(var(--background))" }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 flex justify-between px-1 text-[11px] font-medium text-muted-foreground">
            <span>08:00 AM</span>
            <span>12:00 PM</span>
            <span>04:00 PM</span>
            <span>08:00 PM</span>
          </div>
        </section>

        {/* Action tiles */}
        <section className="mt-6 space-y-3" aria-label="Quick actions">
          {orderedTiles.map((t) => (
            <TileRow
              key={t.title}
              tile={t}
              isPinned={pinned.includes(t.title)}
              onTogglePin={() => togglePin(t.title)}
            />
          ))}
        </section>
      </div>
    </div>
  );
};

export default SellerDashboard;

type TileRowProps = {
  tile: Tile;
  isPinned: boolean;
  onTogglePin: () => void;
};

const TileRow = ({ tile, isPinned, onTogglePin }: TileRowProps) => {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const axisLocked = useRef<"x" | "y" | null>(null);
  const longPressTimer = useRef<number | null>(null);
  const longPressFired = useRef(false);
  const suppressClick = useRef(false);

  const clearLongPress = () => {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    startX.current = e.clientX;
    startY.current = e.clientY;
    axisLocked.current = null;
    longPressFired.current = false;
    suppressClick.current = false;

    longPressTimer.current = window.setTimeout(() => {
      longPressFired.current = true;
      suppressClick.current = true;
      onTogglePin();
      if ("vibrate" in navigator) navigator.vibrate?.(15);
    }, LONG_PRESS_MS);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (startX.current === null || startY.current === null) return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;

    if (!axisLocked.current) {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        axisLocked.current = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
        if (axisLocked.current === "x") {
          clearLongPress();
          setIsDragging(true);
        } else {
          // vertical scroll: cancel
          clearLongPress();
          startX.current = null;
          startY.current = null;
          return;
        }
      } else {
        return;
      }
    }

    if (axisLocked.current === "x") {
      // only allow leftward drag (negative dx)
      const next = Math.max(-SWIPE_REVEAL_MAX, Math.min(0, dx));
      setDragX(next);
      if (Math.abs(dx) > 5) suppressClick.current = true;
    }
  };

  const finishDrag = () => {
    if (axisLocked.current === "x" && Math.abs(dragX) >= SWIPE_PIN_THRESHOLD) {
      onTogglePin();
      if ("vibrate" in navigator) navigator.vibrate?.(10);
    }
    setDragX(0);
    setIsDragging(false);
    axisLocked.current = null;
    startX.current = null;
    startY.current = null;
  };

  const handlePointerUp = () => {
    clearLongPress();
    finishDrag();
  };

  const handlePointerCancel = () => {
    clearLongPress();
    setDragX(0);
    setIsDragging(false);
    axisLocked.current = null;
    startX.current = null;
    startY.current = null;
  };

  const revealOpacity = Math.min(1, Math.abs(dragX) / SWIPE_PIN_THRESHOLD);
  const willPin = Math.abs(dragX) >= SWIPE_PIN_THRESHOLD;

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Reveal background (action hint) */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-end pr-5"
        style={{
          background: willPin
            ? "hsl(var(--primary) / 0.18)"
            : "hsl(var(--secondary))",
          opacity: Math.abs(dragX) > 0 ? 1 : 0,
        }}
        aria-hidden
      >
        <div
          className="flex items-center gap-1.5 text-sm font-semibold text-primary"
          style={{ opacity: revealOpacity }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
            push_pin
          </span>
          <span>{isPinned ? "Unpin" : "Pin"}</span>
        </div>
      </div>

      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        style={{
          transform: `translateX(${dragX}px)`,
          transition: isDragging ? "none" : "transform 220ms ease",
          touchAction: "pan-y",
        }}
      >
        <Link
          to={tile.to}
          onClick={(e) => {
            if (suppressClick.current || longPressFired.current) {
              e.preventDefault();
            }
          }}
          className={`group flex select-none items-center gap-4 rounded-2xl border bg-gradient-card p-4 shadow-card transition-all active:scale-[0.99] ${
            isPinned ? "border-primary/50 shadow-glow" : "border-border hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow"
          }`}
        >
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
            <span className="material-symbols-outlined">{tile.icon}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold leading-tight">{tile.title}</p>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">{tile.desc}</p>
          </div>
          <button
            type="button"
            aria-label={isPinned ? `Unpin ${tile.title}` : `Pin ${tile.title}`}
            aria-pressed={isPinned}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onTogglePin();
            }}
            className={`transition ${
              isPinned ? "text-primary" : "text-muted-foreground/60 hover:text-foreground"
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 18,
                fontVariationSettings: isPinned
                  ? "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24"
                  : undefined,
              }}
            >
              push_pin
            </span>
          </button>
          <span className="material-symbols-outlined text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground">
            chevron_right
          </span>
        </Link>
      </div>
    </div>
  );
};