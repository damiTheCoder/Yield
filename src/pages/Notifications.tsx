import { useApp } from "@/lib/app-state";
import { formatCurrency, formatCurrencyK } from "@/lib/utils";
import { useMemo } from "react";
import { BellRing, Sparkles } from "lucide-react";

export default function Notifications() {
  const { assets } = useApp();

  const notifications = useMemo(
    () =>
      assets.map((asset) => ({
        asset,
        title: `${asset.name} hunt is live`,
        body: `Cycle ${asset.cycle.cycle} has ${formatCurrencyK(asset.cycle.reserve)} in current liquidity and ${formatCurrency(asset.cycle.accrued.holderRewards)} earmarked for rewards.`,
        meta: `${asset.params.initialSupply - asset.cycle.supply} tokens found • LPU ${formatCurrency(asset.cycle.lpu)}`,
      })),
    [assets],
  );

  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="rounded-full border border-border/40 bg-surface/40 p-2 text-foreground">
            <BellRing className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Hunt Notifications</h1>
            <p className="text-sm text-muted-foreground">Stay on top of new hunts and liquidity milestones.</p>
          </div>
        </div>

        <section className="space-y-4">
          {notifications.map(({ asset, title, body, meta }) => (
            <article
              key={asset.id}
              className="flex flex-col gap-4 rounded-2xl border border-border/40 bg-surface/40 p-4 transition-colors hover:border-border/70 md:flex-row md:items-center"
            >
              <div className="flex items-start gap-3 md:w-[260px]">
                <img src={asset.image} alt={asset.name} className="h-14 w-14 rounded-xl object-cover" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">{title}</p>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{asset.ticker || asset.id.toUpperCase()}</p>
                </div>
              </div>
              <div className="flex-1 space-y-2 text-sm text-muted-foreground">
                <p>{body}</p>
                <div className="flex items-center gap-2 text-xs text-foreground/80">
                  <Sparkles className="h-4 w-4" />
                  <span>{meta}</span>
                </div>
              </div>
              <div className="flex gap-2 md:w-[180px] md:justify-end">
                <a
                  href={`/market/${asset.id}/hunt`}
                  className="inline-flex items-center justify-center rounded-lg border border-border/50 px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-surface"
                >
                  Join Hunt
                </a>
                <a
                  href={`/assets/${asset.id}`}
                  className="inline-flex items-center justify-center rounded-lg border border-border/50 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface"
                >
                  View Asset
                </a>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
