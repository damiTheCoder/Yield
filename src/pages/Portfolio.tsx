import React, { useMemo, useState } from "react";
import { useApp } from "@/lib/app-state";
import { cn, formatCurrency, formatUnitCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Layers, Minus, Plus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import CoinTagWalletSection from "@/components/CoinTagWalletSection";

const PORTFOLIO_HEADER_ICONS = ["/z1.png", "/z2.png", "/z3.png", "/r1.jpeg"];
const ICON_STACK_MESSAGE = "we just felt this will make the UX design look good 😂";

const toNumeric = (value: unknown) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getAssetUnitPrice = (asset: {
  cycle: { reserve: number; supply: number; lpu: number };
  secondaryMarket?: { active: boolean; walv: number; liquidityPool?: number; supplyPool?: number };
}) => {
  if (asset.secondaryMarket?.active) {
    const supply = Math.max(0, asset.secondaryMarket.supplyPool ?? 0);
    const liquidity = Math.max(0, asset.secondaryMarket.liquidityPool ?? 0);
    return asset.secondaryMarket.walv || (supply > 0 ? liquidity / supply : 0);
  }

  const reserve = Math.max(0, asset.cycle.reserve);
  const supply = Math.max(0, asset.cycle.supply);
  return supply > 0 ? reserve / supply : asset.cycle.lpu;
};

const formatCompactHoldings = (value: number) => {
  if (!Number.isFinite(value)) return "$0.00";

  const abs = Math.abs(value);
  const units = [
    { value: 1_000_000_000_000, suffix: "t" },
    { value: 1_000_000_000, suffix: "b" },
    { value: 1_000_000, suffix: "m" },
    { value: 1_000, suffix: "k" },
  ];
  const unit = units.find((entry) => abs >= entry.value);

  if (!unit) {
    return formatCurrency(value);
  }

  const scaled = value / unit.value;
  const formatted = scaled >= 100 ? scaled.toFixed(0) : scaled >= 10 ? scaled.toFixed(1) : scaled.toFixed(2);
  return `${formatted.replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1")}${unit.suffix}`;
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

  const [assetRedeemCounts, setAssetRedeemCounts] = useState<Record<string, number>>({});
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [holdingsDialogOpen, setHoldingsDialogOpen] = useState(false);
  const [ownedView, setOwnedView] = useState<"lft" | "cointag">("lft");


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
        : "rounded-3xl bg-[#F3F4F6] m-8 p-4 space-y-5 text-xs shadow-none dark:bg-[#1A1A1A]";
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
            <span className="font-mono text-xs text-foreground">{formatUnitCurrency(unitPrice)}</span>
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
              <span className="text-xs font-semibold">{formatUnitCurrency(unitPrice)}</span>
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
      <main className="mx-auto w-full max-w-6xl px-4 pb-12 pt-4 sm:px-6 lg:px-8">
        <div className="space-y-6 text-sm [&_svg]:h-3.5 [&_svg]:w-3.5">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,0.7fr)] lg:items-start">
            <Card className="rounded-3xl border-none bg-transparent p-0 text-white shadow-none">
              <CardContent className="p-0">
                <div className="flex flex-col items-start gap-2 text-left text-foreground">
                  <div className="flex flex-col items-start gap-1">
                    <button
                      type="button"
                      onClick={() => setHoldingsDialogOpen(true)}
                      className="inline-flex items-center gap-2 rounded-lg px-1 py-1 text-[2.4rem] font-semibold leading-none text-foreground transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F66F6] sm:text-[4rem]"
                      aria-label="Show exact total LFT holdings"
                    >
                      <img src="/usdc.png" alt="USDC" className="h-10 w-10 rounded-full object-cover sm:h-12 sm:w-12" />
                      {formatCompactHoldings(totalLftValue)}
                    </button>
                    <p className="text-[10px] uppercase text-muted-foreground">Total LFT Holdings</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Dialog open={holdingsDialogOpen} onOpenChange={setHoldingsDialogOpen}>
              <DialogContent className="mx-auto w-[calc(100%-2rem)] max-w-xs rounded-2xl border border-border/60 bg-white p-5 text-center shadow-xl">
                <DialogHeader>
                  <DialogTitle className="text-base font-semibold text-foreground">Total LFT Holdings</DialogTitle>
                </DialogHeader>
                <p className="font-mono text-2xl font-semibold text-foreground">{formatCurrency(totalLftValue)}</p>
                <p className="text-xs text-muted-foreground">Exact current value</p>
              </DialogContent>
            </Dialog>
            <Card className="rounded-3xl border-0 bg-transparent p-0 backdrop-blur text-foreground sm:px-6 sm:py-6">
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
                  className="h-9 w-auto self-start border-0 bg-[#2F66F6] px-5 text-xs font-semibold text-white shadow-none hover:bg-[#2558DE]"
                  onClick={() => claimRewards()}
                  disabled={accruedRewards <= 0}
                >
                  Claim Rewards
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {ownedView === "lft" ? (
              <Card className="rounded-3xl border-0 bg-transparent p-0 backdrop-blur text-foreground shadow-none sm:px-6 sm:py-6">
                <CardHeader className="px-0 pt-0 sm:px-0 sm:pt-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-[28px] font-black leading-tight tracking-[-0.06em] sm:text-3xl">Owned LFT Collections</CardTitle>
                      <p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-muted-foreground sm:text-base">
                        Redeem LFTs for their reserve value and access the ecosystem token once discovery completes.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOwnedView("cointag")}
                      className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background/60 text-foreground shadow-sm transition hover:border-ring hover:bg-muted/50"
                      aria-label="Switch to owned CoinTags"
                      title="Switch to owned CoinTags"
                    >
                      <Wallet className="h-5 w-5 transition-transform group-hover:scale-105" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 px-0 pb-0 sm:px-0 sm:pb-0">
                  {ownedAssetLfts.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No asset-specific LFTs yet. Hunt CoinTags to populate this section.
                    </p>
                  ) : (
                    <div className="overflow-hidden rounded-2xl bg-transparent">
                      <div>
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
                              className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition sm:px-4"
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
            ) : (
              <CoinTagWalletSection onSwitchToLfts={() => setOwnedView("lft")} />
            )}
            <Dialog open={Boolean(selectedAsset)} onOpenChange={(open) => !open && setSelectedAssetId(null)}>
              {selectedAsset && (
                <DialogContent
                  overlayClassName="bg-white/35 backdrop-blur-xl dark:bg-black/35"
                  className="mx-auto max-w-2xl rounded-[32px] border-0 bg-transparent p-4 shadow-none backdrop-blur-none sm:p-5"
                >
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
