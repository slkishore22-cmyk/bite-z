import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import SellerHeader from "@/components/seller/SellerHeader";

type Category = "Food" | "Snacks" | "Drinks";
type InvType = "Active" | "Inactive" | "Quantity Based";

type Item = {
  id: string;
  name: string;
  price: number;
  category: string;
  subcategory: string;
  icon: string;
  status: InvType;
};

const ICONS = ["🍔", "🍕", "🍛", "🍜", "🍗"];

const initialItems: Item[] = [
  { id: "1", name: "Burger", price: 120, category: "Fast Food", subcategory: "Main", icon: "🍔", status: "Active" },
  { id: "2", name: "French Fries", price: 80, category: "Snacks", subcategory: "Side", icon: "🍟", status: "Active" },
  { id: "3", name: "Cold Coffee", price: 60, category: "Beverages", subcategory: "Drinks", icon: "🥤", status: "Active" },
];

const Chip = ({
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
    className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
      active
        ? "bg-primary text-primary-foreground shadow-glow"
        : "bg-secondary text-foreground/80 hover:bg-secondary/80"
    }`}
  >
    {children}
  </button>
);

const SellerInventory = () => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<Category>("Food");
  const [invType, setInvType] = useState<InvType>("Active");
  const [icon, setIcon] = useState<string>(ICONS[0]);
  const [items, setItems] = useState<Item[]>(initialItems);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    const priceNum = Number(price);
    if (!trimmed) {
      toast.error("Please enter a food name");
      return;
    }
    if (!priceNum || priceNum <= 0) {
      toast.error("Please enter a valid price");
      return;
    }
    const newItem: Item = {
      id: crypto.randomUUID(),
      name: trimmed,
      price: priceNum,
      category,
      subcategory: invType,
      icon,
      status: invType,
    };
    setItems((prev) => [newItem, ...prev]);
    toast.success(`${trimmed} added to inventory`);
    setName("");
    setPrice("");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-md px-5 pb-12 pt-6">
        <SellerHeader />

        {/* Heading */}
        <section className="mt-7 border-b border-border pb-5">
          <h2 className="text-2xl font-extrabold tracking-[0.08em] text-primary">
            ADD INVENTORY
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Add new food items to your menu
          </p>
        </section>

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-3xl border border-border bg-gradient-card p-5 shadow-card"
        >
          {/* Food name */}
          <label className="block">
            <span className="text-xs font-semibold tracking-[0.18em] text-muted-foreground">
              FOOD NAME
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              placeholder="Enter food name"
              className="mt-2 w-full rounded-full bg-secondary/70 px-5 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none focus:ring-2 focus:ring-primary/60"
            />
          </label>

          {/* Price */}
          <label className="mt-5 block">
            <span className="text-xs font-semibold tracking-[0.18em] text-muted-foreground">
              PRICE (₹)
            </span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Enter price (₹)"
              className="mt-2 w-full rounded-full bg-secondary/70 px-5 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none focus:ring-2 focus:ring-primary/60"
            />
          </label>

          {/* Category */}
          <div className="mt-6">
            <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground">
              SELECT CATEGORY
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              {(["Food", "Snacks", "Drinks"] as Category[]).map((c) => (
                <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
                  {c}
                </Chip>
              ))}
            </div>
          </div>

          {/* Inventory type */}
          <div className="mt-6">
            <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground">
              INVENTORY TYPE
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              {(["Active", "Inactive", "Quantity Based"] as InvType[]).map((t) => (
                <Chip key={t} active={invType === t} onClick={() => setInvType(t)}>
                  {t}
                </Chip>
              ))}
            </div>
          </div>

          {/* Icon */}
          <div className="mt-6">
            <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground">
              CHOOSE ICON
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              {ICONS.map((emoji) => {
                const active = icon === emoji;
                return (
                  <button
                    type="button"
                    key={emoji}
                    onClick={() => setIcon(emoji)}
                    aria-label={`Select icon ${emoji}`}
                    className={`grid h-12 w-12 place-items-center rounded-2xl bg-secondary/70 text-2xl transition ${
                      active
                        ? "ring-2 ring-primary shadow-glow"
                        : "hover:bg-secondary"
                    }`}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="mt-7 w-full rounded-full bg-gradient-primary py-3.5 text-base font-semibold text-primary-foreground shadow-glow transition hover:opacity-95 active:scale-[0.99]"
          >
            Save Item
          </button>
        </form>

        {/* Recently added */}
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold tracking-[0.22em] text-muted-foreground">
              RECENTLY ADDED
            </h3>
            <span className="h-[2px] w-10 rounded-full bg-muted" />
          </div>

          <ul className="mt-4 space-y-3">
            {items.map((it) => (
              <li
                key={it.id}
                className="flex items-center gap-4 rounded-2xl border border-border bg-gradient-card p-4 shadow-card"
              >
                <div className="grid h-12 w-12 place-items-center rounded-full bg-secondary text-2xl">
                  {it.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-bold">{it.name}</p>
                  <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {it.category} • {it.subcategory}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-base font-extrabold text-primary">
                    ₹{it.price}
                  </p>
                  <p
                    className={`mt-0.5 text-xs font-semibold ${
                      it.status === "Active"
                        ? "text-success"
                        : it.status === "Inactive"
                        ? "text-destructive"
                        : "text-muted-foreground"
                    }`}
                  >
                    {it.status}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default SellerInventory;