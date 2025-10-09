import { useMemo } from "react";
import { useWeb3News } from "@/hooks/useWeb3News";
import { cn } from "@/lib/utils";

interface Web3NewsProps {
  variant?: "sidebar" | "mobile";
  className?: string;
}

const shimmerItems = Array.from({ length: 3 }, (_, index) => index);

export default function Web3News({ variant = "sidebar", className }: Web3NewsProps) {
  const { news, loading, error } = useWeb3News();

  const items = useMemo(() => news ?? [], [news]);

  if (!loading && (!items.length || error)) {
    return null;
  }

  const headingSize = variant === "sidebar" ? "text-sm" : "text-base";
  const listWrapperClass = cn(
    "flex gap-4 overflow-x-auto no-scrollbar pb-1",
    variant === "sidebar" ? "md:w-64" : "",
  );

  return (
    <section
      className={cn(
        "flex flex-col gap-3",
        className,
      )}
    >
      <div className={cn("font-semibold uppercase tracking-wide text-muted-foreground", headingSize)}>
        Web3 Headlines
      </div>
      <div className={listWrapperClass}>
        {loading
          ? shimmerItems.map((index) => (
              <div key={index} className="w-56 shrink-0 animate-pulse">
                <div className="h-28 w-full rounded-xl border border-border/40" />
                <div className="mt-2 h-3 w-3/4 rounded bg-border/50" />
              </div>
            ))
          : items.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="group block w-72 shrink-0 overflow-hidden rounded-xl border border-border/50 transition-transform hover:-translate-y-0.5"
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
                  <h4 className="text-sm font-medium text-foreground line-clamp-2">{item.title}</h4>
                </div>
              </a>
            ))}
      </div>
    </section>
  );
}
