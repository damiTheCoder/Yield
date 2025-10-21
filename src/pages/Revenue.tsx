import { useMemo, useState } from "react";
import { TrendingUp, Users, PiggyBank, ArrowDownCircle, Activity } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
} from "recharts";
import { useApp } from "@/lib/app-state";
import { formatCurrency, formatCurrencyK, cn } from "@/lib/utils";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

type SeriesPoint = {
  name: string;
  sales: number;
  liquidity: number;
  payouts: number;
};

const palette = {
  primary: "hsl(142 76% 45%)",
  secondary: "hsl(222 89% 63%)",
  accent: "hsl(268 90% 65%)",
};

export default function Revenue() {
  const { assets } = useApp();
  const [selectedId, setSelectedId] = useState(() => assets[0]?.id ?? "");
  const selectedAsset = assets.find((asset) => asset.id === selectedId) ?? assets[0] ?? null;

  const globalStats = useMemo(() => {
    return assets.reduce(
      (acc, asset) => {
        const { cycle } = asset;
        acc.totalSales += cycle.totalSales;
        acc.totalLiquidity += cycle.accrued.liquidityContribution;
        acc.totalPayouts += cycle.accrued.holderRewards;
        acc.totalCreator += cycle.accrued.creator;
        acc.totalReserve += cycle.accrued.reserveGrowth;
        acc.seed += cycle.seedNext;
        acc.cycleCount += 1;
        return acc;
      },
      {
        totalSales: 0,
        totalLiquidity: 0,
        totalPayouts: 0,
        totalCreator: 0,
        totalReserve: 0,
        seed: 0,
        cycleCount: 0,
      },
    );
  }, [assets]);

  const performanceSeries: SeriesPoint[] = useMemo(() => {
    return assets.map((asset) => ({
      name: asset.ticker || asset.name,
      sales: Number(asset.cycle.totalSales.toFixed(2)),
      liquidity: Number(asset.cycle.accrued.liquidityContribution.toFixed(2)),
      payouts: Number(asset.cycle.accrued.holderRewards.toFixed(2)),
    }));
  }, [assets]);

  const timelineSeries = useMemo(() => {
    return assets.map((asset) => ({
      name: asset.ticker || asset.name,
      reserveGrowth: Number(asset.cycle.accrued.reserveGrowth.toFixed(2)),
      platform: Number(asset.cycle.accrued.platform.toFixed(2)),
      creator: Number(asset.cycle.accrued.creator.toFixed(2)),
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
        reserves: asset.cycle.accrued.reserveGrowth,
        rewards: asset.cycle.accrued.holderRewards,
      }))
      .sort((a, b) => b.sales - a.sales);
  }, [assets]);

  const chartConfig = {
    sales: { label: "Gross Sales", color: palette.primary },
    liquidity: { label: "Liquidity Added", color: palette.secondary },
    payouts: { label: "Holder Payouts", color: palette.accent },
    reserve: { label: "Reserve Growth", color: palette.secondary },
    creator: { label: "Creator Share", color: palette.primary },
    platform: { label: "Platform Share", color: palette.accent },
  } as const;

  const multiStreamMinWidth = useMemo(
    () => Math.max(performanceSeries.length * 200, 720),
    [performanceSeries.length],
  );

  const detailChartData = useMemo(
    () =>
      selectedAsset
        ? [
            {
              label: selectedAsset.ticker || selectedAsset.name,
              creator: selectedAsset.cycle.accrued.creator,
              reserve: selectedAsset.cycle.accrued.reserveGrowth,
              liquidity: selectedAsset.cycle.accrued.liquidityContribution,
              payouts: selectedAsset.cycle.accrued.holderRewards,
              platform: selectedAsset.cycle.accrued.platform,
            },
          ]
        : [],
    [selectedAsset],
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
      <main className="container mx-auto px-4 pb-16 pt-6 space-y-10">
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

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            icon={TrendingUp}
            label="Gross Token Sales"
            primary={formatCurrency(globalStats.totalSales)}
            caption={`${performanceSeries.length} active collections`}
          />
          <KpiCard
            icon={PiggyBank}
            label="Liquidity Backing"
            primary={formatCurrency(globalStats.totalLiquidity)}
            caption="Funds routed into current reserves"
          />
          <KpiCard
            icon={Users}
            label="Holder Payouts"
            primary={formatCurrency(globalStats.totalPayouts)}
            caption="Estimated cumulative share outs"
          />
          <KpiCard
            icon={ArrowDownCircle}
            label="Cycle Rollover Seed"
            primary={formatCurrency(globalStats.seed)}
            caption="Allocated to next cycle reserves"
          />
        </section>

        <section className="grid gap-6">
          <Card className="border-border/60 bg-surface/60 shadow-lg">
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
            <CardContent className="px-0 pb-6">
              <div className="-mx-4 overflow-x-auto px-4 no-scrollbar sm:-mx-6 sm:px-6">
                <div className="h-[320px]" style={{ width: multiStreamMinWidth }}>
                  <ChartContainer config={chartConfig} className="h-full w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={performanceSeries}
                        margin={{ top: 16, right: 24, left: 24, bottom: 48 }}
                        barCategoryGap="32%"
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="name"
                          tick={{
                            fill: "hsl(var(--muted-foreground))",
                            fontSize: 11,
                            angle: -20,
                            textAnchor: "end",
                          }}
                          tickFormatter={(value) => (value.length > 16 ? `${value.slice(0, 15)}…` : value)}
                          tickLine={false}
                          axisLine={false}
                          height={56}
                        />
                        <YAxis
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                          tickFormatter={(value) => formatCurrencyK(value)}
                          width={60}
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
                        <Bar dataKey="sales" fill={chartConfig.sales.color} radius={[8, 8, 4, 4]} />
                        <Bar dataKey="liquidity" fill={chartConfig.liquidity.color} radius={[8, 8, 4, 4]} />
                        <Bar dataKey="payouts" fill={chartConfig.payouts.color} radius={[8, 8, 4, 4]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-6">
          <Card className="border-border/60 bg-surface/60 shadow-lg">
            <CardHeader>
              <CardTitle>Cycle Momentum</CardTitle>
              <p className="text-sm text-muted-foreground">
                Reserve growth, creator share, and platform allocations plotted per collection.
              </p>
            </CardHeader>
            <CardContent className="h-[320px] px-0 pb-6">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timelineSeries} margin={{ top: 16, right: 32, left: 12, bottom: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      tickFormatter={(value) => formatCurrencyK(value)}
                      width={64}
                      axisLine={false}
                      tickLine={false}
                    />
                    <RechartsTooltip
                      cursor={{ stroke: "hsl(var(--muted-foreground))", strokeDasharray: "4 4" }}
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.75rem",
                      }}
                      formatter={(value: number, name: string) => [formatCurrency(value), chartConfig[name as keyof typeof chartConfig]?.label ?? name]}
                      labelFormatter={(label) => `Collection: ${label}`}
                    />
                    <Line dataKey="reserveGrowth" type="monotone" stroke={chartConfig.reserve.color} strokeWidth={2} dot={{ r: 3 }} name="reserve" />
                    <Line dataKey="creator" type="monotone" stroke={chartConfig.creator.color} strokeWidth={2} dot={{ r: 3 }} name="creator" />
                    <Line dataKey="platform" type="monotone" stroke={chartConfig.platform.color} strokeWidth={2} dot={{ r: 3 }} name="platform" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-surface/60 shadow-lg">
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
                        "flex items-center gap-4 px-4 py-4 transition-colors hover:bg-muted/40",
                        index < 3 ? "bg-muted/20" : "",
                      )}
                    >
                      <span className="w-6 text-right text-sm font-semibold text-muted-foreground/80">#{index + 1}</span>
                      <img src={entry.image} alt={entry.name} className="h-10 w-10 rounded-xl object-cover" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <div className="truncate text-sm font-semibold text-foreground">
                            {entry.name}
                            <span className="ml-2 text-xs font-medium text-muted-foreground">
                              {entry.ticker || entry.id.toUpperCase()}
                            </span>
                          </div>
                          <div className="font-mono text-sm text-emerald-300">{formatCurrency(entry.sales)}</div>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span>Cycle {entry.cycle}</span>
                          <span>Reserves {formatCurrency(entry.reserves)}</span>
                          <span>Rewards {formatCurrency(entry.rewards)}</span>
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
          <Card className="border-border/60 bg-surface/70 shadow-lg">
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
                      <DetailMetric label="Creator Share" value={selectedAsset.cycle.accrued.creator} />
                      <DetailMetric label="Liquidity Added" value={selectedAsset.cycle.accrued.liquidityContribution} />
                      <DetailMetric label="Holder Rewards" value={selectedAsset.cycle.accrued.holderRewards} />
                      <DetailMetric label="Reserve Growth" value={selectedAsset.cycle.accrued.reserveGrowth} />
                      <DetailMetric label="Platform Allocation" value={selectedAsset.cycle.accrued.platform} />
                      <DetailMetric label="Seed to Next Cycle" value={selectedAsset.cycle.seedNext} />
                    </div>
                  </div>

                  <div className="rounded-3xl border border-border/40 bg-background/60 p-4">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">Financial Split</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Visual breakdown of how this token’s revenue is distributed.
                    </p>
                    <div className="-mx-3 mt-4 overflow-x-auto px-3 no-scrollbar">
                      <div className="h-48 min-w-[420px]">
                        <ChartContainer config={chartConfig} className="h-full w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={detailChartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis dataKey="label" hide />
                              <YAxis tickFormatter={(value) => formatCurrencyK(value)} width={60} />
                              <ChartTooltip
                                cursor={{ fill: "hsl(var(--muted)/20)" }}
                                content={
                                  <ChartTooltipContent
                                    formatter={(value, name) => [formatCurrency(Number(value)), chartConfig[name as keyof typeof chartConfig]?.label ?? name]}
                                  />
                                }
                              />
                              <Bar dataKey="creator" stackId="a" fill={chartConfig.creator.color} radius={[6, 6, 0, 0]} />
                              <Bar dataKey="reserve" stackId="a" fill={chartConfig.reserve.color} radius={[6, 6, 0, 0]} />
                              <Bar dataKey="liquidity" stackId="a" fill={chartConfig.liquidity.color} radius={[6, 6, 0, 0]} />
                              <Bar dataKey="payouts" stackId="a" fill={chartConfig.payouts.color} radius={[6, 6, 0, 0]} />
                              <Bar dataKey="platform" stackId="a" fill={chartConfig.platform.color} radius={[6, 6, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </ChartContainer>
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
};

function KpiCard({ icon: Icon, label, primary, caption }: KpiCardProps) {
  return (
    <div className="rounded-3xl border border-border/60 bg-surface/80 p-5 shadow-lg backdrop-blur">
      <div className="flex items-center justify-between">
        <div className="rounded-2xl bg-emerald-500/10 p-2 text-emerald-300">
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
