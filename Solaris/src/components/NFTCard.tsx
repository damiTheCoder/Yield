import { Button } from "@/components/ui/button";
import { Heart, Eye } from "lucide-react";

interface NFTCardProps {
  image: string;
  title: string;
  creator: string;
  price: string;
  likes?: number;
  views?: number;
  priceChange?: string;
}

const NFTCard = ({ image, title, creator, price, likes = 0, views = 0, priceChange }: NFTCardProps) => {
  return (
    <div className="group cursor-pointer">
      <div className="relative overflow-hidden rounded-lg bg-card border border-border shadow-card transition-smooth hover:shadow-hover hover:border-accent/50">
        {/* Image */}
        <div className="aspect-square overflow-hidden">
          <img 
            src={image} 
            alt={title}
            className="w-full h-full object-cover transition-smooth group-hover:scale-105"
          />
          
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-smooth flex items-end p-4">
            <div className="flex gap-2 w-full">
              <Button variant="default" size="sm" className="flex-1">
                Buy Now
              </Button>
              <Button variant="outline" size="sm">
                <Heart className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-base text-foreground group-hover:text-foreground/80 transition-smooth">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground">by {creator}</p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-foreground text-base">{price} ETH</p>
              {priceChange && (
                <p className={`text-xs ${priceChange.startsWith('+') ? 'text-success' : 'text-destructive'}`}>
                  {priceChange}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-3 text-muted-foreground text-sm">
              <div className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                <span>{likes}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
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