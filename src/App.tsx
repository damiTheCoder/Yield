import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useLayoutEffect } from "react";
import Layout from "./components/Layout";
import TroneSlider from "./components/TroneSlider";
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
import Blog from "./pages/Blog";
import BlogLiquidityFundedTokens from "./pages/BlogLiquidityFundedTokens";
import BlogCreativeLiquidity from "./pages/BlogCreativeLiquidity";
import BlogTokenizedYield from "./pages/BlogTokenizedYield";

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
          <Routes>
            <Route path="/" element={<TroneSlider />} />
            <Route path="/old-home" element={<Index />} />
            <Route path="/*" element={
              <Layout>
                <Routes>
                  <Route path="/coin-tags" element={<CoinTags />} />
                  <Route path="/portfolio" element={<Portfolio />} />
                  <Route path="/revenue" element={<Revenue />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/assets" element={<Assets />} />
                  <Route path="/assets/all" element={<ViewAllAssets />} />
                  <Route path="/assets/:id" element={<AssetDetail />} />
                  <Route path="/assets/:id/token" element={<AssetTokenTrading />} />
                  <Route path="/assets/:id/hunt" element={<HuntPage />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/liquidity-funded-tokens" element={<BlogLiquidityFundedTokens />} />
                  <Route path="/blog/creative-liquidity-web3" element={<BlogCreativeLiquidity />} />
                  <Route path="/blog/tokenized-yield-liquidity" element={<BlogTokenizedYield />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            } />
          </Routes>
        </BrowserRouter>
      </AppStateProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
