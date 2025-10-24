import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useLayoutEffect } from "react";
import Layout from "./components/Layout";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound";
import CoinTags from "./pages/CoinTags";
import Portfolio from "./pages/Portfolio";
import { AppStateProvider } from "@/lib/app-state";
import Assets from "./pages/Assets";
import ViewAllAssets from "./pages/ViewAllAssets";
import AssetDetail from "./pages/AssetDetail";
import AssetTokenTrading from "./pages/AssetTokenTrading";
import Revenue from "./pages/Revenue";
import HuntPage from "./pages/Hunt";
import Notifications from "./pages/Notifications";

const queryClient = new QueryClient();

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    if (typeof document !== "undefined") {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, [pathname]);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppStateProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Layout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/coin-tags" element={<CoinTags />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/revenue" element={<Revenue />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/assets" element={<Assets />} />
              <Route path="/assets/all" element={<ViewAllAssets />} />
              <Route path="/assets/:id" element={<AssetDetail />} />
              <Route path="/assets/:id/token" element={<AssetTokenTrading />} />
              <Route path="/assets/:id/hunt" element={<HuntPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </AppStateProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
