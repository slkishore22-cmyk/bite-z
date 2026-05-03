import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
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
import SellerProtectedRoute from "./components/seller/SellerProtectedRoute.tsx";
import UserHome from "./pages/user/Home.tsx";
import UserCart from "./pages/user/Cart.tsx";
import UserOrders from "./pages/user/Orders.tsx";
import UserProfile from "./pages/user/Profile.tsx";
import UserEvents from "./pages/user/Events.tsx";
import UserMenu from "./pages/user/Menu.tsx";
import UserPayment from "./pages/user/Payment.tsx";
import UserOrderStatus from "./pages/user/OrderStatus.tsx";
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
import MaProtected from "./master-admin/components/ProtectedRoute.tsx";

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
    ? createSyncStoragePersister({ storage: window.localStorage, key: "bitez-cache" })
    : undefined;

const App = () => (
  <PersistQueryClientProvider
    client={queryClient}
    persistOptions={{ persister: persister!, maxAge: 1000 * 60 * 60 * 24 }}
  >
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/home" element={<UserHome />} />
          <Route path="/cart" element={<UserCart />} />
          <Route path="/orders" element={<UserOrders />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/events" element={<UserEvents />} />
          <Route path="/canteen/:id" element={<UserMenu />} />
          <Route path="/payment" element={<UserPayment />} />
          <Route path="/order-status" element={<UserOrderStatus />} />
          <Route path="/seller/login" element={<SellerLogin />} />
          <Route path="/seller" element={<SellerProtectedRoute><SellerDashboard /></SellerProtectedRoute>} />
          <Route path="/seller/inventory" element={<SellerProtectedRoute><SellerInventory /></SellerProtectedRoute>} />
          <Route path="/seller/menu" element={<SellerProtectedRoute><SellerMenu /></SellerProtectedRoute>} />
          <Route path="/seller/staff" element={<SellerProtectedRoute><SellerStaff /></SellerProtectedRoute>} />
          <Route path="/seller/offers" element={<SellerProtectedRoute><SellerOffers /></SellerProtectedRoute>} />
          <Route path="/seller/settings" element={<SellerProtectedRoute><SellerSettings /></SellerProtectedRoute>} />
          <Route path="/seller/orders" element={<SellerProtectedRoute><SellerOrders /></SellerProtectedRoute>} />
          <Route path="/seller/sales" element={<SellerProtectedRoute><SalesDashboard /></SellerProtectedRoute>} />
          <Route path="/seller/sales/reports" element={<SellerProtectedRoute><SalesReports /></SellerProtectedRoute>} />
          {/* Master Admin (separate dashboard) */}
          <Route path="/master-admin" element={<MaProtected><MaOverview /></MaProtected>} />
          <Route path="/master-admin/login" element={<MaLogin />} />
          <Route path="/master-admin/overview" element={<MaProtected><MaOverview /></MaProtected>} />
          <Route path="/master-admin/sellers" element={<MaProtected><MaSellers /></MaProtected>} />
          <Route path="/master-admin/sellers/new" element={<MaProtected><MaCreateSeller /></MaProtected>} />
          <Route path="/master-admin/sellers/:id" element={<MaProtected><MaSellerDetail /></MaProtected>} />
          <Route path="/master-admin/users" element={<MaProtected><MaUsers /></MaProtected>} />
          <Route path="/master-admin/users/:id" element={<MaProtected><MaUserDetail /></MaProtected>} />
          <Route path="/master-admin/sales" element={<MaProtected><MaSales /></MaProtected>} />
          <Route path="/master-admin/behaviour" element={<MaProtected><MaBehaviour /></MaProtected>} />
          <Route path="/master-admin/products" element={<MaProtected><MaProducts /></MaProtected>} />
          <Route path="/master-admin/audit" element={<MaProtected><MaAudit /></MaProtected>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </PersistQueryClientProvider>
);

export default App;
