import { useEffect, useMemo, useState } from "react";
import { useWeb3News } from "@/hooks/useWeb3News";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Web3NewsProps {
  variant?: "sidebar" | "mobile" | "webview";
  className?: string;
}

const shimmerItems = Array.from({ length: 3 }, (_, index) => index);
const headerIcons = ["/z1.png", "/z2.png", "/z3.png", "/z4.jpeg"];
const iconStackMessage = "we just felt this will make the UX design look good 😂";

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
    variant === "sidebar"
      ? "text-sm"
      : variant === "mobile"
        ? "text-[18px] tracking-[-0.02em]"
        : "text-xl";
  const listWrapperClass =
    variant === "webview"
      ? ""
      : cn("flex gap-4 overflow-x-auto no-scrollbar pb-1", variant === "sidebar" ? "md:w-64" : "");

  const desiredSlots = variant === "webview" ? 4 : 3;
  const MIN_REAL_ITEMS = desiredSlots;
  let displayedItems = items.slice(0, MIN_REAL_ITEMS);

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

  const renderHeaderIcons = () => {
    const iconSizeClass =
      variant === "mobile"
        ? "h-8 w-8"
        : variant === "webview"
          ? "h-9 w-9"
          : "h-7 w-7";

    return (
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className="flex items-center justify-end pl-3" aria-label="Why these icons are here">
            {headerIcons.map((icon, index) => (
              <span
                key={icon}
                className={cn(
                  "overflow-hidden rounded-full border-[2px] border-black bg-white",
                  iconSizeClass,
                  index === 0 ? "ml-0" : "-ml-2.5",
                )}
              >
                <img src={icon} alt="" className="h-full w-full object-cover" loading="lazy" />
              </span>
            ))}
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[240px] rounded-2xl border border-[#D5DCE8] bg-white p-3 text-sm font-medium leading-6 text-[#344054] shadow-xl">
          {iconStackMessage}
        </PopoverContent>
      </Popover>
    );
  };

  const renderWebviewLayout = () => {
    const hero = displayedItems[0];
    const remainder = displayedItems.slice(1);
    const heroIsPlaceholder = loading || !hero?.title;

    return (
      <section className={cn("flex flex-col gap-5", className)}>
        <div className="flex items-center justify-between">
          <div className={cn("font-bold text-foreground", headingSize)}>Web3 Headlines</div>
          {renderHeaderIcons()}
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
      <div className="flex items-center justify-between gap-3">
        <div className={cn("text-foreground", variant === "mobile" ? "font-extrabold" : "font-bold", headingSize)}>
          Web3 Headlines
        </div>
        {renderHeaderIcons()}
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
