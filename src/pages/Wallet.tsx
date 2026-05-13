import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, ExternalLink, KeyRound, Search } from "lucide-react";
import { useApp } from "@/lib/app-state";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Web3News from "@/components/Web3News";

const toNumeric = (value: unknown) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function Wallet() {
  const { assets, userAssets, getAssetCoinTagCodes } = useApp();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selectedKeyAssetId, setSelectedKeyAssetId] = useState<string | null>(null);

  const normalizedQuery = query.trim().toLowerCase();

  const keyedAssetIcons = useMemo(() => {
    return assets
      .map((asset) => ({
        asset,
        codeCount: getAssetCoinTagCodes(asset.id).length,
      }))
      .filter(({ codeCount }) => codeCount > 0)
      .sort((a, b) => b.codeCount - a.codeCount);
  }, [assets, getAssetCoinTagCodes]);

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

  const selectedKeyAsset = useMemo(() => {
    return keyedAssetIcons.find(({ asset }) => asset.id === selectedKeyAssetId)?.asset ?? null;
  }, [keyedAssetIcons, selectedKeyAssetId]);

  const selectedKeyCodes = selectedKeyAsset ? getAssetCoinTagCodes(selectedKeyAsset.id) : [];

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

  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 pb-10 pt-1 sm:pt-4">
        <div className="space-y-4 sm:space-y-6 lg:grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)] lg:gap-8 lg:space-y-0">
          <aside className="hidden lg:block lg:space-y-6 lg:pt-2">
            <Web3News variant="detail" />
          </aside>

          <div className="max-w-5xl space-y-4 text-sm [&_svg]:h-3.5 [&_svg]:w-3.5 lg:max-w-none">
            <Card className="rounded-none border-0 bg-transparent shadow-none">
              <CardContent className="space-y-4 p-0">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="w-full text-center">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">CoinTag wallet</p>
                    <h2 className="mt-1 text-xl font-semibold text-foreground">Asset Wallet</h2>
                    {keyedAssetIcons.length > 0 && (
                      <div className="mt-4 flex justify-center">
                        <div className="flex items-center">
                          {keyedAssetIcons.slice(0, 8).map(({ asset }, index) => (
                            <button
                              key={asset.id}
                              type="button"
                              onClick={() => setSelectedKeyAssetId(asset.id)}
                              className={index === 0 ? "" : "-ml-3"}
                              title={`View ${asset.name} keys`}
                              aria-label={`View ${asset.name} keys`}
                            >
                              <img
                                src={asset.image}
                                alt=""
                                className="h-11 w-11 rounded-full border-2 border-background object-cover shadow-sm transition-transform hover:scale-105 sm:h-12 sm:w-12"
                              />
                            </button>
                          ))}
                          {keyedAssetIcons.length > 8 && (
                            <span className="-ml-3 flex h-11 w-11 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-semibold text-muted-foreground shadow-sm sm:h-12 sm:w-12">
                              +{keyedAssetIcons.length - 8}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mx-auto flex w-full max-w-2xl items-center gap-2 rounded-2xl border border-border/60 bg-background/60 px-3 py-1 transition-colors duration-200 focus-within:border-ring/70 focus-within:bg-background/80">
                  <Search className="shrink-0 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search asset by name or ticker"
                    className="h-8 border-0 bg-transparent p-0 text-sm focus-visible:ring-0"
                  />
                </div>

                <p className="mx-auto max-w-2xl text-left text-sm text-muted-foreground">
                  View every CoinTag you own by asset, including the code assigned at purchase.
                </p>

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

      <Dialog open={Boolean(selectedKeyAsset)} onOpenChange={(open) => !open && setSelectedKeyAssetId(null)}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md rounded-2xl border border-border/60 p-5">
          {selectedKeyAsset && (
            <>
              <DialogHeader className="items-center text-center">
                <img
                  src={selectedKeyAsset.image}
                  alt={selectedKeyAsset.name}
                  className="mb-2 h-14 w-14 rounded-full border border-border/60 object-cover"
                />
                <DialogTitle>{selectedKeyAsset.name}</DialogTitle>
                <DialogDescription>
                  Active CoinTag {selectedKeyCodes.length === 1 ? "key" : "keys"} ready for this asset.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                {selectedKeyCodes.map((code) => (
                  <div
                    key={`${selectedKeyAsset.id}-modal-${code}`}
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
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
