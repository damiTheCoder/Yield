import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useApp } from "@/lib/app-state";
import { cn, formatCurrency, formatCurrencyK } from "@/lib/utils";
import { Dot, Image as ImageIcon, LineChart as LineChartIcon } from "lucide-react";
import { Line, LineChart as RechartsLineChart, XAxis, YAxis } from "recharts";

export default function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { assets, user, userAssets, assetAvailable, buyAssetCoinTags } = useApp();

  const asset = useMemo(() => assets.find((a) => a.id === id), [assets, id]);
  const ua = userAssets[id ?? ""] || { coinTags: 0, lfts: 0 };
  const findable = assetAvailable[id ?? ""] ?? 0;

  if (!asset) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-8 space-y-6">
          <p className="text-muted-foreground">Asset not found.</p>
          <Button variant="secondary" onClick={() => navigate("/assets")}>Back to Assets</Button>
        </main>
      </div>
    );
  }

  const [showHuntPrompt, setShowHuntPrompt] = useState(false);
  const [purchaseMessage, setPurchaseMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"chart" | "image">("chart");
  const [mobileBuyOpen, setMobileBuyOpen] = useState(false);
  const isImageMode = viewMode === "image";
  const handleToggleView = (checked: boolean) => setViewMode(checked ? "image" : "chart");
  const toggleTrackClass =
    "h-7 w-12 px-[3px] py-[3px] !border !border-border/60 data-[state=unchecked]:!bg-muted/80 data-[state=checked]:!bg-emerald-400/80 transition-smooth";
  const toggleThumbClass =
    "!h-[18px] !w-[18px] !bg-background !shadow-none data-[state=checked]:translate-x-[1.5rem] data-[state=unchecked]:translate-x-0";

  const currentLiquidity = asset.cycle.reserve;
  const backingReserve = asset.params.initialReserve;
  const lpu = asset.cycle.lpu;
  const totalSupply = asset.params.initialSupply;
  const discovered = Math.max(0, totalSupply - findable);
  const discoveryPercent = totalSupply > 0 ? (discovered / totalSupply) * 100 : 0;
  const huntFee = Math.max(4.2, lpu * 0.4);
  const description = asset.summary?.trim()
    ? asset.summary
    : "Liquidity-backed artifacts with verifiable reserves and real-time CoinTag discovery. Hunt, redeem, and monitor live performance across every cycle.";

  const formatPrimaryValue = (value: number) => {
    return value >= 1000 ? formatCurrencyK(value) : formatCurrency(value);
  };

  const discoveryProgress = Math.min(100, Math.max(0, discoveryPercent));
  const multiSegmentPercent = 14;
  const yellowWidthPercent = Math.max(
    0,
    Math.min(100 - multiSegmentPercent, (discoveryProgress / 100) * (100 - multiSegmentPercent))
  );

  const chartData = useMemo(() => {
    const base = Math.max(currentLiquidity, 1);
    const seed = (asset.ticker || asset.id)
      .split("")
      .reduce((acc, char, index) => acc + char.charCodeAt(0) * (index + 1), 0);

    const ratios: number[] = [];
    const pushSegment = (
      length: number,
      endRatio: number,
      amplitude: number,
      frequency: number,
      bias: number = 0
    ) => {
      const startRatio = ratios[ratios.length - 1] ?? 0.3;
      for (let i = 1; i <= length; i++) {
        const progress = i / length;
        const baseLine = startRatio + (endRatio - startRatio) * progress;
        const noise = Math.sin((seed + ratios.length + i) * frequency) * amplitude;
        const value = baseLine + noise + bias * progress;
        ratios.push(value);
      }
    };

    // Seed initial value at lower left
    ratios.push(0.32);
    // Sharp initial dip
    pushSegment(4, 0.22, 0.015, 1.4);
    // Recovery and early buildup
    pushSegment(10, 0.55, 0.012, 0.8);
    // Mid plateau with gentle chop
    pushSegment(12, 0.62, 0.01, 1.1);
    // Strong rally toward top right
    pushSegment(14, 1.05, 0.018, 0.9, 0.01);
    // Minor pullback and final push
    pushSegment(8, 1.12, 0.012, 1.3);

    const mapped = ratios.map((ratio, idx) => ({
      label: `T${idx + 1}`,
      value: Number((base * ratio).toFixed(2)),
    }));

    if (mapped.length > 0) {
      mapped[0].value = Number((base * 0.18).toFixed(2));
      mapped[mapped.length - 1].value = Number((base * 1.15).toFixed(2));
    }

    return mapped;
  }, [asset.id, asset.ticker, currentLiquidity]);

  const formatChartPriceTick = (value: number) => {
    const abs = Math.abs(value);
    if (abs >= 1000) {
      return formatCurrencyK(value);
    }
    if (abs >= 100) {
      const hundreds = value / 100;
      const formatted = hundreds.toFixed(1).replace(/\.0$/, ".0");
      return `$${formatted}h`;
    }
    return formatCurrency(value);
  };

  const chartConfig = { value: { label: "Liquidity", color: "hsl(var(--accent-yellow))" } } as const;

  useEffect(() => {
    if (ua.coinTags > 0) {
      setShowHuntPrompt(true);
      setPurchaseMessage("CoinTag already purchased.");
    } else {
      setShowHuntPrompt(false);
      setPurchaseMessage(null);
    }
  }, [ua.coinTags]);
  const transactions = useMemo(() => {
    const base = Math.max(lpu || 1, 0.5);
    const formatter = new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    return Array.from({ length: 16 }, (_, index) => {
      const timestamp = new Date(Date.now() - index * 1000 * 60 * 47);
      const type = index % 5 === 0 ? "Sell" : "Buy";
      const swing = Math.sin((asset.id.length + index) * 1.1) * 0.05;
      const price = Number(Math.max(0.4, base * (1 + swing)).toFixed(2));
      return {
        id: `${asset.id}-tx-${index}`,
        label: formatter.format(timestamp),
        type,
        price,
      };
    });
  }, [asset.id, lpu]);

  const TransactionHistorySection = ({ className }: { className?: string }) => (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Transaction History</h3>
          <p className="text-xs text-muted-foreground/70">Latest fills from the live market</p>
        </div>
        <span className="hidden text-[10px] uppercase tracking-wide text-muted-foreground/60 sm:inline">Last 24h</span>
      </div>
      <div className="rounded-2xl border border-border/50 bg-surface/50 shadow-card">
        <div className="grid grid-cols-[1.6fr_0.9fr_1fr] items-center gap-2 border-b border-border/40 px-3 py-2 text-[10px] uppercase tracking-wide text-muted-foreground">
          <span>Date</span>
          <span className="text-center">Type</span>
          <span className="text-right">Price</span>
        </div>
        <div className="max-h-[22rem] overflow-y-auto divide-y divide-border/20 no-scrollbar">
          {transactions.map((tx) => (
            <div key={tx.id} className="grid grid-cols-[1.6fr_0.9fr_1fr] items-center gap-2 px-3 py-3 text-xs sm:text-sm">
              <span className="font-mono text-[11px] text-muted-foreground/90 sm:text-xs">{tx.label}</span>
              <span className={cn("text-center text-[11px] font-semibold uppercase tracking-wide", tx.type === "Buy" ? "text-emerald-400" : "text-red-400/80")}>{tx.type}</span>
              <span className="text-right font-mono text-[11px] text-foreground sm:text-xs">{formatCurrency(tx.price)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  const BuyTagSectionContent = ({ className }: { className?: string }) => (
    <div
      className={cn(
        "space-y-4 rounded-2xl border border-border/50 bg-surface/50 p-4 shadow-card sm:p-6",
        className,
      )}
    >
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <div className="inline-flex items-center gap-1 rounded-full bg-background/80 px-3 py-1 text-foreground">
          <span className="text-[11px]">Buy</span>
        </div>
        <span className="hidden text-[11px] text-muted-foreground/70 sm:inline">Purchase CoinTags directly</span>
      </div>
      <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span>Wallet balance</span>
          <div className="font-mono text-base text-foreground">{formatCurrency(user.usd)}</div>
        </div>
        <div className="flex items-center gap-2">
          <span>CoinTag balance</span>
          <span className="font-mono text-base text-emerald-400">{ua.coinTags}</span>
        </div>
      </div>
      <div className="space-y-4">
        <div className="border border-border/40 bg-background/80 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">You pay</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-foreground">{formatCurrency(huntFee)}</span>
                <span className="text-sm text-muted-foreground">USD</span>
              </div>
            </div>
            <div className="border border-border/40 bg-surface/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-foreground">
              USD
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">Deducted from your balance instantly.</div>
        </div>

        <div className="border border-border/40 bg-background/80 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">You receive</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-emerald-400">1</span>
                <span className="text-sm text-muted-foreground">CoinTag</span>
              </div>
            </div>
            <div className="border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-300">
              {formatCurrency(huntFee)} → 1 Tag
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">Ready for hunts immediately.</div>
        </div>
      </div>
      <Button
        className="h-12 w-full rounded-full text-base font-semibold"
        disabled={user.usd < huntFee || ua.coinTags >= 1}
        onClick={() => {
          if (ua.coinTags >= 1) {
            setPurchaseMessage("CoinTag already purchased.");
            return;
          }
          if (user.usd < huntFee) {
            setPurchaseMessage("Insufficient balance for this CoinTag.");
            return;
          }
          buyAssetCoinTags(asset.id, huntFee, huntFee);
          setShowHuntPrompt(true);
        }}
      >
        Purchase CoinTags
      </Button>
      <div className="space-y-3 text-[11px] text-muted-foreground/80">
        <p>1 CoinTag unlocks one hunt attempt. Funds settle instantly into the ecosystem reserve.</p>
        {purchaseMessage && (
          <p
            className={cn(
              "text-[11px]",
              purchaseMessage.toLowerCase().includes("insufficient") ? "text-rose-400" : "text-emerald-300",
            )}
          >
            {purchaseMessage}
          </p>
        )}
        {showHuntPrompt && (
          <Button
            onClick={() => navigate(`/market/${asset.id}/hunt`)}
            className="h-11 w-full rounded-full border border-emerald-400/60 bg-transparent text-emerald-300 hover:bg-emerald-400/10"
          >
            Start Hunt
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 pt-4 pb-24 sm:pb-8">
        <div className="space-y-10 lg:grid lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:gap-10 lg:space-y-0">
          <div className="space-y-8 md:space-y-10">
            <section className="space-y-4">
              {!isImageMode && (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={asset.image} alt={asset.name} className="h-12 w-12 rounded-full border border-border/40" />
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <h1 className="text-xl md:text-3xl font-semibold truncate max-w-[14ch] md:max-w-none">
                            {asset.name}
                          </h1>
                          <img src="/checklist.png" alt="verified" className="h-4 w-4 opacity-80" />
                        </div>
                        <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full bg-emerald-400" />
                            Live Chart
                          </span>
                          <span>• Cycle {asset.cycle.cycle}</span>
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={isImageMode}
                      onCheckedChange={handleToggleView}
                      aria-label="Toggle image view"
                      className={toggleTrackClass}
                      thumbClassName={toggleThumbClass}
                    />
                  </div>
                  <div className="font-mono text-3xl md:text-4xl font-semibold">{formatCurrencyK(currentLiquidity)}</div>
                </div>
              )}

              <div
                className={cn(
                  "relative overflow-hidden rounded-3xl",
                  isImageMode ? "h-64 sm:h-72" : "h-56 sm:h-64"
                )}
              >
                <div
                  className={`absolute inset-0 transition-opacity duration-500 ${isImageMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                >
                  <ChartContainer config={chartConfig} className="flex h-full w-full items-center">
                    <RechartsLineChart data={chartData} margin={{ left: 0, right: 0, top: 0, bottom: 16 }}>
                      <XAxis dataKey="label" hide />
                      <YAxis
                        orientation="right"
                        axisLine={false}
                        tickLine={false}
                        width={50}
                        tickFormatter={formatChartPriceTick}
                        tick={{ fill: "var(--muted-foreground)" }}
                      />
                      <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                      <Line type="linear" dataKey="value" stroke="#facc15" strokeWidth={3} dot={false} strokeLinejoin="round" />
                    </RechartsLineChart>
                  </ChartContainer>
                </div>
                <div
                  className={`absolute inset-0 transition-opacity duration-500 ${isImageMode ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                >
                  <img src={asset.image} alt={asset.name} className="h-full w-full object-cover" />
                </div>
                <div className={`absolute right-3 top-3 ${isImageMode ? '' : 'hidden'}`}>
                  <Switch
                    checked={isImageMode}
                    onCheckedChange={handleToggleView}
                    aria-label="Toggle view"
                    className={`${toggleTrackClass} px-0`}
                    thumbClassName={toggleThumbClass}
                  />
                </div>
              </div>

              {!isImageMode && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Dot className="h-3.5 w-3.5 text-emerald-400" />
                  Live Data
                  <span>•</span>
                  Updates every 3s
                </div>
              )}
            </section>

            <section className="space-y-4 md:space-y-6">
              <div className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
                  <h2 className="text-3xl font-semibold leading-tight">{asset.name}</h2>
                  <div className="text-sm text-muted-foreground sm:text-right">Collection: {asset.name} • By OpenYield Labs</div>
                </div>
                <p className="text-sm md:text-base text-muted-foreground/80 max-w-2xl leading-relaxed line-clamp-3">
                  {description}
                </p>
              </div>
            </section>

            <section className="sm:hidden space-y-4 pb-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Discovery Progress</div>
                  <div className="text-[11px] text-muted-foreground">
                    {discovered} / {totalSupply} units • {discoveryPercent.toFixed(1)}% discovered
                  </div>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full border border-border/60">
                  <div className="absolute inset-y-0 left-0 w-[10%] rounded-l-full bg-amber-300" />
                  <div className="absolute inset-y-0 left-[10%] w-[10%] bg-fuchsia-300" />
                  <div className="absolute inset-y-0 left-[20%] w-[10%] bg-pink-300" />
                  <div className="absolute inset-y-0 left-[30%] w-[10%] bg-sky-300" />
                  <div className="absolute inset-y-0 left-[40%] w-[10%] bg-indigo-300" />
                  <div className="absolute inset-y-0 left-[50%] w-[50%] bg-muted/40" />
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-emerald-400 transition-all"
                    style={{ width: `${Math.min(100, discoveryProgress)}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-4">
                <div className="space-y-1">
                  <div className="text-[10px] text-muted-foreground">current liquidity</div>
                  <div className="font-mono text-xl font-semibold">{formatPrimaryValue(currentLiquidity)}</div>
                  <div className="text-[10px] text-muted-foreground">Total value</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-muted-foreground">backing reserve</div>
                  <div className="font-mono text-xl font-semibold text-emerald-400">{formatPrimaryValue(backingReserve)}</div>
                  <div className="text-[10px] text-muted-foreground">Seeded liquidity</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-muted-foreground">cointag price</div>
                  <div className="font-mono text-xl font-semibold text-blue-400">{formatPrimaryValue(huntFee)}</div>
                  <div className="text-[10px] text-muted-foreground">Hunt entry fee</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-muted-foreground">price per unit</div>
                  <div className="font-mono text-xl font-semibold">{formatPrimaryValue(lpu)}</div>
                  <div className="text-[10px] text-muted-foreground">Redeemable floor</div>
                </div>
              </div>
            </section>

            <TransactionHistorySection className="lg:hidden" />
          </div>

          <div className="space-y-6 lg:pt-2">
            <section className="hidden sm:block pb-4 md:pb-0">
              <div className="grid grid-cols-2 gap-x-3 gap-y-5 md:gap-x-4 md:gap-y-6">
                <div className="rounded-2xl border-none bg-transparent p-0 md:border md:border-border/40 md:bg-surface/40 md:p-4">
                  <div className="text-[11px] text-muted-foreground sm:text-xs">current liquidity</div>
                  <div className="font-mono text-2xl font-semibold">{formatPrimaryValue(currentLiquidity)}</div>
                  <div className="text-xs text-muted-foreground">Total value</div>
                </div>
                <div className="rounded-2xl border-none bg-transparent p-0 md:border md:border-border/40 md:bg-surface/40 md:p-4">
                  <div className="text-[11px] text-muted-foreground sm:text-xs">backing reserve</div>
                  <div className="font-mono text-2xl font-semibold text-emerald-400">{formatPrimaryValue(backingReserve)}</div>
                  <div className="text-xs text-muted-foreground">Seeded liquidity</div>
                </div>
                <div className="rounded-2xl border-none bg-transparent p-0 md:border md:border-border/40 md:bg-surface/40 md:p-4">
                  <div className="text-[11px] text-muted-foreground sm:text-xs">cointag price</div>
                  <div className="font-mono text-2xl font-semibold text-blue-400">{formatPrimaryValue(huntFee)}</div>
                  <div className="text-xs text-muted-foreground">Hunt entry fee</div>
                </div>
                <div className="rounded-2xl border-none bg-transparent p-0 md:border md:border-border/40 md:bg-surface/40 md:p-4">
                  <div className="text-[11px] text-muted-foreground sm:text-xs">price per unit</div>
                  <div className="font-mono text-2xl font-semibold">{formatPrimaryValue(lpu)}</div>
                  <div className="text-xs text-muted-foreground">Redeemable floor</div>
                </div>
              </div>
            </section>

            <section className="hidden sm:block pb-4 md:pb-0">
              <div className="rounded-2xl border-none bg-transparent p-0 space-y-4 md:border md:border-border/40 md:bg-surface/40 md:p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Discovery Progress</div>
                  <div className="text-xs text-muted-foreground">
                    {discovered} / {totalSupply} units • {discoveryPercent.toFixed(1)}% discovered
                  </div>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full border border-border/60 bg-background/60">
                  <div className="absolute inset-y-0 left-0 w-[10%] rounded-l-full bg-amber-300" />
                  <div className="absolute inset-y-0 left-[10%] w-[10%] bg-fuchsia-300" />
                  <div className="absolute inset-y-0 left-[20%] w-[10%] bg-pink-300" />
                  <div className="absolute inset-y-0 left-[30%] w-[10%] bg-sky-300" />
                  <div className="absolute inset-y-0 left-[40%] w-[10%] bg-indigo-300" />
                  <div className="absolute inset-y-0 left-[50%] w-[50%] bg-muted/40" />
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-emerald-400 transition-all"
                    style={{ width: `${Math.min(100, discoveryProgress)}%` }}
                  />
                </div>
              </div>
            </section>

            <TransactionHistorySection className="hidden lg:block" />

            <section className="hidden sm:block">
              <BuyTagSectionContent />
            </section>
          </div>
        </div>
      </main>

      <div className="sm:hidden">
        {!mobileBuyOpen && (
          <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-5">
            <Button
              onClick={() => setMobileBuyOpen(true)}
              className="w-full rounded-2xl bg-lime-400 py-3 text-base font-semibold text-gray-900 shadow-lg hover:bg-lime-500"
            >
              Tap to buy tag
            </Button>
          </div>
        )}

        {mobileBuyOpen && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/60" onClick={() => setMobileBuyOpen(false)} />
            <div className="absolute inset-x-0 bottom-0 transform transition-transform duration-300 translate-y-0">
              <div className="rounded-t-3xl border border-border/40 border-b-0 bg-background/95 px-4 pb-6 pt-3 text-foreground shadow-2xl backdrop-blur">
                <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-border/60" />
                <div className="max-h-[70vh] overflow-y-auto pb-2 no-scrollbar">
                  <BuyTagSectionContent className="rounded-none border-0 bg-transparent p-0 shadow-none" />
                </div>
                <Button
                  variant="ghost"
                  className="mt-4 w-full rounded-lg border border-border/40 bg-transparent text-sm font-medium text-muted-foreground"
                  onClick={() => setMobileBuyOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
