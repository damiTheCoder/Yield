import { Button } from "@/components/ui/button";
import { Coins, HeartHandshake, Rocket } from "lucide-react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const highlights = [
  {
    icon: Rocket,
    title: "Launch quickly",
    summary: "Guided setup and prebuilt tokenomics get your campaign live without spreadsheets or custom code.",
  },
  {
    icon: Coins,
    title: "See every dollar",
    summary: "Revenue streams into creator pay, liquidity, holder rewards, and reserve growth the instant tags sell.",
  },
  {
    icon: HeartHandshake,
    title: "Reward believers",
    summary: "Finders redeem at live LPU or roll into yield, keeping collectors excited well past mint day.",
  },
];

const Categories = () => {
  const reveal = useScrollReveal();

  return (
    <section className="py-16">
      <div className="container mx-auto px-4 space-y-12">
        <div ref={reveal} className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-3xl font-bold text-foreground">Why creators choose LFTs</h2>
          <p className="text-base text-muted-foreground">
            A lean launch stack that keeps liquidity, storytelling, and community aligned.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {highlights.map((item, index) => (
            <div
              key={item.title}
              ref={reveal}
              style={{ animationDelay: `${0.1 * (index + 1)}s` }}
              className="rounded-2xl border border-border/40 bg-surface/40 p-6 space-y-3"
            >
              <item.icon className="h-6 w-6 text-foreground" />
              <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.summary}</p>
            </div>
          ))}
        </div>

        <div ref={reveal} style={{ animationDelay: "0.4s" }} className="rounded-2xl border border-border/40 bg-surface/40 p-8 text-center space-y-4">
          <h3 className="text-2xl font-semibold text-foreground">Ready to launch?</h3>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Deploy your first liquidity-funded collection in minutes and watch reserve charts update from the very first CoinTag.
          </p>
          <div className="flex flex-col sm:flex-row sm:justify-center gap-3">
            <Button size="lg">Start Building</Button>
            <Button variant="outline" size="lg">Talk to us</Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Categories;
