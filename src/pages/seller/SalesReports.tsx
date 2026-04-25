import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useOrders } from "@/hooks/useSellerData";
import { SkeletonRow } from "@/components/seller/SkeletonRow";
import { EmptyState } from "@/components/seller/EmptyState";

const startOfDay = (d: Date) => {
  const x = new Date(d); x.setHours(0,0,0,0); return x;
};
const endOfDay = (d: Date) => {
  const x = new Date(d); x.setHours(23,59,59,999); return x;
};

const SalesReports = () => {
  const [startDate, setStartDate] = useState<Date>(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return startOfDay(d);
  });
  const [endDate, setEndDate] = useState<Date>(() => endOfDay(new Date()));

  const { data: orders = [], isLoading } = useOrders({
    status: ["delivered"],
    from: startOfDay(startDate),
    to: endOfDay(endDate),
  });

  const stats = useMemo(() => {
    const totalSales = orders.reduce((s, o) => s + Number(o.total ?? 0), 0);
    const totalOrders = orders.length;
    const days = Math.max(1, Math.ceil((endOfDay(endDate).getTime() - startOfDay(startDate).getTime()) / 86400000));
    const avgPerDay = totalSales / days;
    const itemMap = new Map<string, { name: string; qty: number; revenue: number }>();
    orders.forEach((o) =>
      (o.order_items ?? []).forEach((it) => {
        const ex = itemMap.get(it.name) ?? { name: it.name, qty: 0, revenue: 0 };
        ex.qty += Number(it.quantity ?? 0);
        ex.revenue += Number(it.line_total ?? 0);
        itemMap.set(it.name, ex);
      })
    );
    const items = Array.from(itemMap.values()).sort((a, b) => b.revenue - a.revenue);
    return { totalSales, totalOrders, avgPerDay, items };
  }, [orders, startDate, endDate]);

  const formatINR = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="mx-auto w-full max-w-md px-5 pb-12 pt-6">
        <header className="flex items-center gap-3">
          <Link
            to="/seller/sales"
            aria-label="Back"
            className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Sales Reports</h1>
            <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              Live Analytics
            </p>
          </div>
        </header>

        <section className="mt-6 grid grid-cols-2 gap-3">
          <DateField label="Start Date" value={startDate} onChange={(d) => setStartDate(startOfDay(d))} />
          <DateField label="End Date" value={endDate} onChange={(d) => setEndDate(endOfDay(d))} />
        </section>

        <section className="mt-6 rounded-3xl border border-border bg-gradient-card p-5 shadow-card">
          <p className="text-xs font-bold tracking-[0.2em] text-muted-foreground">TOTAL SALES</p>
          <p className="mt-2 text-4xl font-extrabold tracking-tight">{formatINR(stats.totalSales)}</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-secondary/50 px-4 py-3">
              <p className="text-lg font-extrabold">{stats.totalOrders.toLocaleString("en-IN")}</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Orders</p>
            </div>
            <div className="rounded-2xl bg-secondary/50 px-4 py-3">
              <p className="text-lg font-extrabold">{formatINR(stats.avgPerDay)}</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Avg / Day</p>
            </div>
          </div>
        </section>

        <section className="mt-7">
          <h2 className="text-lg font-extrabold tracking-tight">Item Breakdown</h2>
          <div className="mt-4">
            {isLoading ? (
              <SkeletonRow count={3} />
            ) : stats.items.length === 0 ? (
              <EmptyState
                icon="bar_chart"
                title="No data in this range"
                description="Pick a different date range or wait for new orders."
              />
            ) : (
              <div className="space-y-3">
                {stats.items.map((it) => (
                  <div
                    key={it.name}
                    className="flex items-center justify-between rounded-2xl border border-border bg-gradient-card px-4 py-3 shadow-card"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-base font-bold">{it.name}</p>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                        {it.qty} sold
                      </p>
                    </div>
                    <p className="text-base font-extrabold text-primary">{formatINR(it.revenue)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default SalesReports;

const DateField = ({
  label, value, onChange,
}: { label: string; value: Date; onChange: (d: Date) => void }) => (
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