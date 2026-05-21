import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import OfflineBanner from "@/components/OfflineBanner";
import RootRedirect from "./components/RootRedirect.jsx";
import UserRoute from "./components/guards/UserRoute.jsx";
import SellerRoute from "./components/guards/SellerRoute.jsx";
import AdminRoute from "./components/guards/AdminRoute.jsx";
import { preloadInventoryForSellers } from "@/lib/sellerInventory";
import { loadOrdersFromBackend } from "@/lib/sellerOrders";
import { getRegisteredCanteensFromBackend } from "@/lib/sellerProfile";
import { getUserSession } from "@/utils/sessionManager";
import { pruneCartByCanteens } from "@/lib/userCart";
import { applyPwaHeadForPath } from "@/lib/pwaLaunch";

const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const UserHome = lazy(() => import("./pages/user/Home.tsx"));
const UserCart = lazy(() => import("./pages/user/Cart.tsx"));
const UserOrders = lazy(() => import("./pages/user/Orders.tsx"));
const UserProfile = lazy(() => import("./pages/user/Profile.tsx"));
const UserMenu = lazy(() => import("./pages/user/Menu.tsx"));
const UserPayment = lazy(() => import("./pages/user/Payment.tsx"));
const UserOrderStatus = lazy(() => import("./pages/user/OrderStatus.tsx"));
const UserLogin = lazy(() => import("./pages/user/Login.tsx"));
const UserSignup = lazy(() => import("./pages/user/Signup.tsx"));
const UserForgotPin = lazy(() => import("./pages/user/ForgotPin.tsx"));
const SellerDashboard = lazy(() => import("./pages/seller/Dashboard.tsx"));
const SellerInventory = lazy(() => import("./pages/seller/Inventory.tsx"));
const SellerMenu = lazy(() => import("./pages/seller/Menu.tsx"));
const SellerStaff = lazy(() => import("./pages/seller/Staff.tsx"));
const SellerOffers = lazy(() => import("./pages/seller/Offers.tsx"));
const SellerSettings = lazy(() => import("./pages/seller/Settings.tsx"));
const SellerOrders = lazy(() => import("./pages/seller/Orders.tsx"));
const SalesDashboard = lazy(() => import("./pages/seller/SalesDashboard.tsx"));
const SalesReports = lazy(() => import("./pages/seller/SalesReports.tsx"));
const SellerLogin = lazy(() => import("./pages/seller/Login.tsx"));
const MaLogin = lazy(() => import("./master-admin/pages/Login.tsx"));
const MaOverview = lazy(() => import("./master-admin/pages/Overview.tsx"));
const MaSellers = lazy(() => import("./master-admin/pages/Sellers.tsx"));
const MaCreateSeller = lazy(() => import("./master-admin/pages/CreateSeller.tsx"));
const MaSellerDetail = lazy(() => import("./master-admin/pages/SellerDetail.tsx"));
const MaUsers = lazy(() => import("./master-admin/pages/Users.tsx"));
const MaUserDetail = lazy(() => import("./master-admin/pages/UserDetail.tsx"));
const MaSales = lazy(() => import("./master-admin/pages/Sales.tsx"));
const MaBehaviour = lazy(() => import("./master-admin/pages/Behaviour.tsx"));
const MaProducts = lazy(() => import("./master-admin/pages/Products.tsx"));
const MaAudit = lazy(() => import("./master-admin/pages/Audit.tsx"));

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
      .then((canteens) => {
        if (!alive) return;
        const ids = canteens.map((c) => c.id);
        pruneCartByCanteens(ids);
        preloadInventoryForSellers(ids);
      })
      .catch(() => null);
    const userId = getUserSession()?.id;
    if (userId) loadOrdersFromBackend(null, userId).catch(() => null);
    return () => { alive = false; };
  }, []);
  return null;
};

const PwaRouteSync = () => {
  const location = useLocation();
  useEffect(() => {
    applyPwaHeadForPath(location.pathname);
  }, [location.pathname]);
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
        <PwaRouteSync />
        <Suspense fallback={null}>
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
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </PersistQueryClientProvider>
);

export default App;
