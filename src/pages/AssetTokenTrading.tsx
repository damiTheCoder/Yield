import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApp, type Asset } from "@/lib/app-state";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, ComposedChart, Bar } from "recharts";
import { cn, formatCurrency, formatCurrencyK } from "@/lib/utils";
import {
  BarChart3,
  Flame,
  Power,
  Radio,
  TrendingUp,
  CandlestickChart,
} from "lucide-react";

const TIMEFRAMES = ["1H", "4H", "1D", "1W", "1M"] as const;

type OrderSide = "buy" | "sell";
type OrderType = "limit" | "market";

type ChartPoint = { label: string; value: number };
type CandleData = { label: string; open: number; high: number; low: number; close: number; isBullish: boolean };
type SimpleOrder = { price: number; amount: number };
type OrderBook = { bids: SimpleOrder[]; asks: SimpleOrder[] };
type Trade = { id: string; time: string; price: number; amount: number; side: OrderSide };

type Stat = { label: string; value: string; helper?: string };
type CandleShapeProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  payload: CandleData;
};

const hashString = (value: string) =>
  value.split("").reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 1), 0);

const getTimeframeLength = (timeframe: (typeof TIMEFRAMES)[number]) => {
  switch (timeframe) {
    case "1H":
      return 24;
    case "4H":
      return 32;
    case "1D":
      return 48;
    case "1W":
      return 56;
    case "1M":
      return 64;
    default:
      return 48;
  }
};

const buildChart = (asset: Asset, currentPrice: number, timeframe: (typeof TIMEFRAMES)[number]): ChartPoint[] => {
  const length = getTimeframeLength(timeframe);
  const seed = hashString(`${asset.id}-${asset.cycle.cycle}-${asset.cycle.totalSales.toFixed(2)}`);
  const base = Math.max(currentPrice, asset.cycle.lpu, 0.0001);
  const momentum = Math.tanh(asset.cycle.totalSales / Math.max(asset.params.initialReserve, 1)) * 0.12;
  const volatility = Math.min(
    0.12,
    0.015 +
      asset.cycle.cycle * 0.004 +
      ((asset.cycle.accrued.currentCycleLiquidity ?? 0) / Math.max(asset.cycle.reserve, 1)) * 0.05,
  );

  return Array.from({ length }).map((_, index) => {
    const progress = length > 1 ? index / (length - 1) : 0;
    const fastWave = Math.sin((index + (seed % 13)) * 0.45) * volatility;
    const slowWave = Math.cos((index + (seed % 17)) * 0.14) * (volatility * 0.6);
    const drift = (progress - 0.5) * momentum;
    const value = Math.max(0.0001, base * (1 + fastWave + slowWave + drift));
    return {
      label: `${index + 1}`,
      value: Number(value.toFixed(4)),
    };
  });
};

const buildCandleData = (chartData: ChartPoint[]): CandleData[] => {
  if (chartData.length === 0) return [];
  const source = chartData.slice(Math.max(0, chartData.length - 30));
  const baseline = source[0]?.value ?? 0.0001;
  return source.map((point, index) => {
    const open = Number((source[index - 1]?.value ?? baseline).toFixed(4));
    const close = Number(point.value.toFixed(4));
    const wick = Math.max(baseline * 0.002, Math.abs(close - open) * 0.35);
    const high = Number((Math.max(open, close) + wick).toFixed(4));
    const low = Number((Math.max(0.0001, Math.min(open, close) - wick)).toFixed(4));
    return {
      label: `${index + 1}`,
      open,
      high,
      low,
      close,
      isBullish: close >= open,
    };
  });
};

const buildOrderBook = (price: number, asset: Asset): OrderBook => {
  const scale = Math.max(price, 0.0001);
  const baseQuantity = Math.max(
    500,
    Math.round((asset.cycle.reserve / Math.max(asset.cycle.supply, 1)) * 2_500),
  );
  const demandFactor = Math.max(
    1,
    Math.round(asset.cycle.totalSales / Math.max(asset.cycle.lpu * 0.4, 1)),
  );
  return {
    bids: Array.from({ length: 10 }).map((_, index) => ({
      price: Number((scale * (1 - 0.0025 * (index + 1))).toFixed(4)),
      amount: baseQuantity + (10 - index) * Math.round(baseQuantity * 0.18) + demandFactor * 25,
    })),
    asks: Array.from({ length: 10 }).map((_, index) => ({
      price: Number((scale * (1 + 0.0025 * (index + 1))).toFixed(4)),
      amount: baseQuantity + (index + 1) * Math.round(baseQuantity * 0.16) + demandFactor * 20,
    })),
  };
};

const buildTrades = (orderBook: OrderBook): Trade[] =>
  Array.from({ length: 16 }).map((_, index) => {
    const side: OrderSide = index % 2 === 0 ? "buy" : "sell";
    const level = index % Math.min(orderBook.bids.length, orderBook.asks.length);
    const price = side === "buy" ? orderBook.bids[level]?.price ?? 0 : orderBook.asks[level]?.price ?? 0;
    const amountBase = side === "buy" ? orderBook.bids[level]?.amount ?? 0 : orderBook.asks[level]?.amount ?? 0;
    const hour = 11 + Math.floor(index / 4);
    const minute = (index * 7 + 12) % 60;
    return {
      id: `trade-${index}`,
      time: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
      side,
      price: Number(price.toFixed(4)),
      amount: Number((amountBase * (0.18 + (index % 5) * 0.06)).toFixed(2)),
    };
  });

const formatPriceInputValue = (price: number, multiplier = 1) =>
  price > 0 ? (price * multiplier).toFixed(4) : "";

const useStats = (
  asset: Asset | undefined,
  latestPrice: number,
  tokenInfo?: { remainingLfts: number; supply: number; phase: "hunt" | "market" } | null,
): Stat[] => {
  if (!asset) {
    return [];
  }

  const reserve = asset.cycle.reserve;
  const liquidityDelta = asset.cycle.accrued.currentCycleLiquidity ?? 0;
  const estimatedTagPrice = Math.max(4.2, asset.cycle.lpu * 0.4);
  const holders = Math.max(1, Math.round(asset.cycle.totalSales / estimatedTagPrice));
  const revealProgress =
    tokenInfo?.phase === "market"
      ? 100
      : tokenInfo && tokenInfo.supply > 0
      ? Math.min(100, Math.max(0, ((tokenInfo.supply - tokenInfo.remainingLfts) / tokenInfo.supply) * 100))
      : 0;

  return [
    { label: "TVL", value: formatCurrencyK(reserve), helper: "Vault-backed" },
    { label: "Last Price", value: formatCurrency(latestPrice), helper: asset.ticker ?? "—" },
    { label: "24H Volume", value: formatCurrencyK(Math.max(asset.cycle.totalSales, asset.cycle.reserve * 0.24)) },
    { label: "Active Holders", value: holders.toLocaleString() },
    { label: "Cycle Liquidity Δ", value: `${liquidityDelta >= 0 ? "+" : ""}${formatCurrencyK(liquidityDelta)}` },
    { label: "Reveal Progress", value: `${Math.round(revealProgress)}%` },
  ];
};

