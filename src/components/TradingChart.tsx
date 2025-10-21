import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Line, LineChart as RechartsLineChart, XAxis, YAxis } from "recharts";
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency, formatCurrencyK } from '@/lib/utils';

interface Transaction {
  timestamp: number;
  price: number;
  amount: number;
  type: 'buy' | 'sell';
}

interface TradingChartProps {
  currentPrice: number;
  cLftReserve: number;
  usdcReserve: number;
  totalLiquidity: number;
  transactions?: Transaction[];
  onPriceChange?: (price: number) => void;
}

export default function TradingChart({ 
  currentPrice, 
  cLftReserve, 
  usdcReserve, 
  totalLiquidity,
  transactions = [],
  onPriceChange 
}: TradingChartProps) {
  const [timeframe, setTimeframe] = useState<'1m' | '5m' | '15m' | '1h' | '4h' | '1d'>('15m');
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 768;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Generate chart data from real DEX transactions
  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      // Return empty data if no transactions
      return [];
    }

    // Sort transactions by timestamp
    const sortedTransactions = [...transactions].sort((a, b) => a.timestamp - b.timestamp);
    
    // Filter by timeframe
    const now = Date.now();
    const timeframeMs = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000
    }[timeframe];

    const cutoffTime = now - timeframeMs * 50; // Show last 50 time periods
    const filteredTransactions = sortedTransactions.filter(tx => tx.timestamp > cutoffTime);

    if (filteredTransactions.length === 0) {
      return [];
    }

    // Create chart data points from transactions (ensure chronological order: left = oldest, right = newest)
    const data = filteredTransactions
      .sort((a, b) => a.timestamp - b.timestamp) // Ensure oldest to newest
      .map((transaction, index) => {
        const date = new Date(transaction.timestamp);
        let timeLabel = '';
        
        if (timeframe === '1m') {
          timeLabel = date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
        } else if (timeframe === '5m' || timeframe === '15m') {
          timeLabel = date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
        } else if (timeframe === '1h') {
          timeLabel = date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit' }) + 'h';
        } else if (timeframe === '4h') {
          timeLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } else {
          timeLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
        
        return {
          label: timeLabel,
          value: Number(transaction.price.toFixed(4)),
          timestamp: transaction.timestamp,
          type: transaction.type,
          amount: transaction.amount
        };
      });
    
    return data;
  }, [transactions, timeframe]);

  // Calculate 24h change based on actual 24-hour period
  const change24h = useMemo(() => {
    if (transactions.length === 0) return 0;
    
    const now = Date.now();
    const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);
    
    // Find the closest transaction to 24 hours ago
    const sortedTransactions = [...transactions].sort((a, b) => a.timestamp - b.timestamp);
    
    // Find the price 24 hours ago (or earliest available)
    let price24hAgo = sortedTransactions[0]?.price || currentPrice;
    
    for (const tx of sortedTransactions) {
      if (tx.timestamp >= twentyFourHoursAgo) {
        break;
      }
      price24hAgo = tx.price;
    }
    
    // Calculate percentage change
    if (price24hAgo === 0) return 0;
    return ((currentPrice - price24hAgo) / price24hAgo) * 100;
  }, [transactions, currentPrice]);

  const high24h = useMemo(() => {
    if (transactions.length === 0) return currentPrice;
    
    const now = Date.now();
    const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);
    
    // Get transactions from last 24 hours
    const recent24h = transactions.filter(tx => tx.timestamp >= twentyFourHoursAgo);
    
    if (recent24h.length === 0) return currentPrice;
    
    const prices = recent24h.map(tx => tx.price);
    prices.push(currentPrice); // Include current price
    
    return Math.max(...prices);
  }, [transactions, currentPrice]);
  
  const low24h = useMemo(() => {
    if (transactions.length === 0) return currentPrice;
    
    const now = Date.now();
    const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);
    
    // Get transactions from last 24 hours
    const recent24h = transactions.filter(tx => tx.timestamp >= twentyFourHoursAgo);
    
    if (recent24h.length === 0) return currentPrice;
    
    const prices = recent24h.map(tx => tx.price);
    prices.push(currentPrice); // Include current price
    
    return Math.min(...prices);
  }, [transactions, currentPrice]);

  const formatChartPriceTick = (value: number) => {
    if (value >= 1000) return formatCurrencyK(value);
    if (value >= 100) return `$${(value / 100).toFixed(1)}h`;
    return formatCurrency(value);
  };

  const chartConfig = {
    value: { 
      label: "Price", 
      color: "#22c55e" 
    }
  } as const;

  const chartMargins = useMemo(
    () => ({
      left: 0,
      right: isMobile ? 8 : 60,
      top: 20,
      bottom: 20,
    }),
    [isMobile],
  );

  const yAxisWidth = isMobile ? 48 : 60;

  return (
    <Card className="border-0 rounded-none md:rounded-3xl bg-background/50 backdrop-blur-sm mx-0">
      <CardHeader className="pb-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-3">
              <div className="flex items-center gap-2">
                <img src="/OPY.png" alt="cLT" className="h-8 w-8 rounded-full hidden sm:inline-block" />
                <span>cLT / USDC</span>
                <div className="ml-2 px-2 py-1 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg text-xs text-blue-600 font-medium">
                  Single Asset Trading
                </div>
              </div>
            </CardTitle>
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex items-center gap-4">
                <div className="text-3xl font-mono font-bold">
                  {formatCurrency(currentPrice)}
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
                  change24h >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {change24h >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Current USD value per cLT • Based on demand & supply dynamics
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Timeframe buttons */}
            {(['1m', '5m', '15m', '1h', '4h', '1d'] as const).map((tf) => (
              <Button
                key={tf}
                variant={timeframe === tf ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimeframe(tf)}
                className="text-xs"
              >
                {tf}
              </Button>
            ))}
          </div>
        </div>

      </CardHeader>

      <CardContent className="p-0 md:p-6">
        {/* Professional Trading Chart using Recharts */}
        <div className="w-full h-[400px] bg-background/20 rounded-none md:rounded-2xl overflow-hidden relative">
          {chartData.length === 0 ? (
            // Empty state when no transactions
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-3">
                <div className="text-muted-foreground text-lg font-medium">No cLT Trading Data</div>
                <div className="text-muted-foreground/70 text-sm max-w-sm">
                  Start buying or selling cLT below to see live price discovery based on demand & supply with HybridDEX Smart Price Window Logic.
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/50 mt-4">
                  <div className="w-2 h-2 bg-blue-500/50 rounded-full animate-pulse"></div>
                  <span>HybridDEX Protocol • Single Asset Trading</span>
                </div>
              </div>
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-full w-full">
              <RechartsLineChart data={chartData} margin={chartMargins}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" hide />
                <YAxis
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  width={yAxisWidth}
                  tickFormatter={formatChartPriceTick}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12, textAnchor: "end" }}
                  domain={['dataMin - 0.5', 'dataMax + 0.5']}
                  padding={{ top: 10, bottom: 10 }}
                  reversed={false}
                />
                <ChartTooltip 
                  cursor={false} 
                  content={<ChartTooltipContent hideLabel />} 
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#22c55e" 
                  strokeWidth={3} 
                  dot={{ fill: "#22c55e", r: 3 }}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="url(#colorValue)"
                />
              </RechartsLineChart>
            </ChartContainer>
          )}
        </div>

        {/* DEX Statistics - Below Chart */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 p-4 md:p-0 text-sm">
          <div>
            <div className="text-muted-foreground text-xs">24h High</div>
            <div className="font-mono font-semibold">{formatCurrency(high24h)}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">24h Low</div>
            <div className="font-mono font-semibold">{formatCurrency(low24h)}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">cLT Reserve</div>
            <div className="font-mono font-semibold">{formatCurrencyK(cLftReserve)}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">USDC Reserve</div>
            <div className="font-mono font-semibold">{formatCurrency(usdcReserve)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
