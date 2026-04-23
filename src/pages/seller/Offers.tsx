import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

type OfferType = "general" | "inventory";

type InventoryItem = {
  id: string;
  icon: string;
  name: string;
  group: string;
};

const inventoryItems: InventoryItem[] = [
  { id: "burger", icon: "🍔", name: "Signature Cheeseburger", group: "Premium Selection" },
  { id: "fries", icon: "🍟", name: "Truffle Parmesan Fries", group: "Popular Sides" },
  { id: "cola", icon: "🥤", name: "Craft Vanilla Cola", group: "Cold Beverages" },
];

const SellerOffers = () => {
  const [step, setStep] = useState<"select" | "details">("select");
  const [offerType, setOfferType] = useState<OfferType>("general");
  const [selectedItems, setSelectedItems] = useState<string[]>(["burger", "cola"]);
  const [query, setQuery] = useState("");

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return inventoryItems;
    return inventoryItems.filter(
      (item) =>
        item.name.toLowerCase().includes(normalized) ||
        item.group.toLowerCase().includes(normalized)
    );
  }, [query]);

  const createOffer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    toast.success(offerType === "general" ? "General offer created" : "Inventory offer created");
  };

  const goBack = () => {
    if (step === "details") {
      setStep("select");
      return;
    }
  };

  const toggleItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  if (step === "details" && offerType === "general") {
    return <GeneralOfferForm onBack={goBack} onSubmit={createOffer} />;
  }

  if (step === "details" && offerType === "inventory") {
    return (
      <InventoryOfferForm
        onBack={goBack}
        onSubmit={createOffer}
        query={query}
        setQuery={setQuery}
        items={filteredItems}
        selectedItems={selectedItems}
        toggleItem={toggleItem}
      />
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <main className="mx-auto w-full max-w-md px-5 pb-12 pt-6">
        <header className="flex items-center gap-3">
          <Link
            to="/seller"
            aria-label="Back to dashboard"
            className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-foreground transition hover:bg-secondary/80"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
              arrow_back
            </span>
          </Link>
          <h1 className="text-lg font-extrabold tracking-tight">Create Offer</h1>
        </header>

        <div className="mt-7 grid grid-cols-3 gap-3" aria-label="Step progress">
          <span className="h-1.5 rounded-full bg-primary shadow-glow" />
          <span className="h-1.5 rounded-full bg-secondary" />
          <span className="h-1.5 rounded-full bg-secondary" />
        </div>

        <section className="mt-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">Step 1 of 3</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight">Choose offer type</h2>
          <p className="mt-3 text-sm font-medium leading-relaxed text-muted-foreground">
            Define the scope of your discount. General offers target your entire menu, while inventory offers focus on specific culinary categories.
          </p>
        </section>

        <section className="mt-7 space-y-4">
          <OfferTypeCard
            active={offerType === "general"}
            icon="restaurant_menu"
            title="General Offer"
            subtitle="Applies to all items"
            onClick={() => setOfferType("general")}
          />
          <OfferTypeCard
            active={offerType === "inventory"}
            icon="inventory_2"
            title="Inventory Offer"
            subtitle="Applies to specific items"
            onClick={() => setOfferType("inventory")}
          />
        </section>

        <button
          type="button"
          onClick={() => setStep("details")}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-full bg-primary py-3.5 text-base font-extrabold text-primary-foreground shadow-glow transition hover:bg-primary/90"
        >
          Continue to Details
          <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
            arrow_forward
          </span>
        </button>
        <p className="mt-4 text-center text-sm font-medium text-muted-foreground">Step 1 of 3: Selection</p>
      </main>
    </div>
  );
};

