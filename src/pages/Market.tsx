import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApp } from "@/lib/app-state";
import { useState } from "react";

export default function Market() {
  const { user, yieldIndex, buyYield, sellYield } = useApp();
  const [buyAmount, setBuyAmount] = useState(10);
  const [sellUnits, setSellUnits] = useState(1);

  const onBuy = () => buyYield(buyAmount);
  const onSell = () => sellYield(sellUnits);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8 space-y-8">
        <h1 className="text-3xl font-bold">Consolidated Market (YIELD)</h1>

        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader><CardTitle>Market</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Price</span><span className="font-mono">${yieldIndex.price.toFixed(6)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Agg. Liquidity</span><span className="font-mono">${yieldIndex.aggregatedLiquidity.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Total Units</span><span className="font-mono">{yieldIndex.totalUnits.toFixed(6)}</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Buy YIELD</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">USD: ${user.usd.toFixed(2)}</div>
              <div>
                <label className="text-sm text-muted-foreground">Amount (USD)</label>
                <Input type="number" value={buyAmount} onChange={(e) => setBuyAmount(Number(e.target.value) || 0)} />
              </div>
              <Button onClick={onBuy} disabled={user.usd <= 0 || yieldIndex.price <= 0}>Buy</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Sell YIELD</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">YIELD: {user.yieldUnits.toFixed(6)}</div>
              <div>
                <label className="text-sm text-muted-foreground">Units</label>
                <Input type="number" value={sellUnits} onChange={(e) => setSellUnits(Number(e.target.value) || 0)} />
              </div>
              <Button onClick={onSell} disabled={user.yieldUnits <= 0 || yieldIndex.price <= 0}>Sell</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

