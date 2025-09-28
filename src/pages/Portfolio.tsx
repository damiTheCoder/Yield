import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApp } from "@/lib/app-state";
import { formatCurrency } from "@/lib/utils";
import { useMemo, useState } from "react";

export default function Portfolio() {
  const {
    user,
    cycle,
    yieldIndex,
    redeemFinders,
    convertToYield,
    claimRewards,
    assets,
    userAssets,
    redeemAssetLFTs,
  } = useApp();
  const [redeemCount, setRedeemCount] = useState(1);
  const [convertCount, setConvertCount] = useState(1);
  const [assetRedeemCounts, setAssetRedeemCounts] = useState<Record<string, number>>({});

  const onRedeem = () => redeemFinders(redeemCount);
  const onConvert = () => convertToYield(convertCount);

  const onClaim = () => claimRewards();

  const ownedAssetLfts = useMemo(
    () => assets.filter((asset) => (userAssets[asset.id]?.lfts ?? 0) > 0),
    [assets, userAssets],
  );

  const setAssetRedeemCount = (assetId: string, value: number) => {
    setAssetRedeemCounts((prev) => ({ ...prev, [assetId]: value }));
  };

  const onRedeemAsset = (assetId: string) => {
    const count = assetRedeemCounts[assetId] ?? 1;
    redeemAssetLFTs(assetId, count);
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8 space-y-8">
        <h1 className="text-3xl font-bold">Portfolio</h1>

        <div className="grid md:grid-cols-4 gap-6">
          <Card>
            <CardHeader><CardTitle>Balances</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">USD</span><span className="font-mono">${user.usd.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">CoinTags</span><span className="font-mono">{user.coinTags}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">LFTs</span><span className="font-mono">{user.lfts}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">YIELD</span><span className="font-mono">{user.yieldUnits.toFixed(6)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Rewards Claimed</span><span className="font-mono">${user.realizedRewards.toFixed(2)}</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Redeem LFTs</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm text-muted-foreground">Count</label>
                <Input type="number" value={redeemCount} onChange={(e) => setRedeemCount(Number(e.target.value) || 0)} />
              </div>
              <Button onClick={onRedeem} disabled={user.lfts <= 0 || cycle.ended}>Redeem at LPU</Button>
              <div className="text-xs text-muted-foreground">Each redemption pays current LPU from reserve and burns 1 LFT.</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Convert to YIELD</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm text-muted-foreground">Units</label>
                <Input type="number" value={convertCount} onChange={(e) => setConvertCount(Number(e.target.value) || 0)} />
              </div>
              <Button onClick={onConvert} disabled={user.lfts <= 0}>Convert</Button>
              <div className="text-xs text-muted-foreground">Converted units enter consolidated market; redemption right resets.</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Rewards</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Accrued Holder Rewards</span><span className="font-mono">${cycle.accrued.holderRewards.toFixed(2)}</span></div>
              <Button onClick={onClaim} disabled={cycle.accrued.holderRewards <= 0}>Claim Rewards</Button>
              <div className="text-xs text-muted-foreground">Prototype distributes all accrued rewards to this wallet.</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Owned LFT Collections</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ownedAssetLfts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No asset-specific LFTs yet. Hunt CoinTags to populate this section.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {ownedAssetLfts.map((asset) => {
                  const balances = userAssets[asset.id] ?? { coinTags: 0, lfts: 0 };
                  const count = assetRedeemCounts[asset.id] ?? 1;
                  return (
                    <div
                      key={asset.id}
                      className="rounded-2xl border border-border/40 bg-surface/40 p-4 space-y-3 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <img src={asset.image} alt={asset.name} className="h-10 w-10 rounded-lg object-cover" />
                        <span className="font-medium truncate">{asset.name}</span>
                      </div>
                      <div className="flex justify-between"><span className="text-muted-foreground">LFTs owned</span><span className="font-mono">{balances.lfts}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Current LPU</span><span className="font-mono">{formatCurrency(asset.cycle.lpu)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Reserve</span><span className="font-mono">{formatCurrency(asset.cycle.reserve)}</span></div>
                      <div className="space-y-2">
                        <label className="text-xs text-muted-foreground" htmlFor={`asset-redeem-${asset.id}`}>
                          Redeem count
                        </label>
                        <Input
                          id={`asset-redeem-${asset.id}`}
                          type="number"
                          min={1}
                          value={count}
                          onChange={(event) =>
                            setAssetRedeemCount(asset.id, Math.max(0, Number(event.target.value) || 0))
                          }
                        />
                        <Button
                          className="w-full"
                          onClick={() => onRedeemAsset(asset.id)}
                          disabled={balances.lfts <= 0 || count <= 0}
                        >
                          Redeem
                        </Button>
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
