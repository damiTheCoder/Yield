import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useApp, type Asset } from "@/lib/app-state";
import { cn, formatCompactCurrency, formatCurrencyK } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import Web3News from "@/components/Web3News";

type ValuePoint = {
  label: string;
  value: number;
  color: string;
};

type RatioPoint = {
  label: string;
  value: number;
  ratio: number;
  color: string;
};

type CycleFinancials = {
  cycle: number;
  hasLiveData: boolean;
  isCurrent: boolean;
  note: string;
  launchCost: number;
  grossRevenue: number;
  currentReserve: number;
  currentLiquidity: number;
  nextCycleSeed: number;
  creatorRevenue: number;
  protocolProfit: number;
  holderRewards: number;
  reserveFunding: number;
  creatorAndRewards: number;
  reserveGrowth: number;
  currentLpu: number;
  remainingSupply: number;
  initialSupply: number;
};

const palette = {
  revenue: "#2f66f6",
  reserve: "#0891b2",
  seed: "#5b4bff",
  creator: "#f97316",
  rewards: "#e11d48",
  profit: "#10b981",
  slate: "#475569",
  violet: "#7c3aed",
};

const metricTones = {
  blue: "text-[#2f66f6]",
  green: "text-[#059669]",
  purple: "text-[#4f46e5]",
  red: "text-[#e11d48]",
  slate: "text-[#475569]",
  orange: "text-[#ea580c]",
  cyan: "text-[#0891b2]",
} as const;

const cardClass = "rounded-[24px] border border-transparent bg-[#f5f7fb] shadow-none";

const DEFAULT_SPLIT = {
  creator: 0.2,
  nextCycleLiquidity: 0.3,
  platform: 0.15,
  currentCycleLiquidity: 0.3,
  holderRewards: 0.05,
} as const;

function percent(value: number, total: number) {
  if (total <= 0) return 0;
  return (value / total) * 100;
}

