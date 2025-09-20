import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/app-state";
import { useState } from "react";

export default function Discover() {
  const { user, availableToFind, cycle, openCoinTags } = useApp();
  const [lastResult, setLastResult] = useState<{ opened: number; found: number } | null>(null);

  const open = (count: number) => {
    const res = openCoinTags(count);
    setLastResult(res);
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8 space-y-8">
        <h1 className="text-3xl font-bold">Discover LFTs</h1>

        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Inventory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">CoinTags</span><span className="font-mono">{user.coinTags}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Your LFTs</span><span className="font-mono">{user.lfts}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Findable LFTs</span><span className="font-mono">{availableToFind}</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Open CoinTags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Button onClick={() => open(1)} disabled={user.coinTags <= 0}>Open 1</Button>
                <Button onClick={() => open(5)} disabled={user.coinTags <= 0}>Open 5</Button>
                <Button onClick={() => open(10)} disabled={user.coinTags <= 0}>Open 10</Button>
              </div>
              {lastResult && (
                <div className="text-sm">
                  Opened {lastResult.opened}, found {lastResult.found} LFT{lastResult.found === 1 ? "" : "s"}.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cycle Info</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2 text-sm">
              <div><div className="text-muted-foreground">Cycle</div><div className="font-mono">{cycle.cycle}</div></div>
              <div><div className="text-muted-foreground">LPU</div><div className="font-mono">${cycle.lpu.toFixed(4)}</div></div>
              <div><div className="text-muted-foreground">Reserve</div><div className="font-mono">${cycle.reserve.toFixed(2)}</div></div>
              <div><div className="text-muted-foreground">Supply</div><div className="font-mono">{cycle.supply}</div></div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

