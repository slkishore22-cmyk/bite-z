import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import UserLayout from "@/components/user/UserLayout";
import { MenuItemsSkeleton } from "@/components/user/Skeletons";
import {
  getInventory,
  loadInventoryFromBackend,
  subscribeInventory,
  type SellerInventoryItem,
} from "@/lib/sellerInventory";
import { getRegisteredCanteens, getRegisteredCanteensFromBackend, type SellerProfile } from "@/lib/sellerProfile";
import { addToCart, getCart, setCartQty, subscribeCart } from "@/lib/userCart";
import {
  getFavorites,
  getPinned,
  pinItem,
  subscribePins,
  toggleFavorite,
} from "@/lib/userPins";

type CategoryKey = "Food" | "Snacks" | "Drinks";

const TABS: { key: CategoryKey; label: string; emoji: string }[] = [
  { key: "Food", label: "Food", emoji: "🍛" },
  { key: "Snacks", label: "Snacks", emoji: "🍟" },
  { key: "Drinks", label: "Drinks", emoji: "🥤" },
];

const liquidGlass: React.CSSProperties = {
  background: "rgba(255,255,255,0.4)",
  backdropFilter: "blur(40px)",
  WebkitBackdropFilter: "blur(40px)",
  boxShadow:
    "0 4px 24px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.8), inset 0 24px 24px -12px rgba(255,255,255,0.5)",
  borderRadius: 22,
};

const textGlass: React.CSSProperties = {
  textShadow: "0 1px 2px rgba(255,255,255,0.8), 0 2px 4px rgba(0,0,0,0.05)",
};

