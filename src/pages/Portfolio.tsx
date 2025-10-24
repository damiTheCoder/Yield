import { useMemo, useState } from "react";
import { useApp } from "@/lib/app-state";
import { cn, formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTheme } from "@/hooks/useTheme";

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
  const [ownedViewMode, setOwnedViewMode] = useState<"grid" | "list">("list");
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";

  const accruedRewards = cycle?.accrued?.holderRewards ?? 0;
  const realizedRewards = user.realizedRewards ?? 0;

  const totalLftWithdrawnValue = user.withdrawn ?? 0;
  const totalLftValue = useMemo(() => {
    return assets.reduce((sum, asset) => {
      const owned = userAssets[asset.id]?.lfts ?? 0;
      return sum + owned * asset.cycle.lpu;
    }, 0);
  }, [assets, userAssets]);

  const ownedAssetLfts = useMemo(
    () => assets.filter((asset) => (userAssets[asset.id]?.lfts ?? 0) > 0),
    [assets, userAssets],
  );
  const selectedAsset = useMemo(
    () => (selectedAssetId ? assets.find((asset) => asset.id === selectedAssetId) ?? null : null),
    [assets, selectedAssetId],
  );

  const renderOwnedAssetCard = (asset: (typeof assets)[number], variant: "grid" | "modal" = "grid") => {
    const balances = userAssets[asset.id] ?? { coinTags: 0, lfts: 0 };
    const redeemCount = assetRedeemCounts[asset.id] ?? 1;
    const assetValue = balances.lfts * asset.cycle.lpu;

    const wrapperClasses =
      variant === "grid"
        ? isDarkTheme
          ? "rounded-2xl border border-white/5 bg-neutral-800/80 p-4 space-y-4 text-sm"
          : "rounded-2xl border border-gray-200 bg-gray-100 p-4 space-y-4 text-sm"
        : isDarkTheme
          ? "rounded-2xl bg-background/80 p-4 space-y-4 text-sm shadow-lg"
          : "rounded-2xl bg-white p-4 space-y-4 text-sm shadow-lg";

    return (
      <div key={`${variant}-${asset.id}`} className={wrapperClasses}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src={asset.image} alt={asset.name} className="h-10 w-10 rounded-lg object-cover" />
            <div className="flex flex-col">
              <span className="font-medium">{asset.name}</span>
              <span className="text-[11px] text-muted-foreground">Cycle {asset.cycle.cycle}</span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Value: <span className="font-mono">{formatCurrency(assetValue)}</span>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">LFTs owned</span>
            <span className="font-mono text-sm text-foreground">{balances.lfts}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Current LPU</span>
            <span className="font-mono text-sm text-foreground">{formatCurrency(asset.cycle.lpu)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Reserve</span>
            <span className="font-mono text-sm text-foreground">{formatCurrency(asset.cycle.reserve)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground" htmlFor={`asset-redeem-${asset.id}`}>
              Redeem Count
            </label>
            <Input
              id={`asset-redeem-${asset.id}`}
              type="number"
              min={1}
              value={redeemCount}
              onChange={(event) =>
                setAssetRedeemCount(asset.id, Math.max(0, Number(event.target.value) || 0))
              }
            />
            <Button
              className="w-full flex-col items-center justify-center gap-0 whitespace-normal text-center leading-tight"
              onClick={() => handleRedeemAsset(asset.id)}
              disabled={balances.lfts <= 0 || redeemCount <= 0}
            >
              <span className="text-xs font-semibold uppercase tracking-wide">Redeem For</span>
              <span className="text-sm font-semibold">{formatCurrency(asset.cycle.lpu)}</span>
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
      <main className="container mx-auto px-4 pt-6 pb-10 space-y-8 sm:pt-10">
        <div className="portfolio-badge inline-block rounded-xl px-3 py-1.5">
          <h1 className="portfolio-badge__text text-lg font-semibold">Portfolio</h1>
        </div>

        <Card className="rounded-3xl border-none bg-transparent p-0 text-white shadow-none">
          <CardContent className="p-0">
            <div className="grid grid-cols-2 items-center gap-4 text-foreground">
              <div className="flex flex-col items-start gap-1 text-left">
                <p className="text-xs uppercase text-muted-foreground">Total LFT Withdrawn</p>
                <p className="text-3xl font-semibold text-foreground">{formatCurrency(totalLftWithdrawnValue)}</p>
              </div>
              <div className="flex flex-col items-center gap-1 text-center sm:items-end sm:text-right">
                <p className="text-xs uppercase text-muted-foreground">Total LFT Holdings</p>
                <p className="text-3xl font-semibold text-foreground">{formatCurrency(totalLftValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-3xl border-0 bg-transparent p-0 backdrop-blur text-foreground sm:border sm:border-border/60 sm:bg-surface/60 sm:px-6 sm:py-6">
            <CardHeader className="px-0 pt-0 sm:px-0 sm:pt-0">
              <CardTitle>Wallet & Rewards</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-0 pb-0 text-sm sm:px-0 sm:pb-0">
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
                className="w-full bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-700 dark:text-emerald-100 dark:hover:bg-emerald-600 sm:bg-primary sm:text-primary-foreground sm:hover:bg-primary/90"
                onClick={() => claimRewards()}
                disabled={accruedRewards <= 0}
              >
                Claim Rewards
              </Button>
            </CardContent>
          </Card>

        </div>

        <Card className="rounded-3xl border-0 bg-transparent p-0 backdrop-blur text-foreground sm:bg-surface/60 sm:px-6 sm:py-6 sm:border sm:border-border/60">
          <CardHeader className="px-0 pt-0 sm:px-0 sm:pt-0">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div>
                <CardTitle>Owned LFT Collections</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Redeem LFTs for their reserve value and access the ecosystem token once discovery completes.
                </p>
              </div>
              {ownedAssetLfts.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className={ownedViewMode === "list" ? "font-semibold text-foreground" : undefined}>List</span>
                  <Switch
                    checked={ownedViewMode === "grid"}
                    onCheckedChange={(checked) => setOwnedViewMode(checked ? "grid" : "list")}
                    aria-label="Toggle owned LFT collections layout"
                  />
                  <span className={ownedViewMode === "grid" ? "font-semibold text-foreground" : undefined}>Grid</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4 px-0 pb-0 sm:px-0 sm:pb-0">
            {ownedAssetLfts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No asset-specific LFTs yet. Hunt CoinTags to populate this section.
              </p>
            ) : ownedViewMode === "grid" ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {ownedAssetLfts.map((asset) => renderOwnedAssetCard(asset, "grid"))}
              </div>
            ) : (
              <div className="space-y-3 -mx-2 sm:mx-0">
                {ownedAssetLfts.map((asset) => {
                  const balances = userAssets[asset.id] ?? { coinTags: 0, lfts: 0 };
                  const assetValue = balances.lfts * asset.cycle.lpu;

                  return (
                    <button
                      type="button"
                      key={`list-${asset.id}`}
                      onClick={() => setSelectedAssetId(asset.id)}
                      className={cn(
                        "flex w-full items-center justify-between gap-4 rounded-2xl text-left shadow-sm transition",
                        isDarkTheme
                          ? "bg-background/70 px-2 py-3 sm:px-4 hover:bg-background/60"
                          : "px-2 py-3 sm:px-4 sm:bg-white sm:hover:bg-white/90",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <img src={asset.image} alt={asset.name} className="h-12 w-12 rounded-2xl object-cover" />
                        <span className="font-medium text-foreground">{asset.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Total value</p>
                        <p className="font-mono text-sm font-semibold text-emerald-400">
                          {formatCurrency(assetValue)}
                          <span className="ml-1 text-xs text-muted-foreground">/{balances.lfts} LFTs</span>
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        <Dialog open={Boolean(selectedAsset)} onOpenChange={(open) => !open && setSelectedAssetId(null)}>
          {selectedAsset && (
            <DialogContent className="mx-4 max-w-2xl rounded-3xl">
              <DialogHeader>
                <DialogTitle>{selectedAsset.name}</DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    Redeem LFTs or jump into token trading for this collection when available.
                  </p>
              </DialogHeader>
              {renderOwnedAssetCard(selectedAsset, "modal")}
            </DialogContent>
          )}
        </Dialog>
      </main>
    </div>
  );
}
