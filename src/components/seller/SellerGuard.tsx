import { Navigate, useLocation } from "react-router-dom";
import { useSellerAuth } from "@/contexts/SellerAuthContext";
import { PageSpinner } from "@/components/seller/PageSpinner";

export const SellerGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, sellerProfile, loading } = useSellerAuth();
  const location = useLocation();

  if (loading) return <PageSpinner />;

  if (!user) {
    return <Navigate to="/seller/login" replace state={{ from: location }} />;
  }

  if (!sellerProfile) {
    return (
      <div className="min-h-screen grid place-items-center bg-background text-foreground p-6">
        <div className="max-w-sm text-center space-y-4">
          <span className="material-symbols-outlined text-4xl text-warning">hourglass_top</span>
          <h1 className="text-xl font-extrabold">Seller account not provisioned</h1>
          <p className="text-sm text-muted-foreground">
            Your account is not linked to a seller profile yet. Please contact your admin.
          </p>
        </div>
      </div>
    );
  }

  if (sellerProfile.status !== "approved") {
    return (
      <div className="min-h-screen grid place-items-center bg-background text-foreground p-6">
        <div className="max-w-sm text-center space-y-4">
          <span className="material-symbols-outlined text-4xl text-warning">pending</span>
          <h1 className="text-xl font-extrabold">Awaiting approval</h1>
          <p className="text-sm text-muted-foreground">
            Your seller profile is currently <b>{sellerProfile.status}</b>. An admin must approve it before you can use the dashboard.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};