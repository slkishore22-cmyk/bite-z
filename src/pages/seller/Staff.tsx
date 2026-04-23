import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

type StaffMember = {
  id: string;
  name: string;
  staffId: string;
};

const initialStaff: StaffMember[] = [
  { id: "1", name: "Alex Johnson", staffId: "token_01" },
  { id: "2", name: "Sarah Miller", staffId: "token_02" },
  { id: "3", name: "Marcus Chen", staffId: "token_03" },
  { id: "4", name: "Priya Nair", staffId: "token_04" },
];

const SellerStaff = () => {
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff);
  const [name, setName] = useState("");
  const [staffId, setStaffId] = useState("token_01");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const activeCount = useMemo(() => staff.length, [staff.length]);

  const createStaff = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedStaffId = staffId.trim();

    if (!trimmedName || !trimmedStaffId || password.length < 4) {
      toast.error("Add name, staff ID and password");
      return;
    }

    if (staff.some((member) => member.staffId.toLowerCase() === trimmedStaffId.toLowerCase())) {
      toast.error("Staff ID already exists");
      return;
    }

    setStaff((prev) => [
      { id: crypto.randomUUID(), name: trimmedName, staffId: trimmedStaffId },
      ...prev,
    ]);
    setName("");
    setPassword("");
    setStaffId(`token_${String(staff.length + 2).padStart(2, "0")}`);
    toast.success("Staff created");
  };

  const removeStaff = (id: string) => {
    setStaff((prev) => prev.filter((member) => member.id !== id));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto w-full max-w-md px-6 pb-12 pt-9">
        <header>
          <p className="text-2xl font-extrabold tracking-tight">Staff Management</p>
        </header>

        <section className="mt-20">
          <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-5 py-3 text-xs font-extrabold uppercase tracking-[0.16em] text-primary">
            Administration
          </span>
          <h1 className="mt-7 text-5xl font-extrabold tracking-tight">Create Staff</h1>
          <p className="mt-4 text-xl font-semibold leading-relaxed text-muted-foreground">
            Add staff for billing and token management
          </p>
        </section>

        <form onSubmit={createStaff} className="mt-14 rounded-[2rem] bg-card/80 p-7 shadow-card">
          <label className="block text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
            Staff Name
          </label>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Enter staff name"
            className="mt-4 h-20 w-full rounded-2xl border-0 bg-secondary/40 px-5 text-xl font-medium text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-primary/60"
          />

          <label className="mt-8 block text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
            Staff ID
          </label>
          <div className="mt-4 flex h-20 items-center rounded-2xl bg-secondary/40 px-5 focus-within:ring-2 focus-within:ring-primary/60">
            <input
              value={staffId}
              onChange={(event) => setStaffId(event.target.value)}
              placeholder="Create staff ID"
              className="min-w-0 flex-1 border-0 bg-transparent text-xl font-medium text-foreground placeholder:text-muted-foreground/50 outline-none"
            />
            <span className="ml-3 shrink-0 text-sm font-extrabold text-muted-foreground">token_01</span>
          </div>

          <label className="mt-8 block text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
            Password
          </label>
          <div className="mt-4 flex h-20 items-center rounded-2xl bg-secondary/40 px-5 focus-within:ring-2 focus-within:ring-primary/60">
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type={showPassword ? "text" : "password"}
              placeholder="Create password"
              className="min-w-0 flex-1 border-0 bg-transparent text-xl font-medium text-foreground placeholder:text-muted-foreground/50 outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
                {showPassword ? "visibility_off" : "visibility"}
              </span>
            </button>
          </div>

          <div className="mt-9 flex h-20 items-center justify-between rounded-2xl bg-secondary/45 px-5">
            <div className="flex min-w-0 items-center gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-accent/20 text-accent">
                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                  verified_user
                </span>
              </span>
              <p className="truncate text-lg font-extrabold">Billing Staff</p>
            </div>
            <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-muted-foreground">
              Default
            </span>
          </div>

          <button
            type="submit"
            className="mt-9 h-20 w-full rounded-full bg-primary text-lg font-extrabold text-primary-foreground shadow-glow transition hover:bg-primary/90"
          >
            Create Staff
          </button>
        </form>

        <section className="mt-16">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-3xl font-extrabold tracking-tight">Staff Members</h2>
            <span className="rounded-full bg-muted px-5 py-2 text-sm font-extrabold text-muted-foreground">
              {activeCount} Active
            </span>
          </div>

          <div className="mt-9 space-y-5">
            {staff.map((member) => (
              <article
                key={member.id}
                className="flex min-h-24 items-center justify-between gap-4 rounded-[2rem] bg-card/70 px-6 py-5"
              >
                <div className="min-w-0">
                  <p className="truncate text-xl font-extrabold leading-tight">{member.name}</p>
                  <p className="mt-1 truncate text-base font-semibold text-muted-foreground">{member.staffId}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeStaff(member.id)}
                  aria-label={`Delete ${member.name}`}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-destructive transition hover:bg-destructive/10"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
                    delete
                  </span>
                </button>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default SellerStaff;