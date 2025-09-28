const pillars = [
  {
    title: "Live-backed floor",
    copy: "Every CoinTag sale contributes to a verifiable reserve so holders always see the basis supporting redemption pricing.",
  },
  {
    title: "Programmable economics",
    copy: "Creators define the split once—LaunchPad enforces payouts to the desk, liquidity pool, rewards, and seed-next in real time.",
  },
  {
    title: "Collector agency",
    copy: "Finders can redeem at live LPU, convert to yield, or hold. Transparent dashboards make outcomes predictable, not speculative.",
  },
];

import { useScrollReveal } from "@/hooks/use-scroll-reveal";

export default function LftDefinition() {
  const reveal = useScrollReveal();

  return (
    <section className="py-20">
      <div className="container mx-auto px-4 space-y-12">
        <div ref={reveal} className="space-y-4 max-w-3xl">
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">What is an LFT?</p>
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight">
            Liquidity-Funded Tokens marry storytelling with transparent treasuries
          </h2>
          <p className="text-lg text-muted-foreground">
            Unlike static NFTs, every LFT is born with hard-coded economics. CoinTag sales route dollars into distinct smart-contract buckets so you can publish the exact reserve, creator share, and community rewards backing the collection from minute one.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {pillars.map((pillar, index) => (
            <div
              key={pillar.title}
              ref={reveal}
              style={{ animationDelay: `${0.1 * (index + 1)}s` }}
              className="rounded-2xl border border-border/40 bg-surface/40 p-6 space-y-3"
            >
              <h3 className="text-xl font-semibold text-foreground">{pillar.title}</h3>
              <p className="text-sm text-muted-foreground">{pillar.copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
