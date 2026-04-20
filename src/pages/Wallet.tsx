import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, ExternalLink, KeyRound } from "lucide-react";
import { useApp } from "@/lib/app-state";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Web3News from "@/components/Web3News";

const toNumeric = (value: unknown) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const compactNumberFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  compactDisplay: "short",
  maximumFractionDigits: 1,
});

const formatCompactNumber = (value: number) => {
  if (!Number.isFinite(value)) return "0";
  return compactNumberFormatter.format(value);
};

export default function Wallet() {
  const { assets, userAssets, getAssetCoinTagCodes } = useApp();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();

  const walletRows = useMemo(() => {
    return assets
      .map((asset) => {
        const balances = userAssets[asset.id];
        const ownedCoinTags = toNumeric(balances?.coinTags);
        const codes = getAssetCoinTagCodes(asset.id);
        return {
          asset,
          ownedCoinTags,
          codes,
          visibleCount: Math.max(ownedCoinTags, codes.length),
        };
      })
      .filter(({ asset, visibleCount }) => {
        if (visibleCount <= 0) return false;
        if (!normalizedQuery) return true;
        const name = asset.name.toLowerCase();
        const ticker = asset.ticker?.toLowerCase() ?? "";
        return name.includes(normalizedQuery) || ticker.includes(normalizedQuery);
      })
      .sort((a, b) => b.visibleCount - a.visibleCount);
  }, [assets, userAssets, getAssetCoinTagCodes, normalizedQuery]);

  const totals = useMemo(() => {
    return walletRows.reduce(
      (acc, row) => {
        acc.coinTags += row.visibleCount;
        acc.codes += row.codes.length;
        return acc;
      },
      { coinTags: 0, codes: 0 },
    );
  }, [walletRows]);
  const readyToUseRows = useMemo(
    () => walletRows.filter(({ asset, codes }) => !asset.secondaryMarket?.active && codes.length > 0),
    [walletRows],
  );
  const marketOnlyRows = useMemo(
    () => walletRows.filter(({ asset }) => asset.secondaryMarket?.active),
    [walletRows],
  );
  const utilityCards = [
    {
      label: "Ready for hunt",
      value: readyToUseRows.length,
      helper: readyToUseRows.length > 0 ? "Collections with active CoinTag codes" : "No active hunt codes yet",
    },
    {
      label: "Market-only collections",
      value: marketOnlyRows.length,
      helper: marketOnlyRows.length > 0 ? "Track these in portfolio or token view" : "All wallet rows are still hunt-active",
    },
    {
      label: "Codes ready",
      value: totals.codes,
      helper: "One synced key unlocks a hunt session",
    },
  ];

  const copyCode = async (code: string) => {
    try {
      if (!navigator?.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }
      await navigator.clipboard.writeText(code);
      toast({
        title: "Code copied",
        description: `${code} copied to clipboard.`,
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Could not copy code. Try again.",
        variant: "destructive",
      });
    }
  };

  const quickStats = [
    { label: "Total CoinTags", value: totals.coinTags },
    { label: "Code Entries", value: totals.codes },
    { label: "Assets Held", value: walletRows.length },
  ];

  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 pb-10 pt-3 sm:pt-8">
        <div className="space-y-4 sm:space-y-6 lg:grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)] lg:gap-8 lg:space-y-0">
          <aside className="hidden lg:block lg:space-y-6 lg:pt-2">
            <Web3News variant="detail" />
          </aside>

          <div className="max-w-5xl space-y-4 text-sm [&_svg]:h-3.5 [&_svg]:w-3.5 sm:space-y-6 lg:max-w-none">
            <section className="grid grid-cols-3 gap-3 sm:gap-4">
              {quickStats.map((stat) => (
                <article
                  key={stat.label}
                  className="min-w-0 rounded-2xl border border-border/60 bg-surface/70 p-3 text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:bg-surface/90 sm:p-4"
                >
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground sm:text-[11px]">
                    {stat.label}
                  </p>
                  <p className="mt-2 truncate text-2xl font-semibold leading-none sm:text-3xl" title={String(stat.value)}>
                    {formatCompactNumber(stat.value)}
                  </p>
                </article>
              ))}
            </section>

            <section className="grid gap-3 md:grid-cols-3">
              {utilityCards.map((card) => (
                <article key={card.label} className="rounded-2xl bg-surface/60 px-4 py-4">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{card.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{formatCompactNumber(card.value)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{card.helper}</p>
                </article>
              ))}
            </section>

            <Card className="rounded-none border-0 bg-transparent shadow-none">
              <CardContent className="space-y-5 p-0">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">CoinTag wallet</p>
                    <h2 className="mt-1 text-xl font-semibold text-foreground">Asset Wallet</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      View every CoinTag you own by asset, including the code assigned at purchase.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/60 bg-background/60 px-4 py-1.5 transition-colors duration-200 focus-within:border-ring/70 focus-within:bg-background/80">
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search asset by name or ticker"
                    className="h-10 border-0 bg-transparent p-0 text-sm focus-visible:ring-0"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button className="rounded-full bg-blue-500 text-white hover:bg-blue-600" onClick={() => navigate("/assets")}>
                    Browse Active Hunts
                  </Button>
                  <Button variant="outline" className="rounded-full" onClick={() => navigate("/portfolio")}>
                    Open Portfolio
                  </Button>
                </div>

                {walletRows.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/60 bg-background/40 px-4 py-12 text-center">
                    <p className="text-sm text-muted-foreground">
                      No CoinTag codes found yet. Buy CoinTags from an asset page to populate your wallet.
                    </p>
                    <Button className="mt-4" onClick={() => navigate("/assets")}>
                      Browse Assets
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-border/60 bg-background/50">
                    <div className="divide-y divide-border/50">
                    {walletRows.map(({ asset, codes, ownedCoinTags }) => (
                      <article
                        key={asset.id}
                        className="px-3 py-3 transition-colors duration-200 hover:bg-muted/30 sm:px-4"
                      >
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={asset.image}
                                alt={asset.name}
                                className="h-9 w-9 rounded-xl object-cover"
                              />
                              <div className="min-w-0">
                                <h3 className="truncate text-sm font-medium text-foreground">
                                  {asset.name}
                                </h3>
                                <p className="truncate text-[10px] text-muted-foreground">
                                  {asset.ticker?.toUpperCase() ?? asset.id.toUpperCase()} • Cycle{" "}
                                  {asset.cycle.cycle}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              className="h-8 shrink-0 px-2 text-xs font-medium text-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                              onClick={() => navigate(`/assets/${asset.id}`)}
                            >
                              <span className="hidden sm:inline">Open Asset</span>
                              <span className="sm:hidden">Open</span>
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </div>

                          {codes.length === 0 ? (
                            <div className="rounded-xl bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                              You currently hold {ownedCoinTags} CoinTag{ownedCoinTags === 1 ? "" : "s"},
                              but no codes are synced yet.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 gap-2">
                              {codes.map((code) => (
                                <div
                                  key={`${asset.id}-${code}`}
                                  className="flex items-center justify-between gap-2 rounded-xl bg-muted/25 px-3 py-2"
                                >
                                  <span className="flex min-w-0 items-center gap-2 font-mono text-xs font-semibold text-foreground sm:text-sm">
                                    <KeyRound className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                    <span className="truncate">{code}</span>
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 shrink-0 rounded-lg transition-colors hover:bg-background/70"
                                    onClick={() => copyCode(code)}
                                    aria-label={`Copy code ${code}`}
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </article>
                    ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      </main>
    </div>
  );
}
