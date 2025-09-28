import Header from "@/components/Header";
import { useApp } from "@/lib/app-state";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatCurrencyK } from "@/lib/utils";
import { useMemo, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { ChevronDown } from "lucide-react";

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export default function Assets() {
  const { assets } = useApp();
  const navigate = useNavigate();
  const [gridView, setGridView] = useState(false);
  const totalCreatorPayout = useMemo(
    () => assets.reduce((sum, asset) => sum + (asset.cycle?.accrued?.creator ?? 0), 0),
    [assets]
  );
  const highlightedAsset = useMemo(() => {
    if (assets.length === 0) return null;
    return assets.reduce((top, asset) => {
      const current = asset.cycle?.accrued?.creator ?? 0;
      const best = top?.cycle?.accrued?.creator ?? 0;
      return current > best ? asset : top;
    }, assets[0] ?? null);
  }, [assets]);
  const highlightedPayout = highlightedAsset?.cycle?.accrued?.creator ?? 0;
  const creatorHandle = useMemo(() => {
    if (!highlightedAsset) return "creators.eth";
    const slug = highlightedAsset.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return slug ? `${slug.replace(/-/g, "")}.eth` : "creators.eth";
  }, [highlightedAsset]);
  const trend = useMemo(() => {
    if (!highlightedAsset || highlightedPayout <= 0) return null;
    const hash = hashString(highlightedAsset.id);
    const percent = parseFloat((1 + ((hash % 40) / 10)).toFixed(1));
    const delta = highlightedPayout * (percent / 100);
    return { percent, delta };
  }, [highlightedAsset, highlightedPayout]);
  const creatorSharePercent = highlightedAsset ? Math.round((highlightedAsset.cycle?.split?.creator ?? 0) * 100) : null;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 pt-4 pb-6">
        <div className="flex flex-col gap-5">
          {assets.length > 0 && highlightedAsset && (
              <section className="flex items-center gap-3 rounded-2xl border border-border/40 bg-background/80 px-3 py-2 lg:hidden">
                <img
                  src={highlightedAsset.image}
                  alt={highlightedAsset.name}
                className="h-10 w-10 rounded-xl object-cover"
              />
              <div className="flex flex-1 items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-foreground">{highlightedAsset.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{creatorHandle}</div>
                </div>
                <div className="text-right text-base font-semibold text-foreground">{formatCurrency(highlightedPayout)}</div>
              </div>
            </section>
          )}

          <div className="flex items-center justify-between gap-4">
            <h1 className="text-3xl font-bold">Assets</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={!gridView ? "text-foreground font-semibold" : undefined}>List</span>
              <Switch checked={gridView} onCheckedChange={(checked) => setGridView(Boolean(checked))} aria-label="Toggle grid view" />
              <span className={gridView ? "text-foreground font-semibold" : undefined}>Grid</span>
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(320px,360px)] lg:items-start lg:gap-8">
            <div className="space-y-5">
              {!gridView && (
              <>
                <div className="hidden overflow-x-auto rounded-md border border-border/40 bg-surface md:block">
                  <Table className="min-w-full text-sm">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-left">Collection</TableHead>
                        <TableHead className="text-center">Backing</TableHead>
                        <TableHead className="text-center">Current</TableHead>
                        <TableHead className="text-center">LPU</TableHead>
                        <TableHead className="text-center">CoinTag</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assets.map((a) => (
                        <TableRow
                          key={a.id}
                          className="cursor-pointer [&>td]:py-4"
                          onClick={() => navigate(`/assets/${a.id}`)}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3 text-sm">
                              <img src={a.image} alt={a.name} className="h-8 w-8 rounded" />
                              <span>{a.name}</span>
                              <img src="/checklist.png" alt="verified" className="h-4 w-4 opacity-80" />
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-mono text-xs">{formatCurrencyK(a.params.initialReserve)}</TableCell>
                          <TableCell className="text-center font-mono text-xs">{formatCurrencyK(a.cycle.reserve)}</TableCell>
                          <TableCell className="text-center font-mono text-xs">${a.cycle.lpu.toFixed(6)}</TableCell>
                          <TableCell className="text-center font-mono text-xs">$1.00</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="md:hidden">
                  <div className="grid grid-cols-[1fr_auto_auto] items-center px-2 pb-3 text-[11px] uppercase tracking-wide text-muted-foreground">
                    <div>Collection</div>
                    <div className="w-24 text-right">Current</div>
                    <div className="w-20 text-right">CoinTag</div>
                  </div>
                  <div className="flex flex-col gap-4">
                    {assets.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => navigate(`/assets/${a.id}`)}
                        className="grid grid-cols-[1fr_auto_auto] items-start gap-3 rounded-2xl bg-background/80 px-2 py-3 text-left text-sm"
                      >
                        <div className="min-w-0 flex items-center gap-3">
                          <img src={a.image} alt={a.name} className="h-8 w-8 rounded" />
                          <div className="min-h-[1.25rem] flex items-center gap-1 text-sm font-medium leading-tight">
                            <span className="max-w-[12ch] truncate text-sm">{a.name}</span>
                            <img src="/checklist.png" alt="verified" className="h-3 w-3 flex-shrink-0 opacity-80" />
                          </div>
                        </div>
                        <div className="w-24 self-center text-right font-mono text-sm tabular-nums">{formatCurrencyK(a.cycle.reserve)}</div>
                        <div className="w-20 self-center text-right font-mono text-sm tabular-nums">$1.00</div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {gridView && (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {assets.map((a, index) => (
                  <button
                    type="button"
                    key={a.id}
                    onClick={() => navigate(`/assets/${a.id}`)}
                    className="group relative overflow-hidden rounded-3xl border border-border/40 bg-background/85 p-0 text-left shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border"
                    style={{ animationDelay: `${0.05 * index}s` }}
                  >
                    <div className="relative h-44 w-full overflow-hidden">
                      <img
                        src={a.image}
                        alt={a.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/75 via-black/20 to-transparent px-4 py-2 text-[11px] text-white">
                        <span className="font-medium uppercase tracking-wide">Cycle {a.cycle.cycle}</span>
                        <span className="rounded-full bg-white/15 px-3 py-1 font-mono text-[10px]">
                          {formatCurrencyK(a.cycle.reserve)}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3 p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-foreground transition-colors group-hover:text-foreground/90">
                            {a.name}
                          </h3>
                          <img src="/checklist.png" alt="verified" className="h-4 w-4 opacity-80" />
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          Backed by {formatCurrencyK(a.params.initialReserve)} with live reserve growth powering future hunts.
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-[11px]">
                        <div className="rounded-xl border border-border/40 bg-background/70 p-2">
                          <div className="text-[9px] uppercase tracking-wide text-muted-foreground">Liquidity</div>
                          <div className="font-mono text-[11px]">{formatCurrencyK(a.cycle.reserve)}</div>
                        </div>
                        <div className="rounded-xl border border-border/40 bg-background/70 p-2">
                          <div className="text-[9px] uppercase tracking-wide text-muted-foreground">LPU</div>
                          <div className="font-mono text-[11px]">${a.cycle.lpu.toFixed(3)}</div>
                        </div>
                        <div className="rounded-xl border border-border/40 bg-background/70 p-2">
                          <div className="text-[9px] uppercase tracking-wide text-muted-foreground">Supply</div>
                          <div className="font-mono text-[11px]">{a.params.initialSupply}</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">Tap to explore</span>
                        <span className="font-medium text-foreground/80">View →</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {assets.length > 0 && highlightedAsset && (
            <aside className="hidden rounded-3xl border border-border/50 bg-background/70 p-4 shadow-lg ring-1 ring-black/5 lg:block lg:self-start">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/40 bg-surface/80 p-3 shadow-inner">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Creator wallet</div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-foreground">
                    <span className="font-semibold tracking-tight">{creatorHandle}</span>
                    <ChevronDown className="h-3 w-3" aria-hidden="true" />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {assets.length === 1 ? "1 creator" : `${assets.length} creators`}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/40 bg-surface/80 p-3 shadow-inner">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Total payout</div>
                  <div className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                    {formatCurrency(totalCreatorPayout)}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Across all listed assets</p>
                  {trend ? (
                    <p className="mt-2 text-xs font-medium text-emerald-400">
                      +{trend.percent}% ({formatCurrency(trend.delta)}) Today
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">No creator payouts recorded yet</p>
                  )}
                </div>
                <div className="rounded-2xl border border-border/40 bg-surface/80 p-3 shadow-inner">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Top earner</div>
                  <div className="mt-2 flex items-center gap-3">
                    <img
                      src={highlightedAsset.image}
                      alt={highlightedAsset.name}
                      className="h-11 w-11 rounded-xl object-cover"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">{highlightedAsset.name}</span>
                      <span className="text-xs text-muted-foreground">{formatCurrency(highlightedPayout)}</span>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-border/40 bg-surface/80 p-3 shadow-inner">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Revenue split</div>
                  {creatorSharePercent !== null ? (
                    <div className="mt-2 text-xs text-foreground">
                      <span className="font-semibold">{creatorSharePercent}%</span> creator share
                      <p className="mt-2 text-xs text-muted-foreground">Cycle {highlightedAsset.cycle.cycle}</p>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">Split details unavailable</p>
                  )}
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
      </main>
    </div>
  );
}
