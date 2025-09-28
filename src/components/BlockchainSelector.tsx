import { Lightbulb, Lock, Sigma, Users } from "lucide-react";

const features = [
  {
    icon: Lightbulb,
    title: "Narrative + Liquidity",
    description: "Pair your storytelling with an auditable reserve so fans know exactly what underwrites the floor.",
  },
  {
    icon: Lock,
    title: "Programmable Splits",
    description: "Every CoinTag sale routes value to creators, holders, liquidity, and future cycles instantly.",
  },
  {
    icon: Sigma,
    title: "Cycle Intelligence",
    description: "Real-time dashboards expose sales, reserve growth, and seed allocations across your portfolio.",
  },
  {
    icon: Users,
    title: "Finder Economics",
    description: "Collectors unlock hunts, redeem at live LPU, or convert to yield—always with transparent math.",
  },
];

const BlockchainSelector = () => {
  return (
    <section className="py-12 border-b border-border/40 bg-surface/20">
      <div className="container mx-auto px-4">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-border/40 bg-background/60 p-6 space-y-3"
            >
              <feature.icon className="h-6 w-6 text-foreground" />
              <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlockchainSelector;
