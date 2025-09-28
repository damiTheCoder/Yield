import { useMemo, useState } from "react";
import Header from "@/components/Header";
import { useApp } from "@/lib/app-state";
import type { Asset } from "@/lib/app-state";
import { formatCurrency, formatCurrencyK } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
          <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {sortedAssets.map((asset) => (
              <MarketCard key={asset.id} asset={asset} onEnter={() => navigate(`/market/${asset.id}/hunt`)} />
            ))}
          </section>
        ) : (
          <div className="space-y-5">
            <div className="hidden overflow-x-auto rounded-3xl border border-border/40 bg-surface/60 md:block">
              <Table className="min-w-full text-sm">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-left">Collection</TableHead>
                    <TableHead className="text-center">Liquidity</TableHead>
                    <TableHead className="text-center">LPU</TableHead>
                    <TableHead className="text-center">Sales</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAssets.map((asset) => (
                    <TableRow key={asset.id} className="text-sm">
                      <TableCell>
                        <div className="flex items-center gap-3 text-sm">
                          <img src={asset.image} alt={asset.name} className="h-8 w-8 rounded" />
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">{asset.name}</span>
                            <span className="text-xs text-muted-foreground">{asset.ticker || asset.id.toUpperCase()}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs">{formatCurrencyK(asset.cycle.reserve)}</TableCell>
                      <TableCell className="text-center font-mono text-xs">{formatCurrency(asset.cycle.lpu)}</TableCell>
                      <TableCell className="text-center font-mono text-xs">{formatCurrency(asset.cycle.totalSales)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="secondary" onClick={() => navigate(`/market/${asset.id}/hunt`)}>
                          Enter Hunt
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col gap-4 md:hidden">
              {sortedAssets.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => navigate(`/market/${asset.id}/hunt`)}
                  className="flex items-start gap-3 rounded-2xl bg-background/80 px-3 py-3 text-left"
                >
                  <img src={asset.image} alt={asset.name} className="h-14 w-14 rounded-2xl object-cover" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{asset.name}</p>
                        <p className="text-xs text-muted-foreground">{asset.ticker || asset.id.toUpperCase()}</p>
                      </div>
                      <span className="rounded-full border border-border/40 px-2 py-0.5 text-[10px] uppercase text-muted-foreground">
                        Cycle {asset.cycle.cycle}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                      <Stat label="Liquidity" value={formatCurrencyK(asset.cycle.reserve)} />
                      <Stat label="Seed" value={formatCurrencyK(asset.cycle.seedNext)} />
                      <Stat label="Rewards" value={formatCurrency(asset.cycle.accrued.holderRewards)} />
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      Liquidity-backed at {formatCurrency(asset.params.initialReserve)} with a live LPU of {formatCurrency(asset.cycle.lpu)}.
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{formatCurrency(asset.cycle.totalSales)} gross</span>
                      <span className="font-medium text-foreground">Enter →</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/40 bg-background/30 p-2">
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
  return (
    <article className="group relative overflow-hidden rounded-3xl border border-border/40 bg-background/85 shadow-card transition-all hover:-translate-y-1 hover:shadow-hover">
      <div className="relative h-48 w-full overflow-hidden">
        <img src={asset.image} alt={asset.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 via-black/10 to-transparent px-5 py-3 text-xs text-white">
          <span className="font-medium uppercase tracking-wide">Cycle {asset.cycle.cycle}</span>
          <span className="rounded-full bg-white/15 px-3 py-1 font-mono text-[11px]">{formatCurrencyK(asset.cycle.reserve)}</span>
        </div>
      </div>
      <div className="space-y-4 p-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-foreground transition-colors group-hover:text-foreground/90">{asset.name}</h2>
            <img src="/checklist.png" className="h-4 w-4 opacity-80" alt="verified" />
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">
            Liquidity-backed at {formatCurrency(asset.params.initialReserve)} with a live LPU of {formatCurrency(asset.cycle.lpu)}. Supply: {asset.params.initialSupply}.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-xs">
          <Stat label="Liquidity" value={formatCurrencyK(asset.cycle.reserve)} />
          <Stat label="Seed Next" value={formatCurrencyK(asset.cycle.seedNext)} />
          <Stat label="Rewards" value={formatCurrency(asset.cycle.accrued.holderRewards)} />
        </div>
        <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-muted-foreground">
          <span>{asset.ticker || asset.id.toUpperCase()}</span>
          <span>{formatCurrency(asset.cycle.totalSales)} gross</span>
        </div>
        <Button className="w-full" onClick={onEnter}>
          Enter Hunt
        </Button>
      </div>
    </article>
  );
}
