import { useMemo, useState } from "react";
import { TrendingUp, Users, PiggyBank, ArrowDownCircle, Activity, Trophy, Wallet } from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import { useApp } from "@/lib/app-state";
import { formatCurrency, formatCurrencyK, cn } from "@/lib/utils";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";

type SeriesPoint = {
  name: string;
  sales: number;
  liquidity: number;
  payouts: number;
};

const palette = {
  primary: "hsl(200 90% 56%)",
  secondary: "hsl(214 92% 62%)",
  accent: "hsl(188 92% 50%)",
};

export default function Revenue() {
  const { assets } = useApp();
  const isMobile = useIsMobile();
  const [selectedId, setSelectedId] = useState(() => assets[0]?.id ?? "");
  const selectedAsset = assets.find((asset) => asset.id === selectedId) ?? assets[0] ?? null;

  const globalStats = useMemo(() => {
    return assets.reduce(
      (acc, asset) => {
        const { cycle } = asset;
        const accrued = cycle.accrued ?? {};
        acc.totalSales += cycle.totalSales;
        acc.totalLiquidity += accrued.currentCycleLiquidity ?? 0;
        acc.totalPayouts += accrued.holderRewards ?? 0;
        acc.totalCreator += accrued.creator ?? 0;
        acc.totalNextCycle += accrued.nextCycleLiquidity ?? 0;
        acc.seed += cycle.seedNext;
        acc.cycleCount += 1;
        return acc;
      },
      {
        totalSales: 0,
        totalLiquidity: 0,
        totalPayouts: 0,
        totalCreator: 0,
        totalNextCycle: 0,
        seed: 0,
        cycleCount: 0,
      },
    );
  }, [assets]);

  const performanceSeries: SeriesPoint[] = useMemo(() => {
    return assets.map((asset) => ({
      name: asset.ticker || asset.name,
      sales: Number(asset.cycle.totalSales.toFixed(2)),
      liquidity: Number(((asset.cycle.accrued.currentCycleLiquidity ?? 0)).toFixed(2)),
      payouts: Number(((asset.cycle.accrued.holderRewards ?? 0)).toFixed(2)),
    }));
  }, [assets]);

  const timelineSeries = useMemo(() => {
    return assets.map((asset) => ({
      name: asset.ticker || asset.name,
      nextCycleLiquidity: Number(((asset.cycle.accrued.nextCycleLiquidity ?? 0)).toFixed(2)),
      platform: Number(((asset.cycle.accrued.platform ?? 0)).toFixed(2)),
      creator: Number(((asset.cycle.accrued.creator ?? 0)).toFixed(2)),
    }));
  }, [assets]);

  const leaderboard = useMemo(() => {
    return [...assets]
      .map((asset) => ({
        id: asset.id,
        name: asset.name,
        ticker: asset.ticker,
        image: asset.image,
        sales: asset.cycle.totalSales,
        cycle: asset.cycle.cycle,
        nextSeed: asset.cycle.accrued.nextCycleLiquidity ?? 0,
        rewards: asset.cycle.accrued.holderRewards ?? 0,
      }))
      .sort((a, b) => b.sales - a.sales);
  }, [assets]);

  const topPerformer = leaderboard[0] ?? null;
  const averageSales = assets.length > 0 ? globalStats.totalSales / assets.length : 0;
  const payoutToSalesRatio = globalStats.totalSales > 0 ? (globalStats.totalPayouts / globalStats.totalSales) * 100 : 0;

  const chartConfig = {
    sales: { label: "Gross Sales", color: palette.primary },
    liquidity: { label: "Current Liquidity Added", color: palette.secondary },
    payouts: { label: "Holder Payouts", color: palette.accent },
    nextCycleLiquidity: { label: "Next Cycle Liquidity Seed", color: "hsl(199 89% 60%)" },
    creator: { label: "Creator Share", color: "hsl(222 89% 63%)" },
    platform: { label: "Platform Share", color: "hsl(188 92% 50%)" },
  } as const;

  const multiStreamMinWidth = useMemo(
    () => Math.max(performanceSeries.length * (isMobile ? 144 : 180), isMobile ? 560 : 760),
    [isMobile, performanceSeries.length],
  );

  const selectedSplitSeries = useMemo(
    () =>
      selectedAsset
        ? [
            {
              key: "creator",
              label: "Creator Share",
              value: selectedAsset.cycle.accrued.creator ?? 0,
              color: chartConfig.creator.color,
            },
            {
              key: "nextCycleLiquidity",
              label: "Next Cycle Liquidity",
              value: selectedAsset.cycle.accrued.nextCycleLiquidity ?? 0,
              color: chartConfig.nextCycleLiquidity.color,
            },
            {
              key: "liquidity",
              label: "Current Liquidity",
              value: selectedAsset.cycle.accrued.currentCycleLiquidity ?? 0,
              color: chartConfig.liquidity.color,
            },
            {
              key: "payouts",
              label: "Holder Rewards",
              value: selectedAsset.cycle.accrued.holderRewards ?? 0,
              color: chartConfig.payouts.color,
            },
            {
              key: "platform",
              label: "Platform Allocation",
              value: selectedAsset.cycle.accrued.platform ?? 0,
              color: chartConfig.platform.color,
            },
          ]
        : [],
    [selectedAsset, chartConfig.creator.color, chartConfig.liquidity.color, chartConfig.nextCycleLiquidity.color, chartConfig.payouts.color, chartConfig.platform.color],
  );

  const selectedSplitTotal = useMemo(
    () => selectedSplitSeries.reduce((sum, item) => sum + item.value, 0),
    [selectedSplitSeries],
  );

  if (assets.length === 0) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <main className="container mx-auto px-4 py-16">
          <h1 className="text-3xl font-semibold">Revenue Command Center</h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            Launch a token to start tracking sales, liquidity, and payouts. Revenue analytics will appear here once data is available.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto space-y-10 px-4 pb-16 pt-6">
        <header className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Revenue Command Center</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Monitor how each token funnels volume into the treasury, liquidity pool, and reward backlog. Compare cycle performance at a glance and drill deeper into per-asset revenue streams.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-full border border-border/60 bg-surface/60 px-4 py-2">
            <Activity className="h-4 w-4 text-emerald-400" />
            <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Live telemetry</div>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            icon={TrendingUp}
            label="Gross Token Sales"
            primary={formatCurrency(globalStats.totalSales)}
            caption={`${performanceSeries.length} active collections`}
            tone="blue"
          />
          <KpiCard
            icon={PiggyBank}
            label="Liquidity Backing"
            primary={formatCurrency(globalStats.totalLiquidity)}
            caption="Funds routed into current reserves"
            tone="cyan"
          />
          <KpiCard
            icon={Users}
            label="Holder Payouts"
            primary={formatCurrency(globalStats.totalPayouts)}
            caption="Estimated cumulative share outs"
            tone="indigo"
          />
          <KpiCard
            icon={ArrowDownCircle}
            label="Cycle Rollover Seed"
            primary={formatCurrency(globalStats.seed)}
            caption="Allocated to next cycle reserves"
            tone="teal"
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <Card className="border-border/60 bg-surface/60 shadow-sm lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base sm:text-lg">Portfolio Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/50 bg-background/60 p-4">
                <div className="flex items-start justify-between">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">Top Performer</p>
                  <Trophy className="h-4 w-4 text-sky-400" />
                </div>
                <p className="mt-3 truncate text-lg font-semibold text-foreground">
                  {topPerformer ? topPerformer.name : "No data"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {topPerformer ? `${topPerformer.ticker || topPerformer.id.toUpperCase()} · ${formatCurrency(topPerformer.sales)}` : "Launch data pending"}
                </p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-background/60 p-4">
                <div className="flex items-start justify-between">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">Average Sales</p>
                  <Wallet className="h-4 w-4 text-cyan-400" />
                </div>
                <p className="mt-3 text-lg font-semibold text-foreground">{formatCurrency(averageSales)}</p>
                <p className="text-xs text-muted-foreground">Per collection across current cycle</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-surface/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base sm:text-lg">Payout Efficiency</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-3xl font-semibold text-foreground">{payoutToSalesRatio.toFixed(1)}%</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Holder rewards as a share of gross token sales.
              </p>
              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-muted/70">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500"
                  style={{ width: `${Math.min(100, payoutToSalesRatio)}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6">
          <Card className="border-border/60 bg-surface/60 shadow-sm">
            <CardHeader className="flex flex-col space-y-2">
              <CardTitle className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                Multi-Stream Revenue
                <span className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
                  Per collection
                </span>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Compare sales, liquidity injections, and holder payouts for each token you launched.
              </p>
            </CardHeader>
            <CardContent className="space-y-3 px-0 pb-5">
              <div className="px-4 sm:px-6">
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <LegendPill label="Gross Sales" color={chartConfig.sales.color} />
                  <LegendPill label="Current Liquidity" color={chartConfig.liquidity.color} />
                  <LegendPill label="Holder Payouts" color={chartConfig.payouts.color} />
                </div>
              </div>
              <ScrollArea className="w-full">
                <div className="px-4 pb-2 sm:px-6">
                  <div className={cn("h-[300px] sm:h-[340px]", isMobile ? "min-w-[560px]" : "")} style={{ width: multiStreamMinWidth }}>
                    <ChartContainer config={chartConfig} className="h-full w-full">
                      <BarChart
                        data={performanceSeries}
                        margin={{ top: 12, right: isMobile ? 12 : 20, left: isMobile ? 8 : 20, bottom: isMobile ? 52 : 56 }}
                        barCategoryGap={isMobile ? "22%" : "30%"}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="name"
                          tick={{
                            fill: "hsl(var(--muted-foreground))",
                            fontSize: isMobile ? 10 : 11,
                            angle: -24,
                            textAnchor: "end",
                          }}
                          tickFormatter={(value: string) => (value.length > (isMobile ? 10 : 16) ? `${value.slice(0, isMobile ? 9 : 15)}…` : value)}
                          tickLine={false}
                          axisLine={false}
                          height={58}
                        />
                        <YAxis
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: isMobile ? 10 : 11 }}
                          tickFormatter={(value) => formatCurrencyK(value)}
                          width={isMobile ? 52 : 60}
                          axisLine={false}
                          tickLine={false}
                        />
                        <ChartTooltip
                          cursor={{ fill: "hsl(var(--muted)/20)" }}
                          content={
                            <ChartTooltipContent
                              labelFormatter={(label) => `Asset ${label}`}
                              formatter={(value, name) => [formatCurrency(Number(value)), chartConfig[name as keyof typeof chartConfig]?.label ?? name]}
                            />
                          }
                        />
                        <Bar dataKey="sales" fill={chartConfig.sales.color} radius={[8, 8, 4, 4]} maxBarSize={isMobile ? 14 : 20} />
                        <Bar dataKey="liquidity" fill={chartConfig.liquidity.color} radius={[8, 8, 4, 4]} maxBarSize={isMobile ? 14 : 20} />
                        <Bar dataKey="payouts" fill={chartConfig.payouts.color} radius={[8, 8, 4, 4]} maxBarSize={isMobile ? 14 : 20} />
                      </BarChart>
                    </ChartContainer>
                  </div>
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-6">
          <Card className="border-border/60 bg-surface/60 shadow-sm">
            <CardHeader>
              <CardTitle>Cycle Momentum</CardTitle>
              <p className="text-sm text-muted-foreground">
                Next-cycle liquidity, creator share, and platform allocations plotted per collection.
              </p>
            </CardHeader>
            <CardContent className="space-y-3 px-0 pb-5">
              <div className="px-4 sm:px-6">
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <LegendPill label="Next Cycle Liquidity" color={chartConfig.nextCycleLiquidity.color} />
                  <LegendPill label="Creator Share" color={chartConfig.creator.color} />
                  <LegendPill label="Platform Share" color={chartConfig.platform.color} />
                </div>
              </div>
              <div className="px-4 sm:px-6">
                <div className="h-[280px] w-full sm:h-[320px]">
                  <ChartContainer config={chartConfig} className="h-full w-full">
                    <LineChart data={timelineSeries} margin={{ top: 14, right: isMobile ? 12 : 24, left: isMobile ? 6 : 12, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: isMobile ? 10 : 12 }}
                      interval={isMobile ? "preserveStartEnd" : 0}
                      minTickGap={isMobile ? 28 : 16}
                      tickFormatter={(value: string) => (value.length > (isMobile ? 9 : 14) ? `${value.slice(0, isMobile ? 8 : 13)}…` : value)}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: isMobile ? 10 : 11 }}
                      tickFormatter={(value) => formatCurrencyK(value)}
                      width={isMobile ? 54 : 64}
                      axisLine={false}
                      tickLine={false}
                    />
                    <ChartTooltip
                      cursor={{ stroke: "hsl(var(--muted-foreground))", strokeDasharray: "4 4" }}
                      content={
                        <ChartTooltipContent
                          labelFormatter={(label) => `Collection: ${label}`}
                          formatter={(value, name) => [formatCurrency(Number(value)), chartConfig[name as keyof typeof chartConfig]?.label ?? name]}
                        />
                      }
                    />
                    <Line dataKey="nextCycleLiquidity" type="monotone" stroke={chartConfig.nextCycleLiquidity.color} strokeWidth={2.2} dot={!isMobile ? { r: 2.5 } : false} activeDot={{ r: 4 }} name="nextCycleLiquidity" />
                    <Line dataKey="creator" type="monotone" stroke={chartConfig.creator.color} strokeWidth={2.2} dot={!isMobile ? { r: 2.5 } : false} activeDot={{ r: 4 }} name="creator" />
                    <Line dataKey="platform" type="monotone" stroke={chartConfig.platform.color} strokeWidth={2.2} dot={!isMobile ? { r: 2.5 } : false} activeDot={{ r: 4 }} name="platform" />
                  </LineChart>
                  </ChartContainer>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-surface/60 shadow-sm">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Token Revenue Leaderboard</CardTitle>
                <p className="text-xs text-muted-foreground">Top performing launches ranked by cycle sales.</p>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-muted-foreground">
                Sorted by volume
              </span>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[420px]">
                <ul className="divide-y divide-border/60">
                  {leaderboard.map((entry, index) => (
                    <li
                      key={entry.id}
                      className={cn(
                        "px-4 py-4 transition-colors hover:bg-muted/40",
                        index < 3 ? "bg-muted/20" : "",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span className="w-7 pt-1 text-right text-sm font-semibold text-muted-foreground/80">#{index + 1}</span>
                        <img src={entry.image} alt={entry.name} className="h-10 w-10 rounded-xl object-cover" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <div className="truncate text-sm font-semibold text-foreground">
                              {entry.name}
                              <span className="ml-2 text-xs font-medium text-muted-foreground">
                                {entry.ticker || entry.id.toUpperCase()}
                              </span>
                            </div>
                            <div className="font-mono text-sm text-sky-400">{formatCurrency(entry.sales)}</div>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span>Cycle {entry.cycle}</span>
                            <span>Next seed {formatCurrency(entry.nextSeed)}</span>
                            <span>Rewards {formatCurrency(entry.rewards)}</span>
                          </div>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted/70">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500"
                              style={{ width: `${Math.min(100, (entry.sales / (topPerformer?.sales || 1)) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-6">
          <Card className="border-border/60 bg-surface/70 shadow-sm">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Token Financial Desk</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Tap a collection to review its live revenue splits, liquidity support, and holder rewards.
                </p>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="-mx-3 flex gap-3 overflow-x-auto px-3 no-scrollbar">
                {assets.map((asset) => {
                  const isActive = asset.id === (selectedAsset?.id ?? selectedId);
                  return (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => setSelectedId(asset.id)}
                      className={cn(
                        "flex w-56 shrink-0 flex-col items-start gap-2 rounded-2xl border px-4 py-4 text-left transition sm:w-64",
                        isActive
                          ? "border-emerald-400 bg-emerald-400/10"
                          : "border-border/40 bg-background/60 hover:border-emerald-400/60",
                      )}
                    >
                      <img src={asset.image} alt={asset.name} className="h-10 w-10 rounded-xl object-cover" />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-foreground">{asset.name}</div>
                        <div className="text-xs text-muted-foreground">Cycle {asset.cycle.cycle}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedAsset ? (
                <div className="space-y-5">
                  <div className="flex flex-col gap-3 rounded-3xl border border-border/40 bg-background/70 p-5">
                    <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <img src={selectedAsset.image} alt={selectedAsset.name} className="h-12 w-12 rounded-xl object-cover" />
                        <div>
                          <h2 className="text-lg font-semibold">{selectedAsset.name}</h2>
                          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                            {selectedAsset.ticker || selectedAsset.id} • Cycle {selectedAsset.cycle.cycle}
                          </p>
                        </div>
                      </div>
                      <div className="rounded-full border border-border/40 bg-surface/70 px-3 py-1 text-xs font-semibold text-muted-foreground">
                        {formatCurrency(selectedAsset.cycle.totalSales)} gross sales
                      </div>
                    </header>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <DetailMetric label="Creator Share" value={selectedAsset.cycle.accrued.creator ?? 0} />
                      <DetailMetric label="Current Liquidity" value={selectedAsset.cycle.accrued.currentCycleLiquidity ?? 0} />
                      <DetailMetric label="Holder Rewards" value={selectedAsset.cycle.accrued.holderRewards ?? 0} />
                      <DetailMetric label="Next Cycle Liquidity" value={selectedAsset.cycle.accrued.nextCycleLiquidity ?? 0} />
                      <DetailMetric label="Platform Allocation" value={selectedAsset.cycle.accrued.platform ?? 0} />
                      <DetailMetric label="Seed to Next Cycle" value={selectedAsset.cycle.seedNext} />
                    </div>
                  </div>

                  <div className="rounded-3xl border border-border/40 bg-background/60 p-4">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">Financial Split</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Visual breakdown of how this token's revenue is distributed.
                    </p>
                    <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                      <div className="h-[260px]">
                        <ChartContainer config={chartConfig} className="h-full w-full">
                          <BarChart
                            data={selectedSplitSeries}
                            layout="vertical"
                            margin={{ top: 8, right: 14, left: 8, bottom: 8 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                            <XAxis
                              type="number"
                              tickFormatter={(value) => formatCurrencyK(value)}
                              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              dataKey="label"
                              type="category"
                              width={isMobile ? 108 : 136}
                              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: isMobile ? 10 : 11 }}
                              tickFormatter={(value: string) => (value.length > (isMobile ? 13 : 18) ? `${value.slice(0, isMobile ? 12 : 17)}…` : value)}
                              axisLine={false}
                              tickLine={false}
                            />
                            <ChartTooltip
                              cursor={{ fill: "hsl(var(--muted)/20)" }}
                              content={
                                <ChartTooltipContent
                                  formatter={(value, name) => [formatCurrency(Number(value)), chartConfig[name as keyof typeof chartConfig]?.label ?? name]}
                                />
                              }
                            />
                            <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                              {selectedSplitSeries.map((entry) => (
                                <Cell key={entry.key} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ChartContainer>
                      </div>
                      <div className="grid gap-2 rounded-2xl border border-border/40 bg-background/50 p-3">
                        {selectedSplitSeries.map((entry) => {
                          const pct = selectedSplitTotal > 0 ? (entry.value / selectedSplitTotal) * 100 : 0;
                          return (
                            <div key={`split-${entry.key}`} className="space-y-1">
                              <div className="flex items-center justify-between gap-3 text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                  <span className="text-muted-foreground">{entry.label}</span>
                                </div>
                                <span className="font-mono text-foreground">{pct.toFixed(1)}%</span>
                              </div>
                              <div className="h-1.5 overflow-hidden rounded-full bg-muted/70">
                                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: entry.color }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-border/40 bg-background/70 p-6 text-sm text-muted-foreground">
                  Select a token to see its financial breakdown.
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}

type KpiCardProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  primary: string;
  caption: string;
  tone?: "blue" | "cyan" | "indigo" | "teal";
};

function KpiCard({ icon: Icon, label, primary, caption, tone = "blue" }: KpiCardProps) {
  const toneMap = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    teal: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  } as const;

  return (
    <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-background to-surface/70 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className={cn("rounded-2xl border p-2", toneMap[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">Live</span>
      </div>
      <div className="mt-6 space-y-2">
        <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold text-foreground">{primary}</p>
        <p className="text-xs text-muted-foreground">{caption}</p>
      </div>
    </div>
  );
}

function DetailMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border/40 bg-surface/70 p-3">
      <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-sm text-foreground">{formatCurrency(value)}</div>
    </div>
  );
}

function LegendPill({ label, color }: { label: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