const Menu = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromOffer = searchParams.get("fromOffer") === "1";
  const inventoryRef = useRef<HTMLDivElement | null>(null);
  const [canteen, setCanteen] = useState<SellerProfile | null>(() => getRegisteredCanteens().find((c) => c.id === id) ?? null);
  const title = canteen?.canteenName ?? "Canteen";

  const [active, setActive] = useState<CategoryKey>("Food");
  const [query, setQuery] = useState("");
  const [inventory, setInventory] = useState<SellerInventoryItem[]>(() => getInventory(id));
  const [inventoryLoading, setInventoryLoading] = useState(() => getInventory(id).length === 0);
  const [cart, setCart] = useState(() => getCart());
  // Frozen snapshots: order is captured on entry to this canteen and does NOT
  // shuffle while the user browses. It refreshes on next visit (id change).
  const [pinned, setPinned] = useState(() => getPinned());
  const [favorites, setFavorites] = useState(() => getFavorites());
  // Live favorites used only for the heart UI (so the heart appears immediately
  // when the user double-taps), without re-sorting the visible list.
  const [favoritesLive, setFavoritesLive] = useState(() => getFavorites());

  useEffect(() => {
    const refreshLocal = () => setInventory(getInventory(id));
    const unsub = subscribeInventory(refreshLocal);
    loadInventoryFromBackend(id)
      .then((rows) => { setInventory(rows); setInventoryLoading(false); })
      .catch(() => { setInventory([]); setInventoryLoading(false); });
    getRegisteredCanteensFromBackend().then((rows) => setCanteen(rows.find((c) => c.id === id) ?? null)).catch(() => setCanteen(getRegisteredCanteens().find((c) => c.id === id) ?? null));
    // Re-snapshot pin/favorite order only when the canteen changes
    setPinned(getPinned());
    setFavorites(getFavorites());
    setFavoritesLive(getFavorites());
    return unsub;
  }, [id]);
  useEffect(() => subscribeCart(() => setCart(getCart())), []);
  // When the user lands here from tapping an offer card, auto-scroll the
  // inventory list into view so they immediately start exploring items for
  // this canteen.
  useEffect(() => {
    if (!fromOffer) return;
    if (inventoryLoading) return;
    const t = window.setTimeout(() => {
      inventoryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 250);
    return () => window.clearTimeout(t);
  }, [fromOffer, inventoryLoading, id]);
  useEffect(
    () =>
      subscribePins(() => {
        // Only update the heart indicator; do not re-sort the menu in place.
        setFavoritesLive(getFavorites());
      }),
    [],
  );

  const currentCanteenId = id ?? "__unknown__";
  const qtyOf = (itemId: string) =>
    cart.find((c) => c.itemId === itemId && (c.canteenId ?? "__unknown__") === currentCanteenId)?.qty ?? 0;

  const handleAdd = (it: SellerInventoryItem, n: number) => {
    const current = qtyOf(it.id);
    if (current === 0 && n > 0) {
      // Pin silently — do NOT reorder the visible list right now. The new
      // pinned position will only be reflected on the next visit / after
      // checkout when the snapshot is rebuilt.
      pinItem(it.id);
      addToCart(
        { itemId: it.id, name: it.name, price: it.price, icon: it.icon, category: it.category, canteenId: it.sellerId ?? id, canteenIcon: canteen?.icon, canteenName: canteen?.canteenName },
        n,
      );
    } else {
      if (n > current) pinItem(it.id);
      setCartQty(it.id, n, it.sellerId ?? id);
    }
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? inventory.filter(
          (it) => it.status === "Active" && it.name.toLowerCase().includes(q),
        )
      : inventory.filter(
          (it) => it.category === active && it.status === "Active",
        );
    return [...base].sort((a, b) => {
      const fa = favorites[a.id] ?? 0;
      const fb = favorites[b.id] ?? 0;
      if (fa !== fb) return fb - fa;
      const pa = pinned[a.id] ?? 0;
      const pb = pinned[b.id] ?? 0;
      if (pa !== pb) return pb - pa;
      return 0;
    });
  }, [inventory, active, query, pinned, favorites]);

  const { totalItems, totalPrice } = useMemo(() => {
    const currentCanteenItems = cart.filter((i) => (i.canteenId ?? "__unknown__") === currentCanteenId);
    const totalItems = currentCanteenItems.reduce((s, i) => s + i.qty, 0);
    const totalPrice = currentCanteenItems.reduce((s, i) => s + i.qty * i.price, 0);
    return { totalItems, totalPrice };
  }, [cart, currentCanteenId]);

  return (
    <UserLayout>
      <div
        className="user-page antialiased"
        style={{
          color: "#111827",
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        {/* Header */}
        <div
          className="relative z-10 mx-auto flex items-center justify-between"
          style={{
            paddingTop: "calc(12px + var(--ios-pwa-safe-top) + var(--ios-pwa-top-breathing))",
            paddingBottom: 16,
            paddingLeft: 24,
            paddingRight: 24,
            maxWidth: 672,
          }}
        >
          <button
            type="button"
            onClick={() => navigate("/app/home")}
            aria-label="Back"
            className="flex items-center gap-3"
            style={{ minWidth: 0, flex: 1, overflow: "hidden" }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 24, color: "#4B5563", flexShrink: 0 }}
            >
              arrow_back
            </span>
            <span
              style={{
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                color: "#111827",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                flex: 1,
                minWidth: 0,
                paddingRight: 16,
              }}
            >
              {title}
            </span>
          </button>
          <div style={{ width: 0, height: 40, flexShrink: 0 }} />
        </div>

        {/* Main content */}
        <div
          className="user-content"
          style={{
            paddingTop: 0,
            paddingBottom: 120,
            maxWidth: 672,
          }}
        >
          {/* Search + tabs (scrolls with page) */}
          <div style={{ paddingTop: 8, paddingBottom: 8 }}>
            {/* Search */}
            <div className="flex items-center gap-2">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 22, color: "#2563eb" }}
              >
                search
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for dishes or cravings..."
                className="flex-1 bg-transparent outline-none"
                style={{
                  fontSize: 14,
                  color: "#111827",
                  fontFamily: "inherit",
                }}
              />
            </div>

            {/* Tabs */}
            <div
              className="no-scrollbar flex gap-3 overflow-x-auto"
              style={{ marginTop: 16, marginBottom: 8 }}
            >
              {TABS.map((t) => {
                const isActive = t.key === active;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setActive(t.key)}
                    className="shrink-0"
                    style={{
                      borderRadius: 9999,
                      padding: "8px 20px",
                      fontSize: 14,
                      fontWeight: 600,
                      color: isActive ? "#2563eb" : "#4B5563",
                      transition: "all 400ms ease",
                    }}
                  >
                    {t.label} {t.emoji}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Food list */}
          <div ref={inventoryRef} className="space-y-8">
            {visible.map((it, idx) => {
              const n = qtyOf(it.id);
              return (
                <FoodCard
                  key={it.id}
                  item={{
                    emoji: it.icon,
                    name: it.name,
                    desc: it.iconLabel,
                    price: it.price,
                  }}
                  qty={n}
                  onChange={(v) => handleAdd(it, v)}
                  isFavorite={Boolean(favoritesLive[it.id])}
                  onToggleFavorite={() => toggleFavorite(it.id)}
                  delay={idx * 60}
                />
              );
            })}
            {visible.length === 0 && (
              inventoryLoading ? (
                <MenuItemsSkeleton rows={5} />
              ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "48px 0",
                  color: "#6B7280",
                  fontSize: 14,
                }}
              >
                {inventory.length === 0
                  ? "Menu coming soon."
                  : "No items match your search."}
              </div>
              )
            )}
          </div>
        </div>

        {/* Floating order panel */}
        {totalItems > 0 && (
          <div
            className="fixed z-50 flex items-center justify-between"
            style={{
              ...liquidGlass,
              left: 16,
              right: 16,
              bottom: "calc(24px + var(--ios-pwa-safe-bottom))",
              padding: 16,
            }}
          >
            <div className="min-w-0">
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#6B7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                CURRENT ORDER
              </div>
              <div
                style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginTop: 2 }}
              >
                {totalItems} item{totalItems === 1 ? "" : "s"} • ₹{totalPrice}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate("/app/cart")}
                style={{ fontSize: 12, fontWeight: 700, color: "#6B7280" }}
              >
                View Cart
              </button>
              <button
                type="button"
                onClick={() => navigate(`/app/payment?canteenId=${encodeURIComponent(currentCanteenId)}`)}
                style={{
                  background: "linear-gradient(135deg, #2563eb, #3b82f6)",
                  color: "#FFFFFF",
                  padding: "10px 20px",
                  borderRadius: 9999,
                  boxShadow: "0 4px 14px rgba(37,99,235,0.3)",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                Pay Now
              </button>
            </div>
          </div>
        )}
      </div>
    </UserLayout>
  );
};

