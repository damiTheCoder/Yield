import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApp, type Asset } from "@/lib/app-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatCurrency, formatCurrencyK } from "@/lib/utils";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, XAxis } from "recharts";
import { ChevronLeft, Circle, Flame, Power, ShieldCheck, TrendingUp } from "lucide-react";

type OrderSide = "buy" | "sell";

const buildChart = (seed: number) =>
  Array.from({ length: 72 }).map((_, index) => ({
    label: `${index}`,
    value: 0.82 + Math.sin((index + seed) / 6) * 0.07 + Math.random() * 0.025,
  }));

const buildOrderBook = (price: number) => {
  const scale = Math.max(price, 0.0001);
  return {
    bids: Array.from({ length: 10 }).map((_, index) => ({
      price: Number((scale * (1 - 0.004 * (index + 1))).toFixed(4)),
      amount: 1_200 + index * 480,
    })),
    asks: Array.from({ length: 10 }).map((_, index) => ({
      price: Number((scale * (1 + 0.004 * (index + 1))).toFixed(4)),
      amount: 1_050 + index * 420,
    })),
  };
};

export default function AssetTokenTrading() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { assets, assetAvailable, getAssetTokenInfo } = useApp();

  const asset: Asset | undefined = useMemo(
    () => assets.find((entry) => entry.id === id),
    [assets, id],
  );
  const tokenInfo = id ? getAssetTokenInfo(id) : null;

  const [tradeSide, setTradeSide] = useState<OrderSide>("buy");
  const [priceInput, setPriceInput] = useState("");
  const [amountInput, setAmountInput] = useState("");

  if (!asset) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 px-6 text-center text-white">
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold">Asset not found</h1>
          <p className="mx-auto max-w-md text-sm text-white/70">
            The ecosystem you requested is unavailable. Return to the assets directory to browse active launches and cycles.
          </p>
          <Button variant="secondary" onClick={() => navigate("/assets")} className="border border-white/20 bg-white/10 text-white">
            Back to Assets
          </Button>
        </div>
      </main>
    );
  }

  const currentPrice = tokenInfo?.price ?? 0.84;
  const chartData = buildChart(asset.id.length);
  const orderBook = buildOrderBook(currentPrice);
  const trades = useMemo(
    () =>
      Array.from({ length: 20 }).map((_, index) => ({
        time: `12:${(index * 2 + 8).toString().padStart(2, "0")} UTC`,
        price: formatCurrency(currentPrice * (1 + (Math.random() - 0.5) * 0.02)),
        side: index % 2 === 0 ? "buy" : "sell",
        amount: (850 + index * 120).toLocaleString(),
      })),
    [currentPrice],
  );

  const estimatedCost =
    priceInput && amountInput ? formatCurrency(Number(priceInput || "0") * Number(amountInput || "0")) : "—";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_10%,#0f3d2c_0%,#010101_48%,#010101_100%)] text-white">
      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:gap-8 sm:px-6 lg:px-10">
        <header className="flex flex-col gap-5 rounded-3xl border border-emerald-500/20 bg-black/70 px-6 py-5 shadow-[0_25px_140px_-60px_rgba(16,185,129,0.65)] md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full border border-emerald-500/40 bg-black/40 text-emerald-300 hover:bg-emerald-500/20"
              onClick={() => navigate(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-emerald-300">
                <Circle className="h-2 w-2 fill-emerald-300 stroke-none" />
                Trading Terminal
              </div>
              <div className="flex items-center gap-3 text-2xl font-semibold leading-tight md:text-3xl">
                <span>{asset.name}</span>
                <span className="text-sm font-medium text-white/50">/ USDC</span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-wide text-white/60">
                <span>Cycle {asset.cycle.cycle}</span>
                <span className="hidden sm:inline">•</span>
                <span>LFT remaining {asset.cycle.supply.toLocaleString()}</span>
                <span className="hidden sm:inline">•</span>
                <span>Token supply {tokenInfo?.supply.toLocaleString() ?? "1,000,000"}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-[11px] uppercase tracking-wide text-white/65 sm:grid-cols-4 md:flex md:items-center md:gap-8">
            <div className="flex flex-col gap-0.5">
              <span>Last price</span>
              <span className="text-lg font-semibold text-white">
                {tokenInfo?.price ? formatCurrency(tokenInfo.price) : "—"}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span>24h change</span>
              <span className="text-lg font-semibold text-emerald-400">+3.92%</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span>24h volume</span>
              <span className="text-lg font-semibold text-white">2.74M</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span>Status</span>
              <span className={cn("text-lg font-semibold", tokenInfo?.unlocked ? "text-emerald-300" : "text-white/50")}>
                {tokenInfo?.unlocked ? "Unlocked" : "Locked"}
              </span>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-emerald-500/10 bg-black/75 p-5 shadow-[0_35px_160px_-70px_rgba(16,185,129,0.55)]">
              <div className="mb-4 flex items-center justify-between text-[11px] uppercase tracking-wide text-white/60">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-300" />
                  Price Action
                </div>
                <div className="flex items-center gap-3">
                  {["1H", "4H", "1D", "1W"].map((label, idx) => (
                    <button
                      key={label}
                      className={cn(
                        "rounded-full px-3 py-1 text-[11px] transition",
                        idx === 2 ? "bg-emerald-500/20 text-emerald-300" : "text-white/50 hover:text-white/80",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-[320px] rounded-2xl border border-emerald-500/15 bg-gradient-to-b from-emerald-700/10 via-transparent to-transparent p-3 sm:p-4">
                <ChartContainer
                  className="h-full"
                  config={{
                    value: {
                      label: "Token Price",
                      color: "hsl(142 76% 40%)",
                    },
                  }}
                >
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="token-chart-gradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="10%" stopColor="rgba(16, 185, 129, 0.9)" stopOpacity={0.7} />
                        <stop offset="100%" stopColor="rgba(16, 185, 129, 0)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="label" hide />
                    <ChartTooltip
                      cursor={{ stroke: "rgba(34,197,94,0.25)", strokeWidth: 2 }}
                      content={
                        <ChartTooltipContent
                          indicator="dot"
                          formatter={(value) => [formatCurrency(Number(value)), "Price"]}
                        />
                      }
                    />
                    <Area type="monotone" dataKey="value" stroke="rgba(16,185,129,0.95)" strokeWidth={2.5} fill="url(#token-chart-gradient)" />
                  </AreaChart>
                </ChartContainer>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/80 p-5">
              <div className="mb-4 flex items-center justify-between text-[11px] uppercase tracking-wide text-white/60">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-300" />
                  Ecosystem Stats
                </div>
                <span className="text-white/40">Updated realtime</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs uppercase tracking-wide text-white/60 sm:grid-cols-4">
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p>Reserve backing</p>
                  <p className="mt-1 text-base font-semibold text-white">{formatCurrencyK(asset.cycle.reserve)}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p>Cycle revenue</p>
                  <p className="mt-1 text-base font-semibold text-white">{formatCurrency(asset.cycle.totalSales)}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p>Holder rewards</p>
                  <p className="mt-1 text-base font-semibold text-emerald-300">{formatCurrency(asset.cycle.accrued.holderRewards)}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p>Discovery progress</p>
                  <p className="mt-1 text-base font-semibold text-white">
                    {Math.max(0, 100 - (assetAvailable[id ?? ""] ?? 0)).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/80 p-5">
              <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-wide text-white/60">
                <Flame className="h-4 w-4 text-emerald-300" />
                Recent Trades
              </div>
              <div className="grid grid-cols-3 text-[11px] uppercase tracking-wide text-white/40 sm:grid-cols-6">
                {["Time", "Side", "Price", "Amount", "Notional", "Venue"].map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
              <div className="mt-2 divide-y divide-white/10 text-xs text-white/80">
                {trades.map((trade, index) => (
                  <div key={index} className="grid grid-cols-3 py-2 sm:grid-cols-6">
                    <span>{trade.time}</span>
                    <span className={trade.side === "buy" ? "text-emerald-400" : "text-rose-400"}>{trade.side.toUpperCase()}</span>
                    <span>{trade.price}</span>
                    <span>{trade.amount}</span>
                    <span>{formatCurrency(0.75 * (index + 1))}</span>
                    <span className="text-white/50">Hybrid pool</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-emerald-500/20 bg-black/70 p-5">
              <div className="mb-4 flex items-center justify-between text-[11px] uppercase tracking-wide text-white/60">
                <span>Order Book</span>
                <span>Top of book</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs text-white/70">
                <div>
                  <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-wide text-emerald-300">
                    <span>Bids</span>
                    <span>Qty</span>
                  </div>
                  <div className="space-y-1.5">
                    {orderBook.bids.map((entry, index) => (
                      <div
                        key={`bid-${index}`}
                        className="flex items-center justify-between rounded-lg bg-emerald-500/10 px-2 py-1.5 font-mono text-[11px]"
                      >
                        <span>{formatCurrency(entry.price)}</span>
                        <span>{entry.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-wide text-rose-300">
                    <span>Asks</span>
                    <span>Qty</span>
                  </div>
                  <div className="space-y-1.5">
                    {orderBook.asks.map((entry, index) => (
                      <div
                        key={`ask-${index}`}
                        className="flex items-center justify-between rounded-lg bg-rose-500/10 px-2 py-1.5 font-mono text-[11px]"
                      >
                        <span>{formatCurrency(entry.price)}</span>
                        <span>{entry.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/80 p-5">
              <div className="mb-4 flex items-center justify-between text-[11px] uppercase tracking-wide text-white/60">
                <span>Place Order</span>
                <div className="flex gap-2 rounded-full bg-white/10 p-1">
                  <button
                    className={cn(
                      "px-3 py-1 text-[11px] uppercase tracking-wide",
                      tradeSide === "buy" ? "rounded-full bg-emerald-500/30 text-emerald-200" : "text-white/50",
                    )}
                    onClick={() => setTradeSide("buy")}
                  >
                    Buy
                  </button>
                  <button
                    className={cn(
                      "px-3 py-1 text-[11px] uppercase tracking-wide",
                      tradeSide === "sell" ? "rounded-full bg-rose-500/30 text-rose-200" : "text-white/50",
                    )}
                    onClick={() => setTradeSide("sell")}
                  >
                    Sell
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-wide text-white/50">Limit Price (USDC)</label>
                  <Input
                    value={priceInput}
                    onChange={(event) => setPriceInput(event.target.value)}
                    placeholder={currentPrice.toFixed(4)}
                    className="border-white/10 bg-black/70 text-white placeholder:text-white/30 focus-visible:ring-emerald-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-wide text-white/50">Amount (Tokens)</label>
                  <Input
                    value={amountInput}
                    onChange={(event) => setAmountInput(event.target.value)}
                    placeholder="1000"
                    className="border-white/10 bg-black/70 text-white placeholder:text-white/30 focus-visible:ring-emerald-400"
                  />
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/60 px-3 py-3 text-xs text-white/60">
                  <div className="flex items-center justify-between">
                    <span>Est. Cost</span>
                    <span className="font-mono text-sm text-white">{estimatedCost}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span>Leverage</span>
                    <span className="text-emerald-300">x3 (static)</span>
                  </div>
                </div>
                <Button
                  className={tradeSide === "buy" ? "h-11 rounded-full bg-emerald-500 text-emerald-950 hover:bg-emerald-400" : "h-11 rounded-full bg-rose-500 text-white hover:bg-rose-400"}
                  disabled={!tokenInfo?.unlocked}
                >
                  {tokenInfo?.unlocked ? "Place Order" : "Unlocks after discovery"}
                </Button>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/80 p-5">
              <div className="mb-3 flex items-center justify-between text-[11px] uppercase tracking-wide text-white/60">
                <span>Open Positions</span>
                <Power className="h-4 w-4 text-emerald-300" />
              </div>
              <div className="space-y-3 text-xs text-white/70">
                <div className="rounded-2xl border border-emerald-500/25 bg-black/60 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="uppercase tracking-wide text-[10px] text-emerald-300">Long</span>
                    <span className="font-mono text-sm text-emerald-300">+4,820.12 USDC</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-white/50">
                    <span>Size: 12,500 tokens</span>
                    <span>Entry: {formatCurrency(currentPrice * 0.92)}</span>
                  </div>
                </div>
                <div className="rounded-2xl border border-rose-500/25 bg-black/60 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="uppercase tracking-wide text-[10px] text-rose-300">Short</span>
                    <span className="font-mono text-sm text-rose-300">-1,240.06 USDC</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-white/50">
                    <span>Size: 5,500 tokens</span>
                    <span>Entry: {formatCurrency(currentPrice * 1.04)}</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