const OfferTypeCard = ({
  active,
  icon,
  title,
  subtitle,
  onClick,
}: {
  active: boolean;
  icon: string;
  title: string;
  subtitle: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex w-full items-center gap-4 rounded-2xl border px-4 py-5 text-left transition ${
      active
        ? "border-primary bg-card shadow-glow"
        : "border-transparent bg-card/70 hover:bg-card"
    }`}
  >
    <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-full ${active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
      <span className="material-symbols-outlined" style={{ fontSize: 30 }}>
        {icon}
      </span>
    </span>
    <span className="min-w-0 flex-1">
      <span className="block text-xl font-extrabold tracking-tight">{title}</span>
      <span className="mt-1 block text-sm font-medium text-muted-foreground">{subtitle}</span>
      {active && (
        <span className="mt-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-primary">
          Selected
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            check_circle
          </span>
        </span>
      )}
    </span>
  </button>
);

const PageHeader = ({ title, subtitle, onBack }: { title: string; subtitle?: string; onBack: () => void }) => (
  <header className="flex items-center gap-3 pt-6">
    <button
      type="button"
      onClick={onBack}
      aria-label="Back to offer selection"
      className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-foreground transition hover:bg-secondary/80"
    >
      <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
        arrow_back
      </span>
    </button>
    <div className="min-w-0">
      <h1 className="truncate text-lg font-extrabold tracking-tight">{title}</h1>
      {subtitle && <p className="mt-0.5 text-xs font-extrabold uppercase tracking-[0.14em] text-muted-foreground">{subtitle}</p>}
    </div>
  </header>
);

const GeneralOfferForm = ({ onBack, onSubmit }: { onBack: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) => (
  <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
    <main className="mx-auto w-full max-w-md px-5 pb-12">
      <PageHeader title="General Offer" subtitle="Apply discounts across all items" onBack={onBack} />

      <form onSubmit={onSubmit} className="mt-8 rounded-3xl border border-border bg-gradient-card p-5 shadow-card">
        <FieldLabel>Offer Name</FieldLabel>
        <IconInput placeholder="Fest Offer" icon="label" />

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Start Date</FieldLabel>
            <DateInput />
          </div>
          <div>
            <FieldLabel>End Date</FieldLabel>
            <DateInput />
          </div>
        </div>

        <FieldLabel className="mt-5">Discount Percentage</FieldLabel>
        <IconInput placeholder="Enter discount %" icon="percent" />

        <FieldLabel className="mt-5">Offer Condition (Optional)</FieldLabel>
        <textarea
          placeholder="Enter condition (e.g. Buy above ₹200)"
          className="mt-2 min-h-24 w-full resize-none rounded-2xl border border-border bg-secondary/70 px-5 py-4 text-sm font-medium text-foreground placeholder:text-muted-foreground/70 outline-none focus:ring-2 focus:ring-primary/60"
        />

        <button type="submit" className="mt-7 flex w-full items-center justify-center gap-3 rounded-full bg-primary py-3.5 text-base font-extrabold text-primary-foreground shadow-glow transition hover:bg-primary/90">
          Create Offer
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
            bolt
          </span>
        </button>
      </form>

      <aside className="mt-6 flex items-start gap-4 rounded-3xl bg-card/55 px-5 py-5 text-muted-foreground">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-extrabold text-primary-foreground">i</span>
        <p className="text-sm font-medium leading-relaxed">General offers are applied globally to all active menu items. This action will override any conflicting individual dish discounts.</p>
      </aside>
    </main>
  </div>
);

const InventoryOfferForm = ({
  onBack,
  onSubmit,
  query,
  setQuery,
  items,
  selectedItems,
  toggleItem,
}: {
  onBack: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  query: string;
  setQuery: (value: string) => void;
  items: InventoryItem[];
  selectedItems: string[];
  toggleItem: (id: string) => void;
}) => (
  <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
    <main className="mx-auto w-full max-w-md px-5 pb-12">
      <PageHeader title="Create Offer" subtitle="Fill in the details" onBack={onBack} />

      <form onSubmit={onSubmit} className="mt-8">
        <FieldLabel>Offer Name</FieldLabel>
        <PlainInput placeholder="e.g. Midnight Feast" />

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Start Date</FieldLabel>
            <CompactDateInput />
          </div>
          <div>
            <FieldLabel>End Date</FieldLabel>
            <CompactDateInput />
          </div>
        </div>

        <FieldLabel className="mt-5">Discount Percentage</FieldLabel>
        <IconInput placeholder="20" icon="percent" compact />

        <FieldLabel className="mt-5">Condition</FieldLabel>
        <PlainInput placeholder="Buy more than ₹200 and get 20% off" />

        <div className="mt-6 flex items-center justify-between gap-4">
          <FieldLabel>Inventory Selection</FieldLabel>
          <span className="rounded-full bg-accent px-3 py-1 text-xs font-extrabold uppercase text-accent-foreground">Multi-select</span>
        </div>

        <div className="relative mt-3">
          <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" style={{ fontSize: 20 }}>
            search
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search menu items..."
            className="w-full rounded-full border-0 bg-secondary/70 py-3.5 pl-12 pr-5 text-sm font-medium text-foreground placeholder:text-muted-foreground/70 outline-none focus:ring-2 focus:ring-primary/60"
          />
        </div>

        <div className="mt-4 space-y-3">
          {items.map((item) => {
            const selected = selectedItems.includes(item.id);
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className="flex min-h-20 w-full items-center gap-4 rounded-2xl border border-border bg-gradient-card px-4 py-4 text-left shadow-card transition hover:bg-card/80"
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-secondary text-2xl">{item.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-extrabold">{item.name}</span>
                  <span className="mt-1 block truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">{item.group}</span>
                </span>
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border ${selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40 text-transparent"}`}>
                  <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
                    check
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <button type="submit" className="mt-7 flex w-full items-center justify-center gap-3 rounded-full bg-primary py-3.5 text-base font-extrabold text-primary-foreground shadow-glow transition hover:bg-primary/90">
          Create Offer
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
            arrow_forward
          </span>
        </button>
      </form>
    </main>
  </div>
);

