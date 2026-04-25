import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
import { SellerAuthProvider } from "./contexts/SellerAuthContext";
import { SellerGuard } from "./components/seller/SellerGuard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SellerAuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/seller/login" element={<SellerLogin />} />
            <Route path="/seller" element={<SellerGuard><SellerDashboard /></SellerGuard>} />
            <Route path="/seller/inventory" element={<SellerGuard><SellerInventory /></SellerGuard>} />
            <Route path="/seller/menu" element={<SellerGuard><SellerMenu /></SellerGuard>} />
            <Route path="/seller/staff" element={<SellerGuard><SellerStaff /></SellerGuard>} />
            <Route path="/seller/offers" element={<SellerGuard><SellerOffers /></SellerGuard>} />
            <Route path="/seller/settings" element={<SellerGuard><SellerSettings /></SellerGuard>} />
            <Route path="/seller/orders" element={<SellerGuard><SellerOrders /></SellerGuard>} />
            <Route path="/seller/sales" element={<SellerGuard><SalesDashboard /></SellerGuard>} />
            <Route path="/seller/sales/reports" element={<SellerGuard><SalesReports /></SellerGuard>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SellerAuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
