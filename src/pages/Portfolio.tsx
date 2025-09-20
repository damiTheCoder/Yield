import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApp } from "@/lib/app-state";
import { useState } from "react";

export default function Portfolio() {
  const { user, cycle, yieldIndex, redeemFinders, convertToYield, claimRewards } = useApp();
  const [redeemCount, setRedeemCount] = useState(1);
  const [convertCount, setConvertCount] = useState(1);

  const onRedeem = () => redeemFinders(redeemCount);
  const onConvert = () => convertToYield(convertCount);

  const onClaim = () => claimRewards();

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
          <CardHeader><CardTitle>Cycle & Market</CardTitle></CardHeader>
          <CardContent className="grid md:grid-cols-4 gap-4 text-sm">
            <div><div className="text-muted-foreground">Cycle</div><div className="font-mono">{cycle.cycle}</div></div>
            <div><div className="text-muted-foreground">Reserve</div><div className="font-mono">${cycle.reserve.toFixed(2)}</div></div>
            <div><div className="text-muted-foreground">LPU</div><div className="font-mono">${cycle.lpu.toFixed(6)}</div></div>
            <div><div className="text-muted-foreground">YIELD Price</div><div className="font-mono">${yieldIndex.price.toFixed(6)}</div></div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

