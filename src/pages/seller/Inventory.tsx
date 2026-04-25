import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCategories, useUpsertMenuItem } from "@/hooks/useSellerData";

const SellerInventory = () => {
  const navigate = useNavigate();
  const { data: categories = [] } = useCategories();
  const upsert = useUpsertMenuItem();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [isVeg, setIsVeg] = useState(true);
  const [prepMinutes, setPrepMinutes] = useState("20");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    const priceNum = Number(price);
    if (!trimmed) return toast.error("Please enter a food name");
    if (!priceNum || priceNum <= 0) return toast.error("Please enter a valid price");

    try {
      await upsert.mutateAsync({
        name: trimmed,
        price: priceNum,
        description: description.trim() || null,
        category_id: categoryId || null,
        is_veg: isVeg,
        is_available: true,
        prep_minutes: Number(prepMinutes) || 20,
      });
      toast.success(`${trimmed} added`);
      navigate("/seller/menu");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to add item");
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="mx-auto w-full max-w-md px-5 pb-12 pt-6">
        <header className="flex items-center gap-3">
          <Link
            to="/seller/menu"
            className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-foreground transition-colors hover:bg-secondary/80"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>arrow_back</span>
          </Link>
          <h1 className="text-lg font-extrabold tracking-tight">Add Inventory</h1>
        </header>

        <section className="mt-7 border-b border-border pb-5">
          <h2 className="text-2xl font-extrabold tracking-[0.08em] text-primary">ADD INVENTORY</h2>
          <p className="mt-1 text-sm text-muted-foreground">Add new food items to your menu</p>
        </section>

        <form onSubmit={handleSubmit} className="mt-6 rounded-3xl border border-border bg-gradient-card p-5 shadow-card space-y-5">
          <Field label="Food Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              placeholder="Enter food name"
              className="w-full rounded-full bg-secondary/70 px-5 py-3.5 text-sm outline-none focus:ring-2 focus:ring-primary/60"
            />
          </Field>
          <Field label="Price (₹)">
            <input
              type="number"
              inputMode="decimal"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Enter price"
              className="w-full rounded-full bg-secondary/70 px-5 py-3.5 text-sm outline-none focus:ring-2 focus:ring-primary/60"
            />
          </Field>
          <Field label="Description (optional)">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Short description"
              className="w-full resize-none rounded-2xl bg-secondary/70 px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/60"
            />
          </Field>
          <Field label="Category">
            {categories.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-secondary/40 px-4 py-3 text-xs text-muted-foreground">
                No categories yet. Item will be uncategorised.
              </div>
            ) : (
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-full bg-secondary/70 px-5 py-3.5 text-sm outline-none focus:ring-2 focus:ring-primary/60"
              >
                <option value="">— No category —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Prep Time (minutes)">
            <input
              type="number"
              min={1}
              value={prepMinutes}
              onChange={(e) => setPrepMinutes(e.target.value)}
              className="w-full rounded-full bg-secondary/70 px-5 py-3.5 text-sm outline-none focus:ring-2 focus:ring-primary/60"
            />
          </Field>
          <div className="grid grid-cols-2 gap-1 rounded-full bg-secondary/60 p-1">
            <button
              type="button"
              onClick={() => setIsVeg(true)}
              className={`rounded-full py-2 text-xs font-bold uppercase tracking-wider ${
                isVeg ? "bg-success/20 text-success" : "text-muted-foreground"
              }`}
            >
              Veg
            </button>
            <button
              type="button"
              onClick={() => setIsVeg(false)}
              className={`rounded-full py-2 text-xs font-bold uppercase tracking-wider ${
                !isVeg ? "bg-destructive/20 text-destructive" : "text-muted-foreground"
              }`}
            >
              Non-Veg
            </button>
          </div>

          <button
            type="submit"
            disabled={upsert.isPending}
            className="w-full rounded-full bg-primary py-3.5 text-base font-extrabold text-primary-foreground shadow-glow disabled:opacity-60"
          >
            {upsert.isPending ? "Adding…" : "Add Item"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SellerInventory;

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="text-xs font-semibold tracking-[0.18em] text-muted-foreground">
      {label.toUpperCase()}
    </span>
    <div className="mt-2">{children}</div>
  </label>
);