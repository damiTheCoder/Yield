import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Users, Zap, Star } from "lucide-react";
import NFTCard from "./NFTCard";
import nftHero1 from "@/assets/nft-hero-1.jpg";
import nftHero2 from "@/assets/nft-hero-2.jpg";
import nftHero3 from "@/assets/nft-hero-3.jpg";

const Hero = () => {
  const featuredNFTs = [
    {
      image: nftHero1,
      title: "Shadow Critters",
      creator: "CryptoArt",
      price: "10.94",
      likes: 124,
      views: 1502,
      priceChange: "+ 4.2%"
    },
    {
      image: nftHero2,
      title: "Pudgy Penguins",
      creator: "PudgyPenguins",
      price: "4.35",
      likes: 89,
      views: 987,
      priceChange: "+ 1.7%"
    },
    {
      image: nftHero3,
      title: "Chimpers",
      creator: "ChimpersNFT",
      price: "0.63",
      likes: 156,
      views: 2103,
      priceChange: "+ 5.2%"
    }
  ];

  return (
    <section className="relative overflow-hidden py-20">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-surface border border-border text-sm">
                <Star className="h-4 w-4 mr-2" />
                Minting now
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight text-foreground">
                Discover, Create, and Trade NFTs
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-lg">
                The multi-chain NFT marketplace where you can mint, buy, and sell digital collectibles across multiple blockchains.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="default" size="lg" className="group">
                Explore Collections
                <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-smooth" />
              </Button>
              <Button variant="outline" size="lg">
                Create NFT
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="h-6 w-6 text-foreground" />
                </div>
                <div className="text-2xl font-bold text-foreground">$0.94</div>
                <div className="text-sm text-muted-foreground">Floor 24h</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Users className="h-6 w-6 text-foreground" />
                </div>
                <div className="text-2xl font-bold text-foreground">$4,464</div>
                <div className="text-sm text-muted-foreground">Volume 24h</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Zap className="h-6 w-6 text-foreground" />
                </div>
                <div className="text-2xl font-bold text-foreground">Community</div>
                <div className="text-sm text-muted-foreground">Verified</div>
              </div>
            </div>
          </div>

          {/* Featured NFTs */}
          <div className="space-y-6">
            <div className="text-center lg:text-left">
              <h3 className="text-2xl font-bold mb-2 text-foreground">Trending Collections</h3>
              <p className="text-muted-foreground">Top performing NFTs this week</p>
            </div>
            
            <div className="grid gap-4">
              {featuredNFTs.slice(0, 2).map((nft, index) => (
                <div key={index} className="transform hover:scale-105 transition-smooth">
                  <NFTCard {...nft} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;