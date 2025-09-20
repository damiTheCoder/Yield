import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Search, Menu, Gift } from "lucide-react";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-foreground">YIELD</h1>
        </div>

        {/* Navigation (desktop/tablet) */}
        <nav className="hidden md:flex flex-1 mx-4 items-center space-x-6 text-sm md:text-base">
          <a href="/assets" className="text-foreground hover:text-foreground/80 transition-smooth font-medium">Assets</a>
          <a href="/coin-tags" className="text-foreground hover:text-foreground/80 transition-smooth font-medium">CoinTags</a>
          <a href="/discover" className="text-foreground hover:text-foreground/80 transition-smooth font-medium">Discover</a>
          <a href="/portfolio" className="text-foreground hover:text-foreground/80 transition-smooth font-medium">Portfolio</a>
          <a href="/market" className="text-foreground hover:text-foreground/80 transition-smooth font-medium">Market</a>
          <a href="/lft" className="text-foreground hover:text-foreground/80 transition-smooth font-medium">Simulator</a>
        </nav>

        {/* Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder="Search collections" 
              className="pl-10 bg-surface border-border rounded-lg"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Search className="h-4 w-4" />
          </Button>
          
          <Button variant="ghost" className="hidden lg:flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Earn Points
          </Button>
          
          <Button variant="yellow" size="sm" className="hidden lg:block">
            Get $RARI
          </Button>
          
          <Button variant="default" size="sm">
            Connect
          </Button>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="top" className="w-full bg-background/95 backdrop-blur border-b border-border/50">
              <SheetHeader className="mb-8 text-left">
                <SheetTitle className="text-2xl font-semibold text-foreground">Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col space-y-6 text-3xl font-semibold">
                <SheetClose asChild>
                  <a href="/assets" className="transition-smooth hover:text-foreground/80">Assets</a>
                </SheetClose>
                <SheetClose asChild>
                  <a href="/coin-tags" className="transition-smooth hover:text-foreground/80">CoinTags</a>
                </SheetClose>
                <SheetClose asChild>
                  <a href="/discover" className="transition-smooth hover:text-foreground/80">Discover</a>
                </SheetClose>
                <SheetClose asChild>
                  <a href="/portfolio" className="transition-smooth hover:text-foreground/80">Portfolio</a>
                </SheetClose>
                <SheetClose asChild>
                  <a href="/market" className="transition-smooth hover:text-foreground/80">Market</a>
                </SheetClose>
                <SheetClose asChild>
                  <a href="/lft" className="transition-smooth hover:text-foreground/80">Simulator</a>
                </SheetClose>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
