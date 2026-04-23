import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const canteenIcons = ["🍽️", "🍛", "🍔", "🍕", "🏪", "🥗", "☕"];

const SellerSettings = () => {
  const [selectedIcon, setSelectedIcon] = useState(canteenIcons[0]);

  const saveSettings = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    toast.success("Settings saved");
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <main className="mx-auto w-full max-w-md px-5 pb-12 pt-6">
        <header className="flex items-center gap-3">
          <Link
            to="/seller"
            aria-label="Back to dashboard"
            className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-foreground transition-colors hover:bg-secondary/80"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
              arrow_back
            </span>
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg font-extrabold tracking-tight">Settings</h1>
            <p className="mt-0.5 truncate text-xs font-medium text-muted-foreground">
              Manage your canteen profile and payments
            </p>
          </div>
        </header>

        <form onSubmit={saveSettings} className="mt-7 space-y-5">
          <section className="rounded-3xl border border-border bg-gradient-card p-5 shadow-card">
            <SectionTitle icon="storefront" title="Canteen Details" />
            <SettingsInput label="Canteen Name" placeholder="Enter canteen name" />
            <SettingsInput label="Slogan" placeholder="Enter slogan" />
            <SettingsInput label="Owner Phone Number" placeholder="Enter phone number" inputMode="tel" />

            <div className="mt-5">
              <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground">
                CANTEEN ICON SELECTION
              </p>
              <div className="mt-3 grid grid-cols-7 gap-2 overflow-x-hidden">
                {canteenIcons.map((icon) => {
                  const active = icon === selectedIcon;
                  return (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setSelectedIcon(icon)}
                      aria-label={`Select canteen icon ${icon}`}
                      className={`grid aspect-square w-full place-items-center rounded-2xl bg-secondary/70 text-xl transition ${
                        active ? "ring-2 ring-primary shadow-glow" : "hover:bg-secondary"
                      }`}
                    >
                      {icon}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-gradient-card p-5 shadow-card">
            <SectionTitle icon="payments" title="Payment Details" />
            <SettingsInput label="Account Number" placeholder="Enter account number" inputMode="numeric" />
            <SettingsInput label="IFSC Code" placeholder="Enter IFSC code" />
            <SettingsInput label="UPI ID" placeholder="name@bank" />
          </section>

          <section className="rounded-3xl border border-border bg-gradient-card p-5 shadow-card">
            <SectionTitle icon="lock_reset" title="Change Password" />
            <SettingsInput label="Current Password" placeholder="Enter current password" type="password" />
            <SettingsInput label="New Password" placeholder="Enter new password" type="password" />
          </section>

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-3 rounded-full bg-primary py-3.5 text-base font-extrabold text-primary-foreground shadow-glow transition hover:bg-primary/90"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              save
            </span>
            Save Changes
          </button>
        </form>
      </main>
    </div>
  );
};

const SectionTitle = ({ icon, title }: { icon: string; title: string }) => (
  <div className="mb-5 flex items-center gap-3">
    <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/15 text-primary">
      <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
        {icon}
      </span>
    </span>
    <h2 className="text-base font-extrabold tracking-tight">{title}</h2>
  </div>
);

const SettingsInput = ({
  label,
  placeholder,
  type = "text",
  inputMode,
}: {
  label: string;
  placeholder: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) => (
  <label className="mt-5 block first:mt-0">
    <span className="text-xs font-semibold tracking-[0.18em] text-muted-foreground">
      {label.toUpperCase()}
    </span>
    <input
      type={type}
      inputMode={inputMode}
      placeholder={placeholder}
      className="mt-2 w-full rounded-full bg-secondary/70 px-5 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none focus:ring-2 focus:ring-primary/60"
    />
  </label>
);

export default SellerSettings;