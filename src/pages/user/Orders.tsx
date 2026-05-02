import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserLayout from "@/components/user/UserLayout";
import {
  getOrders,
  subscribeOrders,
  type Order,
} from "@/lib/sellerOrders";

type OrderRow = {
  id: string;
  itemsCount: number;
  total: number;
  emojis: string[];
};

type CanteenGroup = {
  id: string;
  name: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  status: "pending" | "completed";
  orders: OrderRow[];
};

const toOrderRow = (o: Order): OrderRow => ({
  id: o.id,
  itemsCount: o.items.reduce((s, i) => s + i.qty, 0),
  total: o.total,
  emojis: o.items.slice(0, 3).map((i) => i.icon),
});

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>(() => getOrders());

  useEffect(() => subscribeOrders(() => setOrders(getOrders())), []);

  const { pendingGroups, completedGroups } = useMemo(() => {
    const pending = orders.filter((o) => o.status === "Pending");
    const completed = orders.filter((o) => o.status === "Completed");

    const pendingGroups: CanteenGroup[] = pending.length
      ? [
          {
            id: "pending",
            name: "Bitez Canteen",
            icon: "restaurant",
            iconBg: "#D6E3FF",
            iconColor: "#2563EB",
            status: "pending",
            orders: pending.map(toOrderRow),
          },
        ]
      : [];
    const completedGroups: CanteenGroup[] = completed.length
      ? [
          {
            id: "completed",
            name: "Bitez Canteen",
            icon: "local_cafe",
            iconBg: "#F5F5F7",
            iconColor: "#984061",
            status: "completed",
            orders: completed.map(toOrderRow),
          },
        ]
      : [];
    return { pendingGroups, completedGroups };
  }, [orders]);

  const [openIds, setOpenIds] = useState<Record<string, boolean>>({
    pending: true,
  });
  const toggle = (id: string) =>
    setOpenIds((p) => ({ ...p, [id]: !p[id] }));

  return (
    <UserLayout>
      <div
        className="min-h-screen pb-32 antialiased"
        style={{
          background: "#F5F5F7",
          color: "#1D1D1F",
          fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
        }}
      >
        <main className="px-6 mx-auto w-full max-w-md pt-8">
          {/* Editorial Header */}
          <section className="mb-8">
            <h2
              className="font-bold tracking-tight"
              style={{ fontSize: 26, color: "#1D1D1F", lineHeight: 1.1 }}
            >
              My Orders
            </h2>
            <p style={{ color: "#6E6E73", fontSize: 14, marginTop: 4 }}>
              Track and manage your orders
            </p>
          </section>

          {/* Pending Pickup */}
          <Section title="Pending Pickup">
            {pendingGroups.length === 0 ? (
              <EmptyHint text="No pending orders. Place an order to see it here." />
            ) : (
              pendingGroups.map((g) => (
                <GroupCard
                  key={g.id}
                  group={g}
                  open={!!openIds[g.id]}
                  onToggle={() => toggle(g.id)}
                />
              ))
            )}
          </Section>

          {/* Completed Orders */}
          <Section title="Completed Orders" mt={28}>
            {completedGroups.length === 0 ? (
              <EmptyHint text="Completed orders will appear here." />
            ) : (
              completedGroups.map((g) => (
                <GroupCard
                  key={g.id}
                  group={g}
                  open={!!openIds[g.id]}
                  onToggle={() => toggle(g.id)}
                />
              ))
            )}
          </Section>

          {/* Reorder card */}
          <section
            className="relative overflow-hidden mt-10"
            style={{
              borderRadius: 22,
              background: "#FFFFFF",
              padding: 22,
              border: "1px solid rgba(0,0,0,0.03)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
            }}
          >
            <div className="relative z-10">
              <h4
                className="font-bold"
                style={{ fontSize: 18, color: "#1D1D1F", marginBottom: 6 }}
              >
                Craving something else?
              </h4>
              <p
                style={{
                  color: "#6E6E73",
                  fontSize: 13.5,
                  marginBottom: 18,
                  maxWidth: "85%",
                }}
              >
                Explore the latest additions to Bitez kitchens.
              </p>
              <button
                onClick={() => navigate("/home")}
                className="active:scale-95 transition-transform"
                style={{
                  padding: "12px 24px",
                  borderRadius: 9999,
                  background:
                    "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
                  color: "#FFFFFF",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  boxShadow: "0 10px 24px rgba(37,99,235,0.25)",
                }}
              >
                Explore Menus
              </button>
            </div>
            <div
              className="absolute pointer-events-none"
              style={{
                right: -20,
                bottom: -20,
                opacity: 0.05,
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 130, color: "#1D1D1F" }}
              >
                fastfood
              </span>
            </div>
          </section>
        </main>
      </div>
    </UserLayout>
  );
};

