import { useApp } from "@/lib/app-state";
import type { Asset } from "@/lib/app-state";
import { useNavigate, useLocation } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn, formatCurrency, formatCurrencyK } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, ChevronDown } from "lucide-react";
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
  const location = useLocation();
  const [marketMode, setMarketMode] = useState<"listed" | "live">("listed");
  const [selectedNetwork, setSelectedNetwork] = useState<Network>("all");
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [gridView, setGridView] = useState(false);

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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const marketParam = params.get("market");
    if (marketParam === "live" || marketParam === "listed") {
      setMarketMode(marketParam);
    }
  }, [location.search]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleToggle = () => {
      setMarketMode((prev) => (prev === "listed" ? "live" : "listed"));
    };
    const handleSet = (event: Event) => {
      const detail = (event as CustomEvent<"listed" | "live">).detail;
      if (detail === "live" || detail === "listed") {
        setMarketMode(detail);
      }
    };
    window.addEventListener("trone-market-toggle", handleToggle);
    window.addEventListener("trone-market-set", handleSet as EventListener);
    return () => {
      window.removeEventListener("trone-market-toggle", handleToggle);
      window.removeEventListener("trone-market-set", handleSet as EventListener);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("trone-market-mode", { detail: marketMode }));
  }, [marketMode]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const current = params.get("market");
    if (marketMode === "listed" && current) {
      params.delete("market");
      const search = params.toString();
      navigate(
        { pathname: location.pathname, search: search ? `?${search}` : "" },
        { replace: true },
      );
    } else if (marketMode === "live" && current !== "live") {
      params.set("market", "live");
      const search = params.toString();
      navigate(
        { pathname: location.pathname, search: search ? `?${search}` : "" },
        { replace: true },
      );
    }
  }, [marketMode, location.pathname, location.search, navigate]);

  const isLiveMarket = marketMode === "live";
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

  const liveAssets = useMemo(
    () => [...filteredAssets].sort((a, b) => b.cycle.totalSales - a.cycle.totalSales),
    [filteredAssets]
  );

  const listedAssets = filteredAssets;
  const currentAssets = isLiveMarket ? liveAssets : listedAssets;
  const displayListedAssets = listedLimit ? currentAssets.slice(0, listedLimit) : currentAssets;
  const totalVisibleAssets = currentAssets.length;

  const cardBorderClass = "";
  const cardMediaBorderClass = "";
  const liveCardBorderClass = "";
  const liveCardMediaBorderClass = "";

  const selectedNetworkInfo = NETWORKS.find(n => n.id === selectedNetwork) || NETWORKS[0];

  const handleToggleMarket = () => {
    setMarketMode((prev) => (prev === "listed" ? "live" : "listed"));
  };

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

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border/40 bg-surface/60 px-6 py-12 text-center shadow-inner">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">
          {isLiveMarket ? "No live collections yet" : "No listed assets yet"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isLiveMarket
            ? "When a collection enters an active hunt, it shows up here in real time."
            : "Launch a new collection or import assets to start tracking them."}
        </p>
      </div>
      {isLiveMarket ? (
        <Button variant="outline" size="sm" onClick={() => setMarketMode("listed")}>
          View listed collections
        </Button>
      ) : (
        <Button variant="outline" size="sm" onClick={() => navigate("/market")}>
          Explore live market
        </Button>
      )}
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
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6">
      {items.map((a) => {
        const change = getAssetChange(a);
        const changeText = formatChange(change);
        const changeClass = changeColorClass(change);
        const badgeClass = changeBadgeClass(change);
        return (
          <button
            type="button"
            key={a.id}
            onClick={() => navigate(`/assets/${a.id}`)}
            className={`group relative flex h-full flex-col overflow-hidden rounded-3xl bg-surface/60 text-left transition-all hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:ring-foreground/50 ${cardBorderClass}`}
          >
            <div className={`relative h-32 w-full overflow-hidden sm:h-40 lg:h-48 ${cardMediaBorderClass}`}>
              <img
                src={a.image}
                alt={a.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 via-black/10 to-transparent px-3 py-2 text-[11px] text-white sm:px-5 sm:py-3">
                <span className="font-medium uppercase tracking-wide">Cycle {a.cycle.cycle}</span>
                <span className="rounded-full bg-white/15 px-2 py-0.5 font-mono text-[10px] sm:text-[11px]">
                  {formatCurrencyK(a.cycle.reserve)}
                </span>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-3 px-3 py-3 sm:px-5 sm:py-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 flex-col">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-foreground/90 sm:text-base">
                      {a.name}
                    </h2>
                    <img src="/checklist.png" className="h-3.5 w-3.5 opacity-80 sm:h-4 sm:w-4" alt="verified" />
                  </div>
                  <span className={`text-xs font-semibold ${changeClass}`}>{changeText}</span>
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${badgeClass}`}>
                  {formatChange(change)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] sm:grid-cols-4 sm:gap-3 sm:text-xs">
                <div className="rounded-xl border border-border/25 bg-surface/45 p-2">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Liquidity</div>
                  <div className="font-mono text-xs text-foreground">{formatCurrencyK(a.cycle.reserve)}</div>
                </div>
                <div className="rounded-xl border border-border/25 bg-surface/45 p-2">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">LPU</div>
                  <div className="font-mono text-xs text-foreground">{formatCurrency(a.cycle.lpu)}</div>
                </div>
                <div className="rounded-xl border border-border/25 bg-surface/45 p-2">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">CoinTag</div>
                  <div className="font-mono text-xs text-foreground">{formatCurrency(Math.max(4.2, a.cycle.lpu * 0.4))}</div>
                </div>
                <div className="rounded-xl border border-border/25 bg-surface/45 p-2">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Backing</div>
                  <div className="font-mono text-xs text-foreground">{formatCurrencyK(a.params.initialReserve)}</div>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-muted-foreground sm:text-[11px]">
                <span>{formatCurrency(a.cycle.totalSales)} gross</span>
                <span className="font-medium text-foreground/80">Explore →</span>
              </div>
            </div>
          </button>
        );
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
                onClick={() => navigate(`/market/${asset.id}/hunt`)}
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

  const LiveMarketStat = ({ label, value }: { label: string; value: string }) => (
    <div className="rounded-xl border border-border/25 bg-surface/45 p-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-mono text-xs text-foreground">{value}</div>
    </div>
  );

  const renderLiveGrid = (items: Asset[]) => (
    <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6">
      {items.map((asset) => {
        const coinTagPrice = Math.max(4.2, asset.cycle.lpu * 0.4);
        const change = getAssetChange(asset);
        const changeText = formatChange(change);
        const changeClass = changeColorClass(change);
        const badgeClass = changeBadgeClass(change);
        return (
          <button
            type="button"
            key={asset.id}
            onClick={() => navigate(`/market/${asset.id}/hunt`)}
            className={`group relative flex h-full flex-col overflow-hidden rounded-3xl bg-surface/60 text-left transition-all hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:ring-foreground/50 ${liveCardBorderClass}`}
          >
            <div className={`relative h-32 w-full overflow-hidden sm:h-40 lg:h-48 ${liveCardMediaBorderClass}`}>
              <img
                src={asset.image}
                alt={asset.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 via-black/10 to-transparent px-3 py-2 text-[11px] text-white sm:px-5 sm:py-3">
                <span className="font-medium uppercase tracking-wide">Cycle {asset.cycle.cycle}</span>
                <span className="rounded-full bg-white/15 px-2 py-0.5 font-mono text-[10px] sm:text-[11px]">
                  {formatCurrencyK(asset.cycle.reserve)}
                </span>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-3 px-3 py-3 sm:px-5 sm:py-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-foreground/90 sm:text-base">
                    {asset.name}
                  </h2>
                  <img src="/checklist.png" className="h-3.5 w-3.5 opacity-80 sm:h-4 sm:w-4" alt="verified" />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-sm font-semibold ${changeClass}`}>{changeText}</span>
                  <span className="font-mono text-base font-semibold text-foreground">{formatCurrency(asset.cycle.lpu)}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] sm:grid-cols-4 sm:gap-3 sm:text-xs">
                <LiveMarketStat label="Liquidity" value={formatCurrencyK(asset.cycle.reserve)} />
                <LiveMarketStat label="LPU" value={formatCurrency(asset.cycle.lpu)} />
                <LiveMarketStat label="CoinTag" value={formatCurrency(coinTagPrice)} />
                <LiveMarketStat label="Backing" value={formatCurrencyK(asset.params.initialReserve)} />
              </div>
              <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-muted-foreground sm:text-[11px]">
                <span>{formatCurrency(asset.cycle.totalSales)} gross</span>
                <span className="font-medium text-foreground/80">Enter Hunt →</span>
              </div>
            </div>
          </button>
        );
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
              {showTrending && (
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h1 className="text-2xl sm:text-3xl font-bold">
                        {isLiveMarket ? "Live" : "Listed"} <span className="bg-gradient-to-r from-green-400 via-emerald-500 to-teal-600 bg-clip-text text-transparent">Market</span>
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
                      {isLiveMarket 
                        ? "Watch every live LFT drop, inspect on-chain liquidity, and jump into a treasure hunt to find tokens in real time."
                        : "Browse listed LFT assets, analyze their performance, and discover investment opportunities."
                      }
                    </p>
                  </div>
                  <div className="flex w-full items-center gap-3 text-xs text-muted-foreground sm:w-auto sm:justify-end">
                    <div className="hidden items-center gap-1 sm:flex">
                      <span className={!gridView ? "text-foreground font-semibold" : undefined}>List</span>
                      <Switch checked={gridView} onCheckedChange={(checked) => setGridView(Boolean(checked))} aria-label="Toggle grid view" />
                      <span className={gridView ? "text-foreground font-semibold" : undefined}>Grid</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile search removed per updated layout */}

              {/* Desktop controls and network selector */}
              <div className="hidden sm:flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex w-full items-center gap-3 sm:w-auto">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={handleToggleMarket}
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs uppercase tracking-wide font-semibold bg-gray-200 text-gray-900 hover:bg-gray-300 transition-colors dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800"
                  >
                    <ArrowLeftRight className="h-3.5 w-3.5" />
                    {isLiveMarket ? "Switch to listed market" : "Switch to live market"}
                  </Button>
                  {isLiveMarket && (
                    <span className="relative flex h-4 w-4 items-center justify-center" aria-hidden="true">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400/40 blur-sm animate-ping" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    </span>
                  )}
                </div>
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

              {showTrending ? (
                <>
                  {/* Desktop Trending Section */}
                  {trendingTokens.length > 0 && (
                    <section className="space-y-2 -mb-3 hidden md:block">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-semibold text-foreground">Trending Tokens</h2>
                      </div>
                      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 no-scrollbar">
                        {trendingTokens.map(({ asset, change }) => (
                          <TrendingTokenCard key={`trending-${asset.id}`} asset={asset} change={change} />
                        ))}
                      </div>
                    </section>
                  )}
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="hidden items-center gap-1 sm:flex">
                          <span className={!gridView ? "text-foreground font-semibold" : undefined}>List</span>
                          <Switch checked={gridView} onCheckedChange={(checked) => setGridView(Boolean(checked))} aria-label="Toggle grid view" />
                          <span className={gridView ? "text-foreground font-semibold" : undefined}>Grid</span>
                        </div>
                      </div>
                    </div>
                  </div>

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
                </>
              )}

              {!showTrending && showSearchBar && (
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
                ? isLiveMarket
                  ? gridView
                    ? renderLiveGrid(displayListedAssets)
                    : renderLiveList(displayListedAssets)
                  : gridView
                    ? renderListedGrid(displayListedAssets)
                    : renderListedList(displayListedAssets)
                : renderEmptyState()}

              {/* Mobile Trending Section - Below Listed Assets */}
              {showTrending && trendingTokens.length > 0 && (
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

        {/* Mobile view controls - Fixed at bottom */}
        <div className="fixed inset-x-0 bottom-0 z-40 sm:hidden">
          <div className="bg-background/95 backdrop-blur-sm px-4 py-3 shadow-lg">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className={gridView ? "text-muted-foreground" : "text-foreground font-semibold"}>List</span>
                <Switch checked={gridView} onCheckedChange={(checked) => setGridView(Boolean(checked))} aria-label="Toggle grid view" />
                <span className={gridView ? "text-foreground font-semibold" : "text-muted-foreground"}>Grid</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{isLiveMarket ? "Live" : "Listed"}</span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={handleToggleMarket}
                  className="h-8 w-8 rounded-full border border-border/50"
                  style={{ backgroundColor: isLiveMarket ? '#00ff4f' : undefined }}
                >
                  <ArrowLeftRight className="h-4 w-4" />
                </Button>
              </div>
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