const FieldLabel = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <label className={`block text-xs font-extrabold uppercase tracking-[0.16em] text-muted-foreground ${className}`}>{children}</label>
);

const PlainInput = ({ placeholder }: { placeholder: string }) => (
  <input
    placeholder={placeholder}
    className="mt-2 w-full rounded-full border-0 bg-secondary/70 px-5 py-3.5 text-sm font-medium text-foreground placeholder:text-muted-foreground/70 outline-none focus:ring-2 focus:ring-primary/60"
  />
);

const IconInput = ({ placeholder, icon, compact = false }: { placeholder: string; icon: string; compact?: boolean }) => (
  <div className={`mt-2 flex items-center border border-border bg-secondary/70 px-5 focus-within:ring-2 focus-within:ring-primary/60 ${compact ? "rounded-full py-3.5" : "rounded-full py-3.5"}`}>
    <input
      placeholder={placeholder}
      className="min-w-0 flex-1 border-0 bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground/70 outline-none"
    />
    <span className="material-symbols-outlined shrink-0 text-primary" style={{ fontSize: 20 }}>
      {icon}
    </span>
  </div>
);

const DateInput = () => (
  <div className="mt-2 flex rounded-full border border-border bg-secondary/70 px-4 py-3.5 focus-within:ring-2 focus-within:ring-primary/60">
    <input type="date" className="min-w-0 flex-1 border-0 bg-transparent text-xs font-medium text-foreground outline-none [color-scheme:dark]" />
  </div>
);

const CompactDateInput = () => (
  <div className="mt-2 flex items-center rounded-full bg-secondary/70 px-4 py-3.5 focus-within:ring-2 focus-within:ring-primary/60">
    <span className="material-symbols-outlined mr-3 shrink-0 text-primary" style={{ fontSize: 20 }}>
      calendar_today
    </span>
    <input type="date" className="min-w-0 flex-1 border-0 bg-transparent text-xs font-medium text-foreground outline-none [color-scheme:dark]" />
  </div>
);

export default SellerOffers;