type FoodCardItem = { emoji: string; name: string; desc: string; price: number };

const FoodCard = ({
  item,
  qty,
  onChange,
  isFavorite,
  onToggleFavorite,
  delay,
}: {
  item: FoodCardItem;
  qty: number;
  onChange: (n: number) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  delay: number;
}) => {
  const [hover, setHover] = useState(false);
  const lastTapRef = useRef<number>(0);
  const DOUBLE_TAP_MS = 300;

  const handleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < DOUBLE_TAP_MS) {
      onToggleFavorite();
      if ("vibrate" in navigator) navigator.vibrate?.(20);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onPointerUp={handleTap}
      onContextMenu={(e) => e.preventDefault()}
      className="flex items-center animate-fade-in"
      style={{
        ...liquidGlass,
        background: hover ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.4)",
        padding: 12,
        gap: 12,
        transition: "background 400ms ease",
        position: "relative",
        touchAction: "pan-y",
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
        animationDelay: `${delay}ms`,
        animationFillMode: "both",
      }}
    >
      {isFavorite && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: 6,
            left: 6,
            fontSize: 14,
          }}
        >
          ❤️
        </span>
      )}
      <div
        className="flex items-center justify-center shrink-0"
        style={{ width: 48, height: 48, fontSize: 30 }}
      >
        {item.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div
          style={{
            ...textGlass,
            fontWeight: 600,
            fontSize: 15,
            color: "#111827",
          }}
          className="truncate"
        >
          {item.name}
        </div>
        <div
          className="truncate"
          style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}
        >
          {item.desc}
        </div>
        <div
          style={{
            ...textGlass,
            fontSize: 14,
            fontWeight: 700,
            color: "#2563eb",
            marginTop: 4,
          }}
        >
          ₹{item.price}
        </div>
      </div>
      <div className="shrink-0">
        {qty === 0 ? (
          <button
            type="button"
            onClick={() => onChange(1)}
            style={{
              background: "rgba(255,255,255,0.5)",
              borderRadius: 9999,
              padding: "6px 16px",
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#374151",
              transition: "all 400ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.85)";
              e.currentTarget.style.color = "#2563eb";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.5)";
              e.currentTarget.style.color = "#374151";
            }}
          >
            Add
          </button>
        ) : (
          <div
            className="flex items-center"
            style={{
              gap: 8,
              background: "rgba(255,255,255,0.4)",
              border: "1px solid rgba(255,255,255,0.5)",
              borderRadius: 9999,
              padding: 4,
            }}
          >
            <button
              type="button"
              onClick={() => onChange(qty - 1)}
              aria-label="decrease"
              style={{
                width: 24,
                height: 24,
                color: "#4B5563",
                fontSize: 16,
                lineHeight: 1,
              }}
            >
              −
            </button>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#111827",
                minWidth: 16,
                textAlign: "center",
              }}
            >
              {qty}
            </span>
            <button
              type="button"
              onClick={() => onChange(qty + 1)}
              aria-label="increase"
              className="flex items-center justify-center"
              style={{
                width: 24,
                height: 24,
                background: "#2563eb",
                color: "#FFFFFF",
                borderRadius: "50%",
                boxShadow: "0 2px 6px rgba(37,99,235,0.35)",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                add
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Menu;