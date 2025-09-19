import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Zap } from "lucide-react";

const DropsSection = () => {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        {/* Featured Drop */}
        <div className="relative mb-16 rounded-2xl overflow-hidden bg-gradient-card border border-border">
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-background/60" />
          
          <div className="relative p-8 lg:p-12">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="bg-success text-white">
                    <Clock className="h-3 w-3 mr-1" />
                    Minting now
                  </Badge>
                </div>
                
                <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
                  Remilitia
                </h2>
                
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span>by Remilita001</span>
                  <span>on</span>
                  <div className="flex items-center gap-1">
                    <span className="text-base">⟠</span>
                    <span>Ethereum</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-foreground">Free mint</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Minted</span>
                      <span className="text-foreground">1,234 / 10,000</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-foreground h-2 rounded-full w-[12%]" />
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Fee</span>
                    <span className="text-foreground">0.001 ETH</span>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button variant="default" size="lg">
                    Mint Now
                  </Button>
                  <Button variant="outline" size="lg">
                    View Collection
                  </Button>
                </div>
              </div>
              
              <div className="relative">
                <div className="aspect-square bg-surface rounded-xl border border-border p-8 flex items-center justify-center">
                  <div className="text-6xl">🎨</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* More Drops */}
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-4 text-foreground">More Drops</h3>
          <Button variant="outline">
            View All Drops
          </Button>
        </div>
      </div>
    </section>
  );
};

export default DropsSection;