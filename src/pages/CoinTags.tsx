import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { useApp } from "@/lib/app-state";
import { formatCurrency } from "@/lib/utils";
import { useMemo, useState, type ChangeEventHandler } from "react";
import { applyCoinTagSales, initializeCycle, DEFAULT_SPLIT, type RevenueSplit } from "@/domain/tokenomics";
import { useNavigate } from "react-router-dom";

type BreakdownRow = {
  key: keyof RevenueSplit;
  label: string;
  amount: number;
  percent: number;
};

const splitLabels: Record<keyof RevenueSplit, string> = {
  creator: "Creator",
  reserveGrowth: "Reserve Growth",
  platform: "Platform",
  liquidityContribution: "Liquidity",
  holderRewards: "Holder Rewards",
};

const DEFAULT_IMAGE = "/placeholder.svg";

export default function CoinTags() {
  const navigate = useNavigate();
  const { params, launchAsset } = useApp();
  const baseSplit = params.split ?? DEFAULT_SPLIT;

  const [collectionName, setCollectionName] = useState("New LFT Drop");
  const [ticker, setTicker] = useState("NEWX");
  const [summary, setSummary] = useState(
    "Outline the story behind this artifact and why finders will want to activate your CoinTag campaign.",
  );
  const [initialReserve, setInitialReserve] = useState<number>(params.initialReserve);
  const [initialSupply, setInitialSupply] = useState<number>(100); // Fixed at 100 units
  const [pricePerTag, setPricePerTag] = useState<number>(50); // CoinTag price
  const [discoveryRate, setDiscoveryRate] = useState<number>(25);
  const [imageName, setImageName] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string>(DEFAULT_IMAGE);

  const preview = useMemo(() => {
    const safeReserve = Math.max(0, initialReserve);
    const safeSupply = 100; // Always 100 units
    const safePrice = Math.max(1, pricePerTag);
    const tags = 100; // Always 100 CoinTags
    const raise = tags * safePrice; // Calculate total raise from CoinTag price
    const effectiveDiscoveryRate = Math.min(Math.max(discoveryRate, 0), 100);

    const baseCycle = initializeCycle(
      {
        initialReserve: safeReserve,
        initialSupply: safeSupply,
        redemptionThreshold: params.redemptionThreshold,
        split: baseSplit,
      },
      1,
    );
    const postCycle = applyCoinTagSales(baseCycle, raise);

    const breakdown = (Object.keys(splitLabels) as Array<keyof RevenueSplit>).map<BreakdownRow>((key) => ({
      key,
      label: splitLabels[key],
      amount: raise * baseSplit[key],
      percent: baseSplit[key] * 100,
    }));

    const expectedFinds = Math.round(tags * (effectiveDiscoveryRate / 100));
    const expectedFinderValue = expectedFinds * postCycle.lpu;

    return {
      raise,
      tags,
      breakdown,
      baseLpu: baseCycle.lpu,
      postLpu: postCycle.lpu,
      lpuDelta: postCycle.lpu - baseCycle.lpu,
      postReserve: postCycle.reserve,
      liquidityAdded: postCycle.reserve - safeReserve,
      seedNext: postCycle.seedNext,
      expectedFinds,
      expectedFinderValue,
      discoveryRate: effectiveDiscoveryRate,
      coinTagPrice: safePrice,
    };
  }, [baseSplit, discoveryRate, initialReserve, pricePerTag, params.redemptionThreshold]);

  const hasArtwork = imagePreview !== DEFAULT_IMAGE;
  const canLaunch = preview.raise > 0 && preview.tags > 0;

  const handleImageUpload: ChangeEventHandler<HTMLInputElement> = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : DEFAULT_IMAGE;
      setImagePreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleLaunch = () => {
    if (preview.raise <= 0 || preview.tags <= 0) {
      toast({
        variant: "destructive",
        title: "Add a launch raise",
        description: "Set a positive raise target and price per tag before launching.",
      });
      return;
    }

    const nextId = launchAsset({
      name: collectionName,
      ticker,
      summary,
      image: imagePreview,
      params: {
        initialReserve: Math.max(0, initialReserve),
        initialSupply: 100, // Fixed at 100 units
        redemptionThreshold: params.redemptionThreshold,
        split: baseSplit,
      },
      raise: preview.raise,
    });

    toast({
      title: "🚀 LFT Launched Successfully!",
      description: `${collectionName} is now live with ${preview.tags.toLocaleString()} CoinTags at ${formatCurrency(pricePerTag)} each. Initial liquidity: ${formatCurrency(preview.postReserve)}`,
    });
    
    // Navigate to the newly created asset
    setTimeout(() => {
      navigate(`/assets/${nextId}`);
    }, 500);
  };

  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Launch Pad</h1>
          <p className="text-muted-foreground">
            Configure liquidity, supply, and revenue splits to launch a fresh LFT campaign for your community.
          </p>
        </div>

        <div className="grid xl:grid-cols-[2fr_1fr] gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Launch Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <section className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Project Basics</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="collectionName">Collection name</Label>
                    <Input
                      id="collectionName"
                      value={collectionName}
                      onChange={(event) => setCollectionName(event.target.value)}
                      placeholder="E.g. Atlas Forge"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ticker">Ticker</Label>
                    <Input
                      id="ticker"
                      value={ticker}
                      onChange={(event) => setTicker(event.target.value.toUpperCase())}
                      placeholder="E.g. ATLAS"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="summary">Launch narrative</Label>
                  <Textarea
                    id="summary"
                    value={summary}
                    onChange={(event) => setSummary(event.target.value)}
                    rows={4}
                    placeholder="Share the utility, unlockable art, and collector story behind this cycle."
                  />
                </div>
                <div className="grid md:grid-cols-[2fr_1fr] gap-4 items-start">
                  <div className="space-y-2">
                    <Label htmlFor="artifactImage">Artifact image</Label>
                    <Input
                      id="artifactImage"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                    <p className="text-xs text-muted-foreground">
                      Upload a square image (PNG, JPG, or GIF). This artwork will show in listings and detail pages.
                    </p>
                    {imageName && <p className="text-xs">Selected: {imageName}</p>}
                  </div>
                  <div className="rounded-2xl border border-border/40 bg-muted/10 p-3">
                    <img src={imagePreview} alt="Artifact preview" className="w-full aspect-square object-cover rounded-xl" />
                  </div>
                </div>
              </section>

              <Separator />

              <section className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Liquidity & Pricing</h3>
                  <p className="text-xs text-muted-foreground mt-1">Set initial liquidity and CoinTag price. Supply is fixed at 100 units.</p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="initialReserve">Initial Reserve (USD)</Label>
                    <Input
                      id="initialReserve"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      value={initialReserve}
                      onChange={(event) => setInitialReserve(Number(event.target.value) || 0)}
                    />
                    <p className="text-xs text-muted-foreground">Starting liquidity backing your LFTs</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pricePerTag">CoinTag Price (USD)</Label>
                    <Input
                      id="pricePerTag"
                      type="number"
                      inputMode="decimal"
                      min={1}
                      step={1}
                      value={pricePerTag}
                      onChange={(event) => setPricePerTag(Number(event.target.value) || 1)}
                    />
                    <p className="text-xs text-muted-foreground">Price per CoinTag (100 tags will be created)</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="initialSupply">LFT Supply</Label>
                    <Input
                      id="initialSupply"
                      type="number"
                      value={100}
                      disabled
                      className="bg-muted/50 cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground">Fixed at 100 units for all launches</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="totalRaise">Total Raise</Label>
                    <Input
                      id="totalRaise"
                      type="number"
                      value={preview.raise}
                      disabled
                      className="bg-muted/50 cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground">Calculated: {preview.tags} tags × ${pricePerTag}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discoveryRate">Expected Discovery Rate (%)</Label>
                    <Input
                      id="discoveryRate"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={100}
                      value={discoveryRate}
                      onChange={(event) => setDiscoveryRate(Number(event.target.value) || 0)}
                    />
                    <p className="text-xs text-muted-foreground">Estimated chance of finding LFTs per CoinTag</p>
                  </div>
                </div>
              </section>

              <Separator />

              <section className="space-y-3">
                <div>
                  <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Revenue Split</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Launches follow the protocol standard split. Adjustments require governance approval.
                </p>
                <ul className="grid md:grid-cols-3 gap-3 text-sm">
                  {(Object.keys(splitLabels) as Array<keyof RevenueSplit>).map((key) => (
                    <li key={key} className="rounded-xl border border-border/40 bg-muted/10 p-3 flex items-center justify-between">
                      <span>{splitLabels[key]}</span>
                      <span className="font-medium">{(baseSplit[key] * 100).toFixed(1)}%</span>
                    </li>
                  ))}
                </ul>
              </section>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Target raise</span>
                    <span className="font-medium">{formatCurrency(preview.raise)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">CoinTags to mint</span>
                    <span className="font-medium">{preview.tags.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Post-launch LPU</span>
                    <span className="font-medium">{formatCurrency(preview.postLpu, { decimals: 4 })}</span>
                  </div>
                </div>
                <Separator />
                <div className="space-y-1">
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Distribution</div>
                  <ul className="space-y-1.5">
                    {preview.breakdown.map((row) => (
                      <li key={row.key} className="flex items-center justify-between">
                        <span>{row.label}</span>
                        <span className="text-muted-foreground">
                          {formatCurrency(row.amount)} · {row.percent.toFixed(1)}%
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Launch Checklist</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <ul className="space-y-2">
                  <li className={preview.raise > 0 ? "flex items-center justify-between" : "flex items-center justify-between text-destructive"}>
                    <span>Raise goal configured</span>
                    <span>{preview.raise > 0 ? formatCurrency(preview.raise) : "Set a target"}</span>
                  </li>
                  <li className={preview.tags > 0 ? "flex items-center justify-between" : "flex items-center justify-between text-destructive"}>
                    <span>CoinTags supply</span>
                    <span>{preview.tags > 0 ? preview.tags.toLocaleString() : "Needs pricing"}</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Revenue split</span>
                    <span>Protocol standard</span>
                  </li>
                  <li className={hasArtwork ? "flex items-center justify-between" : "flex items-center justify-between text-destructive"}>
                    <span>Campaign artwork</span>
                    <span>{hasArtwork ? "Ready" : "Upload image"}</span>
                  </li>
                </ul>
                <Button className="w-full" size="lg" onClick={handleLaunch} disabled={!canLaunch}>
                  Launch LFT Campaign
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Liquidity Simulation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Starting reserve</span>
                <span className="font-medium">{formatCurrency(initialReserve)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Post-launch reserve</span>
                <span className="font-medium">{formatCurrency(preview.postReserve)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Liquidity added</span>
                <span className="font-medium">{formatCurrency(preview.liquidityAdded)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Seed next cycle</span>
                <span className="font-medium">{formatCurrency(preview.seedNext)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Finder Economics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Discovery rate</span>
                <span className="font-medium">{preview.discoveryRate.toFixed(0)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Expected finds</span>
                <span className="font-medium">{preview.expectedFinds.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Value to finders</span>
                <span className="font-medium">{formatCurrency(preview.expectedFinderValue)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>LFT Pricing Delta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Starting LPU</span>
                <span className="font-medium">{formatCurrency(preview.baseLpu, { decimals: 4 })}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Post-launch LPU</span>
                <span className="font-medium">{formatCurrency(preview.postLpu, { decimals: 4 })}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Change</span>
                <span className={`font-medium ${preview.lpuDelta >= 0 ? "text-emerald-400" : "text-destructive"}`}>
                  {preview.lpuDelta >= 0 ? "+" : ""}
                  {formatCurrency(preview.lpuDelta, { decimals: 4 })}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
