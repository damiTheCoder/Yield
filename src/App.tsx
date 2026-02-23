import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useLayoutEffect } from "react";
import Layout from "./components/Layout";
import SolarisSlider from "./components/SolarisSlider";
import AaveLanding from "./pages/AaveLanding";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound";
import CoinTags from "./pages/CoinTags";
import Portfolio from "./pages/Portfolio";
import Wallet from "./pages/Wallet";
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

import { ErrorBoundary } from "./components/ErrorBoundary";

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

// Wrapper components for routes
const CoinTagsPage = () => <Layout><CoinTags /></Layout>;
const PortfolioPage = () => <Layout><Portfolio /></Layout>;
const WalletPage = () => <Layout><Wallet /></Layout>;
const RevenuePage = () => <Layout><Revenue /></Layout>;
const NotificationsPage = () => <Layout><Notifications /></Layout>;
const AssetsPage = () => <Layout><Assets /></Layout>;
const ViewAllAssetsPage = () => <Layout><ViewAllAssets /></Layout>;
const AssetDetailPage = () => <Layout><AssetDetail /></Layout>;
const AssetTokenTradingPage = () => <Layout><AssetTokenTrading /></Layout>;
const HuntPageWrapper = () => <Layout><HuntPage /></Layout>;
const BlogPage = () => <Layout><Blog /></Layout>;
const BlogLiquidityFundedTokensPage = () => <Layout><BlogLiquidityFundedTokens /></Layout>;
const BlogCreativeLiquidityPage = () => <Layout><BlogCreativeLiquidity /></Layout>;
const BlogTokenizedYieldPage = () => <Layout><BlogTokenizedYield /></Layout>;
const NotFoundPage = () => <Layout><NotFound /></Layout>;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppStateProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<SolarisSlider />} />
              <Route path="/aave-landing" element={<AaveLanding />} />
              <Route path="/old-home" element={<Index />} />
              <Route path="/coin-tags" element={<CoinTagsPage />} />
              <Route path="/portfolio" element={<PortfolioPage />} />
              <Route path="/wallet" element={<WalletPage />} />
              <Route path="/revenue" element={<RevenuePage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/assets" element={<AssetsPage />} />
              <Route path="/assets/all" element={<ViewAllAssetsPage />} />
              <Route path="/assets/:id" element={<AssetDetailPage />} />
              <Route path="/assets/:id/token" element={<AssetTokenTradingPage />} />
              <Route path="/assets/:id/hunt" element={<HuntPageWrapper />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/liquidity-funded-tokens" element={<BlogLiquidityFundedTokensPage />} />
              <Route path="/blog/creative-liquidity-web3" element={<BlogCreativeLiquidityPage />} />
              <Route path="/blog/tokenized-yield-liquidity" element={<BlogTokenizedYieldPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </ErrorBoundary>
        </BrowserRouter>
      </AppStateProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
