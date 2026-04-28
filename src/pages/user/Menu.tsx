import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import UserLayout from "@/components/user/UserLayout";
import { canteens, categories, menuItems, type MenuItem } from "@/data/menu";

const Menu = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const canteen = canteens.find((c) => c.id === id) ?? canteens[0];

  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>("all");
  const [qty, setQty] = useState<Record<string, number>>({});

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return menuItems.filter((m) => {
      if (activeCat !== "all" && m.categoryId !== activeCat) return false;
      if (!q) return true;
      return m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q);
    });
  }, [query, activeCat]);

  const setCount = (id: string, n: number) =>
    setQty((s) => ({ ...s, [id]: Math.max(0, n) }));

  return (
    <UserLayout>
      <div
        className="min-h-screen antialiased"
        style={{
          background: "#F5F5F7",
          color: "#1D1D1F",
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 120px)",
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        }}
      >
        {/* Header with back */}
        <div
          style={{
            paddingTop: 48,
            paddingLeft: 24,
            paddingRight: 24,
            marginBottom: 20,
          }}
          className="flex items-center gap-3"
        >
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="flex items-center justify-center"
            style={{
              width: 40,
              height: 40,
              borderRadius: 999,
              background: "rgba(255,255,255,0.7)",
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8), 0 4px 14px rgba(0,0,0,0.04)",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: "#1D1D1F" }}>
              arrow_back
            </span>
          </button>
          <div className="min-w-0">
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.12em",
                color: "#6E6E73",
                textTransform: "uppercase",
              }}
            >
              Menu
            </div>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 800,
                letterSpacing: "-0.02em",
                color: "#1D1D1F",
                lineHeight: 1.1,
              }}
              className="truncate"
            >
              {canteen.name}
            </h1>
          </div>
        </div>

        {/* Search */}
        <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 20 }}>
          <div
            className="flex items-center gap-2"
            style={{
              height: 48,
              borderRadius: 999,
              padding: "0 18px",
              background: "rgba(255,255,255,0.55)",
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8), 0 6px 18px rgba(0,0,0,0.04)",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: "#6E6E73" }}>
              search
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search menu items..."
              className="flex-1 bg-transparent outline-none"
              style={{
                fontSize: 15,
                color: "#1D1D1F",
                fontFamily: "inherit",
              }}
            />
          </div>
        </div>

        {/* Category pills */}
        <div
          className="no-scrollbar flex gap-3 overflow-x-auto"
          style={{ paddingLeft: 24, paddingRight: 24, paddingBottom: 8, marginBottom: 24 }}
        >
          {categories.map((c) => {
            const isActive = c.id === activeCat;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveCat(c.id)}
                className="shrink-0 flex items-center gap-2"
                style={{
                  height: 44,
                  padding: "0 18px",
                  borderRadius: 999,
                  background: isActive ? "rgba(37,99,235,0.12)" : "rgba(255,255,255,0.55)",
                  backdropFilter: "blur(20px) saturate(180%)",
                  WebkitBackdropFilter: "blur(20px) saturate(180%)",
                  boxShadow: isActive
                    ? "inset 0 0 0 1px rgba(37,99,235,0.35), 0 6px 18px rgba(37,99,235,0.12)"
                    : "inset 0 1px 0 rgba(255,255,255,0.8), 0 4px 14px rgba(0,0,0,0.04)",
                  transition: "all 200ms ease",
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: "-0.01em",
                    color: isActive ? "#2563EB" : "#1D1D1F",
                  }}
                >
                  {c.name}
                </span>
                <span style={{ fontSize: 16, lineHeight: 1 }}>{c.emoji}</span>
              </button>
            );
          })}
        </div>

        {/* Section heading */}
        <h2
          style={{
            paddingLeft: 24,
            paddingRight: 24,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#2563EB",
            marginBottom: 16,
          }}
        >
          {activeCat === "all" ? "All Items" : categories.find((c) => c.id === activeCat)?.name}
        </h2>

        {/* Items */}
        <div className="flex flex-col gap-4" style={{ paddingLeft: 24, paddingRight: 24 }}>
          {visible.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              qty={qty[item.id] ?? 0}
              onChange={(n) => setCount(item.id, n)}
            />
          ))}
          {visible.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "48px 0",
                color: "#6E6E73",
                fontSize: 14,
              }}
            >
              No items match your search.
            </div>
          )}
        </div>
      </div>
    </UserLayout>
  );
};

