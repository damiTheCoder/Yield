import { useMemo, useState } from "react";
import Header from "@/components/Header";
import { useApp } from "@/lib/app-state";
import type { Asset } from "@/lib/app-state";
import { formatCurrency, formatCurrencyK } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
export default function Market() {
  const { assets } = useApp();
  const navigate = useNavigate();
  const [gridView, setGridView] = useState(true);

  const sortedAssets = useMemo(
    () => [...assets].sort((a, b) => b.cycle.totalSales - a.cycle.totalSales),
    [assets],
  );

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8 space-y-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Live Market</h1>
            <p className="text-sm text-muted-foreground">
              Watch every live LFT drop, inspect on-chain liquidity, and jump into a treasure hunt to find tokens in real time.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="rounded-full border border-border/40 bg-surface/40 px-3 py-1">{sortedAssets.length} listings</span>
            <div className="flex items-center gap-1">
              <span className={!gridView ? "text-foreground font-semibold" : undefined}>List</span>
              <Switch checked={gridView} onCheckedChange={(checked) => setGridView(Boolean(checked))} aria-label="Toggle grid view" />
              <span className={gridView ? "text-foreground font-semibold" : undefined}>Grid</span>
            </div>
          </div>
        </div>

        {gridView ? (
          <section className="grid grid-cols-2 gap-4 sm:gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {sortedAssets.map((asset) => (
              <MarketCard key={asset.id} asset={asset} onEnter={() => navigate(`/market/${asset.id}/hunt`)} />
            ))}
          </section>
        ) : (
          <div className="space-y-5">
            <div className="overflow-x-auto rounded-3xl border border-border/40 bg-surface/60">
              <Table className="min-w-[720px] text-sm">
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 z-20 min-w-[200px] bg-surface/80 text-left">Collection</TableHead>
                    <TableHead className="sticky left-[200px] z-10 min-w-[140px] bg-surface/80 text-center">Liquidity</TableHead>
                    <TableHead className="text-center">LPU</TableHead>
                    <TableHead className="text-center">CoinTag</TableHead>
                    <TableHead className="text-center">Backing Reserve</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAssets.map((asset) => {
                    const coinTagPrice = Math.max(4.2, asset.cycle.lpu * 0.4);
                    return (
                      <TableRow
                        key={asset.id}
                        className="cursor-pointer text-sm transition-colors hover:bg-surface/70"
                        onClick={() => navigate(`/market/${asset.id}/hunt`)}
                      >
                      <TableCell className="sticky left-0 z-10 min-w-[200px] bg-surface/90">
                        <div className="flex items-center gap-3 text-sm">
                          <img src={asset.image} alt={asset.name} className="h-8 w-8 rounded object-cover" />
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">{asset.name}</span>
                            <span className="text-xs uppercase text-muted-foreground">{asset.ticker || asset.id.toUpperCase()}</span>
                          </div>
                        </div>
                      </TableCell>
                        <TableCell className="sticky left-[200px] z-10 min-w-[140px] bg-surface/90 text-center font-mono text-xs">
                          {formatCurrencyK(asset.cycle.reserve)}
                        </TableCell>
                        <TableCell className="min-w-[140px] text-center font-mono text-xs">{formatCurrency(asset.cycle.lpu)}</TableCell>
                        <TableCell className="min-w-[140px] text-center font-mono text-xs">{formatCurrency(coinTagPrice)}</TableCell>
                        <TableCell className="min-w-[160px] text-center font-mono text-xs">
                          {formatCurrencyK(asset.params.initialReserve)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/25 bg-surface/45 p-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-mono text-xs text-foreground">{value}</div>
    </div>
  );
}

type MarketCardProps = {
  asset: Asset;
  onEnter: () => void;
};

function MarketCard({ asset, onEnter }: MarketCardProps) {
  const coinTagPrice = Math.max(4.2, asset.cycle.lpu * 0.4);
  return (
    <button
      type="button"
      onClick={onEnter}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border/30 bg-surface/60 text-left shadow-card transition-all hover:-translate-y-1 hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:ring-foreground/50"
    >
      <div className="relative h-32 w-full overflow-hidden sm:h-40 lg:h-48">
        <img
          src={asset.image}
          alt={asset.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 via-black/10 to-transparent px-3 py-2 text-[11px] text-white sm:px-5 sm:py-3">
          <span className="font-medium uppercase tracking-wide">Cycle {asset.cycle.cycle}</span>
          <span className="rounded-full bg-white/15 px-2 py-0.5 font-mono text-[10px] sm:text-[11px]">
            {formatCurrencyK(asset.cycle.reserve)}
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 px-3 py-3 sm:px-5 sm:py-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-foreground/90 sm:text-base">
              {asset.name}
            </h2>
            <img src="/checklist.png" className="h-3.5 w-3.5 opacity-80 sm:h-4 sm:w-4" alt="verified" />
          </div>
          <span className="rounded-full border border-border/40 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
            {asset.ticker || asset.id.toUpperCase()}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[10px] sm:grid-cols-4 sm:gap-3 sm:text-xs">
          <Stat label="Liquidity" value={formatCurrencyK(asset.cycle.reserve)} />
          <Stat label="LPU" value={formatCurrency(asset.cycle.lpu)} />
          <Stat label="CoinTag" value={formatCurrency(coinTagPrice)} />
          <Stat label="Backing" value={formatCurrencyK(asset.params.initialReserve)} />
        </div>
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-muted-foreground sm:text-[11px]">
          <span>{formatCurrency(asset.cycle.totalSales)} gross</span>
          <span className="font-medium text-emerald-400">Enter Hunt →</span>
        </div>
      </div>
    </button>
  );
}
