import { useEffect, useMemo, useRef, useState } from "react";
import { useWeb3News } from "@/hooks/useWeb3News";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Web3NewsProps {
  variant?: "sidebar" | "mobile" | "webview" | "detail";
  className?: string;
}

const shimmerItems = Array.from({ length: 3 }, (_, index) => index);
const headerIcons = ["/z1.png", "/z2.png", "/z3.png", "/r1.jpeg"];
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
  const [mobileNewsIndex, setMobileNewsIndex] = useState(0);
  const mobileSwipeStartX = useRef<number | null>(null);
  const mobileSwipeDeltaX = useRef(0);
  const mobileDidSwipe = useRef(false);

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
      : "bg-gray-50";
  const shimmerBackgroundClasses =
    activeTheme === "dark"
      ? "bg-[#1a1a1a] border-transparent"
      : "bg-gray-50";
  const cardTextClasses = activeTheme === "dark" ? "text-white" : "text-gray-900";

  const items = useMemo(() => news ?? [], [news]);

  const headingSize =
    variant === "sidebar"
      ? "text-sm"
      : variant === "detail"
        ? "text-[17px] tracking-[-0.02em]"
      : variant === "mobile"
        ? "text-[18px] tracking-[-0.02em]"
        : "text-xl";
  const listWrapperClass =
    variant === "webview" || variant === "detail"
      ? ""
      : cn("flex gap-4 overflow-x-auto no-scrollbar pb-1", variant === "sidebar" ? "md:w-64" : "");

  const desiredSlots = variant === "webview" || variant === "detail" || variant === "mobile" ? 4 : 3;
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

  const mobileSlideCount = displayedItems.length;

  useEffect(() => {
    if (variant !== "mobile" || loading || mobileSlideCount <= 1) return;

    const timer = window.setTimeout(() => {
      setMobileNewsIndex((current) => (current + 1) % mobileSlideCount);
    }, 4500);

    return () => window.clearTimeout(timer);
  }, [loading, mobileNewsIndex, mobileSlideCount, variant]);

  useEffect(() => {
    setMobileNewsIndex(0);
  }, [mobileSlideCount]);

  const handleMobileSwipeStart = (event: React.TouchEvent<HTMLDivElement>) => {
    mobileSwipeStartX.current = event.touches[0]?.clientX ?? null;
    mobileSwipeDeltaX.current = 0;
    mobileDidSwipe.current = false;
  };

  const handleMobileSwipeMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (mobileSwipeStartX.current === null) return;
    mobileSwipeDeltaX.current = event.touches[0].clientX - mobileSwipeStartX.current;
  };

  const handleMobileSwipeEnd = () => {
    const delta = mobileSwipeDeltaX.current;
    mobileSwipeStartX.current = null;
    mobileSwipeDeltaX.current = 0;

    if (mobileSlideCount <= 1 || Math.abs(delta) < 48) return;

    mobileDidSwipe.current = true;
    setMobileNewsIndex((current) => {
      if (delta < 0) return (current + 1) % mobileSlideCount;
      return (current - 1 + mobileSlideCount) % mobileSlideCount;
    });
  };

  const handleMobileSwipeClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!mobileDidSwipe.current) return;
    event.preventDefault();
    event.stopPropagation();
    mobileDidSwipe.current = false;
  };

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
          <button
            type="button"
            className={cn("flex items-center", variant === "mobile" ? "justify-start" : "justify-end pl-3")}
            aria-label="Why these icons are here"
          >
            {headerIcons.map((icon, index) => (
              <span
                key={icon}
                className={cn(
                  "overflow-hidden rounded-full bg-white",
                  iconSizeClass,
                  index === 0 ? "ml-0" : "-ml-2.5",
                )}
              >
                <img src={icon} alt="" className="h-full w-full object-cover" loading="lazy" />
              </span>
            ))}
          </button>
        </PopoverTrigger>
        <PopoverContent
          align={variant === "mobile" ? "start" : "end"}
          alignOffset={variant === "mobile" ? 10 : 0}
          collisionPadding={16}
          className="w-[240px] max-w-[calc(100vw-2rem)] rounded-2xl border border-[#D5DCE8] bg-white p-3 text-sm font-medium leading-6 text-[#344054] shadow-xl dark:border-[#2A2A2A] dark:bg-[#171717] dark:text-[#D0D5DD]"
        >
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
              "group relative overflow-hidden rounded-[28px] transition-colors",
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
                    "h-28 w-full rounded-2xl px-4 py-3 animate-pulse",
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
                    "group flex w-full items-center gap-4 rounded-2xl px-4 py-4 transition-colors",
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

  const renderDetailLayout = () => {
    return (
      <section className={cn("flex flex-col gap-4", className)}>
        <div className="flex items-center justify-between gap-3">
          <div className={cn("font-bold text-foreground", headingSize)}>Web3 Headlines</div>
          {renderHeaderIcons()}
        </div>
        <div className="space-y-3">
          {loading || displayedItems.length === 0
            ? shimmerItems.concat(3).slice(0, 4).map((index) => (
                <div key={index} className={cn("h-24 w-full animate-pulse rounded-2xl", shimmerBackgroundClasses)} />
              ))
            : displayedItems.map((item) => {
                const isPlaceholder = !item.title;
                return isPlaceholder ? (
                  <div
                    key={item.id}
                    className={cn(
                      "h-24 w-full rounded-2xl transition-transform",
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
                      "group flex items-center gap-3 rounded-2xl p-3 transition-transform hover:-translate-y-0.5",
                      cardBackgroundClasses,
                    )}
                  >
                    <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {item.source || "Web3"}
                      </div>
                      <h4 className={cn("text-sm font-semibold leading-snug line-clamp-3", cardTextClasses)}>
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-muted-foreground">{formatRelativeTime(item.publishedAt)}</p>
                    </div>
                  </a>
                );
              })}
        </div>
      </section>
    );
  };

  if (variant === "webview") {
    return renderWebviewLayout();
  }

  if (variant === "detail") {
    return renderDetailLayout();
  }

  if (variant === "mobile") {
    return (
      <section className={cn(className)}>
        <div className="flex flex-col gap-3 md:hidden">
          <div className="flex items-center justify-between gap-3">
            {renderHeaderIcons()}
            <div className={cn("text-right text-foreground font-extrabold", headingSize)}>
              Web3 Headlines
            </div>
          </div>
          {loading || displayedItems.length === 0 ? (
            <div className="w-full animate-pulse">
              <div className={cn("h-[320px] w-full rounded-[22px]", shimmerBackgroundClasses)} />
              <div className="mx-auto mt-3 h-1 w-24 rounded-full bg-border/50" />
            </div>
          ) : (
            <div
              className="overflow-hidden touch-pan-y"
              onTouchStart={handleMobileSwipeStart}
              onTouchMove={handleMobileSwipeMove}
              onTouchEnd={handleMobileSwipeEnd}
              onClickCapture={handleMobileSwipeClick}
            >
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${mobileNewsIndex * 100}%)` }}
              >
                {displayedItems.map((item) => {
                  const isPlaceholder = !item.title;
	                  return isPlaceholder ? (
	                    <div key={item.id} className="w-full min-w-full">
	                      <div
	                        className={cn(
	                          "group relative block h-[320px] overflow-hidden rounded-[22px] transition-transform",
	                          cardBackgroundClasses,
	                        )}
	                      >
                        <div className="h-full w-full bg-gradient-to-b from-black/6 to-transparent" />
                        <div className="absolute inset-x-4 bottom-4 space-y-2">
                          <div className="h-4 w-3/4 rounded bg-white/70" />
                          <div className="h-3 w-1/2 rounded bg-white/50" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <a
                      key={item.id}
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
	                      className="group block w-full min-w-full overflow-hidden rounded-[22px] transition-transform"
	                    >
	                      <div className="relative h-[320px] overflow-hidden rounded-[22px] bg-black">
	                        <img
	                          src={item.imageUrl}
	                          alt={item.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
	                        <h4 className="absolute inset-x-0 bottom-0 px-4 pb-5 text-[18px] font-semibold leading-snug text-white line-clamp-3">
	                          {item.title}
	                        </h4>
	                      </div>
                    </a>
                  );
                })}
              </div>
              <div className="mx-auto mt-3 grid w-24 grid-cols-4 gap-1.5">
                {displayedItems.map((item, index) => (
                  <button
                    type="button"
	                    key={`mobile-news-status-${item.id}`}
                    aria-label={`Show headline ${index + 1}`}
                    onClick={() => setMobileNewsIndex(index)}
	                    className={cn(
	                      "h-1 rounded-full transition-colors",
	                      index === mobileNewsIndex ? "bg-[#2F66F6]" : "bg-slate-200",
	                    )}
	                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="hidden flex-col gap-3 md:flex">
          <div className="flex items-center justify-between gap-3">
            {renderHeaderIcons()}
            <div className={cn("text-right text-foreground font-extrabold", headingSize)}>
              Web3 Headlines
            </div>
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
        </div>
      </section>
    );
  }

  return (
    <section className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between gap-3">
        {variant === "mobile" ? (
          <>
            {renderHeaderIcons()}
            <div className={cn("text-right text-foreground font-extrabold", headingSize)}>
              Web3 Headlines
            </div>
          </>
        ) : (
          <>
            <div className={cn("text-foreground", variant === "mobile" ? "font-extrabold" : "font-bold", headingSize)}>
              Web3 Headlines
            </div>
            {renderHeaderIcons()}
          </>
        )}
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
