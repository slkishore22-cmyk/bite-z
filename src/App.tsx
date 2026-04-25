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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/seller" element={<SellerDashboard />} />
          <Route path="/seller/inventory" element={<SellerInventory />} />
          <Route path="/seller/menu" element={<SellerMenu />} />
          <Route path="/seller/staff" element={<SellerStaff />} />
          <Route path="/seller/offers" element={<SellerOffers />} />
          <Route path="/seller/settings" element={<SellerSettings />} />
          <Route path="/seller/orders" element={<SellerOrders />} />
          <Route path="/seller/sales" element={<SalesDashboard />} />
          <Route path="/seller/sales/reports" element={<SalesReports />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
