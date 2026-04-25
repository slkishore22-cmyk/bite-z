import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useSellerAuth } from "@/contexts/SellerAuthContext";
import { supabase } from "@/integrations/supabase/client";

const canteenIcons = ["🍽️", "🍛", "🍔", "🍕", "🏪", "🥗", "☕"];
const STORAGE_KEY = "bitez.seller.profile";

type Profile = {
  canteenName: string;
  slogan: string;
  ownerPhone: string;
  icon: string;
  accountNumber: string;
  ifsc: string;
  upiId: string;
};

const emptyProfile: Profile = {
  canteenName: "",
  slogan: "",
  ownerPhone: "",
  icon: canteenIcons[0],
  accountNumber: "",
  ifsc: "",
  upiId: "",
};

const loadProfile = (): Profile => {
  if (typeof window === "undefined") return emptyProfile;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProfile;
    return { ...emptyProfile, ...(JSON.parse(raw) as Partial<Profile>) };
  } catch {
    return emptyProfile;
  }
};

const SellerSettings = () => {
  const { sellerProfile, refreshSellerProfile, signOut } = useSellerAuth();
  const [profile, setProfile] = useState<Profile>(loadProfile);
  const [draft, setDraft] = useState<Profile>(profile);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const isComplete = useMemo(
    () =>
      Boolean(
        profile.canteenName.trim() &&
          profile.slogan.trim() &&
          profile.ownerPhone.trim() &&
          profile.accountNumber.trim() &&
          profile.ifsc.trim() &&
          profile.upiId.trim()
      ),
    [profile]
  );

  const [isEditing, setIsEditing] = useState(!isComplete);

  useEffect(() => {
    if (!isComplete) setIsEditing(true);
  }, [isComplete]);

  const startEdit = () => {
    setDraft(profile);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    if (!isComplete) {
      toast.error("Complete your profile to continue");
      return;
    }
    setDraft(profile);
    setIsEditing(false);
  };

  const saveSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const required: Array<[keyof Profile, string]> = [
      ["canteenName", "Canteen Name"],
      ["slogan", "Slogan"],
      ["ownerPhone", "Owner Phone Number"],
      ["accountNumber", "Account Number"],
      ["ifsc", "IFSC Code"],
      ["upiId", "UPI ID"],
    ];
    for (const [k, label] of required) {
      if (!draft[k].trim()) {
        toast.error(`${label} is required`);
        return;
      }
    }
    setProfile(draft);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      /* ignore */
    }
    // Sync canteen name + slogan to seller_profile so it shows in header
    if (sellerProfile) {
      const { error } = await supabase
        .from("seller_profiles")
        .update({
          business_name: draft.canteenName.trim(),
          description: draft.slogan.trim(),
        })
        .eq("id", sellerProfile.id);
      if (error) {
        toast.error("Failed to sync to backend: " + error.message);
      } else {
        await refreshSellerProfile();
      }
    }
    if (newPassword || currentPassword) {
      setCurrentPassword("");
      setNewPassword("");
      toast.success("Profile & password updated");
    } else {
      toast.success("Profile saved");
    }
    setIsEditing(false);
  };

  const updateDraft = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

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
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-extrabold tracking-tight">Profile</h1>
            <p className="mt-0.5 truncate text-xs font-medium text-muted-foreground">
              {isEditing ? "Manage your canteen profile and payments" : "Your canteen at a glance"}
            </p>
          </div>
          {!isEditing && isComplete && (
            <button
              type="button"
              onClick={startEdit}
              className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3.5 py-2 text-xs font-bold text-foreground transition hover:bg-secondary/80"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                edit
              </span>
              Edit
            </button>
          )}
          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3.5 py-2 text-xs font-bold text-destructive transition hover:bg-destructive/20"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>logout</span>
            Logout
          </button>
        </header>

        {!isEditing && isComplete ? (
          <section className="mt-10 flex flex-col items-center text-center">
            <div className="grid h-32 w-32 place-items-center rounded-full bg-gradient-card text-7xl shadow-glow ring-2 ring-primary/30">
              {profile.icon}
            </div>
            <h2 className="mt-6 text-2xl font-extrabold tracking-tight">{profile.canteenName}</h2>
            <p className="mt-2 max-w-xs text-sm font-medium italic text-muted-foreground">
              "{profile.slogan}"
            </p>
          </section>
        ) : (
          <form onSubmit={saveSettings} className="mt-7 space-y-5">
            <section className="rounded-3xl border border-border bg-gradient-card p-5 shadow-card">
              <SectionTitle icon="storefront" title="Canteen Details" />
              <SettingsInput
                label="Canteen Name"
                placeholder="Enter canteen name"
                value={draft.canteenName}
                onChange={(v) => updateDraft("canteenName", v)}
              />
              <SettingsInput
                label="Slogan"
                placeholder="Enter slogan"
                value={draft.slogan}
                onChange={(v) => updateDraft("slogan", v)}
              />
              <SettingsInput
                label="Owner Phone Number"
                placeholder="Enter phone number"
                inputMode="tel"
                value={draft.ownerPhone}
                onChange={(v) => updateDraft("ownerPhone", v)}
              />

              <div className="mt-5">
                <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground">
                  CANTEEN ICON SELECTION
                </p>
                <div className="mt-3 grid grid-cols-7 gap-2 overflow-x-hidden">
                  {canteenIcons.map((icon) => {
                    const active = icon === draft.icon;
                    return (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => updateDraft("icon", icon)}
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
              <SettingsInput
                label="Account Number"
                placeholder="Enter account number"
                inputMode="numeric"
                value={draft.accountNumber}
                onChange={(v) => updateDraft("accountNumber", v)}
              />
              <SettingsInput
                label="IFSC Code"
                placeholder="Enter IFSC code"
                value={draft.ifsc}
                onChange={(v) => updateDraft("ifsc", v)}
              />
              <SettingsInput
                label="UPI ID"
                placeholder="name@bank"
                value={draft.upiId}
                onChange={(v) => updateDraft("upiId", v)}
              />
            </section>

            <section className="rounded-3xl border border-border bg-gradient-card p-5 shadow-card">
              <SectionTitle icon="lock_reset" title="Change Password" />
              <SettingsInput
                label="Current Password"
                placeholder="Enter current password"
                type="password"
                value={currentPassword}
                onChange={setCurrentPassword}
              />
              <SettingsInput
                label="New Password"
                placeholder="Enter new password"
                type="password"
                value={newPassword}
                onChange={setNewPassword}
              />
            </section>

            <div className="flex gap-3">
              {isComplete && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="flex-1 rounded-full bg-secondary py-3.5 text-base font-extrabold text-foreground transition hover:bg-secondary/80"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="flex flex-1 items-center justify-center gap-3 rounded-full bg-primary py-3.5 text-base font-extrabold text-primary-foreground shadow-glow transition hover:bg-primary/90"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  save
                </span>
                Save Changes
              </button>
            </div>
          </form>
        )}
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
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  value: string;
  onChange: (v: string) => void;
}) => (
  <label className="mt-5 block first:mt-0">
    <span className="text-xs font-semibold tracking-[0.18em] text-muted-foreground">
      {label.toUpperCase()}
    </span>
    <input
      type={type}
      inputMode={inputMode}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-2 w-full rounded-full bg-secondary/70 px-5 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none focus:ring-2 focus:ring-primary/60"
    />
  </label>
);

export default SellerSettings;
