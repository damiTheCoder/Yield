import { useMemo, useState } from "react";
import { useApp } from "@/lib/app-state";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Portfolio() {
  const {
    user,
    cycle,
    assets,
    userAssets,
    hybridDex,
    hybridDexMetrics,
    claimRewards,
    convertAssetLftsToClft,
    redeemAssetLFTs,
  } = useApp();

  const [assetRedeemCounts, setAssetRedeemCounts] = useState<Record<string, number>>({});
  const [assetConvertCounts, setAssetConvertCounts] = useState<Record<string, number>>({});

  const clftBalance = user.clft ?? 0;
  const currentClftPrice = hybridDex?.currentPrice ?? 0;
  const accruedRewards = cycle?.accrued?.holderRewards ?? 0;
  const realizedRewards = user.realizedRewards ?? 0;

  const totalClftValue = useMemo(
    () => clftBalance * currentClftPrice,
    [clftBalance, currentClftPrice],
  );

  const totalLftValue = useMemo(() => {
    const cycleLpu = cycle?.lpu ?? 0;
    const collectionValue = assets.reduce((sum, asset) => {
      const owned = userAssets[asset.id]?.lfts ?? 0;
      return sum + owned * asset.cycle.lpu;
    }, 0);
    const cycleValue = (user.lfts ?? 0) * cycleLpu;
    return collectionValue + cycleValue;
  }, [assets, userAssets, user.lfts, cycle]);

  const ownedAssetLfts = useMemo(
    () => assets.filter((asset) => (userAssets[asset.id]?.lfts ?? 0) > 0),
    [assets, userAssets],
  );
  const setAssetRedeemCount = (assetId: string, value: number) => {
    setAssetRedeemCounts((prev) => ({ ...prev, [assetId]: Math.max(0, value) }));
  };

  const setAssetConvertCount = (assetId: string, value: number) => {
    setAssetConvertCounts((prev) => ({ ...prev, [assetId]: Math.max(0, value) }));
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

  const handleConvertAsset = (assetId: string) => {
    const requested = assetConvertCounts[assetId] ?? 1;
    if (requested <= 0) return;
    const result = convertAssetLftsToClft(assetId, requested);
    if (result.converted > 0) {
      setAssetConvertCounts((prev) => ({ ...prev, [assetId]: 1 }));
    }
  };

  const { lowerBound, upperBound, vwapPrice } = hybridDexMetrics;

  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="inline-block rounded-2xl border border-emerald-400 bg-emerald-900 px-4 py-2">
          <h1 className="text-xl font-semibold text-emerald-300">Portfolio</h1>
        </div>

        <Card className="rounded-3xl border-none bg-transparent p-0 text-white shadow-none">
          <CardContent className="p-0">
            <div className="grid grid-cols-2 items-center gap-4 text-foreground">
              <div className="flex flex-col items-start gap-1 text-left">
                <p className="text-xs uppercase text-muted-foreground">Total LFT Value</p>
                <p className="text-3xl font-semibold text-foreground">{formatCurrency(totalLftValue)}</p>
              </div>
              <div className="flex flex-col items-center gap-1 text-center sm:items-end sm:text-right">
                <p className="text-xs uppercase text-muted-foreground">Total cLFT Value</p>
                <p className="text-3xl font-semibold text-foreground">{formatCurrency(totalClftValue)}</p>
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
                className="w-full"
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
            <CardTitle>Owned LFT Collections</CardTitle>
            <p className="text-sm text-muted-foreground">
              Redeem LFTs for their reserve value or convert 1:1 into tradable cLFT tokens.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 px-0 pb-0 sm:px-0 sm:pb-0">
            {ownedAssetLfts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No asset-specific LFTs yet. Hunt CoinTags to populate this section.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {ownedAssetLfts.map((asset) => {
                  const balances = userAssets[asset.id] ?? { coinTags: 0, lfts: 0 };
                  const redeemCount = assetRedeemCounts[asset.id] ?? 1;
                  const convertCount = assetConvertCounts[asset.id] ?? 1;
                  const assetValue = balances.lfts * asset.cycle.lpu;

                  return (
                    <div
                      key={asset.id}
                      className="rounded-2xl bg-muted/20 p-4 space-y-4 text-sm dark:bg-background/70"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={asset.image}
                            alt={asset.name}
                            className="h-10 w-10 rounded-lg object-cover"
                          />
                          <span className="font-medium">{asset.name}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Value: <span className="font-mono">{formatCurrency(assetValue)}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">LFTs owned</span>
                          <span className="font-mono">{balances.lfts}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Current LPU</span>
                          <span className="font-mono">{formatCurrency(asset.cycle.lpu)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Reserve</span>
                          <span className="font-mono">{formatCurrency(asset.cycle.reserve)}</span>
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label
                            className="text-xs text-muted-foreground"
                            htmlFor={`asset-redeem-${asset.id}`}
                          >
                            Redeem Count
                          </label>
                          <Input
                            id={`asset-redeem-${asset.id}`}
                            type="number"
                            min={1}
                            value={redeemCount}
                            onChange={(event) =>
                              setAssetRedeemCount(
                                asset.id,
                                Math.max(0, Number(event.target.value) || 0),
                              )
                            }
                          />
                          <Button
                            className="w-full"
                            onClick={() => handleRedeemAsset(asset.id)}
                            disabled={balances.lfts <= 0 || redeemCount <= 0}
                          >
                            Redeem for {formatCurrency(asset.cycle.lpu)}
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <label
                            className="text-xs text-muted-foreground"
                            htmlFor={`asset-convert-${asset.id}`}
                          >
                            Convert to cLFT
                          </label>
                          <Input
                            id={`asset-convert-${asset.id}`}
                            type="number"
                            min={1}
                            value={convertCount}
                            onChange={(event) =>
                              setAssetConvertCount(
                                asset.id,
                                Math.max(0, Number(event.target.value) || 0),
                              )
                            }
                          />
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => handleConvertAsset(asset.id)}
                            disabled={balances.lfts <= 0 || convertCount <= 0}
                          >
                            Convert {convertCount || 0} → cLFT (1:1)
                          </Button>
                          <p className="text-xs text-muted-foreground">
                            Conversion is instant. Tokens become tradable in the HybridDEX.
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
