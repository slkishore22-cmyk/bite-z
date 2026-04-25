import { Link } from "react-router-dom";
import { EmptyState } from "@/components/seller/EmptyState";

const SellerStaff = () => {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <main className="mx-auto w-full max-w-md px-5 pb-12 pt-6">
        <header className="flex items-center gap-3">
          <Link
            to="/seller"
            aria-label="Back to dashboard"
            className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-foreground transition-colors hover:bg-secondary/80"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>arrow_back</span>
          </Link>
          <p className="text-xl font-extrabold tracking-tight">Staff Management</p>
        </header>

        <section className="mt-10">
          <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.14em] text-primary">
            Coming Soon
          </span>
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight">Staff Management</h1>
          <p className="mt-2 text-sm font-medium leading-relaxed text-muted-foreground">
            Add staff for billing and token management.
          </p>
        </section>

        <div className="mt-8">
          <EmptyState
            icon="badge"
            title="No staff members"
            description="Staff accounts are managed by your admin. This screen will let you add and manage them in a future update."
          />
        </div>
      </main>
    </div>
  );
};

export default SellerStaff;