import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LFTSimulator from "./pages/LFTSimulator";
import CoinTags from "./pages/CoinTags";
import Discover from "./pages/Discover";
import Portfolio from "./pages/Portfolio";
import Market from "./pages/Market";
import { AppStateProvider } from "@/lib/app-state";
import Assets from "./pages/Assets";
import AssetDetail from "./pages/AssetDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppStateProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/coin-tags" element={<CoinTags />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/market" element={<Market />} />
            <Route path="/assets" element={<Assets />} />
            <Route path="/assets/:id" element={<AssetDetail />} />
            <Route path="/lft" element={<LFTSimulator />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AppStateProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
