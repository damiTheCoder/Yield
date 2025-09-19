import { Button } from "@/components/ui/button";
import { 
  Palette, 
  Music, 
  Camera, 
  Gamepad2, 
  Trophy, 
  Sparkles,
  ArrowRight 
} from "lucide-react";

const Categories = () => {
  const categories = [
    {
      icon: Palette,
      title: "Art",
      description: "Digital artwork and illustrations",
      count: "125K+",
      color: "text-neon-purple",
      bgColor: "bg-neon-purple/10"
    },
    {
      icon: Music,
      title: "Music",
      description: "Audio files and music NFTs",
      count: "45K+",
      color: "text-neon-cyan",
      bgColor: "bg-neon-cyan/10"
    },
    {
      icon: Camera,
      title: "Photography",
      description: "Unique digital photographs",
      count: "78K+",
      color: "text-neon-pink",
      bgColor: "bg-neon-pink/10"
    },
    {
      icon: Gamepad2,
      title: "Gaming",
      description: "In-game items and collectibles",
      count: "92K+",
      color: "text-neon-purple",
      bgColor: "bg-neon-purple/10"
    },
    {
      icon: Trophy,
      title: "Sports",
      description: "Sports memorabilia and moments",
      count: "34K+",
      color: "text-neon-cyan",
      bgColor: "bg-neon-cyan/10"
    },
    {
      icon: Sparkles,
      title: "Metaverse",
      description: "Virtual world assets",
      count: "56K+",
      color: "text-neon-pink",
      bgColor: "bg-neon-pink/10"
    }
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-foreground">
            Explore by <span className="text-gradient">Category</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Find the perfect NFTs across diverse categories and discover new worlds of digital creativity
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {categories.map((category, index) => (
            <div
              key={index}
              className="group cursor-pointer bg-surface border border-border rounded-xl p-6 transition-smooth hover:border-neon-purple/50 hover:shadow-glow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${category.bgColor}`}>
                  <category.icon className={`h-6 w-6 ${category.color}`} />
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-neon-purple group-hover:translate-x-1 transition-smooth" />
              </div>
              
              <h3 className="text-xl font-semibold mb-2 text-foreground group-hover:text-neon-purple transition-smooth">
                {category.title}
              </h3>
              
              <p className="text-muted-foreground mb-4">
                {category.description}
              </p>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neon-purple">
                  {category.count} items
                </span>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-smooth">
                  Explore
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button variant="gradient" size="lg">
            View All Categories
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Categories;