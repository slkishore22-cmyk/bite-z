import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import OfflineBanner from "@/components/OfflineBanner";
import NotFound from "./pages/NotFound.tsx";
import SellerDashboard from "./pages/seller/Dashboard.tsx";
import SellerInventory from "./pages/seller/Inventory.tsx";
import SellerMenu from "./pages/seller/Menu.tsx";
import SellerStaff from "./pages/seller/Staff.tsx";
import SellerOffers from "./pages/seller/Offers.tsx";
import SellerSettings from "./pages/seller/Settings.tsx";
import SellerOrders from "./pages/seller/Orders.tsx";
import SalesDashboard from "./pages/seller/SalesDashboard.tsx";
import SalesReports from "./pages/seller/SalesReports.tsx";
import SellerLogin from "./pages/seller/Login.tsx";
import UserHome from "./pages/user/Home.tsx";
import UserCart from "./pages/user/Cart.tsx";
import UserOrders from "./pages/user/Orders.tsx";
import UserProfile from "./pages/user/Profile.tsx";
import UserMenu from "./pages/user/Menu.tsx";
import UserPayment from "./pages/user/Payment.tsx";
import UserOrderStatus from "./pages/user/OrderStatus.tsx";
import UserLogin from "./pages/user/Login.tsx";
import UserSignup from "./pages/user/Signup.tsx";
import UserForgotPin from "./pages/user/ForgotPin.tsx";
import MaLogin from "./master-admin/pages/Login.tsx";
import MaOverview from "./master-admin/pages/Overview.tsx";
import MaSellers from "./master-admin/pages/Sellers.tsx";
import MaCreateSeller from "./master-admin/pages/CreateSeller.tsx";
import MaSellerDetail from "./master-admin/pages/SellerDetail.tsx";
import MaUsers from "./master-admin/pages/Users.tsx";
import MaUserDetail from "./master-admin/pages/UserDetail.tsx";
import MaSales from "./master-admin/pages/Sales.tsx";
import MaBehaviour from "./master-admin/pages/Behaviour.tsx";
import MaProducts from "./master-admin/pages/Products.tsx";
import MaAudit from "./master-admin/pages/Audit.tsx";
import RootRedirect from "./components/RootRedirect.jsx";
import UserRoute from "./components/guards/UserRoute.jsx";
import SellerRoute from "./components/guards/SellerRoute.jsx";
import AdminRoute from "./components/guards/AdminRoute.jsx";
import { preloadInventoryForSellers } from "@/lib/sellerInventory";
import { loadOrdersFromBackend } from "@/lib/sellerOrders";
import { getRegisteredCanteensFromBackend } from "@/lib/sellerProfile";
import { getUserSession } from "@/utils/sessionManager";

// Aggressive caching tuned for low-bandwidth campus networks.
// Data stays "fresh" for 5 min, kept in memory for 24h, and persisted to
// localStorage so a returning user sees instant results offline.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 60 * 24,
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

const persister =
  typeof window !== "undefined"
    ? createSyncStoragePersister({ storage: window.localStorage, key: "bitez-cache-v2" })
    : undefined;

const AppDataPreloader = () => {
  useEffect(() => {
    let alive = true;
    getRegisteredCanteensFromBackend()
      .then((canteens) => alive && preloadInventoryForSellers(canteens.map((c) => c.id)))
      .catch(() => null);
    const userId = getUserSession()?.id;
    if (userId) loadOrdersFromBackend(null, userId).catch(() => null);
    return () => { alive = false; };
  }, []);
  return null;
};

const App = () => (
  <PersistQueryClientProvider
    client={queryClient}
    persistOptions={{ persister: persister!, maxAge: 1000 * 60 * 60 * 24 }}
  >
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <OfflineBanner />
      <AppDataPreloader />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />

          {/* USER APP */}
          <Route path="/app/login" element={<UserLogin />} />
          <Route path="/app/signup" element={<UserSignup />} />
          <Route path="/app/forgot-pin" element={<UserForgotPin />} />
          <Route path="/app/home" element={<UserRoute><UserHome /></UserRoute>} />
          <Route path="/app/cart" element={<UserRoute><UserCart /></UserRoute>} />
          <Route path="/app/orders" element={<UserRoute><UserOrders /></UserRoute>} />
          <Route path="/app/profile" element={<UserRoute><UserProfile /></UserRoute>} />
          <Route path="/app/menu/:id" element={<UserRoute><UserMenu /></UserRoute>} />
          <Route path="/app/payment" element={<UserRoute><UserPayment /></UserRoute>} />
          <Route path="/app/order-status" element={<UserRoute><UserOrderStatus /></UserRoute>} />
          <Route path="/app" element={<Navigate to="/app/home" replace />} />

          {/* SELLER APP */}
          <Route path="/seller/login" element={<SellerLogin />} />
          <Route path="/seller/dashboard" element={<SellerRoute><SellerDashboard /></SellerRoute>} />
          <Route path="/seller/inventory" element={<SellerRoute><SellerInventory /></SellerRoute>} />
          <Route path="/seller/menu" element={<SellerRoute><SellerMenu /></SellerRoute>} />
          <Route path="/seller/staff" element={<SellerRoute><SellerStaff /></SellerRoute>} />
          <Route path="/seller/offers" element={<SellerRoute><SellerOffers /></SellerRoute>} />
          <Route path="/seller/settings" element={<SellerRoute><SellerSettings /></SellerRoute>} />
          <Route path="/seller/orders" element={<SellerRoute><SellerOrders /></SellerRoute>} />
          <Route path="/seller/sales" element={<SellerRoute><SalesDashboard /></SellerRoute>} />
          <Route path="/seller/sales/reports" element={<SellerRoute><SalesReports /></SellerRoute>} />
          <Route path="/seller" element={<Navigate to="/seller/dashboard" replace />} />

          {/* MASTER ADMIN */}
          <Route path="/master-admin/login" element={<MaLogin />} />
          <Route path="/master-admin/overview" element={<AdminRoute><MaOverview /></AdminRoute>} />
          <Route path="/master-admin/sellers" element={<AdminRoute><MaSellers /></AdminRoute>} />
          <Route path="/master-admin/sellers/new" element={<AdminRoute><MaCreateSeller /></AdminRoute>} />
          <Route path="/master-admin/sellers/:id" element={<AdminRoute><MaSellerDetail /></AdminRoute>} />
          <Route path="/master-admin/users" element={<AdminRoute><MaUsers /></AdminRoute>} />
          <Route path="/master-admin/users/:id" element={<AdminRoute><MaUserDetail /></AdminRoute>} />
          <Route path="/master-admin/sales" element={<AdminRoute><MaSales /></AdminRoute>} />
          <Route path="/master-admin/behaviour" element={<AdminRoute><MaBehaviour /></AdminRoute>} />
          <Route path="/master-admin/products" element={<AdminRoute><MaProducts /></AdminRoute>} />
          <Route path="/master-admin/audit" element={<AdminRoute><MaAudit /></AdminRoute>} />
          <Route path="/master-admin" element={<Navigate to="/master-admin/overview" replace />} />

          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </PersistQueryClientProvider>
);

export default App;