export default function AssetTokenTrading() {
  const { id } = useParams<{ id: string }>();
  const { assets, user, userAssets, getAssetTokenInfo } = useApp();
  const { theme } = useTheme();
  const navigate = useNavigate();
  
  const isDarkTheme = theme === "dark";

  const asset = useMemo(() => assets.find((entry) => entry.id === id), [assets, id]);
  const tokenInfo = id ? getAssetTokenInfo(id) : null;
  const currentPrice = tokenInfo?.price ?? 0.84;

  const [swapMode, setSwapMode] = useState<OrderSide>("buy");
  const [timeframe, setTimeframe] = useState<(typeof TIMEFRAMES)[number]>("1D");
  const [chartType, setChartType] = useState<"line" | "candle">("line");
  const [fromAmount, setFromAmount] = useState("500");
  const [slippage, setSlippage] = useState(0.5);
  const [orderType, setOrderType] = useState<OrderType>("limit");
  const [tradeSide, setTradeSide] = useState<OrderSide>("buy");
  const [priceInput, setPriceInput] = useState(() => formatPriceInputValue(currentPrice));
  const [amountInput, setAmountInput] = useState("1000");
  const [leverage, setLeverage] = useState(2);
  const [stopLoss, setStopLoss] = useState(() => formatPriceInputValue(currentPrice, 0.95));
  const [takeProfit, setTakeProfit] = useState(() => formatPriceInputValue(currentPrice, 1.1));
  const [sidebarView, setSidebarView] = useState<"orderbook" | "trades">("orderbook");
  const [showTradingModal, setShowTradingModal] = useState(false);
  const [modalTradeSide, setModalTradeSide] = useState<OrderSide>("buy");

  useEffect(() => {
    setPriceInput(formatPriceInputValue(currentPrice));
    setStopLoss(formatPriceInputValue(currentPrice, 0.95));
    setTakeProfit(formatPriceInputValue(currentPrice, 1.1));
  }, [asset?.id, currentPrice]);
  const chartData = useMemo(
    () => (asset ? buildChart(asset, currentPrice, timeframe) : []),
    [asset, currentPrice, timeframe],
  );
  const candleData = useMemo(() => buildCandleData(chartData), [chartData]);
  const orderBook = useMemo(() => (asset ? buildOrderBook(currentPrice, asset) : { bids: [], asks: [] }), [asset, currentPrice]);
  const trades = useMemo(() => buildTrades(orderBook), [orderBook]);
  const stats = useStats(asset, currentPrice, tokenInfo);
  const parsedLimitPrice = Number(priceInput);
  const effectivePrice =
    orderType === "market" || !parsedLimitPrice
      ? currentPrice
      : parsedLimitPrice;
  const parsedOrderPrice = Number.isFinite(effectivePrice) ? Math.max(effectivePrice, 0) : 0;
  const parsedOrderAmount = Math.max(Number(amountInput) || 0, 0);
  const notionalValue = parsedOrderPrice * parsedOrderAmount;
  const estimatedCost = formatCurrency(notionalValue);
  const estimatedFeeValue = notionalValue * 0.001;
  const estimatedFee = formatCurrency(estimatedFeeValue);
  const tradingEnabled = Boolean(tokenInfo && (tokenInfo.unlocked || tokenInfo.phase === "market"));
  const phaseLabel = tokenInfo?.phase === "market" ? "Market Phase (WALV)" : tokenInfo?.unlocked ? "Trading Enabled" : "Hunt Phase";
  const phaseHelper =
    tokenInfo?.phase === "market"
      ? "Redemption is closed. Trading price follows WALV."
      : tokenInfo?.unlocked
      ? "Discovery complete. Token trading is active."
      : "Trading unlocks after hunt discovery completes.";
  const priceChangePct = useMemo(() => {
    if (chartData.length < 2) return 0;
    const start = chartData[0]?.value ?? currentPrice;
    const end = chartData[chartData.length - 1]?.value ?? currentPrice;
    if (start <= 0) return 0;
    return Number((((end - start) / start) * 100).toFixed(2));
  }, [chartData, currentPrice]);
  const priceChangeLabel = `${priceChangePct >= 0 ? "+" : ""}${priceChangePct.toFixed(2)}% (24h)`;
  const priceChangeTone = priceChangePct >= 0 ? "text-emerald-500" : "text-rose-500";


  if (!asset) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 px-6 text-center text-white">
        <div className="space-y-4 max-w-md">
          <h1 className="text-3xl font-semibold">Asset not found</h1>
          <p className="text-sm text-white/70">
            The ecosystem you requested is unavailable. Return to the assets directory to browse active launches and cycles.
          </p>
          <Button variant="secondary" onClick={() => navigate("/assets")}>
            Back to Assets
          </Button>
        </div>
      </main>
    );
  }

  const isBuyingAsset = swapMode === "buy";
  const fromTokenLabel = isBuyingAsset ? "USDC" : asset.ticker ?? asset.name;
  const toTokenLabel = isBuyingAsset ? asset.ticker ?? asset.name : "USDC";
  const parsedAmount = Number(fromAmount) || 0;
  const quoteAmount =
    !parsedAmount || !currentPrice
      ? 0
      : isBuyingAsset
        ? parsedAmount / Math.max(currentPrice, 0.0001)
        : parsedAmount * currentPrice;
  const minReceive = quoteAmount ? quoteAmount * (1 - slippage / 100) : 0;
  const poolDepth = orderBook.bids.concat(orderBook.asks).reduce((sum, entry) => sum + entry.amount, 0);
  const poolShare = parsedAmount && asset.cycle.reserve ? Math.min(100, (parsedAmount / asset.cycle.reserve) * 8) : 0;
  const priceImpact = parsedAmount ? Math.min(3, poolShare / 2.5) : 0;
  const feeValue = parsedAmount * 0.003;
  const routeSegments = isBuyingAsset
    ? ["USDC", "Vault Router", asset.ticker ?? asset.name]
    : [asset.ticker ?? asset.name, "Vault Router", "USDC"];
  const networkLabel = "Base";
  const slippageOptions = [0.1, 0.5, 1];
  const formatTokenValue = (amount: number, token: string) => {
    if (!amount) return "0";
    if (token?.toUpperCase() === "USDC") {
      return formatCurrency(amount);
    }
    return `${amount.toFixed(3)} ${token}`;
  };
  const highlightStats = [
    {
      label: "Vault Liquidity",
      value: formatCurrency(asset.cycle.reserve),
      helper: "Depth secured",
      icon: BarChart3,
    },
    {
      label: "24H Volume",
      value: stats.find((s) => s.label === "24H Volume")?.value ?? formatCurrencyK(asset.cycle.reserve * 0.42),
      helper: "Organic flow",
      icon: TrendingUp,
    },
    {
      label: "Active Holders",
      value: stats.find((s) => s.label === "Active Holders")?.value ?? "—",
      helper: "Connected wallets",
      icon: Radio,
    },
  ] as const;
  const avgEntry = trades.length > 0 ? trades.reduce((sum, trade) => sum + trade.price, 0) / trades.length : currentPrice;
  const queueNotional = orderBook.bids.slice(0, 5).reduce((sum, bid) => sum + bid.price * bid.amount, 0);
  const longPositionValue = (userAssets[asset.id]?.lfts ?? 0) * currentPrice;
  const executionWindow = poolDepth > 150_000 ? "~20s" : poolDepth > 75_000 ? "~1 min" : "~2 mins";
  const liquidityLabel = poolDepth > 100_000 ? "Deep" : poolDepth > 40_000 ? "Healthy" : "Thin";

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-4 pb-32 lg:pb-8 sm:px-6 lg:px-8">
        {/* Asset Header & Chart - Desktop Only, Full Width */}
        <div className="hidden lg:block px-0">
          {/* Asset Header with Chart */}
          <div className="bg-background">
            {/* Asset Info Header */}
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 sm:h-16 sm:w-16 overflow-hidden rounded-full">
                <img src={asset.image} alt={asset.name} className="h-full w-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 sm:gap-3 mb-1">
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate max-w-[140px] sm:max-w-none">{asset.name}</h1>
                  <img src="/checklist.png" alt="verified" className="h-4 w-4 sm:h-5 sm:w-5 opacity-80 flex-shrink-0" />
                  {asset.ticker && (
                    <span className="rounded-full bg-surface px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex-shrink-0">
                      {asset.ticker}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground">
                  <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    {phaseLabel}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">{phaseHelper}</p>
              </div>
              
              {/* Timeframe Selector */}
              <div className="flex items-center gap-1 rounded-2xl bg-surface p-1 text-xs font-medium">
                {TIMEFRAMES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setTimeframe(item)}
                    className={cn(
                      "rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 transition-colors text-xs",
                      timeframe === item 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Asset Price - Above Chart */}
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="text-3xl sm:text-4xl font-bold text-foreground">{formatCurrency(currentPrice)}</p>
                <p className={cn("text-sm font-semibold", priceChangeTone)}>{priceChangeLabel}</p>
              </div>
              <button
                onClick={() => setChartType(chartType === "line" ? "candle" : "line")}
                className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
                title={chartType === "line" ? "Switch to Candlestick" : "Switch to Line Chart"}
              >
                <CandlestickChart className={cn("h-5 w-5", chartType === "candle" ? "text-primary" : "text-muted-foreground")} />
              </button>
            </div>

            {/* Price Chart - Full Width */}
            <div className="h-[250px] sm:h-[320px] mb-6">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "line" ? (
                  <ChartContainer
                    config={{
                      value: {
                        label: "Price",
                        color: "hsl(var(--primary))",
                      },
                    }}
                  >
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="price-gradient-light" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="price-gradient-dark" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#000000" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="label" hide tickLine={false} axisLine={false} padding={{ left: 0, right: 0 }} />
                      <YAxis hide domain={["dataMin", "dataMax"]} />
                      <ChartTooltip cursor={{ stroke: "hsl(var(--border))" }} content={<ChartTooltipContent />} />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2.5} 
                        fill="url(#price-gradient-light)" 
                        className="dark:hidden"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2.5} 
                        fill="url(#price-gradient-dark)" 
                        className="hidden dark:block"
                      />
                    </AreaChart>
                  </ChartContainer>
                ) : (
                  <ChartContainer
                    config={{
                      bullish: {
                        label: "Bullish",
                        color: "#8b5cf6",
                      },
                      bearish: {
                        label: "Bearish",
                        color: "#ec4899",
                      },
                    }}
                  >
                    <ComposedChart data={candleData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                      <XAxis dataKey="label" hide tickLine={false} axisLine={false} />
                      <YAxis hide domain={["auto", "auto"]} />
                      <ChartTooltip 
                        cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }} 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload as CandleData;
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-sm">
                                <div className="grid gap-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[0.70rem] uppercase text-muted-foreground">Open</span>
                                    <span className="font-mono text-sm font-medium">${data.open.toFixed(4)}</span>
                                  </div>
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[0.70rem] uppercase text-muted-foreground">High</span>
                                    <span className="font-mono text-sm font-medium text-emerald-500">${data.high.toFixed(4)}</span>
                                  </div>
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[0.70rem] uppercase text-muted-foreground">Low</span>
                                    <span className="font-mono text-sm font-medium text-rose-500">${data.low.toFixed(4)}</span>
                                  </div>
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[0.70rem] uppercase text-muted-foreground">Close</span>
                                    <span className="font-mono text-sm font-medium">${data.close.toFixed(4)}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      {candleData.map((candle, index) => (
                        <Bar
                          key={index}
                          dataKey={() => [candle.low, candle.high]}
                          fill={candle.isBullish ? "#8b5cf6" : "#ec4899"}
                          shape={(props: CandleShapeProps) => {
                            const { x, y, width, height, payload } = props;
                            if (!payload) return null;
                            
                            // Candlestick dimensions
                            const candleWidth = Math.min(width * 0.8, 20); // Max 20px width
                            const wickWidth = 1.5;
                            const centerX = x + width / 2;
                            
                            // Calculate price positions
                            const priceRange = payload.high - payload.low;
                            if (priceRange === 0) return null;
                            
                            const highY = y;
                            const lowY = y + height;
                            const openY = y + ((payload.high - payload.open) / priceRange) * height;
                            const closeY = y + ((payload.high - payload.close) / priceRange) * height;
                            
                            // Body dimensions
                            const bodyTop = Math.min(openY, closeY);
                            const bodyBottom = Math.max(openY, closeY);
                            const bodyHeight = Math.max(bodyBottom - bodyTop, 1.5); // Minimum visible body
                            
                            const color = payload.isBullish ? "#8b5cf6" : "#ec4899";
                            
                            return (
                              <g>
                                {/* Upper Wick (from high to top of body) */}
                                <line
                                  x1={centerX}
                                  y1={highY}
                                  x2={centerX}
                                  y2={bodyTop}
                                  stroke={color}
                                  strokeWidth={wickWidth}
                                  opacity={0.8}
                                />
                                
                                {/* Lower Wick (from bottom of body to low) */}
                                <line
                                  x1={centerX}
                                  y1={bodyBottom}
                                  x2={centerX}
                                  y2={lowY}
                                  stroke={color}
                                  strokeWidth={wickWidth}
                                  opacity={0.8}
                                />
                                
                                {/* Candle Body */}
                                <rect
                                  x={centerX - candleWidth / 2}
                                  y={bodyTop}
                                  width={candleWidth}
                                  height={bodyHeight}
                                  fill={payload.isBullish ? color : color}
                                  stroke={color}
                                  strokeWidth={1}
                                  opacity={payload.isBullish ? 0.85 : 1}
                                  rx={1}
                                />
                              </g>
                            );
                          }}
                        />
                      ))}
                    </ComposedChart>
                  </ChartContainer>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Desktop 2-Column Layout - Trading Form & Stats */}
        <section className="hidden lg:grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          {/* Column 1: Trading Form */}
          <div>
            {/* Trading Form */}
            <div className="bg-gray-50 dark:bg-[#1a1a1a] p-6 rounded-xl border border-gray-200 dark:border-transparent">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                  <h3 className="font-semibold text-foreground">Place Order</h3>
                  <p className="text-sm text-muted-foreground">Trade {asset.name} with instant execution</p>
                </div>
                <div className="flex items-center gap-1 bg-surface p-1.5 text-xs font-medium rounded-full">
                  {(["limit", "market"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setOrderType(mode)}
                      className={cn(
                        "rounded-2xl px-4 py-2 capitalize transition-colors",
                        orderType === mode 
                          ? "bg-primary text-primary-foreground shadow-sm" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                      )}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  {/* Order Side Selection - Toggle */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                      <span>Order Side</span>
                      <span>Instant execution</span>
                    </div>
                    <div className="flex items-center gap-2 bg-surface p-1.5 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setTradeSide("buy")}
                        className={cn(
                          "flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-all duration-200",
                          tradeSide === "buy"
                            ? "bg-emerald-500 text-white shadow-sm"
                            : "text-foreground hover:text-emerald-600 dark:hover:text-emerald-400",
                        )}
                      >
                        BUY {asset.ticker || asset.name}
                      </button>
                      <button
                        type="button"
                        onClick={() => setTradeSide("sell")}
                        className={cn(
                          "flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-all duration-200",
                          tradeSide === "sell"
                            ? "bg-rose-500 text-white shadow-sm"
                            : "text-foreground hover:text-rose-600 dark:hover:text-rose-400",
                        )}
                      >
                        SELL {asset.ticker || asset.name}
                      </button>
                    </div>
                  </div>

                  {/* Price and Amount Inputs */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Price (USDC)
                      </label>
                      <Input
                        type="number"
                        value={priceInput}
                        onChange={(event) => setPriceInput(event.target.value)}
                        placeholder={currentPrice.toFixed(4)}
                        disabled={orderType === "market"}
                        className="h-12 bg-surface font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Amount
                      </label>
                      <Input
                        type="number"
                        value={amountInput}
                        onChange={(event) => setAmountInput(event.target.value)}
                        placeholder="1000"
                        className="h-12 bg-surface font-mono text-sm"
                      />
                    </div>
                  </div>

                  {/* Leverage Selector */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-muted-foreground">
                        Leverage
                      </label>
                      <span className="text-sm font-bold text-foreground">{leverage}x</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {[1, 2, 5, 10, 20].map((lev) => (
                        <button
                          key={lev}
                          onClick={() => setLeverage(lev)}
                          className={cn(
                            "flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
                            leverage === lev
                              ? "bg-primary text-primary-foreground"
                              : "bg-surface text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {lev}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Stop Loss & Take Profit */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Stop Loss (Optional)
                      </label>
                      <Input
                        type="number"
                        value={stopLoss}
                        onChange={(event) => setStopLoss(event.target.value)}
                        placeholder={currentPrice > 0 ? (currentPrice * 0.95).toFixed(4) : "0.00"}
                        className="h-12 bg-surface font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Take Profit (Optional)
                      </label>
                      <Input
                        type="number"
                        value={takeProfit}
                        onChange={(event) => setTakeProfit(event.target.value)}
                        placeholder={currentPrice > 0 ? (currentPrice * 1.1).toFixed(4) : "0.00"}
                        className="h-12 bg-surface font-mono text-sm"
                      />
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="bg-gray-100 dark:bg-muted/30 p-4 space-y-3 rounded-lg border border-gray-200 dark:border-transparent">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Estimated Total</span>
                      <span className="font-mono font-semibold text-foreground">{estimatedCost}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Execution Fee</span>
                      <span>{`0.1% (~${estimatedFee})`}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Settlement</span>
                      <span>Instant</span>
                    </div>
                  </div>

                  {/* Trading Stats */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Slippage</div>
                      <div className="text-sm font-semibold text-foreground">{priceImpact.toFixed(2)}%</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Liquidity</div>
                      <div className="text-sm font-semibold text-emerald-500">{liquidityLabel}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Speed</div>
                      <div className="text-sm font-semibold text-foreground">Instant</div>
                    </div>
                  </div>

                  {/* Submit Button */}
                    <Button 
                      className={cn(
                        "w-full h-12 font-semibold transition-colors",
                      tradeSide === "buy" 
                        ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                        : "bg-rose-500 hover:bg-rose-600 text-white"
                      )}
                    disabled={!tradingEnabled}
                  >
                    {tradingEnabled
                      ? `${tradeSide === "buy" ? "Buy" : "Sell"} ${asset.ticker || asset.name}`
                      : "Trading Unlocks After Discovery"
                    }
                  </Button>
                </div>

                {/* Position Summary */}
                <div className="space-y-4">
                  <div className="bg-gray-100 dark:bg-muted/30 p-4 rounded-lg border border-gray-200 dark:border-transparent">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-foreground">Order Queue</span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Flame className="h-4 w-4" />
                        Priority
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Pending Orders</span>
                        <span className="font-mono text-foreground">{formatCurrencyK(queueNotional)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Avg. Entry</span>
                        <span className="font-mono text-foreground">{formatCurrency(avgEntry)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Execution Time</span>
                        <span className="font-mono text-foreground">{executionWindow}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-100 dark:bg-surface p-4 rounded-lg border border-gray-200 dark:border-transparent">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-foreground">Portfolio</span>
                      <Power className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2">
                        <span className="text-sm text-emerald-700 dark:text-emerald-300">Long Position</span>
                        <span className="font-mono text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                          {longPositionValue > 0 ? `+${formatCurrency(longPositionValue)}` : formatCurrency(0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-muted/50 px-3 py-2">
                        <span className="text-sm text-muted-foreground">Available Balance</span>
                        <span className="font-mono text-sm text-foreground">{formatCurrency(user.usd)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Column 2: Stats + Order Book */}
          <aside className="space-y-2">
            {/* Stats Grid - 2x2 */}
            <div className="grid grid-cols-2 gap-3">
              <div className={`text-left space-y-1 p-4 rounded-xl ${isDarkTheme ? 'bg-neutral-800/80' : 'bg-gray-50'}`}>
                <p className="text-xs font-medium text-muted-foreground">24H Vol</p>
                <p className="text-lg font-bold text-foreground">{formatCurrencyK(asset.cycle.reserve * 0.38)}</p>
                <span className="text-xs text-muted-foreground block">Live</span>
              </div>
              <div className={`text-left space-y-1 p-4 rounded-xl ${isDarkTheme ? 'bg-neutral-800/80' : 'bg-gray-50'}`}>
                <p className="text-xs font-medium text-muted-foreground">TVL</p>
                <p className="text-lg font-bold text-foreground">{formatCurrencyK(asset.cycle.reserve)}</p>
                <span className="text-xs text-muted-foreground block">Locked</span>
              </div>
              <div className={`text-left space-y-1 p-4 rounded-xl ${isDarkTheme ? 'bg-neutral-800/80' : 'bg-gray-50'}`}>
                <p className="text-xs font-medium text-muted-foreground">Discovery</p>
                <p className="text-lg font-bold text-foreground">{Math.min(96, Math.round(asset.cycle.lpu * 1.8))}%</p>
                <span className="text-xs text-muted-foreground block">Complete</span>
              </div>
              <div className={`text-left space-y-1 p-4 rounded-xl ${isDarkTheme ? 'bg-neutral-800/80' : 'bg-gray-50'}`}>
                <p className="text-xs font-medium text-muted-foreground">Market Cap</p>
                <p className="text-lg font-bold text-foreground">{formatCurrencyK(asset.cycle.reserve * 2.1)}</p>
                <span className="text-xs text-muted-foreground block">Est.</span>
              </div>
            </div>

            {/* Order Book Section */}
            {/* Trading Data Section */}
            <div>
              <div className="flex items-center gap-1 bg-muted/30 dark:bg-[#0f0f12] p-1 rounded-xl text-xs font-medium mb-3">
                <button
                  onClick={() => setSidebarView("orderbook")}
                  className={cn(
                    "flex-1 rounded-lg px-3 py-1.5 transition-colors",
                    sidebarView === "orderbook" 
                      ? "bg-background dark:bg-white text-foreground dark:text-black shadow-sm" 
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Order Book
                </button>
                <button
                  onClick={() => setSidebarView("trades")}
                  className={cn(
                    "flex-1 rounded-lg px-3 py-1.5 transition-colors",
                    sidebarView === "trades" 
                      ? "bg-background dark:bg-white text-foreground dark:text-black shadow-sm" 
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Recent Trades
                </button>
              </div>
              <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground mb-3">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span>Live</span>
              </div>
              
              {/* Conditional Content */}
              {sidebarView === "orderbook" ? (
                <div>
                  {/* Order Book Percentage Bar */}
                  <div className="flex items-center gap-2 mb-4 text-xs font-medium">
                    <span className="text-emerald-500">B {Math.round((orderBook.bids.length / (orderBook.bids.length + orderBook.asks.length)) * 100)}%</span>
                    <div className="flex-1 h-1 bg-rose-500/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500" 
                        style={{ width: `${(orderBook.bids.length / (orderBook.bids.length + orderBook.asks.length)) * 100}%` }}
                      />
                    </div>
                    <span className="text-rose-500">{Math.round((orderBook.asks.length / (orderBook.bids.length + orderBook.asks.length)) * 100)}% S</span>
                  </div>

                  {/* Order Book Headers */}
                  <div className="grid grid-cols-[1fr,auto,auto,1fr] gap-3 mb-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                    <span className="text-left">Bid</span>
                    <span className="text-right">Bid</span>
                    <span className="text-left">Ask</span>
                    <span className="text-right">Ask</span>
                  </div>
                  
                  {/* Combined Order Book */}
                  <div className="space-y-0.5">
                    {Array.from({ length: Math.max(orderBook.bids.length, orderBook.asks.length) }).map((_, index) => {
                      const bid = orderBook.bids[index];
                      const ask = orderBook.asks[orderBook.asks.length - 1 - index];
                      const bidTotal = orderBook.bids.slice(0, index + 1).reduce((sum, order) => sum + order.amount, 0);
                      const askTotal = orderBook.asks.slice(0, index + 1).reduce((sum, order) => sum + order.amount, 0);
                      
                      return (
                        <div 
                          key={`order-${index}`} 
                          className="relative grid grid-cols-[1fr,auto,auto,1fr] gap-3 py-1 text-[11px] font-mono"
                        >
                          {/* Bid Side */}
                          {bid ? (
                            <>
                              <div className="relative">
                                <div 
                                  className="absolute inset-0 bg-emerald-500/10 dark:bg-emerald-500/5" 
                                  style={{ 
                                    width: `${Math.min(100, (bidTotal / Math.max(...orderBook.bids.map(b => b.amount))) * 80)}%`,
                                    left: 0 
                                  }}
                                />
                                <span className="relative text-left text-foreground">{bid.amount.toLocaleString()}</span>
                              </div>
                              <span className="relative text-emerald-500 dark:text-emerald-400 font-medium text-right">{formatCurrency(bid.price)}</span>
                            </>
                          ) : (
                            <>
                              <span></span>
                              <span></span>
                            </>
                          )}
                          
                          {/* Ask Side */}
                          {ask ? (
                            <>
                              <span className="relative text-rose-500 dark:text-rose-400 font-medium text-left">{formatCurrency(ask.price)}</span>
                              <div className="relative">
                                <div 
                                  className="absolute inset-0 bg-rose-500/10 dark:bg-rose-500/5" 
                                  style={{ 
                                    width: `${Math.min(100, (askTotal / Math.max(...orderBook.asks.map(a => a.amount))) * 80)}%`,
                                    right: 0 
                                  }}
                                />
                                <span className="relative text-right text-foreground block">{ask.amount.toLocaleString()}</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <span></span>
                              <span></span>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div>
                  {/* Recent Trades Headers */}
                  <div className="grid grid-cols-4 gap-2 mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <span>Time</span>
                    <span>Side</span>
                    <span>Price</span>
                    <span className="text-right">Amount</span>
                  </div>
                  
                  {/* Trade List */}
                  <div className="space-y-1">
                    {trades.map((trade) => (
                      <div
                        key={trade.id}
                        className="grid grid-cols-4 gap-2 py-2 px-2 text-xs hover:bg-muted/50 rounded transition-colors"
                      >
                        <span className="font-mono text-muted-foreground">{trade.time}</span>
                        <span className={cn(
                          "font-semibold", 
                          trade.side === "buy" 
                            ? "text-emerald-600 dark:text-emerald-400" 
                            : "text-rose-600 dark:text-rose-400"
                        )}>
                          {trade.side.toUpperCase()}
                        </span>
                        <span className="font-mono text-foreground">{formatCurrency(trade.price)}</span>
                        <span className="text-right font-mono text-foreground">{trade.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </section>

        {/* Mobile Layout - Asset Header & Chart */}
        <div className="lg:hidden space-y-6">
          {/* Asset Header with Chart */}
          <div className="bg-background">
            {/* Asset Info Header */}
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 sm:h-16 sm:w-16 overflow-hidden rounded-full">
                <img src={asset.image} alt={asset.name} className="h-full w-full object-cover" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 sm:gap-3 mb-1">
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate max-w-[140px] sm:max-w-none">{asset.name}</h1>
                  <img src="/checklist.png" alt="verified" className="h-4 w-4 sm:h-5 sm:w-5 opacity-80" />
                  {asset.ticker && (
                    <span className="rounded-full bg-surface px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {asset.ticker}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground">
                  <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    {phaseLabel}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">{phaseHelper}</p>
              </div>
              
              {/* Timeframe Selector */}
              <div className="flex items-center gap-1 rounded-2xl bg-surface p-1 text-xs font-medium">
                {TIMEFRAMES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setTimeframe(item)}
                    className={cn(
                      "rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 transition-colors text-xs",
                      timeframe === item 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Asset Price - Above Chart */}
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-3xl sm:text-4xl font-bold text-foreground">{formatCurrency(currentPrice)}</p>
                <p className={cn("text-sm font-semibold", priceChangeTone)}>{priceChangeLabel}</p>
              </div>
              <button
                onClick={() => setChartType(chartType === "line" ? "candle" : "line")}
                className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
                title={chartType === "line" ? "Switch to Candlestick" : "Switch to Line Chart"}
              >
                <CandlestickChart className={cn("h-5 w-5", chartType === "candle" ? "text-primary" : "text-muted-foreground")} />
              </button>
            </div>

            {/* Price Chart - Full Width */}
            <div className="h-[250px] sm:h-[320px] mb-4 -mx-4 sm:-mx-6">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "line" ? (
                  <ChartContainer
                    config={{
                      value: {
                        label: "Price",
                        color: "hsl(var(--primary))",
                      },
                    }}
                  >
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="price-gradient-light-mobile" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="price-gradient-dark-mobile" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#000000" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="label" hide tickLine={false} axisLine={false} padding={{ left: 0, right: 0 }} />
                      <YAxis hide domain={["dataMin", "dataMax"]} />
                      <ChartTooltip cursor={{ stroke: "hsl(var(--border))" }} content={<ChartTooltipContent />} />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2.5} 
                        fill="url(#price-gradient-light-mobile)" 
                        className="dark:hidden"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2.5} 
                        fill="url(#price-gradient-dark-mobile)" 
                        className="hidden dark:block"
                      />
                    </AreaChart>
                  </ChartContainer>
                ) : (
                  <ChartContainer
                    config={{
                      bullish: {
                        label: "Bullish",
                        color: "#8b5cf6",
                      },
                      bearish: {
                        label: "Bearish",
                        color: "#ec4899",
                      },
                    }}
                  >
                    <ComposedChart data={candleData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                      <XAxis dataKey="label" hide tickLine={false} axisLine={false} />
                      <YAxis hide domain={["auto", "auto"]} />
                      <ChartTooltip 
                        cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }} 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload as CandleData;
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-sm">
                                <div className="grid gap-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[0.70rem] uppercase text-muted-foreground">Open</span>
                                    <span className="font-mono text-sm font-medium">${data.open.toFixed(4)}</span>
                                  </div>
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[0.70rem] uppercase text-muted-foreground">High</span>
                                    <span className="font-mono text-sm font-medium text-emerald-500">${data.high.toFixed(4)}</span>
                                  </div>
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[0.70rem] uppercase text-muted-foreground">Low</span>
                                    <span className="font-mono text-sm font-medium text-rose-500">${data.low.toFixed(4)}</span>
                                  </div>
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[0.70rem] uppercase text-muted-foreground">Close</span>
                                    <span className="font-mono text-sm font-medium">${data.close.toFixed(4)}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      {candleData.map((candle, index) => (
                        <Bar
                          key={index}
                          dataKey={() => [candle.low, candle.high]}
                          fill={candle.isBullish ? "#8b5cf6" : "#ec4899"}
                          shape={(props: CandleShapeProps) => {
                            const { x, y, width, height, payload } = props;
                            if (!payload) return null;

                            const candleWidth = Math.min(width * 0.8, 20);
                            const wickWidth = 1.5;
                            const centerX = x + width / 2;
                            
                            const priceRange = payload.high - payload.low;
                            if (priceRange === 0) return null;
                            
                            const highY = y;
                            const lowY = y + height;
                            const openY = y + ((payload.high - payload.open) / priceRange) * height;
                            const closeY = y + ((payload.high - payload.close) / priceRange) * height;
                            
                            const bodyTop = Math.min(openY, closeY);
                            const bodyBottom = Math.max(openY, closeY);
                            const bodyHeight = Math.max(bodyBottom - bodyTop, 1.5);
                            
                            const color = payload.isBullish ? "#8b5cf6" : "#ec4899";
                            
                            return (
                              <g>
                                <line
                                  x1={centerX}
                                  y1={highY}
                                  x2={centerX}
                                  y2={bodyTop}
                                  stroke={color}
                                  strokeWidth={wickWidth}
                                  opacity={0.8}
                                />
                                <line
                                  x1={centerX}
                                  y1={bodyBottom}
                                  x2={centerX}
                                  y2={lowY}
                                  stroke={color}
                                  strokeWidth={wickWidth}
                                  opacity={0.8}
                                />
                                <rect
                                  x={centerX - candleWidth / 2}
                                  y={bodyTop}
                                  width={candleWidth}
                                  height={bodyHeight}
                                  fill={payload.isBullish ? color : color}
                                  stroke={color}
                                  strokeWidth={1}
                                  opacity={payload.isBullish ? 0.85 : 1}
                                  rx={1}
                                />
                              </g>
                            );
                          }}
                        />
                      ))}
                    </ComposedChart>
                  </ChartContainer>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Mobile Stats - Below Chart */}
        <div className="lg:hidden grid grid-cols-2 gap-3 mb-3">
          <div className={`p-4 text-left rounded-xl ${isDarkTheme ? 'bg-neutral-800/80' : 'bg-gray-50'}`}>
            <p className="text-xs font-medium text-muted-foreground">24H Vol</p>
            <p className="text-lg font-bold text-foreground">{formatCurrencyK(asset.cycle.reserve * 0.38)}</p>
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
          <div className={`p-4 text-left rounded-xl ${isDarkTheme ? 'bg-neutral-800/80' : 'bg-gray-50'}`}>
            <p className="text-xs font-medium text-muted-foreground">TVL</p>
            <p className="text-lg font-bold text-foreground">{formatCurrencyK(asset.cycle.reserve)}</p>
            <span className="text-xs text-muted-foreground">Locked</span>
          </div>
          <div className={`p-4 text-left rounded-xl ${isDarkTheme ? 'bg-neutral-800/80' : 'bg-gray-50'}`}>
            <p className="text-xs font-medium text-muted-foreground">Discovery</p>
            <p className="text-lg font-bold text-foreground">{Math.min(96, Math.round(asset.cycle.lpu * 1.8))}%</p>
            <span className="text-xs text-muted-foreground">Complete</span>
          </div>
          <div className={`p-4 text-left rounded-xl ${isDarkTheme ? 'bg-neutral-800/80' : 'bg-gray-50'}`}>
            <p className="text-xs font-medium text-muted-foreground">Market Cap</p>
            <p className="text-lg font-bold text-foreground">{formatCurrencyK(asset.cycle.reserve * 2.1)}</p>
            <span className="text-xs text-muted-foreground">Est.</span>
          </div>
        </div>

        {/* Fixed Buy/Sell Buttons - Mobile Only, Above Bottom Nav */}
        <div className="lg:hidden fixed bottom-16 left-0 right-0 p-4 z-40">
          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
            <Button
              onClick={() => {
                if (!tradingEnabled) return;
                setModalTradeSide("buy");
                setShowTradingModal(true);
              }}
              className="h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
              disabled={!tradingEnabled}
            >
              Buy {asset.ticker || asset.name}
            </Button>
            <Button
              onClick={() => {
                if (!tradingEnabled) return;
                setModalTradeSide("sell");
                setShowTradingModal(true);
              }}
              className="h-12 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-semibold"
              disabled={!tradingEnabled}
            >
              Sell {asset.ticker || asset.name}
            </Button>
          </div>
        </div>

        {/* Mobile Order Book & Trades Section */}
        <div className="lg:hidden">
          <div className="flex items-center gap-1 bg-muted/30 dark:bg-[#0f0f12] p-1.5 rounded-xl text-xs font-medium mb-4">
            <button
              onClick={() => setSidebarView("orderbook")}
              className={cn(
                "flex-1 rounded-lg px-3 py-2 transition-colors",
                sidebarView === "orderbook" 
                  ? "bg-background dark:bg-white text-foreground dark:text-black shadow-sm" 
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Order Book
            </button>
            <button
              onClick={() => setSidebarView("trades")}
              className={cn(
                "flex-1 rounded-lg px-3 py-2 transition-colors",
                sidebarView === "trades" 
                  ? "bg-background dark:bg-white text-foreground dark:text-black shadow-sm" 
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Recent Trades
            </button>
          </div>
          <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground mb-4">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span>Live</span>
          </div>
          
          {/* Mobile Content */}
          {sidebarView === "orderbook" ? (
            <div>
              {/* Order Book Percentage Bar */}
              <div className="flex items-center gap-2 mb-4 text-xs font-medium">
                <span className="text-emerald-500">B {Math.round((orderBook.bids.length / (orderBook.bids.length + orderBook.asks.length)) * 100)}%</span>
                <div className="flex-1 h-1 bg-rose-500/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500" 
                    style={{ width: `${(orderBook.bids.length / (orderBook.bids.length + orderBook.asks.length)) * 100}%` }}
                  />
                </div>
                <span className="text-rose-500">{Math.round((orderBook.asks.length / (orderBook.bids.length + orderBook.asks.length)) * 100)}% S</span>
              </div>

              {/* Order Book Headers */}
              <div className="grid grid-cols-[1fr,auto,auto,1fr] gap-3 mb-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                <span className="text-left">Bid</span>
                <span className="text-right">Bid</span>
                <span className="text-left">Ask</span>
                <span className="text-right">Ask</span>
              </div>
              
              {/* Combined Order Book - Mobile (show fewer rows) */}
              <div className="space-y-0.5">
                {Array.from({ length: 10 }).map((_, index) => {
                  const bid = orderBook.bids[index];
                  const ask = orderBook.asks[orderBook.asks.length - 1 - index];
                  
                  return (
                    <div 
                      key={`mobile-order-${index}`} 
                      className="grid grid-cols-[1fr,auto,auto,1fr] gap-3 py-1 text-[11px] font-mono"
                    >
                      {/* Bid Side */}
                      {bid ? (
                        <>
                          <span className="text-left text-foreground">{bid.amount.toLocaleString()}</span>
                          <span className="text-emerald-500 dark:text-emerald-400 font-medium text-right">{formatCurrency(bid.price)}</span>
                        </>
                      ) : (
                        <>
                          <span></span>
                          <span></span>
                        </>
                      )}
                      
                      {/* Ask Side */}
                      {ask ? (
                        <>
                          <span className="text-rose-500 dark:text-rose-400 font-medium text-left">{formatCurrency(ask.price)}</span>
                          <span className="text-right text-foreground">{ask.amount.toLocaleString()}</span>
                        </>
                      ) : (
                        <>
                          <span></span>
                          <span></span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              {/* Mobile Trades Headers */}
              <div className="grid grid-cols-4 gap-2 mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                <span>Time</span>
                <span>Side</span>
                <span>Price</span>
                <span className="text-right">Amount</span>
              </div>
              
              {/* Mobile Trade List */}
              <div className="space-y-1">
                {trades.slice(0, 10).map((trade) => (
                  <div key={`mobile-${trade.id}`} className="grid grid-cols-4 gap-2 py-2 px-2 text-xs hover:bg-muted/50 rounded transition-colors">
                    <span className="font-mono text-muted-foreground">{trade.time}</span>
                    <span className={cn("font-semibold", trade.side === "buy" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                      {trade.side.toUpperCase()}
                    </span>
                    <span className="font-mono text-foreground">{formatCurrency(trade.price)}</span>
                    <span className="text-right font-mono text-foreground">{trade.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Trading Modal */}
        <Dialog open={showTradingModal} onOpenChange={setShowTradingModal}>
          <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto mx-auto w-[calc(100%-2rem)] sm:m-4 rounded-3xl border-0">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="h-8 w-8 overflow-hidden rounded-lg">
                  <img src={asset.image} alt={asset.name} className="h-full w-full object-cover" />
                </div>
                <span className="truncate max-w-[200px]">{modalTradeSide === "buy" ? "Buy" : "Sell"} {asset.name}</span>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Current Price */}
              <div className="bg-muted/30 p-4 text-center rounded-lg">
                <p className="text-sm text-muted-foreground">Current Price</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(currentPrice)}</p>
                <span className={cn("text-sm font-semibold", priceChangeTone)}>
                  {priceChangePct >= 0 ? "+" : ""}{priceChangePct.toFixed(2)}%
                </span>
              </div>

              {/* Order Type Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Order Type</label>
                <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg">
                  {(["market", "limit"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setOrderType(mode)}
                      className={cn(
                        "flex-1 rounded-md px-4 py-2 capitalize text-sm font-medium transition-colors",
                        orderType === mode 
                          ? "bg-primary text-primary-foreground shadow-sm" 
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Order Inputs */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-2">
                    Price (USDC)
                  </label>
                  <Input
                    type="number"
                    value={priceInput}
                    onChange={(event) => setPriceInput(event.target.value)}
                    placeholder={currentPrice.toFixed(4)}
                    disabled={orderType === "market"}
                    className="h-12 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-2">
                    Amount
                  </label>
                  <Input
                    type="number"
                    value={amountInput}
                    onChange={(event) => setAmountInput(event.target.value)}
                    placeholder="1000"
                    className="h-12 font-mono text-sm"
                  />
                </div>
              </div>

              {/* Leverage Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">
                    Leverage
                  </label>
                  <span className="text-sm font-bold text-foreground">{leverage}x</span>
                </div>
                <div className="flex items-center gap-2">
                  {[1, 2, 5, 10, 20].map((lev) => (
                    <button
                      key={lev}
                      onClick={() => setLeverage(lev)}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
                        leverage === lev
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {lev}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Stop Loss & Take Profit */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-2">
                    Stop Loss (Optional)
                  </label>
                  <Input
                    type="number"
                    value={stopLoss}
                    onChange={(event) => setStopLoss(event.target.value)}
                    placeholder={currentPrice > 0 ? (currentPrice * 0.95).toFixed(4) : "0.00"}
                    className="h-12 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-2">
                    Take Profit (Optional)
                  </label>
                  <Input
                    type="number"
                    value={takeProfit}
                    onChange={(event) => setTakeProfit(event.target.value)}
                    placeholder={currentPrice > 0 ? (currentPrice * 1.1).toFixed(4) : "0.00"}
                    className="h-12 font-mono text-sm"
                  />
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-muted/30 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Estimated Total</span>
                  <span className="font-mono font-semibold">{estimatedCost}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Fee (0.1%)</span>
                  <span>~{estimatedFee}</span>
                </div>
              </div>

              {/* Compact Order Book */}
              <div className="bg-surface p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-foreground">Order Book</h4>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    Live
                  </div>
                </div>
                
                {/* Top 3 asks */}
                <div className="space-y-1 mb-3">
                  {orderBook.asks.slice(0, 3).reverse().map((ask, index) => (
                    <div key={index} className="flex justify-between text-xs py-1 px-2 rounded bg-rose-50 dark:bg-rose-500/10">
                      <span className="text-rose-600 dark:text-rose-400 font-mono">{formatCurrency(ask.price)}</span>
                      <span className="text-muted-foreground">{ask.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                
                {/* Spread */}
                <div className="text-center py-2 text-sm font-mono font-semibold text-foreground border-y border-border/60">
                  {formatCurrency(currentPrice)}
                </div>
                
                {/* Top 3 bids */}
                <div className="space-y-1 mt-3">
                  {orderBook.bids.slice(0, 3).map((bid, index) => (
                    <div key={index} className="flex justify-between text-xs py-1 px-2 rounded bg-emerald-50 dark:bg-emerald-500/10">
                      <span className="text-emerald-600 dark:text-emerald-400 font-mono">{formatCurrency(bid.price)}</span>
                      <span className="text-muted-foreground">{bid.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                className={cn(
                  "w-full h-12 font-semibold",
                  modalTradeSide === "buy" 
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                    : "bg-rose-500 hover:bg-rose-600 text-white"
                )}
                onClick={() => setShowTradingModal(false)}
                disabled={!tradingEnabled}
              >
                {tradingEnabled
                  ? modalTradeSide === "buy" ? "Place Buy Order" : "Place Sell Order"
                  : "Trading Unlocks After Discovery"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