/* ---------------- Menu Item Card ---------------- */
const MenuItemCard = ({
  item,
  qty,
  onChange,
}: {
  item: MenuItem;
  qty: number;
  onChange: (n: number) => void;
}) => (
  <div className="cb-glass" style={{ padding: 14 }}>
    <div className="relative z-10 flex gap-3">
      {/* Image */}
      <div
        className="shrink-0 overflow-hidden"
        style={{
          width: 88,
          height: 88,
          borderRadius: 18,
          background: "rgba(255,255,255,0.6)",
          boxShadow: "inset 0 0 20px rgba(0,0,0,0.08)",
        }}
      >
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span
                className="inline-block"
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  border: `1.5px solid ${item.isVeg ? "#22C55E" : "#EF4444"}`,
                  position: "relative",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    inset: 2,
                    borderRadius: 999,
                    background: item.isVeg ? "#22C55E" : "#EF4444",
                  }}
                />
              </span>
              {item.popular && (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    color: "#B45309",
                    background: "rgba(255,181,150,0.4)",
                    padding: "2px 6px",
                    borderRadius: 999,
                    textTransform: "uppercase",
                  }}
                >
                  Popular
                </span>
              )}
            </div>
            <h3
              className="truncate"
              style={{
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: "-0.01em",
                color: "#1D1D1F",
                marginTop: 4,
              }}
            >
              {item.name}
            </h3>
            <p
              className="line-clamp-1"
              style={{ fontSize: 12, color: "#6E6E73", marginTop: 2 }}
            >
              {item.description}
            </p>
          </div>
        </div>

        <div className="flex items-end justify-between mt-2">
          <div className="flex items-baseline gap-1.5">
            <span style={{ fontSize: 17, fontWeight: 800, color: "#1D1D1F", letterSpacing: "-0.01em" }}>
              ₹{item.price}
            </span>
            {item.oldPrice && (
              <span
                style={{
                  fontSize: 12,
                  color: "#8A8A8E",
                  textDecoration: "line-through",
                }}
              >
                ₹{item.oldPrice}
              </span>
            )}
            <span style={{ fontSize: 11, color: "#6E6E73", marginLeft: 6 }}>
              · {item.prepMinutes} min
            </span>
          </div>

          {qty === 0 ? (
            <button
              type="button"
              onClick={() => onChange(1)}
              style={{
                background: "#2563EB",
                color: "#FFFFFF",
                fontSize: 12,
                fontWeight: 700,
                padding: "8px 16px",
                borderRadius: 999,
                boxShadow: "0 8px 18px -6px rgba(37,99,235,0.45)",
              }}
            >
              Add +
            </button>
          ) : (
            <div
              className="flex items-center"
              style={{
                background: "rgba(255,255,255,0.65)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                borderRadius: 999,
                padding: "2px 6px",
                gap: 6,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
              }}
            >
              <button
                type="button"
                onClick={() => onChange(qty - 1)}
                aria-label="decrease"
                style={{ width: 26, height: 26, fontSize: 18, fontWeight: 700, color: "#6E6E73" }}
              >
                −
              </button>
              <span
                style={{
                  minWidth: 14,
                  textAlign: "center",
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#1D1D1F",
                }}
              >
                {qty}
              </span>
              <button
                type="button"
                onClick={() => onChange(qty + 1)}
                aria-label="increase"
                style={{ width: 26, height: 26, fontSize: 18, fontWeight: 700, color: "#2563EB" }}
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default Menu;