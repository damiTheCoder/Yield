import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Users, Zap } from "lucide-react";
import NFTCard from "./NFTCard";
import nftHero1 from "@/assets/nft-hero-1.jpg";
import nftHero2 from "@/assets/nft-hero-2.jpg";
import nftHero3 from "@/assets/nft-hero-3.jpg";

const Hero = () => {
  const featuredNFTs = [
    {
      image: nftHero1,
      title: "Cyber Genesis #001",
      creator: "CyberArt",
      price: "2.5",
      likes: 124,
      views: 1502
    },
    {
      image: nftHero2,
      title: "Abstract Dreams",
      creator: "DigitalMind",
      price: "1.8",
      likes: 89,
      views: 987
    },
    {
      image: nftHero3,
      title: "Mystic Guardian",
      creator: "EtherealArt",
      price: "3.2",
      likes: 156,
      views: 2103
    }
  ];

  return (
    <section className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-hero opacity-50" />
      
      <div className="relative container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-surface border border-neon-purple/30 text-neon-purple text-sm">
                <Zap className="h-4 w-4 mr-2" />
                Discover, Create, Collect
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                <span className="text-gradient">Discover</span>
                <br />
                <span className="text-foreground">Rare Digital</span>
                <br />
                <span className="text-foreground">Art & NFTs</span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-lg">
                The world's first and largest digital marketplace for crypto collectibles and non-fungible tokens (NFTs).
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="gradient" size="lg" className="group">
                Start Exploring
                <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-smooth" />
              </Button>
              <Button variant="neon" size="lg">
                Create NFT
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="h-6 w-6 text-neon-cyan" />
                </div>
                <div className="text-2xl font-bold text-foreground">2.5M+</div>
                <div className="text-sm text-muted-foreground">Total Sales</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Users className="h-6 w-6 text-neon-purple" />
                </div>
                <div className="text-2xl font-bold text-foreground">500K+</div>
                <div className="text-sm text-muted-foreground">Creators</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Zap className="h-6 w-6 text-neon-pink" />
                </div>
                <div className="text-2xl font-bold text-foreground">1.2M+</div>
                <div className="text-sm text-muted-foreground">Collections</div>
              </div>
            </div>
          </div>

          {/* Featured NFTs */}
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2 text-foreground">Featured Today</h3>
              <p className="text-muted-foreground">Handpicked NFTs from top creators</p>
            </div>
            
            <div className="grid gap-4">
              {featuredNFTs.slice(0, 2).map((nft, index) => (
                <div key={index} className="transform hover:scale-105 transition-bounce">
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