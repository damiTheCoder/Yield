import { useApp } from "@/lib/app-state";
import type { Asset } from "@/lib/app-state";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn, formatCurrency, formatCurrencyK } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { Input } from "@/components/ui/input";
import Web3News from "@/components/Web3News";

const MAX_TRENDING = 10;

type Network = "all" | "bitcoin" | "ethereum" | "solana" | "eos";

const NETWORKS = [
  { id: "all" as const, name: "All networks", icon: "⚡", image: "/22.png" },
  { id: "bitcoin" as const, name: "Bitcoin", icon: "₿", image: "/bitcoin.jpeg" },
  { id: "ethereum" as const, name: "Ethereum", icon: "Ξ", image: "/ethereum.jpeg" },
  { id: "solana" as const, name: "Solana", icon: "◎", image: "/solana.jpeg" },
  { id: "eos" as const, name: "EOS", icon: "E", image: "/eos.jpeg" },
];

type AssetsPageProps = {
  showTrending?: boolean;
  showViewAllButton?: boolean;
  listedLimit?: number;
  showSearchBar?: boolean;
};

type RGBColor = { r: number; g: number; b: number };

const imageColorCache = new Map<string, RGBColor>();

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function clampColor(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function adjustColor(color: RGBColor, amount: number): RGBColor {
  const target = amount < 0 ? 0 : 255;
  const factor = Math.abs(amount);
  return {
    r: clampColor((target - color.r) * factor + color.r),
    g: clampColor((target - color.g) * factor + color.g),
    b: clampColor((target - color.b) * factor + color.b),
  };
}

function toRgba({ r, g, b }: RGBColor, alpha: number) {
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function hslToRgb(h: number, s: number, l: number): RGBColor {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (hp >= 0 && hp < 1) {
    r1 = c;
    g1 = x;
  } else if (hp >= 1 && hp < 2) {
    r1 = x;
    g1 = c;
  } else if (hp >= 2 && hp < 3) {
    g1 = c;
    b1 = x;
  } else if (hp >= 3 && hp < 4) {
    g1 = x;
    b1 = c;
  } else if (hp >= 4 && hp < 5) {
    r1 = x;
    b1 = c;
  } else {
    r1 = c;
    b1 = x;
  }

  const m = l - c / 2;
  return {
    r: clampColor((r1 + m) * 255),
    g: clampColor((g1 + m) * 255),
    b: clampColor((b1 + m) * 255),
  };
}

function fallbackColor(id: string): RGBColor {
  const hue = hashString(id) % 360;
  return hslToRgb(hue, 0.58, 0.46);
}

function useAverageColor(src: string, id: string): RGBColor {
  const initial = useMemo(() => fallbackColor(id), [id]);
  const [color, setColor] = useState<RGBColor>(initial);

  useEffect(() => {
    setColor(initial);
  }, [initial]);

  useEffect(() => {
    if (!src) {
      setColor(initial);
      return;
    }
    if (imageColorCache.has(src)) {
      setColor(imageColorCache.get(src)!);
      return;
    }

    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      if (cancelled) return;
      try {
        const canvas = document.createElement("canvas");
        const size = 16;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("missing context");
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        let r = 0;
        let g = 0;
        let b = 0;
        let count = 0;
        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3] / 255;
          if (alpha === 0) continue;
          r += data[i] * alpha;
          g += data[i + 1] * alpha;
          b += data[i + 2] * alpha;
          count += alpha;
        }
        if (count === 0) throw new Error("transparent image");
        const averaged: RGBColor = {
          r: clampColor(r / count),
          g: clampColor(g / count),
          b: clampColor(b / count),
        };
        imageColorCache.set(src, averaged);
        if (!cancelled) setColor(averaged);
      } catch (error) {
        if (!cancelled) setColor(initial);
      }
    };

    img.onerror = () => {
      if (!cancelled) setColor(initial);
    };

    img.src = src;

    return () => {
      cancelled = true;
      img.onload = null;
      img.onerror = null;
    };
  }, [src, initial]);

  return color;
}