const Section = ({
  title,
  children,
  mt = 0,
}: {
  title: string;
  children: React.ReactNode;
  mt?: number;
}) => (
  <div style={{ marginTop: mt }} className="mb-2">
    <h3
      className="font-bold uppercase"
      style={{
        color: "#6E6E73",
        fontSize: 10.5,
        letterSpacing: "0.12em",
        padding: "0 4px",
        marginBottom: 12,
      }}
    >
      {title}
    </h3>
    <div className="space-y-3">{children}</div>
  </div>
);

const GroupCard = ({
  group,
  open,
  onToggle,
}: {
  group: CanteenGroup;
  open: boolean;
  onToggle: () => void;
}) => {
  const navigate = useNavigate();
  const isPending = group.status === "pending";
  const count = group.orders.length;

  return (
    <div
      className="overflow-hidden"
      style={{
        borderRadius: 22,
        background: "rgba(255,255,255,0.7)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.6)",
        boxShadow:
          "0 4px 24px -1px rgba(0,0,0,0.04), inset 0 1px 1px rgba(255,255,255,1)",
      }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between active:scale-[0.99] transition-transform"
        style={{ padding: "18px 20px" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center"
            style={{
              width: 44,
              height: 44,
              borderRadius: 9999,
              background: group.iconBg,
              color: group.iconColor,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 22,
                fontVariationSettings: "'FILL' 1",
                color: group.iconColor,
              }}
            >
              {group.icon}
            </span>
          </div>
          <div className="text-left">
            <h3 className="font-bold" style={{ fontSize: 15, color: "#1D1D1F" }}>
              {group.name}
            </h3>
            <span
              className="font-bold uppercase"
              style={{
                fontSize: 10,
                letterSpacing: "0.1em",
                color: isPending ? "#2563EB" : "#6E6E73",
                opacity: isPending ? 1 : 0.7,
                marginTop: 2,
                display: "inline-block",
              }}
            >
              {count} {isPending ? "Active" : "Completed"} Order
              {count > 1 ? "s" : ""}
            </span>
          </div>
        </div>
        <span
          className="material-symbols-outlined"
          style={{
            color: "#6E6E73",
            fontSize: 22,
            transform: open ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 300ms ease",
          }}
        >
          chevron_right
        </span>
      </button>

      {open && (
        <div style={{ padding: "0 16px 16px 16px" }} className="space-y-3">
          {group.orders.map((o) => (
            <button
              key={o.id}
              onClick={() =>
                isPending ? navigate("/order-status") : undefined
              }
              className="w-full text-left active:scale-[0.99] transition-transform"
              style={{
                background: "rgba(255,255,255,0.85)",
                padding: 18,
                borderRadius: 18,
                border: "1px solid rgba(0,0,0,0.03)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col">
                  {isPending ? (
                    <span
                      className="font-bold inline-block w-fit"
                      style={{
                        background: "#D6E3FF",
                        color: "#1D1D1F",
                        padding: "4px 10px",
                        borderRadius: 9999,
                        fontSize: 11,
                        marginBottom: 8,
                      }}
                    >
                      Order ID: {o.id}
                    </span>
                  ) : (
                    <span
                      className="font-bold"
                      style={{ fontSize: 13, color: "#1D1D1F", marginBottom: 4 }}
                    >
                      Order ID: {o.id}
                    </span>
                  )}
                  <p
                    className="font-medium"
                    style={{
                      fontSize: 14,
                      color: isPending ? "#1D1D1F" : "#6E6E73",
                    }}
                  >
                    {o.itemsCount} item{o.itemsCount > 1 ? "s" : ""} • ₹{o.total}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  {isPending ? (
                    <span
                      className="font-bold uppercase flex items-center gap-1.5"
                      style={{
                        fontSize: 10.5,
                        color: "#2563EB",
                        letterSpacing: "0.12em",
                      }}
                    >
                      <span
                        className="animate-pulse"
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 9999,
                          background: "#2563EB",
                          display: "inline-block",
                        }}
                      />
                      Pending Pickup
                    </span>
                  ) : (
                    <span
                      className="font-bold uppercase flex items-center gap-1"
                      style={{
                        fontSize: 10.5,
                        color: "#15803D",
                        letterSpacing: "0.1em",
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 14 }}
                      >
                        check_circle
                      </span>
                      Completed
                    </span>
                  )}
                </div>
              </div>

              {isPending ? (
                <div className="flex" style={{ marginTop: 4 }}>
                  <div className="flex" style={{ marginLeft: 0 }}>
                    {o.emojis.map((e, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-center"
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 9999,
                          background: "#F5F5F7",
                          border: "2px solid #FFFFFF",
                          fontSize: 14,
                          marginLeft: i === 0 ? 0 : -8,
                          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                        }}
                      >
                        {e}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p style={{ color: "#6E6E73", fontSize: 12.5 }}>
                  You have collected your order
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
