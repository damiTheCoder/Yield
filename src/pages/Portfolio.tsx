import React, { useMemo, useState } from "react";
import { useApp } from "@/lib/app-state";
import { cn, formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Web3News from "@/components/Web3News";

const PORTFOLIO_HEADER_ICONS = ["/z1.png", "/z2.png", "/z3.png", "/z4.jpeg"];
const ICON_STACK_MESSAGE = "we just felt this will make the UX design look good 😂";

const toNumeric = (value: unknown) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getAssetUnitPrice = (asset: { cycle: { lpu: number }; secondaryMarket?: { active: boolean; walv: number } }) =>
  asset.secondaryMarket?.active ? asset.secondaryMarket.walv : asset.cycle.lpu;

export default function Portfolio() {
  const {
    user,
    cycle,
    assets,
    userAssets,
    claimRewards,
    redeemAssetLFTs,
  } = useApp();

  const [assetRedeemCounts, setAssetRedeemCounts] = useState<Record<string, number>>({});
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);


  const accruedRewards = cycle?.accrued?.holderRewards ?? 0;
  const realizedRewards = user.realizedRewards ?? 0;
  const totalLftValue = useMemo(() => {
    const total = assets.reduce((sum, asset) => {
      const owned = toNumeric(userAssets[asset.id]?.lfts);
      const lpu = getAssetUnitPrice(asset);
      return sum + owned * lpu;
    }, 0);
    return isNaN(total) ? 0 : total;
  }, [assets, userAssets]);

  const ownedAssetLfts = useMemo(() => {
    return assets.filter((asset) => {
      const lfts = toNumeric(userAssets[asset.id]?.lfts);
      return lfts > 0;
    });
  }, [assets, userAssets]);
  const selectedAsset = useMemo(
    () => (selectedAssetId ? assets.find((asset) => asset.id === selectedAssetId) ?? null : null),
    [assets, selectedAssetId],
  );
  const redeemableNow = useMemo(
    () =>
      ownedAssetLfts.reduce((sum, asset) => {
        if (asset.secondaryMarket?.active) return sum;
        const owned = toNumeric(userAssets[asset.id]?.lfts);
        return sum + owned * getAssetUnitPrice(asset);
      }, 0),
    [ownedAssetLfts, userAssets],
  );
  const marketOnlyValue = useMemo(
    () =>
      ownedAssetLfts.reduce((sum, asset) => {
        if (!asset.secondaryMarket?.active) return sum;
        const owned = toNumeric(userAssets[asset.id]?.lfts);
        return sum + owned * getAssetUnitPrice(asset);
      }, 0),
    [ownedAssetLfts, userAssets],
  );
  const readyToRedeemCollections = useMemo(
    () => ownedAssetLfts.filter((asset) => !asset.secondaryMarket?.active).length,
    [ownedAssetLfts],
  );
  const portfolioInsights = [
    {
      label: "Redeemable Now",
      value: formatCurrency(redeemableNow),
      helper: `${readyToRedeemCollections} live collection${readyToRedeemCollections === 1 ? "" : "s"}`,
      accent: "text-emerald-500",
    },
    {
      label: "Rewards Pending",
      value: formatCurrency(accruedRewards),
      helper: accruedRewards > 0 ? "Ready to claim" : "No active holder payout",
      accent: "text-blue-500",
    },
    {
      label: "Market-Only Value",
      value: formatCurrency(marketOnlyValue),
      helper: marketOnlyValue > 0 ? "Tracked at WALV pricing" : "No market-only holdings",
      accent: "text-violet-500",
    },
  ];

  const renderOwnedAssetCard = (asset: (typeof assets)[number], variant: "grid" | "modal" = "grid") => {
    const rawBalances = userAssets[asset.id];
    const balances = {
      coinTags: toNumeric(rawBalances?.coinTags),
      lfts: toNumeric(rawBalances?.lfts),
    };
    const marketOnlyPhase = Boolean(asset.secondaryMarket?.active);
    const unitPrice = getAssetUnitPrice(asset);
    const redeemCount = assetRedeemCounts[asset.id] ?? 1;
    const assetValue = balances.lfts * unitPrice;
    const statusLabel = marketOnlyPhase ? "Market only" : "Redeemable now";
    const statusValue = marketOnlyPhase ? "WALV pricing active" : formatCurrency(assetValue);

    const wrapperClasses =
      variant === "grid"
        ? "rounded-2xl border border-border bg-card p-4 space-y-4 text-xs shadow-sm"
        : "rounded-2xl bg-card p-4 space-y-4 text-xs shadow-lg";
    const redeemButtonClasses =
      variant === "modal"
        ? "bg-sky-200 text-sky-950 shadow-[0_6px_16px_rgba(56,189,248,0.2)] hover:bg-sky-300"
        : "bg-sky-300 text-sky-950 hover:bg-sky-400";

    return (
      <div key={`${variant}-${asset.id}`} className={wrapperClasses}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src={asset.image} alt={asset.name} className="h-8 w-8 rounded-md object-cover" />
            <div className="flex flex-col">
              <span className="text-xs font-medium">{asset.name}</span>
              <span className="text-[10px] text-muted-foreground">Cycle {asset.cycle.cycle}</span>
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground">
            Value: <span className="font-mono">{formatCurrency(assetValue)}</span>
          </div>
        </div>

        <div className="space-y-2 text-[11px]">
          <div className="flex justify-between">
            <span className="text-muted-foreground">LFTs owned</span>
            <span className="font-mono text-xs text-foreground">{balances.lfts}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Current LPU</span>
            <span className="font-mono text-xs text-foreground">{formatCurrency(unitPrice)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Reserve</span>
            <span className="font-mono text-xs text-foreground">{formatCurrency(asset.cycle.reserve)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{statusLabel}</span>
            <span className="font-mono text-xs text-foreground">{statusValue}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-[11px] text-muted-foreground" htmlFor={`asset-redeem-${asset.id}`}>
              Redeem Count
            </label>
            <Input
              className="h-9 text-xs"
              id={`asset-redeem-${asset.id}`}
              type="number"
              min={1}
              value={redeemCount}
              onChange={(event) =>
                setAssetRedeemCount(asset.id, Math.max(0, Number(event.target.value) || 0))
              }
            />
            <Button
              className={cn(
                "w-full flex-col items-center justify-center gap-0 whitespace-normal text-center leading-tight border-0",
                redeemButtonClasses,
              )}
              onClick={() => handleRedeemAsset(asset.id)}
              disabled={balances.lfts <= 0 || redeemCount <= 0 || marketOnlyPhase}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wide">Redeem For</span>
              <span className="text-xs font-semibold">{formatCurrency(unitPrice)}</span>
            </Button>
          </div>
        </div>
      </div>
    );
  };
  const setAssetRedeemCount = (assetId: string, value: number) => {
    setAssetRedeemCounts((prev) => ({ ...prev, [assetId]: Math.max(0, value) }));
  };

  const handleRedeemAsset = (assetId: string) => {
    const requested = assetRedeemCounts[assetId] ?? 1;
    if (requested <= 0) return;
    const result = redeemAssetLFTs(assetId, requested);
    if (result.redeemed > 0) {
      setAssetRedeemCounts((prev) => ({ ...prev, [assetId]: 1 }));
    } else {
      setAssetRedeemCounts((prev) => ({ ...prev, [assetId]: 0 }));
    }
  };

  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 pb-10 pt-3 sm:pt-8">
        <div className="space-y-8 text-sm [&_svg]:h-3.5 [&_svg]:w-3.5 lg:grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)] lg:gap-8 lg:space-y-0">
          <aside className="hidden lg:block lg:space-y-6 lg:pt-2">
            <Web3News variant="detail" />
          </aside>

          <div className="space-y-8">
            <Card className="rounded-3xl border-none bg-transparent p-0 text-white shadow-none">
              <CardContent className="p-0">
                <div className="flex items-start justify-between gap-4 text-foreground">
                  <div className="flex flex-col items-start gap-1 text-left">
                    <p className="text-[10px] uppercase text-muted-foreground">Total LFT Holdings</p>
                    <p className="text-4xl font-semibold text-foreground sm:text-[44px]">{formatCurrency(totalLftValue)}</p>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center pt-1 transition-transform hover:scale-[1.02]"
                        aria-label="Why these icons are here"
                      >
                        {PORTFOLIO_HEADER_ICONS.map((icon, index) => (
                          <span
                            key={icon}
                            className={cn(
                              "h-8 w-8 overflow-hidden rounded-full border-[2px] border-black bg-white",
                              index === 0 ? "ml-0" : "-ml-2.5",
                            )}
                          >
                            <img src={icon} alt="" className="h-full w-full object-cover" loading="lazy" />
                          </span>
                        ))}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-[240px] rounded-2xl border border-[#D5DCE8] bg-white p-3 text-sm font-medium leading-6 text-[#344054] shadow-xl">
                      {ICON_STACK_MESSAGE}
                    </PopoverContent>
                  </Popover>
                </div>
              </CardContent>
            </Card>

            <section className="grid gap-3 sm:grid-cols-3">
              {portfolioInsights.map((insight) => (
                <article key={insight.label} className="rounded-2xl border border-border/60 bg-surface/50 px-4 py-4">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{insight.label}</p>
                  <p className={cn("mt-2 text-2xl font-semibold", insight.accent)}>{insight.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{insight.helper}</p>
                </article>
              ))}
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="rounded-3xl border-0 bg-transparent p-0 backdrop-blur text-foreground sm:border sm:border-border/60 sm:bg-surface/60 sm:px-6 sm:py-6">
                <CardHeader className="px-0 pt-0 sm:px-0 sm:pt-0">
                  <CardTitle className="text-lg">Wallet & Rewards</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 px-0 pb-0 text-xs sm:px-0 sm:pb-0">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Accrued Holder Rewards</span>
                      <span className="font-mono">{formatCurrency(accruedRewards)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Realized Rewards</span>
                      <span className="font-mono">{formatCurrency(realizedRewards)}</span>
                    </div>
                  </div>
                  <Button
                    className="h-9 w-full border-0 bg-[#2F66F6] text-xs font-semibold text-white shadow-[0_10px_24px_rgba(47,102,246,0.25)] hover:bg-[#2558DE]"
                    onClick={() => claimRewards()}
                    disabled={accruedRewards <= 0}
                  >
                    Claim Rewards
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-3xl border-0 bg-transparent p-0 backdrop-blur text-foreground shadow-none sm:bg-surface/60 sm:px-6 sm:py-6 sm:border sm:border-border/60">
              <CardHeader className="px-0 pt-0 sm:px-0 sm:pt-0">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <div>
                    <CardTitle className="text-lg">Owned LFT Collections</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Redeem LFTs for their reserve value and access the ecosystem token once discovery completes.
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 px-0 pb-0 sm:px-0 sm:pb-0">
                {ownedAssetLfts.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No asset-specific LFTs yet. Hunt CoinTags to populate this section.
                  </p>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-border/60 bg-background/50">
                    <div className="divide-y divide-border/50">
                      {ownedAssetLfts.map((asset) => {
                        const rawBalances = userAssets[asset.id];
                        const balances = {
                          coinTags: toNumeric(rawBalances?.coinTags),
                          lfts: toNumeric(rawBalances?.lfts),
                        };
                        const assetValue = balances.lfts * getAssetUnitPrice(asset);

                        return (
                          <button
                            type="button"
                            key={`list-${asset.id}`}
                            onClick={() => setSelectedAssetId(asset.id)}
                            className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition hover:bg-muted/30 sm:px-4"
                          >
                            <div className="flex items-center gap-3">
                              <img src={asset.image} alt={asset.name} className="h-9 w-9 rounded-xl object-cover" />
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-foreground">{asset.name}</span>
                                <span className="text-[10px] text-muted-foreground">Cycle {asset.cycle.cycle}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                {asset.secondaryMarket?.active ? "Market value" : "Redeemable value"}
                              </p>
                              <p className={cn("font-mono text-xs font-semibold", asset.secondaryMarket?.active ? "text-violet-500" : "text-emerald-500")}>
                                {formatCurrency(assetValue)}
                                <span className="ml-1 text-[10px] text-muted-foreground">/{balances.lfts} LFTs</span>
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            <Dialog open={Boolean(selectedAsset)} onOpenChange={(open) => !open && setSelectedAssetId(null)}>
              {selectedAsset && (
                <DialogContent overlayClassName="bg-transparent" className="mx-auto max-w-2xl rounded-[32px] border border-border/60 bg-surface/95 p-5 shadow-xl sm:p-6">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-semibold text-foreground">{selectedAsset.name}</DialogTitle>
                    <p className="text-xs text-muted-foreground">
                      Redeem LFTs or jump into token trading for this collection when available.
                    </p>
                  </DialogHeader>
                  {renderOwnedAssetCard(selectedAsset, "modal")}
                </DialogContent>
              )}
            </Dialog>
          </div>
        </div>
      </main>
    </div>
  );
}
