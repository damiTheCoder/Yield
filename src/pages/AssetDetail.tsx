import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useApp } from "@/lib/app-state";
import { formatCurrency, formatCurrencyK } from "@/lib/utils";
import { Dot, Image as ImageIcon, LineChart as LineChartIcon } from "lucide-react";
import { Line, LineChart as RechartsLineChart, XAxis } from "recharts";

export default function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    assets,
    user,
    userAssets,
    assetAvailable,
    buyAssetCoinTags,
    openAssetCoinTags,
  } = useApp();

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

  const [amount, setAmount] = useState(10);
  const [openCount, setOpenCount] = useState(5);
  const [lastOpen, setLastOpen] = useState<{ opened: number; found: number } | null>(null);
  const [viewMode, setViewMode] = useState<"chart" | "image">("chart");

  const currentLiquidity = asset.cycle.reserve;
  const backingReserve = asset.params.initialReserve;
  const lpu = asset.cycle.lpu;
  const totalSupply = asset.params.initialSupply;
  const discovered = Math.max(0, totalSupply - findable);
  const discoveryPercent = totalSupply > 0 ? (discovered / totalSupply) * 100 : 0;
  const huntFee = Math.max(4.2, lpu * 0.4);

  const chartData = useMemo(() => {
    const base = currentLiquidity || 1;
    return Array.from({ length: 16 }).map((_, idx) => {
      const t = idx / 15;
      const wave = Math.sin(t * Math.PI * 1.8) * 0.14;
      const trend = 0.8 + t * 0.35;
      const value = base * (trend + wave);
      return { label: `T${idx + 1}`, value: Number(value.toFixed(2)) };
    });
  }, [currentLiquidity]);

  const chartConfig = { value: { label: "Liquidity", color: "hsl(var(--accent-yellow))" } } as const;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 pt-4 pb-8 space-y-10">
        <section className="space-y-4">
          {viewMode === "chart" ? (
            <>
              <div className="flex items-center justify-between gap-4">
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
                <Button
                  variant="ghost"
                  className="gap-2 text-sm md:text-base"
                  onClick={() => setViewMode("image")}
                >
                  <ImageIcon className="h-5 w-5" />
                  Image
                </Button>
              </div>
              <div className="space-y-3">
                <div className="text-3xl md:text-4xl font-semibold">{formatCurrencyK(currentLiquidity)}</div>
                <ChartContainer config={chartConfig} className="h-56 md:h-64">
                  <RechartsLineChart data={chartData} margin={{ left: 8, right: 16, top: 16, bottom: 8 }}>
                    <XAxis dataKey="label" hide />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                    <Line type="monotone" dataKey="value" stroke="var(--color-value)" strokeWidth={3} dot={false} />
                  </RechartsLineChart>
                </ChartContainer>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Dot className="h-3.5 w-3.5 text-emerald-400" />
                  Live Data
                  <span>•</span>
                  Updates every 3s
                </div>
              </div>
            </>
          ) : (
            <div className="relative">
              <img src={asset.image} alt={asset.name} className="w-full aspect-square object-cover rounded-3xl" />
              <Button
                variant="ghost"
                className="absolute top-3 right-3 gap-2 text-sm bg-background/60 backdrop-blur"
                onClick={() => setViewMode("chart")}
              >
                <LineChartIcon className="h-5 w-5" />
                Chart
              </Button>
            </div>
          )}
        </section>

        <section className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-3xl font-semibold leading-tight">{asset.name}</h2>
            <div className="text-sm text-muted-foreground">Collection: {asset.name} • By OpenYield Labs</div>
            <p className="text-sm md:text-base text-muted-foreground/80 max-w-2xl">
              A liquidity-funded token with verifiable reserve, transparent discovery mechanics, and guaranteed floor
              value via CoinTag hunts. Track live liquidity, drill into cycle performance, and switch to artifact view
              to showcase the current featured collectible.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-border/40 bg-surface/40 p-4">
              <div className="text-xs uppercase text-muted-foreground">Current Liquidity</div>
              <div className="text-2xl font-semibold">{formatCurrency(currentLiquidity)}</div>
              <div className="text-xs text-muted-foreground">Total value</div>
            </div>
            <div className="rounded-2xl border border-border/40 bg-surface/40 p-4">
              <div className="text-xs uppercase text-muted-foreground">Backing Reserve</div>
              <div className="text-2xl font-semibold text-emerald-400">{formatCurrency(backingReserve)}</div>
              <div className="text-xs text-muted-foreground">Seeded liquidity</div>
            </div>
            <div className="rounded-2xl border border-border/40 bg-surface/40 p-4">
              <div className="text-xs uppercase text-muted-foreground">CoinTag Price</div>
              <div className="text-2xl font-semibold text-blue-400">{formatCurrency(huntFee)}</div>
              <div className="text-xs text-muted-foreground">Hunt entry fee</div>
            </div>
            <div className="rounded-2xl border border-border/40 bg-surface/40 p-4">
              <div className="text-xs uppercase text-muted-foreground">Price per Unit</div>
              <div className="text-2xl font-semibold">{formatCurrency(lpu)}</div>
              <div className="text-xs text-muted-foreground">Redeemable floor</div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/40 bg-surface/40 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Discovery Progress</div>
              <div className="text-xs text-muted-foreground">
                {discovered} / {totalSupply} units • {discoveryPercent.toFixed(1)}% discovered
              </div>
            </div>
            <Progress value={discoveryPercent} className="h-2" />
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Buy CoinTags</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">USD: {formatCurrency(user.usd)}</div>
              <div>
                <label className="text-sm text-muted-foreground">Amount (USD)</label>
                <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value) || 0)} />
              </div>
              <Button onClick={() => buyAssetCoinTags(asset.id, amount)} disabled={user.usd <= 0}>Purchase</Button>
              <div className="text-xs text-muted-foreground">Receive {Math.floor(amount)} CoinTags (1$ each).</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Hunt LFTs</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm flex justify-between"><span className="text-muted-foreground">Your CoinTags</span><span className="font-mono">{ua.coinTags}</span></div>
              <div className="text-sm flex justify-between"><span className="text-muted-foreground">Your LFTs</span><span className="font-mono">{ua.lfts}</span></div>
              <div className="text-sm flex justify-between"><span className="text-muted-foreground">Findable remaining</span><span className="font-mono">{findable}</span></div>
              <div>
                <label className="text-sm text-muted-foreground">Open count</label>
                <Input type="number" value={openCount} onChange={(e) => setOpenCount(Number(e.target.value) || 0)} />
              </div>
              <Button onClick={() => setLastOpen(openAssetCoinTags(asset.id, openCount))} disabled={ua.coinTags <= 0}>Open</Button>
              {lastOpen && (
                <div className="text-xs">Opened {lastOpen.opened}, found {lastOpen.found} LFT{lastOpen.found === 1 ? "" : "s"}.</div>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
