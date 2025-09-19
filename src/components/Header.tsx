import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, User, ShoppingCart, Menu } from "lucide-react";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gradient">Rarible</h1>
        </div>

        {/* Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder="Search NFTs, collections, creators..." 
              className="pl-10 bg-surface border-border"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden lg:flex items-center space-x-6">
          <a href="#" className="text-foreground hover:text-neon-purple transition-smooth">Explore</a>
          <a href="#" className="text-foreground hover:text-neon-purple transition-smooth">Create</a>
          <a href="#" className="text-foreground hover:text-neon-purple transition-smooth">Collections</a>
        </nav>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <ShoppingCart className="h-4 w-4" />
          </Button>
          <Button variant="neon" size="sm">
            <User className="h-4 w-4 mr-2" />
            Connect Wallet
          </Button>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;