function getCycleFinancials(asset: Asset): CycleFinancials[] {
  const split = asset.cycle.split ?? asset.params.split ?? DEFAULT_SPLIT;
  const snapshots = new Map((asset.secondaryMarket?.snapshots ?? []).map((entry) => [entry.cycle, entry]));
  const currentCycleNumber = Math.max(1, asset.cycle.cycle);
  const cycles: CycleFinancials[] = [];
  let cycleStartReserve = asset.params.initialReserve;
  let previousEndReserve = asset.params.initialReserve;
  let previousSeedNext = 0;

  for (let cycle = 1; cycle <= 5; cycle += 1) {
    const cycleInitialSupply = Math.max(1, Math.floor(asset.params.initialSupply / 2 ** (cycle - 1)));

    if (cycle === currentCycleNumber) {
      const currentReserve = asset.cycle.reserve;
      const currentLiquidity = asset.cycle.accrued.currentCycleLiquidity ?? 0;
      const nextCycleSeed = asset.cycle.accrued.nextCycleLiquidity ?? 0;
      const creatorRevenue = asset.cycle.accrued.creator ?? 0;
      const protocolProfit = asset.cycle.accrued.platform ?? 0;
      const holderRewards = asset.cycle.accrued.holderRewards ?? 0;
      const grossRevenue = asset.cycle.totalSales;
      const reserveFunding = currentLiquidity + nextCycleSeed;

      cycles.push({
        cycle,
        hasLiveData: true,
        isCurrent: true,
        note: "Live current-cycle financials from this token.",
        launchCost: cycleStartReserve,
        grossRevenue,
        currentReserve,
        currentLiquidity,
        nextCycleSeed,
        creatorRevenue,
        protocolProfit,
        holderRewards,
        reserveFunding,
        creatorAndRewards: creatorRevenue + holderRewards,
        reserveGrowth: currentReserve - cycleStartReserve,
        currentLpu: asset.cycle.lpu,
        remainingSupply: asset.cycle.supply,
        initialSupply: asset.cycle.initialSupply,
      });

      previousEndReserve = currentReserve;
      previousSeedNext = nextCycleSeed;
      cycleStartReserve = cycle === 1 ? nextCycleSeed : currentReserve;
      continue;
    }

    if (cycle < currentCycleNumber) {
      const snapshot = snapshots.get(cycle);
      const currentReserve = snapshot?.liquidity ?? cycleStartReserve;
      const remainingSupply = snapshot?.unredeemedSupply ?? cycleInitialSupply;
      const grossRevenue =
        split.currentCycleLiquidity > 0
          ? Math.max(0, currentReserve - cycleStartReserve) / split.currentCycleLiquidity
          : 0;
      const currentLiquidity = grossRevenue * split.currentCycleLiquidity;
      const nextCycleSeed = grossRevenue * split.nextCycleLiquidity;
      const creatorRevenue = grossRevenue * split.creator;
      const protocolProfit = grossRevenue * split.platform;
      const holderRewards = grossRevenue * split.holderRewards;

      cycles.push({
        cycle,
        hasLiveData: Boolean(snapshot),
        isCurrent: false,
        note: snapshot
          ? "Recorded cycle snapshot with split-based financial breakdown."
          : "Cycle summary reconstructed from available token data.",
        launchCost: cycleStartReserve,
        grossRevenue,
        currentReserve,
        currentLiquidity,
        nextCycleSeed,
        creatorRevenue,
        protocolProfit,
        holderRewards,
        reserveFunding: currentLiquidity + nextCycleSeed,
        creatorAndRewards: creatorRevenue + holderRewards,
        reserveGrowth: currentReserve - cycleStartReserve,
        currentLpu: remainingSupply > 0 ? currentReserve / remainingSupply : 0,
        remainingSupply,
        initialSupply: cycleInitialSupply,
      });

      previousEndReserve = currentReserve;
      previousSeedNext = nextCycleSeed;
      cycleStartReserve = cycle === 1 ? nextCycleSeed : currentReserve;
      continue;
    }

    cycles.push({
      cycle,
      hasLiveData: false,
      isCurrent: false,
      note: "No live cycle data has been recorded for this token yet.",
      launchCost: cycle === 1 ? asset.params.initialReserve : cycle === 2 ? previousSeedNext : previousEndReserve,
      grossRevenue: 0,
      currentReserve: cycle === 1 ? asset.params.initialReserve : cycle === 2 ? previousSeedNext : previousEndReserve,
      currentLiquidity: 0,
      nextCycleSeed: 0,
      creatorRevenue: 0,
      protocolProfit: 0,
      holderRewards: 0,
      reserveFunding: 0,
      creatorAndRewards: 0,
      reserveGrowth: 0,
      currentLpu: cycleInitialSupply > 0 ? (cycle === 1 ? asset.params.initialReserve : cycle === 2 ? previousSeedNext : previousEndReserve) / cycleInitialSupply : 0,
      remainingSupply: cycleInitialSupply,
      initialSupply: cycleInitialSupply,
    });
  }

  return cycles;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="min-w-[170px] rounded-2xl bg-white px-3 py-2 shadow-sm ring-1 ring-black/5">
      {label ? (
        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#94a3b8]">{label}</div>
      ) : null}
      <div className="mt-1.5 space-y-1.5">
        {payload.map((entry) => (
          <div key={`${label}-${entry.name}`} className="flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 text-[#475569]">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              <span>{entry.name}</span>
            </div>
            <span className="font-semibold text-[#0f172a]">{formatCompactCurrency(Number(entry.value ?? 0))}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Revenue() {
  const { assets } = useApp();
  const isMobile = useIsMobile();
  const [selectedId, setSelectedId] = useState(() => assets[0]?.id ?? "");
  const [selectedCycle, setSelectedCycle] = useState(1);
  const [cycleModalOpen, setCycleModalOpen] = useState(false);

  useEffect(() => {
    if (!assets.length) {
      setSelectedId("");
      return;
    }
    if (!assets.some((asset) => asset.id === selectedId)) {
      setSelectedId(assets[0]?.id ?? "");
    }
  }, [assets, selectedId]);

  const selectedAsset = assets.find((asset) => asset.id === selectedId) ?? assets[0] ?? null;

  const cycleOptions = useMemo(
    () => (selectedAsset ? getCycleFinancials(selectedAsset) : []),
    [selectedAsset],
  );

  useEffect(() => {
    if (!selectedAsset) {
      setSelectedCycle(1);
      return;
    }
    setSelectedCycle(Math.min(Math.max(1, selectedAsset.cycle.cycle), 5));
  }, [selectedAsset]);

  const activeCycle =
    cycleOptions.find((entry) => entry.cycle === selectedCycle) ??
    cycleOptions[Math.min(cycleOptions.length - 1, Math.max(0, selectedAsset?.cycle.cycle ? selectedAsset.cycle.cycle - 1 : 0))] ??
    null;

  const metrics = useMemo(() => {
    if (!selectedAsset || !activeCycle) return null;

    const sharingData: ValuePoint[] = [
      { label: "Current Liquidity", value: activeCycle.currentLiquidity, color: palette.reserve },
      { label: "Next-cycle Seed", value: activeCycle.nextCycleSeed, color: palette.seed },
      { label: "Creator Share", value: activeCycle.creatorRevenue, color: palette.creator },
      { label: "Protocol Share", value: activeCycle.protocolProfit, color: palette.profit },
      { label: "Holder Rewards", value: activeCycle.holderRewards, color: palette.rewards },
    ];

    const positionData: ValuePoint[] = [
      { label: "Launch Cost", value: activeCycle.launchCost, color: palette.slate },
      { label: "Gross Revenue", value: activeCycle.grossRevenue, color: palette.revenue },
      { label: "Current Reserve", value: activeCycle.currentReserve, color: palette.reserve },
      { label: "Creator Revenue", value: activeCycle.creatorRevenue, color: palette.creator },
      { label: "Protocol Profit", value: activeCycle.protocolProfit, color: palette.profit },
    ];

    const flowData: ValuePoint[] = [
      { label: "Gross Revenue", value: activeCycle.grossRevenue, color: palette.revenue },
      { label: "Reserve Funding", value: activeCycle.reserveFunding, color: palette.violet },
      { label: "Creator + Rewards", value: activeCycle.creatorAndRewards, color: palette.creator },
      { label: "Protocol Profit", value: activeCycle.protocolProfit, color: palette.profit },
      { label: "Reserve Balance", value: activeCycle.currentReserve, color: palette.reserve },
    ];

    const ratioData: RatioPoint[] = [
      {
        label: "Reserve Funding",
        value: activeCycle.reserveFunding,
        ratio: percent(activeCycle.reserveFunding, activeCycle.grossRevenue),
        color: palette.violet,
      },
      {
        label: "Creator Share",
        value: activeCycle.creatorRevenue,
        ratio: percent(activeCycle.creatorRevenue, activeCycle.grossRevenue),
        color: palette.creator,
      },
      {
        label: "Protocol Profit",
        value: activeCycle.protocolProfit,
        ratio: percent(activeCycle.protocolProfit, activeCycle.grossRevenue),
        color: palette.profit,
      },
      {
        label: "Holder Rewards",
        value: activeCycle.holderRewards,
        ratio: percent(activeCycle.holderRewards, activeCycle.grossRevenue),
        color: palette.rewards,
      },
    ];

    return {
      ...activeCycle,
      sharingData,
      positionData,
      flowData,
      ratioData,
    };
  }, [activeCycle, selectedAsset]);

  if (!assets.length || !selectedAsset || !metrics) {
    return (
      <div className="min-h-screen bg-white text-foreground">
        <main className="container mx-auto px-4 py-14">
          <Card className={cardClass}>
            <CardContent className="flex flex-col items-start gap-3 p-6">
              <div className="rounded-full bg-[#edf3ff] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#2f66f6]">
                Revenue
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-[#0f172a]">Token Financials Dashboard</h1>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-[#64748b]">
                  Launch a token first. Once CoinTag sales and reserve activity exist, this page will track the actual financial performance of each launched token.
                </p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-foreground">
      <main className="container mx-auto px-4 pb-16 pt-5">
        <div className="space-y-4 sm:space-y-5 lg:grid lg:grid-cols-12 lg:gap-8 lg:space-y-0">
          <aside className="hidden lg:col-span-4 lg:block lg:space-y-6 lg:pt-2">
            <Web3News variant="detail" />
          </aside>

          <div className="space-y-4 sm:space-y-5 lg:col-span-8">
            <header className="space-y-2.5">
              <div className="inline-flex rounded-full bg-[#edf3ff] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#2f66f6]">
                Revenue
              </div>
              <div className="space-y-2">
                <h1 className="text-[28px] font-semibold tracking-tight text-[#0f172a] sm:text-[36px]">
                  Token Financials Dashboard
                </h1>
                <p className="max-w-3xl text-sm leading-7 text-[#64748b] sm:text-[15px]">
                  This dashboard helps creators monitor the live financial performance of each launched token, including launch cost, CoinTag revenue, reserve funding, creator share, rewards, and protocol income.
                </p>
              </div>
            </header>

            <section className={cn(cardClass, "p-4 sm:p-5")}>
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#94a3b8]">
                Launched Tokens
              </div>
              <div
                className="-mx-1 overflow-x-auto no-scrollbar px-1 pb-1"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                <div className="flex gap-3">
                  {assets.map((asset) => {
                    const isActive = asset.id === selectedAsset.id;

                    return (
                      <button
                        key={asset.id}
                        type="button"
                        onClick={() => {
                          setSelectedId(asset.id);
                          setCycleModalOpen(true);
                        }}
                        className={cn(
                          "relative flex w-[168px] shrink-0 items-center gap-3 rounded-[20px] px-3 py-3 text-left transition",
                          isActive ? "bg-white shadow-sm" : "bg-white hover:bg-white/95",
                        )}
                      >
                        <div className="relative shrink-0">
                          <img
                            src={asset.image}
                            alt={asset.name}
                            className="h-11 w-11 rounded-[14px] object-cover"
                          />
                          {isActive ? (
                            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#2f66f6] text-white">
                              <Check className="h-3.5 w-3.5 stroke-[3]" />
                            </span>
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-[#0f172a]">{asset.name}</div>
                          <div className="mt-0.5 text-xs text-[#64748b]">
                            Cycle {asset.cycle.cycle} · {asset.network}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            <Dialog open={cycleModalOpen} onOpenChange={setCycleModalOpen}>
              <DialogContent
                className="max-w-[360px] rounded-[28px] border-0 bg-white p-5 shadow-xl sm:p-6"
                overlayClassName="bg-black/20"
              >
                <DialogHeader className="space-y-2 text-left">
                  <DialogTitle className="text-[18px] font-semibold text-[#0f172a]">
                    {selectedAsset.name}
                  </DialogTitle>
                  <p className="text-[12px] leading-6 text-[#64748b]">
                    Select a cycle to view the token financials for that cycle.
                  </p>
                </DialogHeader>

                <div className="grid grid-cols-1 gap-2.5">
                  {cycleOptions.map((entry) => {
                    const isActiveCycle = entry.cycle === selectedCycle;
                    return (
                      <button
                        key={entry.cycle}
                        type="button"
                        onClick={() => {
                          setSelectedCycle(entry.cycle);
                          setCycleModalOpen(false);
                        }}
                        className={cn(
                          "flex items-center justify-between rounded-[18px] px-4 py-3 text-left transition",
                          isActiveCycle ? "bg-[#eef4ff]" : "bg-[#f5f7fb] hover:bg-[#eef2f8]",
                        )}
                      >
                        <div>
                          <div className="text-[14px] font-semibold text-[#0f172a]">{`Cycle ${entry.cycle}`}</div>
                          <div className="mt-0.5 text-[11px] text-[#64748b]">
                            {entry.hasLiveData ? (entry.isCurrent ? "Live data available" : "Recorded cycle data") : "No live cycle data"}
                          </div>
                        </div>
                        {isActiveCycle ? (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2f66f6] text-white">
                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </DialogContent>
            </Dialog>

            <section className="-mx-1 overflow-x-auto no-scrollbar px-1 pb-1">
              <div className="flex min-w-max gap-3 sm:gap-4">
                <MetricCard
                  label="Gross CoinTag Revenue"
                  value={formatCompactCurrency(metrics.grossRevenue)}
                  caption={`Actual revenue recorded in cycle ${metrics.cycle}`}
                  tone="blue"
                />
                <MetricCard
                  label="Launch Cost"
                  value={formatCompactCurrency(metrics.launchCost)}
                  caption={`Reserve committed at the start of cycle ${metrics.cycle}`}
                  tone="slate"
                />
                <MetricCard
                  label="Current Reserve"
                  value={formatCompactCurrency(metrics.currentReserve)}
                  caption={`Reserve balance captured for cycle ${metrics.cycle}`}
                  tone="cyan"
                />
                <MetricCard
                  label="Reserve Funding"
                  value={formatCompactCurrency(metrics.reserveFunding)}
                  caption="Liquidity backing plus next-cycle seed"
                  tone="purple"
                />
                <MetricCard
                  label="Creator Revenue"
                  value={formatCompactCurrency(metrics.creatorRevenue)}
                  caption="Creator share generated in this cycle"
                  tone="orange"
                />
                <MetricCard
                  label="Protocol Profit"
                  value={formatCompactCurrency(metrics.protocolProfit)}
                  caption="Protocol-side revenue in this cycle"
                  tone="green"
                />
                <MetricCard
                  label="Holder Rewards"
                  value={formatCompactCurrency(metrics.holderRewards)}
                  caption="Rewards accrued for holders in this cycle"
                  tone="red"
                />
                <MetricCard
                  label="Reserve Growth"
                  value={formatCompactCurrency(metrics.reserveGrowth)}
                  caption="Reserve change from cycle launch cost"
                  tone="cyan"
                />
              </div>
            </section>

            <section className="grid gap-4 xl:grid-cols-2">
              <Panel title="Cycle Revenue Sharing" subtitle="Token split for the selected cycle">
                <ValueBarChart data={metrics.sharingData} isMobile={isMobile} />
              </Panel>

              <Panel title="Cycle Financial Position" subtitle="Real financial position for the selected cycle">
                <ValueBarChart data={metrics.positionData} isMobile={isMobile} />
              </Panel>
            </section>

            <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]">
              <Panel title="CoinTag Sales Effect" subtitle="How sales are affecting the selected cycle">
                <ValueBarChart data={metrics.flowData} isMobile={isMobile} />
              </Panel>

              <Panel title="Cycle Ratios & Status">
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <MiniInfo label="Cycle" value={`${metrics.cycle}`} />
                    <MiniInfo label="Current LPU" value={formatCompactCurrency(metrics.currentLpu)} />
                    <MiniInfo label="Remaining Supply" value={`${metrics.remainingSupply}/${metrics.initialSupply}`} />
                    <MiniInfo label="Next-cycle Seed" value={formatCompactCurrency(metrics.nextCycleSeed)} />
                  </div>

                  <div className="space-y-3">
                    {metrics.ratioData.map((item) => (
                      <div key={item.label} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-4 text-xs">
                          <div className="font-medium text-[#334155]">{item.label}</div>
                          <div className="text-right">
                            <span className="font-semibold text-[#0f172a]">{formatCompactCurrency(item.value)}</span>
                            <span className="ml-2 text-[#64748b]">{item.ratio.toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-white">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${Math.min(100, item.ratio)}%`, backgroundColor: item.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Panel>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

function MetricCard({
  label,
  value,
  caption,
  tone,
}: {
  label: string;
  value: string;
  caption: string;
  tone: keyof typeof metricTones;
}) {
  return (
    <Card className={cn(cardClass, "w-[220px] shrink-0 rounded-[22px] sm:w-[250px]")}>
      <CardContent className="p-3.5 sm:p-4.5">
        <div className={cn("text-[11px] font-semibold uppercase tracking-[0.08em] sm:text-[12px]", metricTones[tone])}>
          {label}
        </div>
        <div className="mt-3 text-[22px] font-semibold leading-none tracking-tight text-[#0f172a] sm:mt-4 sm:text-[26px]">
          {value}
        </div>
        <p className="mt-2.5 text-[11px] leading-5 text-[#64748b] sm:mt-3 sm:text-[12px] sm:leading-6">{caption}</p>
      </CardContent>
    </Card>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <Card className={cardClass}>
      <CardHeader className="space-y-1 p-5 pb-2 sm:p-6 sm:pb-3">
        <CardTitle className="text-[17px] font-semibold tracking-tight text-[#0f172a] sm:text-[20px]">
          {title}
        </CardTitle>
        {subtitle ? <p className="text-[12px] leading-6 text-[#64748b]">{subtitle}</p> : null}
      </CardHeader>
      <CardContent className="p-5 pt-2 sm:p-6 sm:pt-2">{children}</CardContent>
    </Card>
  );
}

function ValueBarChart({ data, isMobile }: { data: ValuePoint[]; isMobile: boolean }) {
  return (
    <div className="h-[240px] w-full sm:h-[270px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: isMobile ? 4 : 12, left: isMobile ? 2 : 10, bottom: 0 }}
          barCategoryGap={isMobile ? "18%" : "20%"}
        >
          <CartesianGrid stroke="#dbe3f0" strokeDasharray="6 6" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "#7c8ba1", fontSize: isMobile ? 10 : 11 }}
            tickLine={false}
            axisLine={false}
            interval={0}
            angle={isMobile ? -18 : 0}
            textAnchor={isMobile ? "end" : "middle"}
            height={isMobile ? 48 : 34}
          />
          <YAxis
            tick={{ fill: "#7c8ba1", fontSize: isMobile ? 10 : 11 }}
            tickFormatter={(value) => formatCurrencyK(Number(value))}
            tickLine={false}
            axisLine={false}
            width={isMobile ? 48 : 60}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" radius={[10, 10, 4, 4]} maxBarSize={isMobile ? 20 : 26}>
            {data.map((item) => (
              <Cell key={item.label} fill={item.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] bg-white p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#94a3b8]">{label}</div>
      <div className="mt-2 text-[16px] font-semibold text-[#0f172a]">{value}</div>
    </div>
  );
}
