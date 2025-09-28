import Header from "@/components/Header";
import { useApp } from "@/lib/app-state";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatCurrencyK } from "@/lib/utils";
import { useEffect, useMemo, useRef, useState } from "react";
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
  const headerScrollRef = useRef<HTMLDivElement | null>(null);
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

  useEffect(() => {
    const headerEl = headerScrollRef.current;
    if (!headerEl) return;
    const sync = (source: HTMLElement) => {
      const others = document.querySelectorAll<HTMLElement>(".mobile-trailing");
      others.forEach((el) => {
        if (el !== source) el.scrollLeft = source.scrollLeft;
      });
    };
    const onHeaderScroll = () => sync(headerEl);
    headerEl.addEventListener("scroll", onHeaderScroll, { passive: true });

    const rowEls = document.querySelectorAll<HTMLElement>(".mobile-trailing");
    const onRowScroll = (e: Event) => sync(e.currentTarget as HTMLElement);
    rowEls.forEach((el) => el.addEventListener("scroll", onRowScroll, { passive: true }));

    return () => {
      headerEl.removeEventListener("scroll", onHeaderScroll);
      rowEls.forEach((el) => el.removeEventListener("scroll", onRowScroll));
    };
  }, [assets.length]);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 pt-4 pb-6">
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)] lg:items-start lg:gap-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-3xl font-bold">Assets</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className={!gridView ? "text-foreground font-medium" : undefined}>List</span>
                <Switch checked={gridView} onCheckedChange={(checked) => setGridView(Boolean(checked))} aria-label="Toggle grid view" />
                <span className={gridView ? "text-foreground font-medium" : undefined}>Grid</span>
              </div>
            </div>
            {assets.length > 0 && (
              <section className="flex items-center gap-3 rounded-2xl border border-border/40 bg-surface/80 p-3 shadow-sm sm:hidden">
                <img
                  src={highlightedAsset?.image ?? "/placeholder.svg"}
                  alt={highlightedAsset?.name ?? "Creator"}
                  className="h-10 w-10 rounded-xl object-cover"
                />
                <div className="flex flex-1 items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-foreground">
                      {highlightedAsset?.name ?? "Creator"}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {creatorHandle}
                    </div>
                  </div>
                  <div className="text-right text-sm font-semibold text-foreground">
                    {formatCurrency(highlightedPayout)}
                  </div>
                </div>
              </section>
            )}
            {!gridView && (
              <>
                {/* Desktop/tablet table */}
                <div className="hidden overflow-x-auto rounded-md border border-border/40 bg-surface md:block">
                  <Table className="min-w-full">
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
                          className="cursor-pointer [&>td]:py-5"
                          onClick={() => navigate(`/assets/${a.id}`)}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <img src={a.image} alt={a.name} className="h-8 w-8 rounded" />
                              <span>{a.name}</span>
                              <img src="/checklist.png" alt="verified" className="h-4 w-4 opacity-80" />
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-mono">{formatCurrencyK(a.params.initialReserve)}</TableCell>
                          <TableCell className="text-center font-mono">{formatCurrencyK(a.cycle.reserve)}</TableCell>
                          <TableCell className="text-center font-mono">${a.cycle.lpu.toFixed(6)}</TableCell>
                          <TableCell className="text-center font-mono">$1.00</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile list */}
                <div className="md:hidden">
                  <div className="grid grid-cols-[1fr_auto_auto] items-center px-2 pb-3 text-[12px] uppercase tracking-wide text-muted-foreground">
                    <div>Collection</div>
                    <div className="w-28 text-right">Current</div>
                    <div className="w-24 text-right">CoinTag</div>
                  </div>
                  <div className="flex flex-col gap-5">
                    {assets.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => navigate(`/assets/${a.id}`)}
                        className="grid grid-cols-[1fr_auto_auto] items-start gap-3 px-2 py-3 text-left text-base"
                      >
                        <div className="min-w-0 flex items-center gap-3">
                          <img src={a.image} alt={a.name} className="h-8 w-8 rounded" />
                          <div className="min-h-[1.5rem] flex items-center gap-1 font-medium leading-tight">
                            <span className="max-w-[12ch] truncate">{a.name}</span>
                            <img src="/checklist.png" alt="verified" className="h-3.5 w-3.5 flex-shrink-0 opacity-80" />
                          </div>
                        </div>
                        <div className="w-28 self-center text-right font-mono text-base tabular-nums">{formatCurrencyK(a.cycle.reserve)}</div>
                        <div className="w-24 self-center text-right font-mono text-base tabular-nums">$1.00</div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {gridView && (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {assets.map((a, index) => (
                  <button
                    type="button"
                    key={a.id}
                    onClick={() => navigate(`/assets/${a.id}`)}
                    className="group relative overflow-hidden rounded-3xl border border-border/40 bg-surface/50 p-0 text-left shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border"
                    style={{ animationDelay: `${0.05 * index}s` }}
                  >
                    <div className="relative h-48 w-full overflow-hidden">
                      <img
                        src={a.image}
                        alt={a.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/75 via-black/20 to-transparent px-4 py-3 text-xs text-white">
                        <span className="font-medium uppercase tracking-wide">Cycle {a.cycle.cycle}</span>
                        <span className="rounded-full bg-white/15 px-3 py-1 font-mono text-[11px]">
                          {formatCurrencyK(a.cycle.reserve)}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-4 p-5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-foreground transition-colors group-hover:text-foreground/90">
                            {a.name}
                          </h3>
                          <img src="/checklist.png" alt="verified" className="h-4 w-4 opacity-80" />
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          Backed by {formatCurrencyK(a.params.initialReserve)} with live reserve growth powering future hunts.
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div className="rounded-xl border border-border/40 bg-background/60 p-3">
                          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Liquidity</div>
                          <div className="font-mono text-sm">{formatCurrencyK(a.cycle.reserve)}</div>
                        </div>
                        <div className="rounded-xl border border-border/40 bg-background/60 p-3">
                          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">LPU</div>
                          <div className="font-mono text-sm">${a.cycle.lpu.toFixed(3)}</div>
                        </div>
                        <div className="rounded-xl border border-border/40 bg-background/60 p-3">
                          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Supply</div>
                          <div className="font-mono text-sm">{a.params.initialSupply}</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-muted-foreground">Tap to explore</span>
                        <span className="font-medium text-foreground/80">View →</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          {assets.length > 0 && (
            <aside className="space-y-6">
              <section className="rounded-3xl border border-border/40 bg-surface/80 shadow-card backdrop-blur-sm">
                <div className="grid gap-4 p-5 sm:p-6 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/40 bg-background/80 p-4">
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Creator wallet</div>
                    <div className="mt-2 flex items-center gap-2 text-sm text-foreground">
                      <span className="font-semibold tracking-tight">{creatorHandle}</span>
                      <ChevronDown className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                      {assets.length === 1 ? "1 creator" : `${assets.length} creators`}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/40 bg-background/80 p-4">
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Total payout</div>
                    <div className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                      {formatCurrency(totalCreatorPayout)}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">Across all listed assets</p>
                    {trend ? (
                      <p className="mt-3 text-sm font-medium text-emerald-400">
                        +{trend.percent}% ({formatCurrency(trend.delta)}) Today
                      </p>
                    ) : (
                      <p className="mt-3 text-sm text-muted-foreground">No creator payouts recorded yet</p>
                    )}
                  </div>
                  <div className="rounded-2xl border border-border/40 bg-background/80 p-4">
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Top earner</div>
                    {highlightedAsset ? (
                      <div className="mt-3 flex items-center gap-3 sm:flex-col sm:items-start sm:gap-4">
                        <img
                          src={highlightedAsset.image}
                          alt={highlightedAsset.name}
                          className="h-12 w-12 rounded-xl object-cover sm:h-14 sm:w-14"
                        />
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-lg font-semibold text-foreground sm:text-base">
                            <span>{formatCurrency(highlightedPayout)}</span>
                          </div>
                          <span className="text-sm text-muted-foreground sm:text-base">{highlightedAsset.name}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">Creator data coming soon</p>
                    )}
                  </div>
                  <div className="rounded-2xl border border-border/40 bg-background/80 p-4">
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Revenue split</div>
                    {highlightedAsset && creatorSharePercent !== null ? (
                      <div className="mt-2 text-sm text-foreground">
                        <span className="font-semibold">{creatorSharePercent}%</span> creator share
                        <p className="mt-2 text-sm text-muted-foreground">Cycle {highlightedAsset.cycle.cycle}</p>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">Split details unavailable</p>
                    )}
                  </div>
                </div>
              </section>
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}
