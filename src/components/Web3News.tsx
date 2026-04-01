import { useEffect, useMemo, useState } from "react";
import { useWeb3News } from "@/hooks/useWeb3News";
import type { Web3NewsItem } from "@/hooks/useWeb3News";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

interface Web3NewsProps {
  variant?: "sidebar" | "mobile" | "webview";
  className?: string;
}

const shimmerItems = Array.from({ length: 3 }, (_, index) => index);

const FEATURED_SUBSTACK_ARTICLE: Web3NewsItem = {
  id: "substack-liquidity-funded-tokens",
  title: "Liquidity Funded Tokens (LFTs): The Future of Sustainable Digital Assets",
  url: "https://open.substack.com/pub/daminathan/p/liquidity-funded-tokens-lfts-the?r=52dbsh&utm_campaign=post&utm_medium=web&showWelcomeOnShare=false",
  imageUrl:
    "https://substackcdn.com/image/fetch/$s_!jW0s!,w_1200,h_600,c_fill,f_jpg,q_auto:good,fl_progressive:steep,g_auto/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fb940a014-a274-41a7-8a5c-c8cba578ab71_1536x1024.png",
  source: "Solaris Substack",
  publishedAt: new Date("2024-04-29T00:00:00.000Z"),
};

const isFeaturedSubstackArticle = (item?: Web3NewsItem | null) =>
  !!item &&
  (item.id === FEATURED_SUBSTACK_ARTICLE.id ||
    item.url === FEATURED_SUBSTACK_ARTICLE.url ||
    item.title === FEATURED_SUBSTACK_ARTICLE.title);

function formatRelativeTime(date?: Date) {
  if (!date) return "";
  const diff = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < hour) {
    const minutes = Math.max(1, Math.round(diff / minute));
    return `${minutes}m ago`;
  }
  if (diff < day) {
    const hours = Math.max(1, Math.round(diff / hour));
    return `${hours}h ago`;
  }
  const days = Math.max(1, Math.round(diff / day));
  return `${days}d ago`;
}

