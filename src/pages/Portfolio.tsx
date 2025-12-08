import React, { useMemo, useState } from "react";
import { useApp } from "@/lib/app-state";
import { cn, formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";


const toNumeric = (value: unknown) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function Portfolio() {
  const {
    user,
    cycle,
    assets,
    userAssets,
    claimRewards,
    redeemAssetLFTs,
  } = useApp();

  console.log('🔄 Portfolio Page - Loaded with userAssets:', JSON.stringify(userAssets, null, 2));
  console.log('🔄 Portfolio Page - Total assets available:', assets.length);

  const [assetRedeemCounts, setAssetRedeemCounts] = useState<Record<string, number>>({});
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);


  const accruedRewards = cycle?.accrued?.holderRewards ?? 0;
  const realizedRewards = user.realizedRewards ?? 0;

  const totalLftWithdrawnValue = user.withdrawn ?? 0;
  const totalLftValue = useMemo(() => {
    console.log('🏦 Portfolio Debug - Calculating totalLftValue with userAssets:', JSON.stringify(userAssets, null, 2));
    const total = assets.reduce((sum, asset) => {
      const owned = toNumeric(userAssets[asset.id]?.lfts);
      const lpu = typeof asset.cycle?.lpu === 'number' ? asset.cycle.lpu : 0;
      const assetValue = owned * lpu;
      console.log(`📊 Portfolio Debug - Asset ${asset.name} (${asset.id}): ${owned} LFTs × ${lpu} LPU = ${assetValue}`);
      return sum + assetValue;
    }, 0);
    console.log(`💰 Portfolio Debug - Total LFT Value: ${total}`);
    return isNaN(total) ? 0 : total;
  }, [assets, userAssets]);

  const ownedAssetLfts = useMemo(() => {
    const owned = assets.filter((asset) => {
      const lfts = toNumeric(userAssets[asset.id]?.lfts);
      const hasLfts = lfts > 0;
      console.log(`🔍 Portfolio Debug - Checking ${asset.name}: ${lfts} LFTs, owned: ${hasLfts}`);
      return hasLfts;
    });
    console.log(`📦 Portfolio Debug - Total owned assets:`, owned.map(a => a.name));
    return owned;
  }, [assets, userAssets]);
  const selectedAsset = useMemo(
    () => (selectedAssetId ? assets.find((asset) => asset.id === selectedAssetId) ?? null : null),
    [assets, selectedAssetId],
  );

  const renderOwnedAssetCard = (asset: (typeof assets)[number], variant: "grid" | "modal" = "grid") => {
    const rawBalances = userAssets[asset.id];
    const balances = {
      coinTags: toNumeric(rawBalances?.coinTags),
      lfts: toNumeric(rawBalances?.lfts),
    };
    const redeemCount = assetRedeemCounts[asset.id] ?? 1;
    const assetValue = balances.lfts * asset.cycle.lpu;

    const wrapperClasses =
      variant === "grid"
        ? "rounded-2xl border border-border bg-card p-4 space-y-4 text-sm shadow-sm"
        : "rounded-2xl bg-card p-4 space-y-4 text-sm shadow-lg";
    const redeemButtonClasses =
      variant === "modal"
        ? "bg-gradient-to-r from-violet-200 via-violet-300 to-violet-200 text-violet-900 shadow-[0_6px_16px_rgba(167,139,250,0.35)] hover:opacity-95"
        : "bg-gradient-to-r from-violet-300 via-violet-400 to-violet-500 text-white hover:opacity-95";

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
              className={cn(
                "w-full flex-col items-center justify-center gap-0 whitespace-normal text-center leading-tight border-0",
                redeemButtonClasses,
              )}
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
      <main className="container mx-auto px-4 pt-3 pb-10 space-y-8 sm:pt-8">
        <div className="mb-4 flex justify-center">
          <img
            src="/G3.png"
            alt="Solaris portfolio highlight"
            className="w-full max-w-2xl rounded-2xl object-cover sm:rounded-3xl"
          />
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
                className="w-full border-0 bg-gradient-to-r from-violet-300 via-violet-400 to-violet-500 text-white font-semibold shadow-[0_8px_20px_rgba(167,139,250,0.35)] hover:opacity-95"
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
                <CardTitle>Owned LFT Collections</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Redeem LFTs for their reserve value and access the ecosystem token once discovery completes.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 px-0 pb-0 sm:px-0 sm:pb-0">
            {ownedAssetLfts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
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
                    const assetValue = balances.lfts * asset.cycle.lpu;

                    return (
                      <button
                        type="button"
                        key={`list-${asset.id}`}
                        onClick={() => setSelectedAssetId(asset.id)}
                        className="flex w-full items-center justify-between gap-4 px-3 py-3 text-left transition hover:bg-muted/30 sm:px-4"
                      >
                        <div className="flex items-center gap-3">
                          <img src={asset.image} alt={asset.name} className="h-11 w-11 rounded-2xl object-cover" />
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">{asset.name}</span>
                            <span className="text-[11px] text-muted-foreground">Cycle {asset.cycle.cycle}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Total value</p>
                          <p className="font-mono text-sm font-semibold text-violet-400">
                            {formatCurrency(assetValue)}
                            <span className="ml-1 text-xs text-muted-foreground">/{balances.lfts} LFTs</span>
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
            <DialogContent className="mx-auto max-w-2xl rounded-[32px] border border-border/60 bg-surface/95 p-6 shadow-xl sm:p-8">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-foreground">{selectedAsset.name}</DialogTitle>
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
