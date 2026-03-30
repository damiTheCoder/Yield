import { CheckCircle2, Compass, LineChart, Sparkles } from "lucide-react";

const steps = [
  {
    icon: Compass,
    title: "Design the Hunt",
    description:
      "Shape your narrative, choose artifacts, and calibrate the CoinTag price. Decide the supply, discovery rate, and liquidity targets for the cycle.",
    takeaways: ["Upload artifact media + lore", "Preview programmable revenue split", "Set discovery parameters"],
  },
  {
    icon: LineChart,
    title: "Stream Value Automatically",
    description:
      "LaunchPad executes your split the moment a CoinTag sells—routing liquidity, reserve growth, creator pay, and future seed capital instantly.",
    takeaways: ["Live dashboards update per sale", "Reserve growth auto-seeds next cycle"],
  },
  {
    icon: Sparkles,
    title: "Activate Finders",
    description:
      "Collectors buy CoinTags to enter hunts, surface LFTs, redeem at live LPU, or convert to yield. Everything is transparent and gamified.",
    takeaways: ["Finder leaderboards & telemetry", "Predictable redemption math"],
  },
  {
    icon: CheckCircle2,
    title: "Cycle Forward",
    description:
      "Close the chapter when redemption thresholds hit. Liquidity rolls over, new artifacts unlock, and your community keeps compounding value.",
    takeaways: ["One-click cycle resets", "Automatic treasury rollovers"],
  },
];

const TrendingSection = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-background via-surface/30 to-background">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">How an LFT campaign flows</h2>
          <p className="text-lg text-muted-foreground">
            We automate the liquidity choreography so you can focus on worldbuilding. Follow the guided runway from the first CoinTag to the next seeded cycle.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {steps.map((step) => (
            <div key={step.title} className="rounded-2xl border border-border/40 bg-surface/40 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <step.icon className="h-6 w-6 text-foreground" />
                <h3 className="text-xl font-semibold text-foreground">{step.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{step.description}</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {step.takeaways.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-foreground/80" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrendingSection;
