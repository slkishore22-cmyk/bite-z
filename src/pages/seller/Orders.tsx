import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useOrders, useUpdateOrderStatus } from "@/hooks/useSellerData";
import { SkeletonRow } from "@/components/seller/SkeletonRow";
import { EmptyState } from "@/components/seller/EmptyState";
import { toast } from "sonner";

type TabKey = "live" | "history";

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const endOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

const formatAgo = (iso: string) => {
  const m = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  return `${d} d ago`;
};

const STATUS_FLOW: Record<string, string | null> = {
  pending: "confirmed",
  confirmed: "preparing",
  preparing: "out_for_delivery",
  out_for_delivery: "delivered",
  delivered: null,
  cancelled: null,
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Accept",
  confirmed: "Mark Preparing",
  preparing: "Mark Ready",
  out_for_delivery: "Mark Delivered",
};

const SellerOrders = () => {
  const [tab, setTab] = useState<TabKey>("live");
  const [query, setQuery] = useState("");
  const [startDate, setStartDate] = useState<Date>(() => startOfDay(new Date()));
  const [endDate, setEndDate] = useState<Date>(() => endOfDay(new Date()));

  const liveQuery = useOrders({ liveOnly: true });
  const historyQuery = useOrders({
    status: ["delivered"],
    from: startOfDay(startDate),
    to: endOfDay(endDate),
  });
  const update = useUpdateOrderStatus();

  const orders = tab === "live" ? liveQuery.data ?? [] : historyQuery.data ?? [];
  const loading = tab === "live" ? liveQuery.isLoading : historyQuery.isLoading;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        o.order_number.toLowerCase().includes(q) ||
        (o.order_items ?? []).some((i) => i.name.toLowerCase().includes(q))
    );
  }, [orders, query]);

  const advance = async (id: string, current: string) => {
    const next = STATUS_FLOW[current];
    if (!next) return;
    try {
      await update.mutateAsync({ id, status: next });
      toast.success(`Order moved to ${next.replace(/_/g, " ")}`);
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    }
  };

  const cancel = async (id: string) => {
    try {
      await update.mutateAsync({ id, status: "cancelled" });
      toast.success("Order cancelled");
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="mx-auto w-full max-w-md px-5 pb-24 pt-6">
        <header className="flex items-center gap-3">
          <Link
            to="/seller"
            aria-label="Back"
            className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight text-primary">Orders</h1>
        </header>

        <div className="mt-6 flex items-center gap-6 border-b border-border">
          {(["live", "history"] as TabKey[]).map((k) => {
            const active = tab === k;
            return (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`relative pb-3 text-sm font-bold tracking-wide transition ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {k === "live" ? "Live Orders" : "History"}
                {active && <span className="absolute -bottom-px left-0 h-0.5 w-8 rounded-full bg-primary" />}
              </button>
            );
          })}
        </div>

        {tab === "history" && (
          <div className="mt-5 grid grid-cols-2 gap-3">
            <DateField label="Start date" value={startDate} onChange={(d) => setStartDate(startOfDay(d))} />
            <DateField label="End date" value={endDate} onChange={(d) => setEndDate(endOfDay(d))} />
          </div>
        )}

        <section className="mt-6">
          <div className="relative">
            <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" style={{ fontSize: 20 }}>
              search
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by order # or item"
              className="w-full rounded-full border border-border bg-secondary/60 py-3 pl-11 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="mt-4">
            {loading ? (
              <SkeletonRow count={3} />
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={tab === "live" ? "receipt_long" : "history"}
                title={tab === "live" ? "No live orders" : "No completed orders"}
                description={
                  tab === "live"
                    ? "When customers place orders, they'll appear here."
                    : "Try a wider date range."
                }
              />
            ) : (
              <div className="space-y-4">
                {filtered.map((o) => {
                  const next = STATUS_FLOW[o.status];
                  return (
                    <article key={o.id} className="rounded-2xl border border-border bg-gradient-card p-4 shadow-card">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground">ORDER</p>
                          <p className="mt-1 text-xl font-extrabold tracking-tight">{o.order_number}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground">STATUS</p>
                          <p className="mt-1 text-sm font-semibold capitalize text-primary">
                            {o.status.replace(/_/g, " ")}
                          </p>
                          <p className="text-[11px] text-muted-foreground">{formatAgo(o.placed_at)}</p>
                        </div>
                      </div>

                      <div className="mt-3 rounded-xl bg-secondary/50 p-3">
                        {(o.order_items ?? []).map((it) => (
                          <div key={it.id} className="flex items-center justify-between py-1.5 text-sm">
                            <span className="truncate font-semibold">{it.name}</span>
                            <span className="font-bold text-muted-foreground">x{it.quantity}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 flex items-end justify-between">
                        <div>
                          <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground">TOTAL</p>
                          <p className="mt-0.5 text-xl font-extrabold">₹{Number(o.total).toLocaleString("en-IN")}</p>
                        </div>
                        {tab === "live" && next && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => cancel(o.id)}
                              className="rounded-full border border-destructive/40 px-3 py-2 text-xs font-bold text-destructive transition hover:bg-destructive/10"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => advance(o.id, o.status)}
                              className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-glow"
                            >
                              {STATUS_LABEL[o.status] ?? "Next"}
                            </button>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default SellerOrders;

const DateField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Date;
  onChange: (d: Date) => void;
}) => (
  <div>
    <p className="mb-1.5 text-[10px] font-bold tracking-[0.2em] text-muted-foreground">{label.toUpperCase()}</p>
    <Popover>
      <PopoverTrigger asChild>
        <button className={cn("flex w-full items-center justify-between rounded-full border border-border bg-secondary/60 px-4 py-2.5 text-sm font-semibold transition hover:border-primary/40")}>
          <span>{format(value, "dd MMM yyyy")}</span>
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={value} onSelect={(d) => d && onChange(d)} initialFocus className={cn("p-3 pointer-events-auto")} />
      </PopoverContent>
    </Popover>
  </div>
);