export default function Web3News({ variant = "sidebar", className }: Web3NewsProps) {
  const { news, loading } = useWeb3News();
  const { theme } = useTheme();

  const getDocumentTheme = () => {
    if (typeof document !== "undefined") {
      const attr = document.documentElement.getAttribute("data-theme");
      if (attr === "dark" || attr === "light") {
        return attr;
      }
    }
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "dark";
  };

  const [activeTheme, setActiveTheme] = useState<"dark" | "light">(() => getDocumentTheme());

  useEffect(() => {
    setActiveTheme(getDocumentTheme());
  }, [theme]);

  useEffect(() => {
    if (typeof MutationObserver === "undefined" || typeof document === "undefined") return;
    const observer = new MutationObserver(() => {
      setActiveTheme(getDocumentTheme());
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  const headingColorClass = activeTheme === "dark" ? "text-white" : "text-black";
  const cardBackgroundClasses =
    activeTheme === "dark"
      ? "bg-[#1a1a1a] border-transparent"
      : "bg-gray-50 border border-gray-200";
  const shimmerBackgroundClasses =
    activeTheme === "dark"
      ? "bg-[#1a1a1a] border-transparent"
      : "bg-gray-50 border border-gray-200";
  const cardTextClasses = activeTheme === "dark" ? "text-white" : "text-gray-900";

  const items = useMemo(() => news ?? [], [news]);

  const headingSize =
    variant === "sidebar" ? "text-sm" : variant === "mobile" ? "text-base" : "text-xl";
  const listWrapperClass =
    variant === "webview"
      ? ""
      : cn("flex gap-4 overflow-x-auto no-scrollbar pb-1", variant === "sidebar" ? "md:w-64" : "");

  const normalizeSource = (source?: string) => (source ?? "").toLowerCase();
  const coindeskItems = items.filter((i) => normalizeSource(i.source).includes("coindesk"));
  const cointelegraphItems = items.filter((i) => normalizeSource(i.source).includes("cointelegraph"));
  const bloombergItems = items.filter((i) => normalizeSource(i.source).includes("bloomberg"));

  const picked = new Set<typeof items[number]>();
  const selected: typeof items = [];

  const desiredSlots = variant === "webview" ? 4 : 3;
  const MIN_REAL_ITEMS = desiredSlots;

  const addFromCategory = (categoryItems: typeof items, desiredCount: number) => {
    let added = 0;
    for (const item of categoryItems) {
      if (picked.has(item)) continue;
      selected.push(item);
      picked.add(item);
      added += 1;
      if (added >= desiredCount) break;
    }
  };

  // Enforce requested mix: 2 CoinDesk, 2 CoinTelegraph, 1 Bloomberg
  addFromCategory(coindeskItems, 2);
  addFromCategory(cointelegraphItems, 2);
  addFromCategory(bloombergItems, 1);

  // Fill remaining slots with any other items, preserving order
  if (selected.length < desiredSlots) {
    for (const item of items) {
      if (picked.has(item)) continue;
      selected.push(item);
      picked.add(item);
      if (selected.length >= desiredSlots) break;
    }
  }

  let displayedItems = selected.slice(0, desiredSlots);

  const realItemsMap = new Map<string, (typeof items)[number]>();
  for (const item of displayedItems) {
    if (!item.title) continue;
    const key = item.url || item.id || item.title;
    if (!realItemsMap.has(key)) {
      realItemsMap.set(key, item);
    }
  }

  if (realItemsMap.size < MIN_REAL_ITEMS) {
    for (const item of items) {
      if (!item.title) continue;
      const key = item.url || item.id || item.title;
      if (!realItemsMap.has(key)) {
        realItemsMap.set(key, item);
      }
      if (realItemsMap.size >= MIN_REAL_ITEMS) break;
    }
  }

  displayedItems = Array.from(realItemsMap.values()).slice(0, MIN_REAL_ITEMS);

  const hasFeaturedArticle = displayedItems.some((item) => isFeaturedSubstackArticle(item));

  if (!hasFeaturedArticle) {
    const insertIndex = variant === "webview" ? Math.min(1, displayedItems.length) : 0;
    displayedItems = [
      ...displayedItems.slice(0, insertIndex),
      FEATURED_SUBSTACK_ARTICLE,
      ...displayedItems.slice(insertIndex),
    ];
  }

  displayedItems = displayedItems.slice(0, MIN_REAL_ITEMS);

  if (displayedItems.length < MIN_REAL_ITEMS) {
    const placeholders = Array.from({ length: MIN_REAL_ITEMS - displayedItems.length }).map((_, i) => ({
      id: `placeholder-${i}`,
      title: "",
      url: "#",
      imageUrl: "",
      source: "",
      publishedAt: new Date(),
    }));
    displayedItems = [...displayedItems, ...placeholders];
  }

  const renderWebviewLayout = () => {
    const hero = displayedItems[0];
    const remainder = displayedItems.slice(1);
    const heroIsPlaceholder = loading || !hero?.title;

    return (
      <section className={cn("flex flex-col gap-5", className)}>
        <div className="flex items-center justify-between">
          <div className={cn("font-bold text-foreground", headingSize)}>Web3 Headlines</div>
          <a
            href="/blog"
            className="text-xs font-semibold uppercase tracking-widest text-primary hover:text-primary/80"
          >
            View all
          </a>
        </div>
        <div className="grid gap-5 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div
            className={cn(
              "group relative overflow-hidden rounded-[28px] border transition-colors",
              heroIsPlaceholder ? shimmerBackgroundClasses : cardBackgroundClasses,
              "min-h-[280px] md:min-h-[360px]",
            )}
          >
            {heroIsPlaceholder ? (
              <div className="h-full w-full animate-pulse bg-black/10" />
            ) : (
              <a href={hero.url} target="_blank" rel="noreferrer" className="absolute inset-0">
                <div className="absolute inset-0">
                  <img
                    src={hero.imageUrl}
                    alt={hero.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                </div>
                <div className="absolute inset-x-0 bottom-0 p-8 space-y-3 text-white">
                  <span className="inline-flex items-center text-[11px] font-semibold uppercase tracking-[0.2em] text-yellow-300">
                    {hero.source || "Featured"}
                  </span>
                  <h3 className="text-2xl md:text-3xl font-semibold leading-tight">{hero.title}</h3>
                  <p className="text-sm text-white/75">
                    {`Latest coverage from ${hero.source || "top analysts"} · ${formatRelativeTime(hero.publishedAt)}`}
                  </p>
                </div>
              </a>
            )}
          </div>
          <div className="space-y-4">
            {remainder.map((item, index) => {
              const isPlaceholder = loading || !item?.title;
              return isPlaceholder ? (
                <div
                  key={`shimmer-${index}`}
                  className={cn(
                    "h-28 w-full rounded-2xl border px-4 py-3 animate-pulse",
                    shimmerBackgroundClasses,
                  )}
                />
              ) : (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    "group flex w-full items-center gap-4 rounded-2xl border px-4 py-4 transition-colors hover:border-white/40",
                    cardBackgroundClasses,
                  )}
                >
                  <div className="flex-1 space-y-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-yellow-400">
                      {item.source || "Web3"}
                    </span>
                    <h4 className={cn("text-base font-semibold leading-tight", cardTextClasses)}>
                      {item.title}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(item.publishedAt)}
                    </p>
                  </div>
                  <div className="relative h-20 w-28 overflow-hidden rounded-xl">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </section>
    );
  };

  if (variant === "webview") {
    return renderWebviewLayout();
  }

  return (
    <section className={cn("flex flex-col gap-3", className)}>
      <div className={cn("font-bold text-foreground", headingSize)}>
        Web3 Headlines
      </div>
      <div className={listWrapperClass}>
        {loading || displayedItems.length === 0
          ? shimmerItems.map((index) => (
              <div key={index} className="w-56 shrink-0 animate-pulse">
                <div className={cn("h-28 w-full rounded-xl", shimmerBackgroundClasses)} />
                <div className="mt-2 h-3 w-3/4 rounded bg-border/50" />
              </div>
            ))
          : displayedItems.map((item) => {
              const isPlaceholder = !item.title;
              return isPlaceholder ? (
                <div
                  key={item.id}
                  className={cn(
                    "group block w-72 shrink-0 overflow-hidden rounded-xl transition-transform",
                    cardBackgroundClasses,
                  )}
                >
                  <div className="h-28 w-full rounded-t-xl bg-gradient-to-b from-black/6 to-transparent" />
                  <div className="space-y-1 px-3 py-4">
                    <div className="h-4 w-3/4 bg-border/50 rounded" />
                    <div className="h-3 w-1/2 bg-border/50 rounded" />
                  </div>
                </div>
              ) : (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    "group block w-72 shrink-0 overflow-hidden rounded-xl transition-transform hover:-translate-y-0.5",
                    cardBackgroundClasses,
                  )}
                >
                  <div className="relative h-28 w-full overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  </div>
                  <div className="space-y-1 px-3 py-2">
                    <h4 className={cn("text-sm font-medium line-clamp-2", cardTextClasses)}>{item.title}</h4>
                  </div>
                </a>
              );
            })}
      </div>
    </section>
  );
}
