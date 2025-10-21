import { useEffect, useMemo, useState } from "react";
import { useWeb3News } from "@/hooks/useWeb3News";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

interface Web3NewsProps {
  variant?: "sidebar" | "mobile";
  className?: string;
}

const shimmerItems = Array.from({ length: 3 }, (_, index) => index);

export default function Web3News({ variant = "sidebar", className }: Web3NewsProps) {
  const { news, loading, error } = useWeb3News();
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
      ? "bg-neutral-800 border border-neutral-700"
      : "bg-gray-100 border border-gray-200";
  const shimmerBackgroundClasses =
    activeTheme === "dark"
      ? "bg-neutral-800 border border-neutral-700"
      : "bg-gray-100 border border-gray-200";
  const cardTextClasses = activeTheme === "dark" ? "text-white" : "text-gray-900";

  const items = useMemo(() => news ?? [], [news]);

  // If there's an error, show nothing
  if (!loading && error) return null;

  const headingSize = variant === "sidebar" ? "text-sm" : "text-base";
  const listWrapperClass = cn(
    "flex gap-4 overflow-x-auto no-scrollbar pb-1",
    variant === "sidebar" ? "md:w-64" : "",
  );

  const normalizeSource = (source?: string) => (source ?? "").toLowerCase();
  const coindeskItems = items.filter((i) => normalizeSource(i.source).includes("coindesk"));
  const cointelegraphItems = items.filter((i) => normalizeSource(i.source).includes("cointelegraph"));
  const bloombergItems = items.filter((i) => normalizeSource(i.source).includes("bloomberg"));

  const picked = new Set<typeof items[number]>();
  const selected: typeof items = [];

  const MIN_REAL_ITEMS = 3;
  const desiredSlots = MIN_REAL_ITEMS;

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

  return (
    <section
      className={cn(
        "flex flex-col gap-3",
        className,
      )}
    >
      <div
        className={cn("uppercase tracking-wide", headingSize, "font-bold", headingColorClass)}
        style={{ color: activeTheme === "dark" ? "#ffffff" : "#000000" }}
      >
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
                    <span className="absolute left-3 top-3 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                      {item.source}
                    </span>
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
