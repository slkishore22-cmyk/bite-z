import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import UserLayout from "@/components/user/UserLayout";
import { canteens } from "@/data/menu";

type Item = { emoji: string; name: string; desc: string; price: number };
type CategoryKey = "food" | "snacks" | "drinks";

const DATA: Record<CategoryKey, Item[]> = {
  food: [
    { emoji: "🍱", name: "Artisan Bento Box", desc: "Premium salmon, tempura, and organic greens.", price: 450 },
    { emoji: "🍜", name: "Midnight Miso Ramen", desc: "12-hour broth with slow-cooked pork belly.", price: 380 },
    { emoji: "🌮", name: "Truffle Steak Tacos", desc: "Wagyu beef with truffle oil and cilantro.", price: 520 },
    { emoji: "🍤", name: "Rock Shrimp Tempura", desc: "Crispy shrimp with spicy mayo glaze.", price: 420 },
  ],
  snacks: [
    { emoji: "🥪", name: "Club Sandwich", desc: "Grilled chicken, cheese and crispy bacon.", price: 180 },
    { emoji: "🍟", name: "Loaded Fries", desc: "Cheese, jalapeños, and house sauce.", price: 160 },
    { emoji: "🥨", name: "Soft Pretzel", desc: "Warm pretzel with mustard dip.", price: 120 },
    { emoji: "🌭", name: "Gourmet Hot Dog", desc: "Smoked sausage with caramelised onions.", price: 220 },
  ],
  drinks: [
    { emoji: "🧃", name: "Cold Pressed Mango", desc: "Fresh Alphonso mango, no added sugar.", price: 90 },
    { emoji: "🥤", name: "Sparkling Lemonade", desc: "House-made with mint and lime.", price: 80 },
    { emoji: "☕", name: "Iced Caramel Latte", desc: "Double espresso, milk, caramel drizzle.", price: 140 },
    { emoji: "🍵", name: "Matcha Cloud", desc: "Ceremonial matcha with oat foam.", price: 160 },
  ],
};

const TABS: { key: CategoryKey; label: string; emoji: string }[] = [
  { key: "food", label: "Food", emoji: "🍛" },
  { key: "snacks", label: "Snacks", emoji: "🍟" },
  { key: "drinks", label: "Drinks", emoji: "🥤" },
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
  const canteen = canteens.find((c) => c.id === id);
  const title = canteen?.name ?? "Main Block Canteen";

  const [active, setActive] = useState<CategoryKey>("food");
  const [query, setQuery] = useState("");
  const [qty, setQty] = useState<Record<string, number>>({});

  const setCount = (key: string, n: number) =>
    setQty((s) => ({ ...s, [key]: Math.max(0, n) }));

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DATA[active].filter(
      (it) => !q || it.name.toLowerCase().includes(q) || it.desc.toLowerCase().includes(q),
    );
  }, [active, query]);

  const { totalItems, totalPrice } = useMemo(() => {
    let items = 0;
    let price = 0;
    (Object.keys(DATA) as CategoryKey[]).forEach((cat) => {
      DATA[cat].forEach((it) => {
        const k = `${cat}:${it.name}`;
        const n = qty[k] ?? 0;
        items += n;
        price += n * it.price;
      });
    });
    return { totalItems: items, totalPrice: price };
  }, [qty]);

  return (
    <UserLayout>
      <div
        className="min-h-screen antialiased"
        style={{
          background: "#F5F5F7",
          color: "#111827",
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        {/* Fixed header */}
        <div
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between"
          style={{
            padding: "16px 24px",
            background: "rgba(245,245,247,0.85)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="flex items-center gap-3"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 24, color: "#4B5563" }}
            >
              arrow_back
            </span>
            <span
              style={{
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                color: "#111827",
              }}
            >
              {title}
            </span>
          </button>
          <div style={{ width: 40, height: 40 }} />
        </div>

        {/* Main content */}
        <div
          className="mx-auto"
          style={{
            paddingTop: 96,
            paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 120px)",
            paddingLeft: 16,
            paddingRight: 16,
            maxWidth: 672,
          }}
        >
          {/* Sticky: search + tabs */}
          <div
            className="sticky z-40"
            style={{ top: 64, paddingTop: 8, background: "transparent" }}
          >
            {/* Search */}
            <div
              className="flex items-center gap-2"
              style={{
                ...liquidGlass,
                height: 52,
                borderRadius: 9999,
                padding: "0 16px",
              }}
            >
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
              style={{ marginTop: 32, marginBottom: 32 }}
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
                      ...liquidGlass,
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
          <div className="space-y-8">
            {visible.map((it, idx) => {
              const k = `${active}:${it.name}`;
              const n = qty[k] ?? 0;
              return (
                <FoodCard
                  key={k}
                  item={it}
                  qty={n}
                  onChange={(v) => setCount(k, v)}
                  delay={idx * 60}
                />
              );
            })}
            {visible.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "48px 0",
                  color: "#6B7280",
                  fontSize: 14,
                }}
              >
                No items match your search.
              </div>
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
              bottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)",
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
                style={{ fontSize: 12, fontWeight: 700, color: "#6B7280" }}
              >
                Add to Cart
              </button>
              <button
                type="button"
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

const FoodCard = ({
  item,
  qty,
  onChange,
  delay,
}: {
  item: Item;
  qty: number;
  onChange: (n: number) => void;
  delay: number;
}) => {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="flex items-center animate-fade-in"
      style={{
        ...liquidGlass,
        background: hover ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.4)",
        padding: 12,
        gap: 12,
        transition: "background 400ms ease",
        animationDelay: `${delay}ms`,
        animationFillMode: "both",
      }}
    >
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