import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApp } from "@/lib/app-state";
import { useState, useMemo } from "react";

export default function CoinTags() {
  const { cycle, params, user, buyCoinTags } = useApp();
  const [amount, setAmount] = useState(10);

  const preview = useMemo(() => {
    const s = amount;
    return {
      creator: (s * (params.split?.creator ?? 0)).toFixed(2),
      reserveGrowth: (s * (params.split?.reserveGrowth ?? 0)).toFixed(2),
      platform: (s * (params.split?.platform ?? 0)).toFixed(2),
      liquidity: (s * (params.split?.liquidityContribution ?? 0)).toFixed(2),
      rewards: (s * (params.split?.holderRewards ?? 0)).toFixed(2),
    };
  }, [amount, params.split]);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8 space-y-8">
        <h1 className="text-3xl font-bold">Buy CoinTags</h1>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Purchase</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">USD Balance: ${user.usd.toFixed(2)}</div>
              <div>
                <label className="text-sm text-muted-foreground">Amount (USD)</label>
                <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value) || 0)} />
              </div>
              <Button onClick={() => buyCoinTags(amount)}>Buy CoinTags</Button>
              <div className="text-sm">You will receive {Math.floor(amount)} CoinTags (1$ each).</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Allocation Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex justify-between"><span className="text-muted-foreground">Creator 50%</span><span>${preview.creator}</span></li>
                <li className="flex justify-between"><span className="text-muted-foreground">Reserve Growth 20%</span><span>${preview.reserveGrowth}</span></li>
                <li className="flex justify-between"><span className="text-muted-foreground">Platform 15%</span><span>${preview.platform}</span></li>
                <li className="flex justify-between"><span className="text-muted-foreground">Liquidity 10%</span><span>${preview.liquidity}</span></li>
                <li className="flex justify-between"><span className="text-muted-foreground">Holder Rewards 5%</span><span>${preview.rewards}</span></li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Cycle Snapshot</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div><div className="text-muted-foreground">Cycle</div><div className="font-mono">{cycle.cycle}</div></div>
              <div><div className="text-muted-foreground">Reserve</div><div className="font-mono">${cycle.reserve.toFixed(2)}</div></div>
              <div><div className="text-muted-foreground">Supply</div><div className="font-mono">{cycle.supply}</div></div>
              <div><div className="text-muted-foreground">LPU</div><div className="font-mono">${cycle.lpu.toFixed(4)}</div></div>
              <div><div className="text-muted-foreground">Seed Next</div><div className="font-mono">${cycle.seedNext.toFixed(2)}</div></div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

