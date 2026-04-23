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
  <header className="-mx-6 flex items-center gap-6 bg-card/30 px-6 pb-6 pt-7">
    <button
      type="button"
      onClick={onBack}
      aria-label="Back to offer selection"
      className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
    >
      <span className="material-symbols-outlined" style={{ fontSize: 34 }}>
        arrow_back
      </span>
    </button>
    <div className="min-w-0">
      <h1 className="truncate text-2xl font-extrabold tracking-tight">{title}</h1>
      {subtitle && <p className="mt-1 text-sm font-extrabold uppercase tracking-[0.16em] text-muted-foreground">{subtitle}</p>}
    </div>
  </header>
);

const GeneralOfferForm = ({ onBack, onSubmit }: { onBack: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) => (
  <div className="min-h-screen bg-background text-foreground">
    <main className="mx-auto w-full max-w-md px-6 pb-14">
      <PageHeader title="General Offer" subtitle="Apply discounts across all items" onBack={onBack} />

      <form onSubmit={onSubmit} className="mt-16 rounded-[1.7rem] border border-border bg-card/80 p-7 shadow-card">
        <FieldLabel>Offer Name</FieldLabel>
        <IconInput placeholder="Fest Offer" icon="label" />

        <div className="mt-9 grid grid-cols-2 gap-6">
          <div>
            <FieldLabel>Start Date</FieldLabel>
            <DateInput />
          </div>
          <div>
            <FieldLabel>End Date</FieldLabel>
            <DateInput />
          </div>
        </div>

        <FieldLabel className="mt-9">Discount Percentage</FieldLabel>
        <IconInput placeholder="Enter discount %" icon="percent" />

        <FieldLabel className="mt-9">Offer Condition (Optional)</FieldLabel>
        <textarea
          placeholder="Enter condition (e.g. Buy above ₹200)"
          className="mt-4 min-h-32 w-full resize-none rounded-2xl border border-border bg-secondary/45 px-5 py-6 text-xl font-medium text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-primary/60"
        />

        <button type="submit" className="mt-10 flex h-20 w-full items-center justify-center gap-4 rounded-full bg-primary text-xl font-extrabold text-primary-foreground shadow-glow transition hover:bg-primary/90">
          Create Offer
          <span className="material-symbols-outlined" style={{ fontSize: 30 }}>
            bolt
          </span>
        </button>
      </form>

      <aside className="mt-10 flex items-start gap-5 rounded-[2rem] bg-card/55 px-8 py-7 text-muted-foreground">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground font-extrabold">i</span>
        <p className="text-lg font-medium leading-relaxed">General offers are applied globally to all active menu items. This action will override any conflicting individual dish discounts.</p>
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
  <div className="min-h-screen bg-background text-foreground">
    <main className="mx-auto w-full max-w-md px-6 pb-14">
      <PageHeader title="Create Offer" subtitle="Fill in the details" onBack={onBack} />

      <form onSubmit={onSubmit} className="mt-11">
        <FieldLabel>Offer Name</FieldLabel>
        <PlainInput placeholder="e.g. Midnight Feast" />

        <div className="mt-10 grid grid-cols-2 gap-6">
          <div>
            <FieldLabel>Start Date</FieldLabel>
            <CompactDateInput />
          </div>
          <div>
            <FieldLabel>End Date</FieldLabel>
            <CompactDateInput />
          </div>
        </div>

        <FieldLabel className="mt-10">Discount Percentage</FieldLabel>
        <IconInput placeholder="20" icon="percent" compact />

        <FieldLabel className="mt-10">Condition</FieldLabel>
        <PlainInput placeholder="Buy more than ₹200 and get 20% off" />

        <div className="mt-10 flex items-center justify-between gap-4">
          <FieldLabel>Inventory Selection</FieldLabel>
          <span className="rounded-full bg-accent px-3 py-1 text-xs font-extrabold uppercase text-accent-foreground">Multi-select</span>
        </div>

        <div className="relative mt-5">
          <span className="material-symbols-outlined pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" style={{ fontSize: 22 }}>
            search
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search menu items..."
            className="h-16 w-full rounded-full border-0 bg-secondary/60 pl-16 pr-5 text-lg font-medium text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/60"
          />
        </div>

        <div className="mt-7 space-y-4">
          {items.map((item) => {
            const selected = selectedItems.includes(item.id);
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className="flex min-h-28 w-full items-center gap-5 rounded-[2rem] bg-card px-6 py-5 text-left transition hover:bg-card/80"
              >
                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-background text-3xl">{item.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xl font-extrabold">{item.name}</span>
                  <span className="mt-1 block truncate text-sm font-semibold uppercase tracking-wide text-muted-foreground">{item.group}</span>
                </span>
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg border ${selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40 text-transparent"}`}>
                  <span className="material-symbols-outlined" style={{ fontSize: 28 }}>
                    check
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <button type="submit" className="mt-14 flex h-20 w-full items-center justify-center gap-4 rounded-full bg-primary text-xl font-extrabold text-primary-foreground shadow-glow transition hover:bg-primary/90">
          Create Offer
          <span className="material-symbols-outlined" style={{ fontSize: 30 }}>
            arrow_forward
          </span>
        </button>
      </form>
    </main>
  </div>
);

const FieldLabel = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <label className={`block text-sm font-extrabold uppercase tracking-wide text-muted-foreground ${className}`}>{children}</label>
);

const PlainInput = ({ placeholder }: { placeholder: string }) => (
  <input
    placeholder={placeholder}
    className="mt-5 h-16 w-full rounded-full border-0 bg-secondary/60 px-6 text-lg font-medium text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/60"
  />
);

const IconInput = ({ placeholder, icon, compact = false }: { placeholder: string; icon: string; compact?: boolean }) => (
  <div className={`mt-4 flex items-center rounded-2xl border border-border bg-secondary/45 px-5 focus-within:ring-2 focus-within:ring-primary/60 ${compact ? "h-16 rounded-full" : "h-20"}`}>
    <input
      placeholder={placeholder}
      className="min-w-0 flex-1 border-0 bg-transparent text-xl font-medium text-foreground placeholder:text-muted-foreground/50 outline-none"
    />
    <span className="material-symbols-outlined shrink-0 text-primary" style={{ fontSize: 28 }}>
      {icon}
    </span>
  </div>
);

const DateInput = () => (
  <div className="mt-4 flex h-20 items-center rounded-2xl border border-border bg-secondary/45 px-4 focus-within:ring-2 focus-within:ring-primary/60">
    <input type="date" className="min-w-0 flex-1 border-0 bg-transparent text-lg font-medium text-foreground outline-none [color-scheme:dark]" />
  </div>
);

const CompactDateInput = () => (
  <div className="mt-5 flex h-16 items-center rounded-full bg-secondary/60 px-4 focus-within:ring-2 focus-within:ring-primary/60">
    <span className="material-symbols-outlined mr-3 shrink-0 text-primary" style={{ fontSize: 20 }}>
      calendar_today
    </span>
    <input type="date" className="min-w-0 flex-1 border-0 bg-transparent text-base font-medium text-foreground outline-none [color-scheme:dark]" />
  </div>
);

export default SellerOffers;