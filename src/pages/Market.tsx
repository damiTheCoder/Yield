import { useMemo, useState, useCallback, useEffect } from "react";
import { useApp } from "@/lib/app-state";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import TradingChart from "../components/TradingChart";
import OrderBook from "../components/OrderBook";

type OrderType = 'buy' | 'sell';
type ConsolidatedOrder = {
  id: string;
  type: OrderType;
  price: number;
  quantity: number;
  total: number;
  timestamp: string;
};

export default function Market() {
  const {
    assets,
    user,
    hybridDex,
    convertLftsToClft,
    applyHybridDexMarketTrade,
  } = useApp();
  
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [orderQuantity, setOrderQuantity] = useState('');
  
  // Current Market Price (computed from orderbook)
  const [currentMarketPrice, setCurrentMarketPrice] = useState(hybridDex.currentPrice ?? 13.13);
  
  useEffect(() => {
    setCurrentMarketPrice(hybridDex.currentPrice ?? 13.13);
  }, [hybridDex.currentPrice]);
  
  const transactions = hybridDex.transactions;
  const orderBookSellers = useMemo(
    () =>
      hybridDex.sellers.map((seller) => ({
        id: seller.id,
        price: seller.price,
        quantity: seller.remaining,
        active: seller.status === "open" && seller.remaining > 0,
      })),
    [hybridDex.sellers],
  );

  // HybridDEX Orderbook Aggregation and Price Discovery
  const poolMetrics = useMemo(() => {
    const totalLiquidity = assets.reduce((sum, asset) => sum + asset.cycle.reserve, 0);
    const totalUnredeemedLFTs = assets.reduce((sum, asset) => sum + asset.cycle.supply, 0);
    
    // HybridDEX: Orderbook Aggregator Layer (OAL)
    const activeSellers = orderBookSellers
      .filter((seller) => seller.active && seller.quantity > 0)
      .map((seller) => ({
        id: seller.id,
        price: seller.price,
        quantity: seller.quantity,
      }));
    
    // Remove outliers (top and bottom 10%)
    const sortedPrices = [...activeSellers].sort((a, b) => a.price - b.price);
    const outlierCount = Math.floor(sortedPrices.length * 0.1);
    const cleanedSellers = sortedPrices.slice(outlierCount, -outlierCount || undefined);
    
    // Calculate VWAP from actual executed trades (Pi × Qi) / ΣQi
    let vwapPrice = currentMarketPrice; // Default fallback
    
    if (transactions.length > 0) {
      // Use recent transactions to calculate true VWAP
      const recentTrades = transactions.slice(-10); // Last 10 trades for VWAP
      const totalTradeVolume = recentTrades.reduce((sum, trade) => sum + trade.amount, 0);
      const weightedTradeSum = recentTrades.reduce((sum, trade) => sum + (trade.price * trade.amount), 0);
      vwapPrice = totalTradeVolume > 0 ? weightedTradeSum / totalTradeVolume : currentMarketPrice;
    } else if (cleanedSellers.length > 0) {
      // Fallback to seller orderbook VWAP if no trades yet
      const totalVolume = cleanedSellers.reduce((sum, seller) => sum + seller.quantity, 0);
      const weightedSum = cleanedSellers.reduce((sum, seller) => sum + (seller.price * seller.quantity), 0);
      vwapPrice = totalVolume > 0 ? weightedSum / totalVolume : currentMarketPrice;
    }
    
    // Smart Price Window Logic (SPWL) - ±5% range around VWAP
    const lowerBound = vwapPrice * 0.95;
    const upperBound = vwapPrice * 1.05;
    
    // Valid sellers within the fair trading zone
    const validSellers = cleanedSellers.filter(s => s.price >= lowerBound && s.price <= upperBound);
    
    // Current Price = Price of Last Matched Trade (Bid = Ask)
    // Pure market equilibrium in real time - last execution determines market value
    const cLftPrice = currentMarketPrice;
    const tradingFee = 0.002; // 0.2% HybridDEX fee
    
    // HybridDEX Trade Execution Engine (TEE) - REALISTIC ORDERBOOK MATCHING
    const executeOrderbookTrade = (usdAmount: number, isBuy: boolean) => {
      const IMPACT_MULTIPLIER = 0.06; // calibrated to keep typical trades within the Smart Price Window
      const LIQUIDITY_FLOOR = 75000;
      const totalOrderbookLiquidityUsd = validSellers.reduce(
        (sum, seller) => sum + seller.quantity * seller.price,
        0,
      );
      const baseLiquidity = Math.max(totalOrderbookLiquidityUsd, totalLiquidity, LIQUIDITY_FLOOR);

      if (!isBuy) {
        // Sell: Add selling pressure, price drops based on volume
        const cLFTAmount = usdAmount; // When selling, usdAmount parameter is actually cLFT amount
        const tradeNotional = Math.max(cLFTAmount * vwapPrice, 0);
        const effectiveLiquidity = Math.max(baseLiquidity, totalOrderbookLiquidityUsd + tradeNotional);
        const sellPressure = Math.sqrt(tradeNotional / effectiveLiquidity) * IMPACT_MULTIPLIER;
        const dampenedSellPressure = Number.isFinite(sellPressure) ? sellPressure : 0;
        const theoreticalSellPrice = vwapPrice * (1 - dampenedSellPressure);
        const minAllowedPrice = lowerBound;
        const finalSellPrice = Math.max(theoreticalSellPrice, minAllowedPrice);
        const priceRatio = finalSellPrice / Math.max(vwapPrice, 1e-8);
        const appliedPressure = Math.max(0, 1 - priceRatio);
        const usdReceived = cLFTAmount * finalSellPrice;
        
        return {
          cLftAmount: usdReceived, // USD received from selling cLFT
          avgExecutionPrice: finalSellPrice,
          priceImpact: -appliedPressure * 100, // NEGATIVE impact for sells (price decreases)
        };
      }
      
      // Buy: Consume orderbook from cheapest to most expensive
      const availableSellers = validSellers.filter(s => s.quantity > 0).sort((a, b) => a.price - b.price);
      if (availableSellers.length === 0) return { cLftAmount: 0, avgExecutionPrice: vwapPrice, priceImpact: 0 };
      
      const amountInWithFee = usdAmount * (1 - tradingFee);
      let remainingUSD = amountInWithFee;
      let totalcLFTReceived = 0;
      let totalUSDSpent = 0;
      
      // Fill from multiple sellers based on available quantity
      for (const seller of availableSellers) {
        if (remainingUSD <= 0) break;
        
        const maxcLFTFromSeller = seller.quantity;
        const usdNeededForAllTokens = maxcLFTFromSeller * seller.price;
        
        if (remainingUSD >= usdNeededForAllTokens) {
          // Buy all tokens from this seller
          totalcLFTReceived += maxcLFTFromSeller;
          totalUSDSpent += usdNeededForAllTokens;
          remainingUSD -= usdNeededForAllTokens;
        } else {
          // Partially fill from this seller
          const cLFTFromThisSeller = remainingUSD / seller.price;
          totalcLFTReceived += cLFTFromThisSeller;
          totalUSDSpent += remainingUSD;
          remainingUSD = 0;
        }
      }
      
      const avgExecutionPrice = totalcLFTReceived > 0 ? totalUSDSpent / totalcLFTReceived : vwapPrice;
      
      // Buy orders should ALWAYS increase price (positive impact)
      const tradeNotional = Math.max(usdAmount, 0);
      const effectiveLiquidity = Math.max(baseLiquidity, totalOrderbookLiquidityUsd + tradeNotional);
      const buyPressure = Math.sqrt(tradeNotional / effectiveLiquidity) * IMPACT_MULTIPLIER;
      const dampenedBuyPressure = Number.isFinite(buyPressure) ? buyPressure : 0;
      const theoreticalBuyPrice = avgExecutionPrice * (1 + dampenedBuyPressure);
      const maxAllowedPrice = upperBound;
      const finalBuyPrice = Math.min(theoreticalBuyPrice, maxAllowedPrice);
      const priceRatio = finalBuyPrice / Math.max(avgExecutionPrice, 1e-8);
      const appliedPressure = Math.max(0, priceRatio - 1);
      const priceImpact = appliedPressure * 100; // Positive impact for buys
      
      return {
        cLftAmount: totalcLFTReceived,
        avgExecutionPrice: finalBuyPrice, // Use increased price
        priceImpact: priceImpact // Positive for buys
      };
    };
    
    const getSwapOutput = (amountIn: number, isBuy: boolean) => {
      const result = executeOrderbookTrade(amountIn, isBuy);
      return result.cLftAmount;
    };
    
    const getBestExecutionPrice = (isBuy: boolean, usdAmount: number = 100) => {
      const result = executeOrderbookTrade(usdAmount, isBuy);
      return result.avgExecutionPrice;
    };
    
    const calculatePriceImpact = (amountIn: number, isBuy: boolean) => {
      const result = executeOrderbookTrade(amountIn, isBuy);
      return result.priceImpact;
    };
    
    return {
      totalLiquidity,
      totalUnredeemedLFTs,
      cLftPrice,
      tradingFee,
      vwapPrice,
      lowerBound,
      upperBound,
      validSellers,
      activeSellers: activeSellers.length,
      validSellersCount: validSellers.length,
      executeOrderbookTrade,
      getSwapOutput,
      getBestExecutionPrice,
      calculatePriceImpact,
      // Legacy compatibility for chart
      cLftReserve: totalUnredeemedLFTs * 0.8,
      usdcReserve: totalLiquidity * 0.6
    };
  }, [assets, orderBookSellers, transactions, currentMarketPrice]);

  // cLFT DEX Trading Functions
  const handleLftTocLftSwap = useCallback((lftAmount: number) => {
    if (lftAmount <= 0 || user.lfts < lftAmount) {
      alert('Insufficient LFT balance for swap');
      return;
    }
    
    // Swap LFTs for cLFTs at 1:1 ratio for HybridDEX trading
    // Note: By swapping, user gives up old reward eligibility for trading potential
    const { converted } = convertLftsToClft(lftAmount);
    if (converted <= 0) {
      alert('Conversion failed. Try a different amount.');
      return;
    }
    
    console.log(`🔄 Swapped ${lftAmount} LFTs → ${converted} cLFTs`);
    console.log(`🚀 Ready for HybridDEX orderbook trading! (Old rewards forfeited for trading potential)`);
  }, [convertLftsToClft, user.lfts]);

  const handleCLftSwap = useCallback((amountIn: number, isBuy: boolean) => {
    // HybridDEX Trade Execution with Realistic Orderbook Matching
    const tradeResult = poolMetrics.executeOrderbookTrade ? 
      poolMetrics.executeOrderbookTrade(amountIn, isBuy) : 
      { cLftAmount: poolMetrics.getSwapOutput(amountIn, isBuy), avgExecutionPrice: poolMetrics.getBestExecutionPrice(isBuy, amountIn), priceImpact: poolMetrics.calculatePriceImpact(amountIn, isBuy) };
    
    const amountOut = tradeResult.cLftAmount;
    const executionPrice = tradeResult.avgExecutionPrice;
    const priceImpact = tradeResult.priceImpact;
    const tradingFee = amountIn * poolMetrics.tradingFee;
    
    // Check if trade is within valid price window
    if (executionPrice < poolMetrics.lowerBound || executionPrice > poolMetrics.upperBound) {
      alert(`Trade rejected: Price ${formatCurrency(executionPrice)} is outside fair trading zone (${formatCurrency(poolMetrics.lowerBound)} - ${formatCurrency(poolMetrics.upperBound)})`);
      return;
    }
    
    if (isBuy) {
      // Buy cLFT with USDC using HybridDEX
      if (user.usd < amountIn) {
        alert('Insufficient USDC balance');
        return;
      }
      
      // Current Price = Price of Last Matched Trade (Bid = Ask) - Pure market equilibrium
      const nextPrice = Math.max(executionPrice, poolMetrics.cLftPrice);
      setCurrentMarketPrice((prev) => Math.max(executionPrice, prev));
      applyHybridDexMarketTrade({
        side: "buy",
        usdAmount: amountIn,
        clftAmount: amountOut,
        executionPrice: nextPrice,
      });
      
      console.log(`🔄 HybridDEX Buy: ${formatCurrency(amountIn)} USDC → ${amountOut.toFixed(4)} cLFT`);
      console.log(`📈 Execution Price: ${formatCurrency(nextPrice)} | VWAP: ${formatCurrency(poolMetrics.vwapPrice)}`);
      console.log(`📊 Price Impact: ${priceImpact.toFixed(2)}% | Trading Fee: ${formatCurrency(tradingFee)}`);
    } else {
      // Sell cLFT for USDC using HybridDEX
      if (user.clft < amountIn) {
        alert('Insufficient cLFT balance');
        return;
      }
      
      // Current Price = Price of Last Matched Trade (Bid = Ask) - Pure market equilibrium
      const nextPrice = Math.min(executionPrice, poolMetrics.cLftPrice);
      setCurrentMarketPrice((prev) => Math.min(executionPrice, prev));
      applyHybridDexMarketTrade({
        side: "sell",
        usdAmount: amountOut,
        clftAmount: amountIn,
        executionPrice: nextPrice,
      });
      
      console.log(`🔄 HybridDEX Sell: ${amountIn.toFixed(4)} cLFT → ${formatCurrency(amountOut)} USDC`);
      console.log(`📉 Execution Price: ${formatCurrency(nextPrice)} | VWAP: ${formatCurrency(poolMetrics.vwapPrice)}`);
      console.log(`📉 Price Impact: ${priceImpact.toFixed(2)}% | Trading Fee: ${formatCurrency(tradingFee)}`);
    }
  }, [applyHybridDexMarketTrade, poolMetrics, user.clft, user.usd]);

  const handlePlaceOrder = useCallback(() => {
    const quantity = parseFloat(orderQuantity);
    if (!orderQuantity || quantity <= 0) return;
    
    if (activeTab === 'buy') {
      // Buy cLFTs using HybridDEX orderbook
      handleCLftSwap(quantity, true);
    } else if (activeTab === 'sell') {
      // Sell cLFTs using HybridDEX orderbook
      handleCLftSwap(quantity, false);
    }
    
    setOrderQuantity('');
  }, [activeTab, orderQuantity, handleCLftSwap]);



  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-0 md:p-6">
      <div className="w-full max-w-7xl mx-auto space-y-0 md:space-y-6">
        
        {/* Professional Trading Chart */}
        <TradingChart 
          currentPrice={poolMetrics.cLftPrice}
          cLftReserve={poolMetrics.cLftReserve}
          usdcReserve={poolMetrics.usdcReserve}
          totalLiquidity={poolMetrics.totalLiquidity}
          transactions={transactions}
          onPriceChange={(price) => console.log('Price updated:', price)}
        />

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 p-4 md:p-0">
          <OrderBook 
            sellers={orderBookSellers}
            transactions={transactions}
            currentPrice={poolMetrics.cLftPrice}
            vwapPrice={poolMetrics.vwapPrice}
          />
          
          <Button 
            variant="outline"
            className="gap-2 border-red-200 text-red-600 hover:bg-red-50"
            onClick={() => {
              localStorage.removeItem('forge-art-hub-state');
              window.location.reload();
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Clear Storage & Reload
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 md:p-0">
          {/* Trading Interface - Left Side */}
          <Card className="lg:col-span-2 border-0 rounded-3xl">
            <CardHeader className="pb-4">
              <div className="flex flex-col items-center w-full">
                {/* HybridDEX Single Asset Header */}
                <div className="mb-4 text-center">
                  <h2 className="text-lg font-semibold flex items-center gap-2 justify-center">
                    <img src="/OPY.png" alt="cLT" className="h-6 w-6 rounded-full hidden sm:inline-block" />
                    cLT / USDC Trading
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Single asset trading based on demand & supply with Smart Price Window Logic
                  </p>
                </div>
                
                <div className="flex gap-2 w-full max-w-md">
                    <Button
                    variant={activeTab === 'buy' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('buy')}
                    className="text-xs font-medium flex-1 rounded-2xl bg-green-500 hover:bg-green-600 text-white"
                  >
                    Buy cLT
                  </Button>
                    <Button
                    variant={activeTab === 'sell' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('sell')}
                    className="text-xs font-medium flex-1 rounded-2xl bg-red-500 hover:bg-red-600 text-white"
                  >
                    Sell cLT
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4 p-6">
              
              {/* HybridDEX Single Asset Trading Interface */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-full">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-blue-700">HybridDEX Protocol Active</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Trading cLT based on aggregated seller data with ±5% Smart Price Window Logic
                </p>
              </div>

              {activeTab === 'buy' && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <label className="text-sm font-medium">USDC Amount</label>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={orderQuantity}
                        onChange={(e) => setOrderQuantity(e.target.value)}
                        className="w-full pr-24 h-14 text-xl font-mono rounded-2xl border-0 bg-muted/60"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <img src="/usdc.png" alt="USDC" className="h-4 w-4 rounded-full" />
                        <span className="text-sm text-muted-foreground">USDC</span>
                      </div>
                    </div>
                  </div>

                  {orderQuantity && parseFloat(orderQuantity) > 0 && (
                    <div className="bg-muted/60 rounded-2xl border-0 p-4 text-sm space-y-2">
                      <div className="flex justify-between">
                        <span>USDC Amount:</span>
                        <span className="font-medium">{formatCurrency(parseFloat(orderQuantity))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>cLT Output (HybridDEX):</span>
                        <div className="flex items-center gap-1 font-medium text-green-500">
                          <img src="/OPY.png" alt="cLT" className="h-3 w-3 rounded-full hidden sm:inline-block" />
                          {poolMetrics.getSwapOutput(parseFloat(orderQuantity), true).toFixed(4)}
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span>Execution Price:</span>
                        <span className="font-medium text-green-600">{formatCurrency(poolMetrics.getBestExecutionPrice(true))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Price Impact:</span>
                        <span className={`font-medium ${
                          poolMetrics.calculatePriceImpact(parseFloat(orderQuantity), true) > 3 ? 'text-orange-500' : 'text-green-500'
                        }`}>
                          {poolMetrics.calculatePriceImpact(parseFloat(orderQuantity), true).toFixed(2)}% (SPWL)
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-border/50 pt-2">
                        <span>Trading Fee:</span>
                        <span className="font-medium">{formatCurrency(parseFloat(orderQuantity) * poolMetrics.tradingFee)}</span>
                      </div>
                    </div>
                  )}

                  <Button 
                    className="w-full h-14 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all text-lg"
                    disabled={!orderQuantity || parseFloat(orderQuantity) <= 0 || user.usd < parseFloat(orderQuantity || '0')}
                    onClick={() => handlePlaceOrder()}
                  >
                    {!orderQuantity || parseFloat(orderQuantity) <= 0 
                      ? 'Enter USD amount to buy cLT' 
                      : user.usd < parseFloat(orderQuantity || '0')
                      ? 'Insufficient USD balance'
                      : `Buy cLT (${formatCurrency(poolMetrics.getBestExecutionPrice(true))} per token)`
                    }
                  </Button>
                </div>
              )}

              {activeTab === 'sell' && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <label className="text-sm font-medium">cLFT Amount</label>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="0.0000"
                        value={orderQuantity}
                        onChange={(e) => setOrderQuantity(e.target.value)}
                        className="w-full pr-24 h-14 text-xl font-mono rounded-2xl border-0 bg-muted/60"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <img src="/OPY.png" alt="cLFT" className="h-4 w-4 rounded-full" />
                        <span className="text-sm text-muted-foreground">cLFT</span>
                      </div>
                    </div>
                  </div>

                  {orderQuantity && parseFloat(orderQuantity) > 0 && (
                    <div className="bg-muted/60 rounded-2xl border-0 p-4 text-sm space-y-2">
                      <div className="flex justify-between">
                        <span>cLFT Amount:</span>
                        <span className="font-medium">{parseFloat(orderQuantity).toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>USDC Output (HybridDEX):</span>
                        <div className="flex items-center gap-1 font-medium text-red-500">
                          <img src="/usdc.png" alt="USDC" className="h-3 w-3 rounded-full" />
                          {formatCurrency(poolMetrics.getSwapOutput(parseFloat(orderQuantity), false))}
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span>Execution Price:</span>
                        <span className="font-medium text-blue-600">{formatCurrency(poolMetrics.getBestExecutionPrice(false))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Price Impact:</span>
                        <span className={`font-medium ${
                          poolMetrics.calculatePriceImpact(parseFloat(orderQuantity), false) > 3 ? 'text-orange-500' : 'text-green-500'
                        }`}>
                          {poolMetrics.calculatePriceImpact(parseFloat(orderQuantity), false).toFixed(2)}% (SPWL)
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-border/50 pt-2">
                        <span>Trading Fee:</span>
                        <span className="font-medium">{formatCurrency(parseFloat(orderQuantity) * poolMetrics.cLftPrice * poolMetrics.tradingFee)}</span>
                      </div>
                    </div>
                  )}

                  <Button 
                    className="w-full h-14 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all text-lg"
                    disabled={!orderQuantity || parseFloat(orderQuantity) <= 0 || user.clft < parseFloat(orderQuantity || '0')}
                    onClick={() => handlePlaceOrder()}
                  >
                    {!orderQuantity || parseFloat(orderQuantity) <= 0 
                      ? 'Enter cLT amount' 
                      : user.clft < parseFloat(orderQuantity || '0')
                      ? 'Insufficient cLT balance'
                      : 'Sell cLT via HybridDEX'
                    }
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pool Statistics - Right Side */}
          <div className="hidden lg:block">
            <Card className="bg-muted/50 border-0 rounded-2xl h-fit">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4 text-lg">Market Stats</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Total Liquidity</div>
                    <div className="font-mono text-lg font-semibold">{formatCurrency(poolMetrics.totalLiquidity)}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Unredeemed LFTs</div>
                    <div className="font-mono text-lg font-semibold">{poolMetrics.totalUnredeemedLFTs.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">cLT Price</div>
                    <div className="font-mono text-lg font-semibold">{formatCurrency(poolMetrics.cLftPrice)}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Trading Fee</div>
                    <div className="font-mono text-lg font-semibold">{(poolMetrics.tradingFee * 100).toFixed(1)}%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Mobile Statistics - Bottom */}
        <div className="lg:hidden">
          <Card className="bg-transparent border-0 rounded-2xl shadow-none">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 text-left">
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">VWAP (Volume-Weighted)</div>
                  <div className="font-mono text-sm font-semibold text-green-600">{formatCurrency(poolMetrics.vwapPrice)}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Fair Trading Zone</div>
                  <div className="font-mono text-xs font-semibold text-blue-600">
                    {formatCurrency(poolMetrics.lowerBound)} - {formatCurrency(poolMetrics.upperBound)}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Active Sellers</div>
                  <div className="font-mono text-sm font-semibold">{poolMetrics.activeSellers} total / {poolMetrics.validSellersCount} valid</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Trading Fee</div>
                  <div className="font-mono text-sm font-semibold">{(poolMetrics.tradingFee * 100).toFixed(1)}%</div>
                </div>
              </div>
              
              {/* HybridDEX Protocol Badge */}
              <div className="mt-4 pt-4 border-t border-border/50">
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">HybridDEX Protocol</span>
                  <span>•</span>
                  <span>Smart Price Window Logic (±5%)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick LFT → cLFT Conversion (Bottom Right Corner) */}
      {user.lfts > 0 && (
        <div className="fixed bottom-6 right-6">
          <Card className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-0 rounded-2xl backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="text-sm space-y-2">
                <div className="font-medium text-center">Convert LFTs</div>
                <div className="text-xs text-muted-foreground text-center">
                  {user.lfts} LFTs available
                </div>
                <Button
                  size="sm"
                  onClick={() => handleLftTocLftSwap(user.lfts)}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                >
                  <div className="flex items-center gap-2">
                    Convert All →
                    <img src="/OPY.png" alt="cLT" className="h-4 w-4 rounded-full hidden sm:inline-block" />
                    cLT
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
