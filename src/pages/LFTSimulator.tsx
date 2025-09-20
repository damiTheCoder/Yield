import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/Header";
import {
  CycleParams,
  CycleState,
  YieldIndex,
  applyCoinTagSales,
  convertLFTtoYield,
  endCycleAndSeedNext,
  initializeCycle,
  redeemFinders,
} from "@/domain/tokenomics";

const number = (v: string) => (v === "" ? 0 : Number(v));

export default function LFTSimulator() {
  const [params, setParams] = useState<CycleParams>({
    initialReserve: 1000,
    initialSupply: 100,
    redemptionThreshold: 200,
  });

  const [state, setState] = useState<CycleState>(() => initializeCycle(params, 1));
  const [index, setIndex] = useState<YieldIndex>({ aggregatedLiquidity: 0, totalUnits: 0, price: 0 });

  const [sales, setSales] = useState(0);
  const [redeems, setRedeems] = useState(0);
  const [convertUnits, setConvertUnits] = useState(0);

  const kpis = useMemo(
    () => [
      { label: "Cycle", value: state.cycle },
      { label: "Reserve (R)", value: state.reserve.toFixed(2) },
      { label: "Supply (Q)", value: state.supply },
      { label: "LPU (R/Q)", value: state.lpu.toFixed(4) },
      { label: "Seed Next (20% S)", value: state.seedNext.toFixed(2) },
      { label: "Total Sales (S)", value: state.totalSales.toFixed(2) },
      { label: "Ended", value: state.ended ? "Yes" : "No" },
    ],
    [state]
  );

  const revenue = useMemo(
    () => [
      { label: "Creator 50%", value: state.accrued.creator.toFixed(2) },
      { label: "Reserve Growth 20%", value: state.accrued.reserveGrowth.toFixed(2) },
      { label: "Platform 15%", value: state.accrued.platform.toFixed(2) },
      { label: "Liquidity 10%", value: state.accrued.liquidityContribution.toFixed(2) },
      { label: "Holder Rewards 5%", value: state.accrued.holderRewards.toFixed(2) },
    ],
    [state]
  );

  const yieldStats = useMemo(
    () => [
      { label: "Aggregated Liquidity", value: index.aggregatedLiquidity.toFixed(2) },
      { label: "YIELD Units", value: index.totalUnits },
      { label: "YIELD Price", value: index.price.toFixed(6) },
    ],
    [index]
  );

  const onReset = () => {
    setState(initializeCycle(params, 1));
    setIndex({ aggregatedLiquidity: 0, totalUnits: 0, price: 0 });
  };

  const onApplySales = () => setState((s) => applyCoinTagSales(s, sales));

  const onRedeem = () => setState((s) => redeemFinders(s, redeems, params.redemptionThreshold));

  const onConvert = () => {
    const { state: s2, index: i2 } = convertLFTtoYield(state, convertUnits, index);
    setState(s2);
    setIndex(i2);
  };

  const onEndCycle = () => setState((s) => endCycleAndSeedNext(s, params));

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8 space-y-8">
        <h1 className="text-3xl font-bold">LFT Tokenomics Simulator</h1>

        <Card>
          <CardHeader>
            <CardTitle>Parameters</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Initial Reserve</label>
              <Input
                type="number"
                value={params.initialReserve}
                onChange={(e) => setParams((p) => ({ ...p, initialReserve: number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Initial Supply</label>
              <Input
                type="number"
                value={params.initialSupply}
                onChange={(e) => setParams((p) => ({ ...p, initialSupply: number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Redemption Threshold</label>
              <Input
                type="number"
                value={params.redemptionThreshold}
                onChange={(e) => setParams((p) => ({ ...p, redemptionThreshold: number(e.target.value) }))}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button variant="default" className="w-full" onClick={onReset}>
                Reset Simulator
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Cycle KPIs</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {kpis.map((k) => (
                  <li key={k.label} className="flex justify-between">
                    <span className="text-muted-foreground">{k.label}</span>
                    <span className="font-mono">{k.value}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {revenue.map((r) => (
                  <li key={r.label} className="flex justify-between">
                    <span className="text-muted-foreground">{r.label}</span>
                    <span className="font-mono">{r.value}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>YIELD Index (Consolidated)</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {yieldStats.map((r) => (
                  <li key={r.label} className="flex justify-between">
                    <span className="text-muted-foreground">{r.label}</span>
                    <span className="font-mono">{r.value}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="text-sm text-muted-foreground">Apply CoinTag Sales ($)</label>
                  <Input type="number" value={sales} onChange={(e) => setSales(number(e.target.value))} />
                </div>
                <Button onClick={onApplySales}>Apply</Button>
              </div>
              <p className="text-xs text-muted-foreground">
                10% of sales reinforces current reserve (raises LPU). 20% seeds next cycle.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="text-sm text-muted-foreground">Redeem Finders (units)</label>
                  <Input type="number" value={redeems} onChange={(e) => setRedeems(number(e.target.value))} />
                </div>
                <Button onClick={onRedeem} disabled={state.ended}>Redeem</Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Each redemption removes 1 unit and pays current LPU from reserve.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="text-sm text-muted-foreground">Convert to YIELD (units)</label>
                  <Input type="number" value={convertUnits} onChange={(e) => setConvertUnits(number(e.target.value))} />
                </div>
                <Button onClick={onConvert}>Convert</Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Converted units join the consolidated market; redemption right resets.
              </p>
            </div>
          </CardContent>
        </Card>

        <Separator />

        <div className="flex gap-3">
          <Button variant="secondary" onClick={onEndCycle}>End Cycle & Seed Next</Button>
        </div>
      </main>
    </div>
  );
}

