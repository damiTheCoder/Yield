import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useApp } from "@/lib/app-state";
import { formatCurrency } from "@/lib/utils";
import { useMemo } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, CartesianGrid, XAxis, YAxis, Legend } from "recharts";

export default function Revenue() {
  const { assets } = useApp();

  const totals = useMemo(
    () =>
      assets.reduce(
        (acc, asset) => {
          const { cycle } = asset;
          acc.sales += cycle.totalSales;
          acc.creator += cycle.accrued.creator;
          acc.reserveGrowth += cycle.accrued.reserveGrowth;
          acc.platform += cycle.accrued.platform;
          acc.liquidity += cycle.accrued.liquidityContribution;
          acc.holderRewards += cycle.accrued.holderRewards;
          acc.seedNext += cycle.seedNext;
          return acc;
        },
        {
          sales: 0,
          creator: 0,
          reserveGrowth: 0,
          platform: 0,
          liquidity: 0,
          holderRewards: 0,
          seedNext: 0,
        },
      ),
    [assets],
  );

  const distribution = useMemo(
    () => [
      { key: "creator", label: "Creator", value: totals.creator },
      { key: "liquidity", label: "Liquidity", value: totals.liquidity },
      { key: "reserve", label: "Reserve Growth", value: totals.reserveGrowth },
      { key: "platform", label: "Platform", value: totals.platform },
      { key: "rewards", label: "Holder Rewards", value: totals.holderRewards },
      { key: "seed", label: "Seed Next", value: totals.seedNext },
    ],
    [totals],
  );

  const barData = useMemo(
    () =>
      assets.map((asset) => ({
        name: asset.ticker || asset.name,
        sales: Number(asset.cycle.totalSales.toFixed(2)),
        liquidity: Number(asset.cycle.accrued.liquidityContribution.toFixed(2)),
        reserve: Number(asset.cycle.accrued.reserveGrowth.toFixed(2)),
        rewards: Number(asset.cycle.accrued.holderRewards.toFixed(2)),
      })),
    [assets],
  );

  const hasRevenue = totals.sales > 0;
  const chartConfig = {
    creator: { label: "Creator", color: "hsl(51 100% 50%)" },
    liquidity: { label: "Liquidity", color: "hsl(142 76% 46%)" },
    reserve: { label: "Reserve", color: "hsl(262 83% 66%)" },
    platform: { label: "Platform", color: "hsl(217 91% 60%)" },
    rewards: { label: "Rewards", color: "hsl(348 100% 68%)" },
    seed: { label: "Seed Next", color: "hsl(199 89% 48%)" },
  } as const;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Revenue Monitor</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Track live CoinTag sales and revenue splits across every LFT you have launched.
          </p>
        </div>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Protocol Totals</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm sm:gap-6">
            <Metric label="Gross Sales" value={totals.sales} />
            <Metric label="Liquidity Added" value={totals.liquidity} />
            <Metric label="Creator Share" value={totals.creator} />
            <Metric label="Reserve Growth" value={totals.reserveGrowth} />
            <Metric label="Platform" value={totals.platform} />
            <Metric label="Holder Rewards" value={totals.holderRewards} />
            <Metric label="Seeded Next Cycle" value={totals.seedNext} />
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <Card className="bg-background">
            <CardHeader className="pb-1">
              <CardTitle>Revenue Allocation</CardTitle>
            </CardHeader>
            <CardContent className="px-1 pb-3">
              {hasRevenue ? (
                <ChartContainer config={chartConfig} className="aspect-square">
                  <PieChart>
                    <Pie
                      data={distribution}
                      dataKey="value"
                      nameKey="label"
                      innerRadius={80}
                      outerRadius={140}
                      paddingAngle={4}
                    >
                      {distribution.map((slice) => (
                        <Cell key={slice.key} fill={(chartConfig as any)[slice.key]?.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
              ) : (
                <EmptyState label="No revenue yet" />
              )}
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-surface/40">
            <CardHeader>
              <CardTitle>Per-Asset Streams</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {barData.length > 0 ? (
                <ChartContainer config={chartConfig} className="aspect-video">
                  <BarChart data={barData} margin={{ top: 12, right: 12, left: 12, bottom: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${v}`} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="sales" name="Sales" fill={chartConfig.creator.color} radius={[6, 6, 0, 0]} />
                    <Bar dataKey="liquidity" name="Liquidity" fill={chartConfig.liquidity.color} radius={[6, 6, 0, 0]} />
                    <Bar dataKey="reserve" name="Reserve" fill={chartConfig.reserve.color} radius={[6, 6, 0, 0]} />
                    <Bar dataKey="rewards" name="Rewards" fill={chartConfig.rewards.color} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <EmptyState label="No assets available" />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="hidden md:block rounded-md border border-border/40 bg-surface/40 overflow-x-auto">
          <Table className="min-w-full text-sm">
            <TableHeader>
              <TableRow>
                <TableHead className="text-left">Collection</TableHead>
                <TableHead className="text-center">Cycle</TableHead>
                <TableHead className="text-center">Gross Sales</TableHead>
                <TableHead className="text-center">Creator</TableHead>
                <TableHead className="text-center">Reserve Growth</TableHead>
                <TableHead className="text-center">Liquidity</TableHead>
                <TableHead className="text-center">Platform</TableHead>
                <TableHead className="text-center">Holder Rewards</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((asset) => (
                <TableRow key={asset.id} className="align-middle">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img src={asset.image} alt={asset.name} className="h-10 w-10 rounded-lg object-cover" />
                      <div>
                        <div className="font-medium">{asset.name}</div>
                        <div className="text-xs text-muted-foreground">{asset.ticker || asset.id}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-mono">{asset.cycle.cycle}</TableCell>
                  <TableCell className="text-center font-mono">{formatCurrency(asset.cycle.totalSales)}</TableCell>
                  <TableCell className="text-center font-mono">{formatCurrency(asset.cycle.accrued.creator)}</TableCell>
                  <TableCell className="text-center font-mono">{formatCurrency(asset.cycle.accrued.reserveGrowth)}</TableCell>
                  <TableCell className="text-center font-mono">{formatCurrency(asset.cycle.accrued.liquidityContribution)}</TableCell>
                  <TableCell className="text-center font-mono">{formatCurrency(asset.cycle.accrued.platform)}</TableCell>
                  <TableCell className="text-center font-mono">{formatCurrency(asset.cycle.accrued.holderRewards)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="grid gap-4 md:hidden">
          {assets.map((asset) => (
            <Card key={asset.id} className="border-border/40 bg-surface/40">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-3">
                  <img src={asset.image} alt={asset.name} className="h-9 w-9 rounded-lg object-cover" />
                  <span className="truncate">{asset.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Cycle</span><span className="font-mono">{asset.cycle.cycle}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Gross Sales</span><span className="font-mono">{formatCurrency(asset.cycle.totalSales)}</span></div>
                <div className="grid grid-cols-2 gap-2">
                  <MiniMetric label="Creator" value={asset.cycle.accrued.creator} />
                  <MiniMetric label="Reserve" value={asset.cycle.accrued.reserveGrowth} />
                  <MiniMetric label="Liquidity" value={asset.cycle.accrued.liquidityContribution} />
                  <MiniMetric label="Platform" value={asset.cycle.accrued.platform} />
                  <MiniMetric label="Rewards" value={asset.cycle.accrued.holderRewards} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-mono text-lg font-semibold">{formatCurrency(value)}</div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border/40 bg-background/40 p-2 space-y-1">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold">{formatCurrency(value)}</div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-[240px] items-center justify-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}
