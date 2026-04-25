import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  useCategories,
  useMenuItems,
  useToggleMenuItemAvailable,
  useDeleteMenuItem,
} from "@/hooks/useSellerData";
import { SkeletonRow } from "@/components/seller/SkeletonRow";
import { EmptyState } from "@/components/seller/EmptyState";

const SellerMenu = () => {
  const { data: categories = [] } = useCategories();
  const { data: items = [], isLoading } = useMenuItems();
  const toggle = useToggleMenuItemAvailable();
  const remove = useDeleteMenuItem();

  const [activeCat, setActiveCat] = useState<string | "all">("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      if (activeCat !== "all" && i.category_id !== activeCat) return false;
      if (q && !i.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, activeCat, query]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-md px-5 pb-12 pt-6">
        <header className="flex items-center gap-3">
          <Link
            to="/seller"
            aria-label="Back to dashboard"
            className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-foreground transition-colors hover:bg-secondary/80"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>arrow_back</span>
          </Link>
          <h1 className="text-lg font-extrabold tracking-tight">Menu Manager</h1>
          <Link
            to="/seller/inventory"
            className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-glow"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            Add Item
          </Link>
        </header>

        <div className="relative mt-6">
          <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" style={{ fontSize: 20 }}>
            search
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search menu items..."
            className="w-full rounded-full bg-secondary/70 py-3.5 pl-12 pr-5 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none focus:ring-2 focus:ring-primary/60"
          />
        </div>

        <div className="mt-5 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <CatChip active={activeCat === "all"} onClick={() => setActiveCat("all")}>
            All
          </CatChip>
          {categories.map((c) => (
            <CatChip key={c.id} active={activeCat === c.id} onClick={() => setActiveCat(c.id)}>
              {c.name}
            </CatChip>
          ))}
        </div>

        <section className="mt-6">
          {isLoading ? (
            <SkeletonRow count={4} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon="restaurant_menu"
              title="No menu items"
              description="Start by adding your first dish."
              action={{ label: "Add Item", to: "/seller/inventory" }}
            />
          ) : (
            <div className="space-y-4">
              {filtered.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-border bg-gradient-card p-4 shadow-card"
                >
                  <div className="flex items-start gap-3">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-secondary text-2xl">
                      {item.image_url ? (
                        <img src={item.image_url} alt="" className="h-full w-full rounded-xl object-cover" />
                      ) : (
                        "🍽️"
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-bold leading-tight">{item.name}</p>
                      <p className="mt-1 text-sm font-semibold text-primary">
                        ₹{Number(item.price).toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        if (!confirm(`Delete ${item.name}?`)) return;
                        try {
                          await remove.mutateAsync(item.id);
                          toast.success("Item deleted");
                        } catch (e: any) {
                          toast.error(e.message);
                        }
                      }}
                      className="grid h-9 w-9 place-items-center rounded-full text-destructive hover:bg-destructive/10"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>delete</span>
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-1 rounded-full bg-secondary/60 p-1">
                    <button
                      onClick={() =>
                        toggle.mutate({ id: item.id, is_available: true })
                      }
                      className={`rounded-full py-2 text-xs font-bold uppercase tracking-wider transition ${
                        item.is_available ? "bg-success/20 text-success" : "text-muted-foreground"
                      }`}
                    >
                      Available
                    </button>
                    <button
                      onClick={() =>
                        toggle.mutate({ id: item.id, is_available: false })
                      }
                      className={`rounded-full py-2 text-xs font-bold uppercase tracking-wider transition ${
                        !item.is_available ? "bg-destructive/20 text-destructive" : "text-muted-foreground"
                      }`}
                    >
                      Unavailable
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default SellerMenu;

const CatChip = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
      active
        ? "bg-primary text-primary-foreground shadow-glow"
        : "bg-secondary text-foreground/80 hover:bg-secondary/80"
    }`}
  >
    {children}
  </button>
);