export function AssetsPage({ showTrending = true, showViewAllButton = true, listedLimit, showSearchBar = false }: AssetsPageProps) {
  const { assets } = useApp();
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";
  const navigate = useNavigate();
  const [selectedNetwork, setSelectedNetwork] = useState<Network>("all");
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [marketMode, setMarketMode] = useState<"listed" | "live">("listed");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleToggleMarket = (event: Event) => {
      const detail = (event as CustomEvent<"listed" | "live" | undefined>).detail;
      if (detail === "listed" || detail === "live") {
        setMarketMode(detail);
        return;
      }
      setMarketMode((prev) => (prev === "listed" ? "live" : "listed"));
    };

    window.addEventListener("trone-assets-toggle-market", handleToggleMarket as EventListener);
    return () => {
      window.removeEventListener("trone-assets-toggle-market", handleToggleMarket as EventListener);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent("trone-assets-market-mode", { detail: marketMode })
    );
  }, [marketMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<Network>).detail;
      if (!detail) return;
      setSelectedNetwork(detail);
      setShowNetworkDropdown(false);
    };
    window.addEventListener("trone-network-change", handler as EventListener);
    return () => window.removeEventListener("trone-network-change", handler as EventListener);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("trone-network-sync", { detail: selectedNetwork }));
  }, [selectedNetwork]);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredAssets = useMemo(() => {
    let filtered = assets;
    
    // Filter by network (assign chains based on asset ID hash for demo)
    if (selectedNetwork !== "all") {
      filtered = filtered.filter((asset) => {
        const hash = asset.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const networks: Network[] = ["bitcoin", "ethereum", "solana", "eos"];
        const assignedNetwork = networks[hash % networks.length];
        return assignedNetwork === selectedNetwork;
      });
    }
    
    // Filter by search term
    if (normalizedSearch) {
      filtered = filtered.filter((asset) => {
        const name = asset.name.toLowerCase();
        const ticker = asset.ticker?.toLowerCase() ?? "";
        const id = asset.id.toLowerCase();
        return name.includes(normalizedSearch) || ticker.includes(normalizedSearch) || id.includes(normalizedSearch);
      });
    }
    
    return filtered;
  }, [assets, normalizedSearch, selectedNetwork]);

  const listedAssets = filteredAssets;
  const displayListedAssets = listedLimit ? listedAssets.slice(0, listedLimit) : listedAssets;
  const totalVisibleAssets = listedAssets.length;
  const cardBorderClass = "";
  const cardMediaBorderClass = isDarkTheme ? "border-b-0" : "border-b border-slate-200/60";

  const selectedNetworkInfo = NETWORKS.find(n => n.id === selectedNetwork) || NETWORKS[0];

  const getAssetChange = (asset: Asset) => {
    const baseHash = hashString(`${asset.id}-${asset.name}`);
    const raw = ((baseHash % 140) - 60) / 10;
    return Number(raw.toFixed(1));
  };

  const formatChange = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;

  const changeColorClass = (value: number) => (value >= 0 ? "text-emerald-500" : "text-rose-500");

  const changeBadgeClass = (value: number) =>
    value >= 0
      ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-500"
      : "border-rose-500/50 bg-rose-500/15 text-rose-500";

  const renderGridCard = (
    asset: Asset,
    change: number,
    onNavigate: () => void,
    bottomContent?: React.ReactNode,
  ) => {
    const changeClass = changeColorClass(change);
    const coinTagPrice = Math.max(4.2, asset.cycle.lpu * 0.4);
    const stats = [
      { label: "Liquidity", value: formatCurrencyK(asset.cycle.reserve) },
      { label: "LPU", value: formatCurrency(asset.cycle.lpu) },
      { label: "CoinTag", value: formatCurrency(coinTagPrice) },
      { label: "Backing", value: formatCurrencyK(asset.params.initialReserve) },
    ];

    return (
      <div
        role="button"
        tabIndex={0}
        key={`grid-${asset.id}`}
        onClick={onNavigate}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onNavigate();
          }
        }}
        className={cn(
          "group flex w-full flex-col gap-3 border-b border-border/40 pb-5 text-left transition hover:-translate-y-0.5",
          "sm:rounded-3xl sm:border sm:border-border/60 sm:bg-surface/60 sm:px-5 sm:py-5 sm:shadow-sm sm:border-b-0 sm:hover:-translate-y-1",
        )}
      >
        <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 overflow-hidden rounded-full sm:h-12 sm:w-12">
                <img src={asset.image} alt={asset.name} className="h-full w-full object-cover" />
              </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-foreground sm:text-base">{asset.name}</span>
                <img src="/checklist.png" alt="verified" className="h-3 w-3 opacity-80 sm:h-4 sm:w-4" />
              </div>
              <span className="text-[11px] text-muted-foreground sm:text-xs">Cycle {asset.cycle.cycle}</span>
            </div>
          </div>
          <span className={cn("text-sm font-semibold", changeClass)}>{formatChange(change)}</span>
        </div>

        <div className="flex w-full flex-nowrap items-start justify-between gap-4 overflow-x-auto text-[11px] uppercase tracking-wide text-muted-foreground sm:grid sm:flex-none sm:grid-cols-4 sm:gap-5 sm:overflow-visible">
          {stats.map((stat) => (
            <div key={`${asset.id}-${stat.label}`} className="flex min-w-[4.75rem] flex-col gap-0.5 sm:min-w-0">
              <span className="text-[10px]">{stat.label}</span>
              <span className="font-mono text-sm text-foreground">{stat.value}</span>
            </div>
          ))}
        </div>
        {bottomContent}
      </div>
    );
  };

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border/40 bg-surface/60 px-6 py-12 text-center shadow-inner">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">No listed assets yet</h2>
        <p className="text-sm text-muted-foreground">
          Launch a new collection or import assets to start tracking them.
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={() => navigate("/coin-tags")}>
        Launch an LFT
      </Button>
    </div>
  );

  const renderListedList = (items: Asset[]) => (
    <div className="overflow-x-auto no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      <Table className="min-w-[720px] text-sm">
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 z-20 min-w-[200px] bg-background text-left pl-2">Collection</TableHead>
            <TableHead className="min-w-[140px] text-right">Liquidity</TableHead>
            <TableHead className="min-w-[140px] text-right">LPU</TableHead>
            <TableHead className="min-w-[140px] text-right">CoinTag</TableHead>
            <TableHead className="min-w-[160px] text-right">Backing Reserve</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((asset) => {
            const coinTagPrice = Math.max(4.2, asset.cycle.lpu * 0.4);
            const change = getAssetChange(asset);
            const changeText = formatChange(change);
            const changeClass = changeColorClass(change);
            return (
              <TableRow
                key={asset.id}
                className="cursor-pointer text-sm transition-colors hover:bg-surface/30"
                onClick={() => navigate(`/assets/${asset.id}`)}
              >
                <TableCell className="sticky left-0 z-10 min-w-[200px] bg-background px-2">
                  <div className="flex items-center gap-3 text-sm">
                    <img src={asset.image} alt={asset.name} className="h-9 w-9 rounded-xl object-cover" />
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-foreground truncate">{asset.name}</span>
                        <img src="/checklist.png" alt="verified" className="h-4 w-4 opacity-80 flex-shrink-0" />
                      </div>
                      <span className={`text-xs font-semibold ${changeClass}`}>{changeText}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="min-w-[140px] text-right font-mono text-sm px-2">{formatCurrencyK(asset.cycle.reserve)}</TableCell>
                <TableCell className="min-w-[140px] text-right font-mono text-sm px-2">{formatCurrency(asset.cycle.lpu)}</TableCell>
                <TableCell className="min-w-[140px] text-right font-mono text-sm px-2">{formatCurrency(coinTagPrice)}</TableCell>
                <TableCell className="min-w-[160px] text-right font-mono text-sm px-2">
                  {formatCurrencyK(asset.params.initialReserve)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

  const renderListedGrid = (items: Asset[]) => (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-6">
      <div className="-mt-2 h-px w-full bg-border/60 sm:hidden" />
      {items.map((asset) => {
        const change = getAssetChange(asset);
        return renderGridCard(asset, change, () => navigate(`/assets/${asset.id}`));
      })}
    </div>
  );

  const renderLiveList = (items: Asset[]) => (
    <div className="overflow-x-auto no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      <Table className="min-w-[720px] text-sm">
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 z-20 min-w-[200px] bg-background text-left pl-2">Collection</TableHead>
            <TableHead className="min-w-[140px] text-right">Liquidity</TableHead>
            <TableHead className="min-w-[140px] text-right">LPU</TableHead>
            <TableHead className="min-w-[140px] text-right">CoinTag</TableHead>
            <TableHead className="min-w-[160px] text-right">Backing Reserve</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((asset) => {
            const coinTagPrice = Math.max(4.2, asset.cycle.lpu * 0.4);
            const change = getAssetChange(asset);
            const changeText = formatChange(change);
            const changeClass = changeColorClass(change);
            return (
              <TableRow
                key={asset.id}
                className="cursor-pointer text-sm transition-colors hover:bg-surface/30"
                onClick={() => navigate(`/assets/${asset.id}/token`)}
              >
                <TableCell className="sticky left-0 z-10 min-w-[200px] bg-background px-2">
                  <div className="flex items-center gap-3 text-sm">
                    <img src={asset.image} alt={asset.name} className="h-9 w-9 rounded-xl object-cover" />
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-foreground truncate">{asset.name}</span>
                        <img src="/checklist.png" alt="verified" className="h-4 w-4 opacity-80 flex-shrink-0" />
                      </div>
                      <span className={`text-xs font-semibold ${changeClass}`}>{changeText}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="min-w-[140px] text-right font-mono text-sm px-2">{formatCurrencyK(asset.cycle.reserve)}</TableCell>
                <TableCell className="min-w-[140px] text-right font-mono text-sm px-2">{formatCurrency(asset.cycle.lpu)}</TableCell>
                <TableCell className="min-w-[140px] text-right font-mono text-sm px-2">{formatCurrency(coinTagPrice)}</TableCell>
                <TableCell className="min-w-[160px] text-right font-mono text-sm px-2">
                  {formatCurrencyK(asset.params.initialReserve)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

  const renderLiveGrid = (items: Asset[]) => (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-6">
      {items.map((asset) => {
        const change = getAssetChange(asset);
        return renderGridCard(asset, change, () => navigate(`/assets/${asset.id}`));
      })}
    </section>
  );

  const trendingTokens = useMemo(() => {
    if (!showTrending) return [];
    return [...listedAssets]
      .map((asset) => ({ asset, change: getAssetChange(asset) }))
      .sort((a, b) => b.change - a.change)
      .slice(0, MAX_TRENDING);
  }, [listedAssets, showTrending]);

  const TrendingTokenCard = ({ asset, change }: { asset: Asset; change: number }) => {
    const baseColor = useAverageColor(asset.image, asset.id);
    const startColor = adjustColor(baseColor, isDarkTheme ? 0.15 : 0.35);
    const endColor = adjustColor(baseColor, isDarkTheme ? -0.25 : -0.05);
    const background = `linear-gradient(135deg, ${toRgba(startColor, 0.75)}, ${toRgba(endColor, 0.9)})`;
    const isPositive = change >= 0;
    return (
      <button
        type="button"
        onClick={() => navigate(`/assets/${asset.id}`)}
        className="group flex min-w-[240px] items-center justify-between gap-4 rounded-2xl border-0 px-4 py-3 text-left transition hover:-translate-y-0.5 hover:shadow-lg"
        style={{ backgroundImage: background }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <img src={asset.image} alt={asset.name} className="h-12 w-12 rounded-xl border border-border/40 object-cover shadow-sm" />
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="max-w-[12ch] truncate sm:max-w-[14ch]">{asset.name}</span>
              {asset.ticker && <span className="max-w-[6ch] truncate text-xs font-medium text-muted-foreground">{asset.ticker}</span>}
            </div>
            <div className="flex items-center gap-2 text-xs text-foreground">
              <span className="text-foreground">{formatCurrencyK(asset.cycle.reserve)}</span>
              <span className={`font-semibold ${isPositive ? "text-emerald-300" : "text-rose-300"}`}>{formatChange(change)}</span>
            </div>
          </div>
        </div>
        <div className="hidden h-10 w-16 items-center justify-center text-emerald-200 group-hover:text-emerald-100 sm:flex">
          <span className="text-sm font-semibold">↗</span>
        </div>
      </button>
    );
  };

  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 pt-4 pb-6">
        <div className="flex flex-col gap-3">
          <div className="space-y-3">
            <div className="space-y-3 px-0">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h1 className="text-2xl sm:text-3xl font-bold">
                      {marketMode === "live" ? (
                        <>
                          Live{" "}
                          <span className="bg-gradient-to-r from-green-400 via-emerald-500 to-teal-600 bg-clip-text text-transparent">
                            Market
                          </span>
                        </>
                      ) : (
                        <>
                          Listed{" "}
                          <span className="bg-gradient-to-r from-green-400 via-emerald-500 to-teal-600 bg-clip-text text-transparent">
                            Assets
                          </span>
                        </>
                      )}
                    </h1>
                    {/* Mobile: Show view all button adjacent to title */}
                    {showViewAllButton && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate("/assets/all")}
                        className="sm:hidden text-xs font-semibold text-primary hover:text-primary hover:bg-transparent px-2"
                      >
                        View all tokens
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {marketMode === "live"
                      ? "Monitor market performance, liquidity flows, and pricing in real time."
                      : "Browse listed LFT assets, analyze their performance, and discover investment opportunities."}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-2 text-xs sm:hidden">
                    <span className="text-muted-foreground">
                      {marketMode === "live" ? "Viewing live market data" : "Viewing listed marketplace"}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-foreground"
                      onClick={() => setMarketMode((prev) => (prev === "live" ? "listed" : "live"))}
                    >
                      {marketMode === "live" ? "Switch to Listed" : "Switch to Live"}
                    </Button>
                  </div>
                </div>
                <div className="flex w-full items-center gap-3 text-xs text-muted-foreground sm:w-auto sm:justify-end">
                  <div className="hidden items-center gap-2 sm:flex">
                    <Button
                      type="button"
                      size="sm"
                      variant={marketMode === "listed" ? "default" : "ghost"}
                      onClick={() => setMarketMode("listed")}
                    >
                      Listed
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={marketMode === "live" ? "default" : "ghost"}
                      onClick={() => setMarketMode("live")}
                    >
                      Live
                    </Button>
                  </div>
                </div>
              </div>

              {/* Mobile search removed per updated layout */}

              {/* Desktop controls and network selector */}
              <div className="hidden sm:flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex w-full items-center gap-3 sm:w-auto" />
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowNetworkDropdown(!showNetworkDropdown)}
                      className="inline-flex items-center gap-2 rounded-full border border-border/60 px-4 py-2 text-sm font-semibold bg-muted/70 text-foreground transition-colors hover:bg-muted dark:border-transparent dark:bg-neutral-950/80 dark:hover:bg-neutral-900"
                    >
                      {selectedNetworkInfo.image ? (
                        <img src={selectedNetworkInfo.image} alt={selectedNetworkInfo.name} className="h-5 w-5 rounded-full object-cover" />
                      ) : (
                        <span>{selectedNetworkInfo.icon}</span>
                      )}
                      <span>
                        {selectedNetwork === "all"
                          ? selectedNetworkInfo.name.toUpperCase()
                          : selectedNetworkInfo.name}
                      </span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    
                    {showNetworkDropdown && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setShowNetworkDropdown(false)}
                        />
                        <div className="absolute top-full right-0 mt-2 w-56 rounded-2xl bg-card shadow-xl z-50 overflow-hidden dark:bg-neutral-950/95">
                          {NETWORKS.map((network) => (
                            <button
                              key={network.id}
                              type="button"
                              onClick={() => {
                                setSelectedNetwork(network.id);
                                setShowNetworkDropdown(false);
                              }}
                              className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                                selectedNetwork === network.id
                                  ? "bg-muted/70 text-foreground font-semibold dark:bg-neutral-900"
                                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground dark:hover:bg-neutral-900/80",
                              )}
                            >
                              {network.image ? (
                                <img src={network.image} alt={network.name} className="h-6 w-6 rounded-full object-cover" />
                              ) : (
                                <span className="text-xl">{network.icon}</span>
                              )}
                              <span>{network.name}</span>
                              {selectedNetwork === network.id && (
                                <span className="ml-auto text-primary">✓</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {marketMode === "listed" && showTrending && trendingTokens.length > 0 && (
                <section className="space-y-2 -mb-3 hidden md:block">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold text-foreground">Trending Tokens</h2>
                    <Button
                      variant="link"
                      className="h-auto px-0 text-sm font-semibold text-primary"
                      onClick={() => navigate("/assets/all")}
                    >
                      View all
                    </Button>
                  </div>
                  <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 no-scrollbar">
                    {trendingTokens.map(({ asset, change }) => (
                      <TrendingTokenCard key={`trending-${asset.id}`} asset={asset} change={change} />
                    ))}
                  </div>
                </section>
              )}

              {showSearchBar && (
                <div className="px-0">
                  <Input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search tokens, tickers, or IDs"
                    className="hidden sm:block h-11 w-full rounded-2xl border border-border/40 bg-background/80 px-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-0"
                  />
                </div>
              )}

              {showSearchBar && (
                <div className="sm:hidden">
                  <Input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search tokens, tickers, or IDs"
                    className="mt-3 h-11 w-full rounded-3xl border border-border/40 bg-muted/40 px-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-0"
                  />
                </div>
              )}

              {/* Always render list view */}
              {displayListedAssets.length > 0
                ? marketMode === "live"
                  ? renderLiveList(displayListedAssets)
                  : renderListedList(displayListedAssets)
                : renderEmptyState()}

              <div className="block h-px w-full bg-border/60 sm:hidden" />

              {/* Mobile Trending Section - Below Listed Assets */}
              {marketMode === "listed" && showTrending && trendingTokens.length > 0 && (
                <section className="space-y-3 mt-6 md:hidden">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold text-foreground">Trending Tokens</h2>
                  </div>
                  <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 no-scrollbar">
                    {trendingTokens.map(({ asset, change }) => (
                      <TrendingTokenCard key={`mobile-trending-${asset.id}`} asset={asset} change={change} />
                    ))}
                  </div>
                </section>
              )}

              {showTrending && <Web3News variant="mobile" className="mt-6 sm:hidden" />}
              
              {/* Spacer for mobile fixed bottom controls */}
              <div className="h-20 sm:hidden" />
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

export default function Assets() {
  return <AssetsPage showTrending showViewAllButton listedLimit={12} />;
}
