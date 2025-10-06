import Header from "@/components/Header";
import { useApp } from "@/lib/app-state";
import type { Asset } from "@/lib/app-state";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatCurrencyK } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, ChevronDown } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { Input } from "@/components/ui/input";

const MAX_TRENDING = 10;

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

function AssetsPage({ showTrending = true, showViewAllButton = true, listedLimit, showSearchBar = false }: AssetsPageProps) {
  const { assets } = useApp();
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";
  const navigate = useNavigate();
  const [marketMode, setMarketMode] = useState<"listed" | "live">("listed");
  const [gridViewListed, setGridViewListed] = useState(false);
  const [gridViewLive, setGridViewLive] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const isLiveMarket = marketMode === "live";
  const gridView = isLiveMarket ? gridViewLive : gridViewListed;
  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredAssets = useMemo(() => {
    if (!normalizedSearch) return assets;
    return assets.filter((asset) => {
      const name = asset.name.toLowerCase();
      const ticker = asset.ticker?.toLowerCase() ?? "";
      const id = asset.id.toLowerCase();
      return name.includes(normalizedSearch) || ticker.includes(normalizedSearch) || id.includes(normalizedSearch);
    });
  }, [assets, normalizedSearch]);

  const liveAssets = useMemo(
    () => [...filteredAssets].sort((a, b) => b.cycle.totalSales - a.cycle.totalSales),
    [filteredAssets]
  );

  const listedAssets = filteredAssets;
  const currentAssets = isLiveMarket ? liveAssets : listedAssets;
  const displayListedAssets = !isLiveMarket && listedLimit ? currentAssets.slice(0, listedLimit) : currentAssets;

  const listLabel = isLiveMarket ? "Live List" : "Listed List";
  const gridLabel = isLiveMarket ? "Live Grid" : "Listed Grid";

  const cardBorderClass = isDarkTheme ? "" : "border border-neutral-300";
  const cardMediaBorderClass = isDarkTheme ? "" : "border-b border-neutral-300";
  const liveCardBorderClass = cardBorderClass;
  const liveCardMediaBorderClass = cardMediaBorderClass;

  const handleGridToggle = (checked: boolean) => {
    if (isLiveMarket) {
      setGridViewLive(Boolean(checked));
    } else {
      setGridViewListed(Boolean(checked));
    }
  };

  const handleToggleMarket = () => {
    setMarketMode((prev) => {
      const next = prev === "listed" ? "live" : "listed";
      if (next === "live") {
        setGridViewLive(false);
      }
      return next;
    });
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
    <>
      <div className="hidden overflow-x-auto md:block">
        <Table className="min-w-full text-sm border-separate border-spacing-y-0 [&_th:first-child]:pl-0 [&_td:first-child]:pl-0">
          <TableHeader className="[&_th]:border-b-transparent" style={{ borderBottom: "none" }}>
            <TableRow className="border-b-transparent" style={{ borderBottom: "none" }}>
              <TableHead className="text-left">Collection</TableHead>
              <TableHead className="text-center">Backing</TableHead>
              <TableHead className="text-center">Current</TableHead>
              <TableHead className="text-center">LPU</TableHead>
              <TableHead className="text-center">CoinTag</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border/40 [&>tr:first-child]:border-t-0 [&>tr]:border-b-0">
            {items.map((a) => {
              const change = getAssetChange(a);
              const changeText = formatChange(change);
              const changeClass = changeColorClass(change);
              return (
                <TableRow
                  key={a.id}
                  className="cursor-pointer transition-colors hover:bg-surface/60 [&>td]:py-4"
                  onClick={() => navigate(`/assets/${a.id}`)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3 text-sm">
                      <img src={a.image} alt={a.name} className="h-8 w-8 rounded-xl" />
                      <div className="flex flex-col leading-tight">
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-foreground">{a.name}</span>
                          <img src="/checklist.png" alt="verified" className="h-4 w-4 opacity-80" />
                        </div>
                        <span className={`text-xs font-semibold ${changeClass}`}>{changeText}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs">{formatCurrencyK(a.params.initialReserve)}</TableCell>
                  <TableCell className="text-center font-mono text-xs">{formatCurrencyK(a.cycle.reserve)}</TableCell>
                  <TableCell className="text-center font-mono text-xs">${a.cycle.lpu.toFixed(6)}</TableCell>
                  <TableCell className="text-center font-mono text-xs">${Math.max(4.2, a.cycle.lpu * 0.4).toFixed(2)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="md:hidden">
        <div className="grid grid-cols-[1fr_5.5rem_5rem] items-center px-2 pb-3 text-[10px] uppercase tracking-wide text-muted-foreground">
          <div>Collection</div>
          <div className="text-right">Current</div>
          <div className="text-right">CoinTag</div>
        </div>
        <div className="flex flex-col gap-4">
          {items.map((a) => {
            const change = getAssetChange(a);
            const changeText = formatChange(change);
            const changeClass = changeColorClass(change);
            return (
              <button
                key={a.id}
                onClick={() => navigate(`/assets/${a.id}`)}
                className="grid grid-cols-[1fr_5.5rem_5rem] items-start gap-3 border-b border-border/40 px-1.5 pb-3 text-left text-[13px] last:border-b-0"
              >
                <div className="min-w-0 flex items-center gap-3">
                  <img src={a.image} alt={a.name} className="h-9 w-9 rounded-lg" />
                  <div className="min-w-0 flex flex-col leading-tight">
                    <div className="flex items-center gap-1 text-[13px] font-medium">
                      <span className="max-w-[12ch] truncate">{a.name}</span>
                      <img src="/checklist.png" alt="verified" className="h-3 w-3 flex-shrink-0 opacity-80" />
                    </div>
                    <span className={`text-[11px] font-semibold ${changeClass}`}>{changeText}</span>
                  </div>
                </div>
                <div className="flex min-w-[5.5rem] flex-col items-end text-xs font-mono tabular-nums">
                  <span className="text-sm">{formatCurrencyK(a.cycle.reserve)}</span>
                </div>
                <div className="flex min-w-[5rem] flex-col items-end text-xs font-mono tabular-nums">
                  <span className="text-sm">{formatCurrency(Math.max(4.2, a.cycle.lpu * 0.4))}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );

  const renderListedGrid = (items: Asset[]) => (
    <div className="-mx-1 grid grid-cols-2 gap-2 sm:mx-0 sm:grid-cols-2 sm:gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-3 xl:grid-cols-3">
      {items.map((a, index) => {
        const change = getAssetChange(a);
        const changeText = formatChange(change);
        const changeClass = changeColorClass(change);
        return (
          <button
            type="button"
            key={a.id}
            onClick={() => navigate(`/assets/${a.id}`)}
            className={`group relative overflow-hidden rounded-2xl bg-surface/75 p-0 text-left transition-all duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border ${cardBorderClass}`}
            style={{ animationDelay: `${0.04 * index}s` }}
          >
            <div className={`relative h-40 w-full overflow-hidden sm:h-44 ${cardMediaBorderClass}`}>
              <img
                src={a.image}
                alt={a.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/75 via-black/20 to-transparent px-4 py-2 text-[11px] text-white">
                <span className="font-medium uppercase tracking-wide">Cycle {a.cycle.cycle}</span>
                <span className="rounded-full bg-white/15 px-3 py-1 font-mono text-[10px]">
                  {formatCurrencyK(a.cycle.reserve)}
                </span>
              </div>
            </div>
            <div className="space-y-3 p-3 md:p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground transition-colors group-hover:text-foreground/90 md:text-base">
                      {a.name}
                    </h3>
                    <img src="/checklist.png" alt="verified" className="h-4 w-4 opacity-80" />
                  </div>
                  <span className={`text-xs font-semibold ${changeClass}`}>{changeText}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-[10px] md:gap-2 md:text-[11px]">
                <div className="rounded-xl border border-border/40 bg-surface/60 px-2 py-1.5 md:px-2.5 md:py-2">
                  <div className="text-[8px] uppercase tracking-wide text-muted-foreground md:text-[9px]">Liquidity</div>
                  <div className="font-mono text-[10px] md:text-[11px]">{formatCurrencyK(a.cycle.reserve)}</div>
                </div>
                <div className="rounded-xl border border-border/40 bg-surface/60 px-2 py-1.5 md:px-2.5 md:py-2">
                  <div className="text-[8px] uppercase tracking-wide text-muted-foreground md:text-[9px]">LPU</div>
                  <div className="font-mono text-[10px] md:text-[11px]">${a.cycle.lpu.toFixed(3)}</div>
                </div>
                <div className="rounded-xl border border-border/40 bg-surface/60 px-2 py-1.5 md:px-2.5 md:py-2">
                  <div className="text-[8px] uppercase tracking-wide text-muted-foreground md:text-[9px]">Supply</div>
                  <div className="font-mono text-[10px] md:text-[11px]">{a.params.initialSupply}</div>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] md:text-[11px]">
                <span className="text-muted-foreground">Tap to explore</span>
                <span className="font-medium text-foreground/80">View →</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );

  const renderLiveList = (items: Asset[]) => (
    <div className="overflow-x-auto rounded-3xl border border-border/30 bg-black/40">
      <Table className="min-w-[720px] text-sm">
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 z-20 min-w-[200px] bg-surface/80 text-left">Collection</TableHead>
            <TableHead className="min-w-[140px] text-center">Liquidity</TableHead>
            <TableHead className="min-w-[140px] text-center">LPU</TableHead>
            <TableHead className="min-w-[140px] text-center">CoinTag</TableHead>
            <TableHead className="min-w-[160px] text-center">Backing Reserve</TableHead>
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
                className="cursor-pointer text-sm transition-colors hover:bg-surface/70"
                onClick={() => navigate(`/market/${asset.id}/hunt`)}
              >
                <TableCell className="sticky left-0 z-10 min-w-[200px] bg-surface/90">
                  <div className="flex items-center gap-3 text-sm">
                    <img src={asset.image} alt={asset.name} className="h-9 w-9 rounded-xl border border-black/70 object-cover" />
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{asset.name}</span>
                      <span className={`text-xs font-semibold ${changeClass}`}>{changeText}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="min-w-[140px] text-center font-mono text-xs">{formatCurrencyK(asset.cycle.reserve)}</TableCell>
                <TableCell className="min-w-[140px] text-center font-mono text-xs">{formatCurrency(asset.cycle.lpu)}</TableCell>
                <TableCell className="min-w-[140px] text-center font-mono text-xs">{formatCurrency(coinTagPrice)}</TableCell>
                <TableCell className="min-w-[160px] text-center font-mono text-xs">
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
    <section className="grid grid-cols-2 gap-4 sm:gap-6 sm:grid-cols-2 xl:grid-cols-3">
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
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 flex-col">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-foreground/90 sm:text-base">
                      {asset.name}
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
      <Header />
      <main className="container mx-auto px-4 pt-4 pb-6">
        <div className="flex flex-col gap-5">
          <div className="space-y-6">
            <div className="space-y-5 px-0">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold">Assets</h1>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={handleToggleMarket}
                    className={
                      isLiveMarket
                        ? "inline-flex items-center gap-2 rounded-full border-emerald-500/50 !bg-emerald-950/80 px-3 py-1 text-xs uppercase tracking-wide !text-emerald-200 hover:!bg-emerald-900/70 hover:!text-emerald-100"
                        : "inline-flex items-center gap-2 rounded-full border-purple-400/50 !bg-purple-950/80 px-3 py-1 text-xs uppercase tracking-wide !text-purple-200 hover:!bg-purple-900/70 hover:!text-purple-100"
                    }
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
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className={!gridView ? "text-foreground font-semibold" : undefined}>{listLabel}</span>
                  <Switch
                    checked={gridView}
                    onCheckedChange={handleGridToggle}
                    aria-label="Toggle grid view"
                  />
                  <span className={gridView ? "text-foreground font-semibold" : undefined}>{gridLabel}</span>
                  {showViewAllButton && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => navigate("/assets/all")}
                      className="rounded-2xl px-3 py-1 text-xs font-semibold"
                    >
                      View all tokens
                    </Button>
                  )}
                </div>
              </div>

              {showSearchBar && (
                <div className="px-0">
                  <Input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search tokens, tickers, or IDs"
                    className="h-11 w-full rounded-2xl border border-border/40 bg-background/80 px-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-0"
                  />
                </div>
              )}

              {showTrending && trendingTokens.length > 0 && (
                <section className="space-y-1">
                  <h2 className="text-xl font-semibold text-foreground">Trending Tokens</h2>
                  <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-3 no-scrollbar">
                    {trendingTokens.map(({ asset, change }) => (
                      <TrendingTokenCard key={`trending-${asset.id}`} asset={asset} change={change} />
                    ))}
                  </div>
                </section>
              )}

              {!gridView &&
                (displayListedAssets.length > 0
                  ? isLiveMarket
                    ? renderLiveList(displayListedAssets)
                    : renderListedList(displayListedAssets)
                  : renderEmptyState())}

              {gridView &&
                (displayListedAssets.length > 0
                  ? isLiveMarket
                    ? renderLiveGrid(displayListedAssets)
                    : renderListedGrid(displayListedAssets)
                  : renderEmptyState())}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

export default function Assets() {
  return <AssetsPage showTrending showViewAllButton listedLimit={10} />;
}

export function ViewAllAssets() {
  return <AssetsPage showTrending={false} showViewAllButton={false} showSearchBar />;
}
