import { Button } from "@/components/ui/button";
import { Heart, Eye } from "lucide-react";

interface NFTCardProps {
  image: string;
  title: string;
  creator: string;
  price: string;
  likes?: number;
  views?: number;
}

const NFTCard = ({ image, title, creator, price, likes = 0, views = 0 }: NFTCardProps) => {
  return (
    <div className="group cursor-pointer">
      <div className="relative overflow-hidden rounded-xl bg-surface border border-border shadow-card transition-smooth hover:shadow-glow hover:border-neon-purple/50">
        {/* Image */}
        <div className="aspect-square overflow-hidden">
          <img 
            src={image} 
            alt={title}
            className="w-full h-full object-cover transition-smooth group-hover:scale-110"
          />
          
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-smooth flex items-end p-4">
            <div className="flex gap-2 w-full">
              <Button variant="gradient" size="sm" className="flex-1">
                Buy Now
              </Button>
              <Button variant="neon" size="sm">
                <Heart className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-lg text-foreground group-hover:text-neon-purple transition-smooth">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground">by {creator}</p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Current Price</p>
              <p className="font-bold text-neon-purple text-lg">{price} ETH</p>
            </div>
            
            <div className="flex items-center gap-3 text-muted-foreground text-sm">
              <div className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                <span>{likes}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{views}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NFTCard;