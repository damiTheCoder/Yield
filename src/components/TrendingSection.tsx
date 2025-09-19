import { Button } from "@/components/ui/button";
import { TrendingUp, Clock, DollarSign } from "lucide-react";
import NFTCard from "./NFTCard";
import nftTrending1 from "@/assets/nft-trending-1.jpg";
import nftTrending2 from "@/assets/nft-trending-2.jpg";
import nftTrending3 from "@/assets/nft-trending-3.jpg";

const TrendingSection = () => {
  const trendingNFTs = [
    {
      image: nftTrending1,
      title: "Neon Metropolis",
      creator: "FutureVision",
      price: "4.2",
      likes: 234,
      views: 3421
    },
    {
      image: nftTrending2,
      title: "Cosmic Nebula",
      creator: "SpaceArt",
      price: "2.8",
      likes: 187,
      views: 2156
    },
    {
      image: nftTrending3,
      title: "Cyber Warrior",
      creator: "TechnoArt",
      price: "3.5",
      likes: 298,
      views: 4032
    },
    {
      image: nftTrending1,
      title: "Digital Dreams",
      creator: "VirtualMind",
      price: "1.9",
      likes: 145,
      views: 1876
    },
    {
      image: nftTrending2,
      title: "Ethereal Beauty",
      creator: "DreamWeaver",
      price: "2.1",
      likes: 167,
      views: 2234
    },
    {
      image: nftTrending3,
      title: "Future Legends",
      creator: "CyberCreator",
      price: "5.7",
      likes: 412,
      views: 5678
    }
  ];

  const timeFilters = [
    { label: "24h", active: true },
    { label: "7d", active: false },
    { label: "30d", active: false },
    { label: "All time", active: false }
  ];

  return (
    <section className="py-20 bg-gradient-surface">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-12">
          <div className="mb-6 lg:mb-0">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="h-8 w-8 text-neon-purple" />
              <h2 className="text-4xl font-bold text-foreground">Trending NFTs</h2>
            </div>
            <p className="text-lg text-muted-foreground">
              Discover the hottest digital collectibles right now
            </p>
          </div>

          {/* Time Filters */}
          <div className="flex items-center gap-2 bg-surface rounded-lg p-1 border border-border">
            {timeFilters.map((filter, index) => (
              <Button
                key={index}
                variant={filter.active ? "gradient" : "ghost"}
                size="sm"
                className={filter.active ? "" : "text-muted-foreground"}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-3 mb-8">
          {[
            { icon: TrendingUp, label: "Trending", active: true },
            { icon: DollarSign, label: "Top Sales", active: false },
            { icon: Clock, label: "New", active: false }
          ].map((tab, index) => (
            <Button
              key={index}
              variant={tab.active ? "neon" : "outline"}
              className="gap-2"
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </Button>
          ))}
        </div>

        {/* NFT Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {trendingNFTs.map((nft, index) => (
            <div key={index} className="transform hover:scale-105 transition-bounce">
              <NFTCard {...nft} />
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <Button variant="neon" size="lg">
            Load More NFTs
          </Button>
        </div>
      </div>
    </section>
  );
};

export default TrendingSection;