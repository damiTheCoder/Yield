import { useMemo, useState, useCallback } from "react";
import { useApp } from "@/lib/app-state";
import { formatCurrency, formatCurrencyK, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, RefreshCw, Activity } from "lucide-react";

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
  const { assets, user } = useApp();
  
  const [activeTab, setActiveTab] = useState<'swap' | 'limit' | 'buy' | 'sell'>('swap');
  const [orderQuantity, setOrderQuantity] = useState('');
  const [swapFromAmount, setSwapFromAmount] = useState('');
  const [swapToAmount, setSwapToAmount] = useState('');
  
  // cLFT DEX State
  const [cLftBalance, setCLftBalance] = useState(0);
  const [usdcBalance, setUsdcBalance] = useState(user.usd);
  const [slippageTolerance, setSlippageTolerance] = useState(0.5); // 0.5% default

  // Calculate Consolidated Pool Metrics with cLFT DEX Logic
  const poolMetrics = useMemo(() => {
    const totalLiquidity = assets.reduce((sum, asset) => sum + asset.cycle.reserve, 0);
    const totalUnredeemedLFTs = assets.reduce((sum, asset) => sum + asset.cycle.supply, 0);
    const totalCycles = assets.reduce((sum, asset) => sum + asset.cycle.cycle, 0);

    // cLFT DEX Pool (AMM Model - Uniswap Style)
    const cLftReserve = totalUnredeemedLFTs * 0.8; // 80% of LFTs converted to cLFTs
    const usdcReserve = totalLiquidity * 0.6; // 60% paired as USDC liquidity
    const constantProduct = cLftReserve * usdcReserve; // x * y = k for AMM
    
    // Current cLFT price based purely on AMM ratio (market-driven price)
    const cLftPrice = usdcReserve > 0 ? usdcReserve / cLftReserve : 13.13; // Default starting price
    
    // Trading fee (0.3% like Uniswap)
    const tradingFee = 0.003;
    
    // AMM Swap Functions
    const getSwapOutput = (amountIn: number, isSwapTocLft: boolean) => {
      if (isSwapTocLft) {
        // USDC → cLFT swap
        const amountInWithFee = amountIn * (1 - tradingFee);
        const newUsdcReserve = usdcReserve + amountInWithFee;
        const newCLftReserve = constantProduct / newUsdcReserve;
        return cLftReserve - newCLftReserve;
      } else {
        // cLFT → USDC swap
        const amountInWithFee = amountIn * (1 - tradingFee);
        const newCLftReserve = cLftReserve + amountInWithFee;
        const newUsdcReserve = constantProduct / newCLftReserve;
        return usdcReserve - newUsdcReserve;
      }
    };
    
    const calculatePriceImpact = (amountIn: number, isSwapTocLft: boolean) => {
      const outputAmount = getSwapOutput(amountIn, isSwapTocLft);
      let expectedPrice: number;
      let actualPrice: number;
      
      if (isSwapTocLft) {
        expectedPrice = cLftPrice;
        actualPrice = amountIn / outputAmount;
      } else {
        expectedPrice = 1 / cLftPrice;
        actualPrice = outputAmount / amountIn;
      }
      
      return Math.abs((actualPrice - expectedPrice) / expectedPrice) * 100;
    };
    
    return {
      totalLiquidity,
      totalUnredeemedLFTs,
      totalCycles,
      avgLiquidityPerCycle: totalCycles > 0 ? totalLiquidity / totalCycles : 0,
      cLftReserve,
      usdcReserve,
      constantProduct,
      cLftPrice,
      tradingFee,
      getSwapOutput,
      calculatePriceImpact
    };
  }, [assets]);

  // cLFT DEX Trading Functions
  const handleLftTocLftSwap = useCallback((lftAmount: number) => {
    if (lftAmount <= 0 || user.lfts < lftAmount) {
      alert('Insufficient LFT balance for swap');
      return;
    }
    
    // Swap LFTs for cLFTs at 1:1 ratio for AMM trading
    // Note: By swapping, user gives up old reward eligibility for trading potential
    const cLftReceived = lftAmount; // 1:1 conversion
    setCLftBalance(prev => prev + cLftReceived);
    
    console.log(`🔄 Swapped ${lftAmount} LFTs → ${cLftReceived} cLFTs`);
    console.log(`🚀 Ready for AMM trading! (Old rewards forfeited for trading potential)`);
  }, [user.lfts]);

  const handleCLftSwap = useCallback((amountIn: number, isSwapTocLft: boolean) => {
    const amountOut = poolMetrics.getSwapOutput(amountIn, isSwapTocLft);
    const priceImpact = poolMetrics.calculatePriceImpact(amountIn, isSwapTocLft);
    const tradingFee = amountIn * poolMetrics.tradingFee;
    
    if (isSwapTocLft) {
      // Buy cLFTs with USDC
      if (usdcBalance < amountIn) {
        alert('Insufficient USDC balance');
        return;
      }
      
      setUsdcBalance(prev => prev - amountIn);
      setCLftBalance(prev => prev + amountOut);
      
      console.log(`🔄 AMM Swap: ${formatCurrency(amountIn)} USDC → ${amountOut.toFixed(4)} cLFT`);
      console.log(`📈 Price Impact: ${priceImpact.toFixed(2)}% | Trading Fee: ${formatCurrency(tradingFee)}`);
    } else {
      // Sell cLFTs for USDC
      if (cLftBalance < amountIn) {
        alert('Insufficient cLFT balance');
        return;
      }
      
      setCLftBalance(prev => prev - amountIn);
      setUsdcBalance(prev => prev + amountOut);
      
      console.log(`🔄 AMM Swap: ${amountIn.toFixed(4)} cLFT → ${formatCurrency(amountOut)} USDC`);
      console.log(`📉 Price Impact: ${priceImpact.toFixed(2)}% | Trading Fee: ${formatCurrency(tradingFee)}`);
    }
  }, [poolMetrics, cLftBalance, usdcBalance]);

  const handlePlaceOrder = useCallback(() => {
    const quantity = parseFloat(orderQuantity);
    if (!orderQuantity || quantity <= 0) return;
    
    if (activeTab === 'buy') {
      // Buy cLFTs using AMM
      handleCLftSwap(quantity, true);
    } else if (activeTab === 'sell') {
      // Sell cLFTs using AMM
      handleCLftSwap(quantity, false);
    }
    
    setOrderQuantity('');
  }, [activeTab, orderQuantity, handleCLftSwap]);

  const handleSwapEstimate = useCallback(() => {
    const fromAmount = parseFloat(swapFromAmount);
    if (!fromAmount) return;
    
    if (activeTab === 'swap') {
      // Assume USDC → cLFT for simplicity
      const outputAmount = poolMetrics.getSwapOutput(fromAmount, true);
      setSwapToAmount(outputAmount.toFixed(4));
    }
  }, [swapFromAmount, poolMetrics, activeTab]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4 md:p-6">
      <div className="w-full max-w-7xl mx-auto space-y-6">


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trading Interface - Left Side */}
          <Card className="lg:col-span-2 bg-card/90 dark:bg-card/95 md:bg-gradient-to-br md:from-background/80 md:to-muted/30 border-0 rounded-3xl md:backdrop-blur-sm md:shadow-xl">
            <CardHeader className="pb-2">
              {/* Tab Navigation */}
              <div className="flex space-x-1 bg-muted/50 rounded-lg p-1">
                {(['swap', 'buy', 'sell'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "flex-1 text-sm font-medium py-2 px-3 rounded-md transition-all",
                      activeTab === tab
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tab === 'swap' ? 'Swap' : tab === 'buy' ? 'Buy' : 'Sell'}
                  </button>
                ))}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Balances Display */}
              <div className="bg-muted/50 rounded-2xl p-4 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src="/OPY.png" alt="cLFT" className="h-4 w-4 rounded-full" />
                    <span>cLFT: <span className="font-mono font-medium">{cLftBalance.toFixed(4)}</span></span>
                  </div>
                  <div className="w-px h-4 bg-border"></div>
                  <div className="flex items-center gap-2">
                    <img src="/USD Coin (USDC) Vector Logo.jpeg" alt="USDC" className="h-4 w-4 rounded-full" />
                    <span>USDC: <span className="font-mono font-medium">{formatCurrency(usdcBalance)}</span></span>
                  </div>
                </div>
              </div>

              {activeTab === 'swap' && (
                <div className="relative">
                  {/* You send section */}
                  <div className="space-y-3 pb-3">
                    <div className="flex justify-between items-center">
                      <label className="text-sm text-muted-foreground">You send</label>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span>Balance: {formatCurrency(usdcBalance)}</span>
                      </div>
                    </div>
                    <div className="bg-muted/60 rounded-2xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img src="/USD Coin (USDC) Vector Logo.jpeg" alt="USDC" className="h-8 w-8 rounded-full" />
                          <span className="font-medium text-lg">USDC</span>
                        </div>
                        <div className="flex-1 text-right">
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={swapFromAmount}
                            onChange={(e) => setSwapFromAmount(e.target.value)}
                            className="text-right text-2xl font-mono bg-transparent border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Swap arrow button - positioned to overlap both sections */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSwapEstimate}
                      className="w-12 h-12 rounded-full border-2 p-0 bg-background shadow-lg hover:shadow-xl transition-all"
                    >
                      <TrendingDown className="h-5 w-5 rotate-90" />
                    </Button>
                  </div>

                  {/* You receive section */}
                  <div className="space-y-3 pt-3">
                    <div className="flex justify-between items-center">
                      <label className="text-sm text-muted-foreground">You receive</label>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span>Balance: {cLftBalance.toFixed(4)}</span>
                      </div>
                    </div>
                    <div className="bg-muted/60 rounded-2xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img src="/OPY.png" alt="cLFT" className="h-8 w-8 rounded-full" />
                          <span className="font-medium text-lg">cLFT</span>
                        </div>
                        <div className="flex-1 text-right">
                          <div className="text-2xl font-mono text-muted-foreground">
                            {swapToAmount || "0.0000"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {swapFromAmount && parseFloat(swapFromAmount) > 0 && (
                    <div className="bg-muted/60 rounded-2xl border-0 p-4 text-sm space-y-2">
                      <div className="flex justify-between">
                        <span>Exchange Rate:</span>
                        <span className="font-medium">{formatCurrency(poolMetrics.cLftPrice)} per cLFT</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Price Impact:</span>
                        <span className={`font-medium ${
                          poolMetrics.calculatePriceImpact(parseFloat(swapFromAmount), true) > 5 ? 'text-red-500' : 'text-yellow-500'
                        }`}>
                          {poolMetrics.calculatePriceImpact(parseFloat(swapFromAmount), true).toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-muted-foreground/20 pt-3">
                        <span>Trading Fee:</span>
                        <span className="font-medium">{formatCurrency(parseFloat(swapFromAmount) * poolMetrics.tradingFee)}</span>
                      </div>
                    </div>
                  )}

                  <div className="pt-6">
                    <Button 
                      className="w-full h-14 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all text-lg"
                      disabled={!swapFromAmount || parseFloat(swapFromAmount) <= 0 || usdcBalance < parseFloat(swapFromAmount || '0')}
                      onClick={() => swapFromAmount && handleCLftSwap(parseFloat(swapFromAmount), true)}
                    >
                      {!swapFromAmount || parseFloat(swapFromAmount) <= 0 
                        ? 'Enter amount to swap' 
                        : usdcBalance < parseFloat(swapFromAmount || '0')
                        ? 'Insufficient USDC balance'
                        : 'Swap USDC → cLFT'
                      }
                    </Button>
                  </div>
                </div>
              )}

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
                        <img src="/USD Coin (USDC) Vector Logo.jpeg" alt="USDC" className="h-4 w-4 rounded-full" />
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
                        <span>cLFT Output (AMM):</span>
                        <div className="flex items-center gap-1 font-medium text-green-500">
                          <img src="/OPY.png" alt="cLFT" className="h-3 w-3 rounded-full" />
                          {poolMetrics.getSwapOutput(parseFloat(orderQuantity), true).toFixed(4)}
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span>Price Impact:</span>
                        <span className={`font-medium ${
                          poolMetrics.calculatePriceImpact(parseFloat(orderQuantity), true) > 5 ? 'text-red-500' : 'text-yellow-500'
                        }`}>
                          {poolMetrics.calculatePriceImpact(parseFloat(orderQuantity), true).toFixed(2)}%
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
                    disabled={!orderQuantity || parseFloat(orderQuantity) <= 0 || usdcBalance < parseFloat(orderQuantity || '0')}
                    onClick={() => handlePlaceOrder()}
                  >
                    {!orderQuantity || parseFloat(orderQuantity) <= 0 
                      ? 'Enter USDC amount' 
                      : usdcBalance < parseFloat(orderQuantity || '0')
                      ? 'Insufficient USDC balance'
                      : 'Buy cLFT via AMM'
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
                        <span>USDC Output (AMM):</span>
                        <div className="flex items-center gap-1 font-medium text-red-500">
                          <img src="/USD Coin (USDC) Vector Logo.jpeg" alt="USDC" className="h-3 w-3 rounded-full" />
                          {formatCurrency(poolMetrics.getSwapOutput(parseFloat(orderQuantity), false))}
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span>Price Impact:</span>
                        <span className={`font-medium ${
                          poolMetrics.calculatePriceImpact(parseFloat(orderQuantity), false) > 5 ? 'text-red-500' : 'text-yellow-500'
                        }`}>
                          {poolMetrics.calculatePriceImpact(parseFloat(orderQuantity), false).toFixed(2)}%
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
                    disabled={!orderQuantity || parseFloat(orderQuantity) <= 0 || cLftBalance < parseFloat(orderQuantity || '0')}
                    onClick={() => handlePlaceOrder()}
                  >
                    {!orderQuantity || parseFloat(orderQuantity) <= 0 
                      ? 'Enter cLFT amount' 
                      : cLftBalance < parseFloat(orderQuantity || '0')
                      ? 'Insufficient cLFT balance'
                      : 'Sell cLFT via AMM'
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
                <h3 className="font-semibold mb-4 text-lg">Pool Stats</h3>
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
                    <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">cLFT Price</div>
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
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Total Liquidity</div>
                  <div className="font-mono text-sm font-semibold">{formatCurrency(poolMetrics.totalLiquidity)}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Unredeemed LFTs</div>
                  <div className="font-mono text-sm font-semibold">{poolMetrics.totalUnredeemedLFTs.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">cLFT Price</div>
                  <div className="font-mono text-sm font-semibold">{formatCurrency(poolMetrics.cLftPrice)}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Trading Fee</div>
                  <div className="font-mono text-sm font-semibold">{(poolMetrics.tradingFee * 100).toFixed(1)}%</div>
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
                    <img src="/OPY.png" alt="cLFT" className="h-4 w-4 rounded-full" />
                    cLFT
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
