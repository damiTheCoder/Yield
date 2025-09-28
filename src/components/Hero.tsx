import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

export default function Hero() {
  const sectionRef = useScrollReveal<HTMLDivElement>();

  return (
    <section className="relative overflow-hidden py-20">
      <div ref={sectionRef} className="container mx-auto px-4 opacity-0">
        <div className="max-w-4xl space-y-10">
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-surface border border-border text-sm uppercase tracking-wide">
                Liquidity-Backed Collectibles
              </div>

              <h1 className="text-5xl lg:text-6xl font-bold leading-tight text-foreground">
                Launch LFTs with verifiable reserve and real-time revenue
              </h1>

              <p className="text-xl text-muted-foreground max-w-2xl">
                Liquidity-Funded Tokens (LFTs) blend collectible storytelling with on-chain treasury mechanics. Every mint auto-routes revenue into creator payouts, holder rewards, and reusable liquidity so your community always sees what backs the floor.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="default" size="lg" className="group">
                Launch Your Campaign
                <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-smooth" />
              </Button>
              <Button variant="outline" size="lg">
                View Live Revenues
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
