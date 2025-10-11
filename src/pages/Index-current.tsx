import { useState, useEffect } from "react";
import { ArrowRight, Menu, X, ExternalLink, Shield, Zap, TrendingUp, Users, Layers, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

// Statistics data
const stats = [
  { value: "$2.4M", label: "Total Volume" },
  { value: "15.2K", label: "Total Users" },
  { value: "$127K", label: "24 Hour Volume" },
  { value: "8.7K", label: "LFTs Created" },
];

// Features data
const features = [
  {
    icon: TrendingUp,
    title: "Self-Appreciating Liquidity",
    description: "10% of every purchase flows directly into the liquidity pool. Watch your guaranteed redemption value increase as others join the hunt.",
  },
  {
    icon: Shield,
    title: "Guaranteed Value Floor",
    description: "Every LFT is backed by locked funds. Your floor value can only go up, never down during active cycles.",
  },
  {
    icon: Zap,
    title: "Real-Time Growth",
    description: "No action required—just hold and appreciate. LFTs represent redeemable liquidity reserves that grow automatically.",
  },
  {
    icon: Layers,
    title: "Revolutionary Asset Class",
    description: "Combining the collectibility of NFTs, liquidity backing of bonds, and engagement mechanics of skill-based gaming.",
  },
  {
    icon: Users,
    title: "Creator Economics",
    description: "Artists and developers can lock real funds to create LFTs with verifiable on-chain reserves that cannot be withdrawn.",
  },
  {
    icon: Lock,
    title: "Transparent & Secure",
    description: "All reserves are verifiable on-chain with total transparency. View liquidity flow and the whole process without limits.",
  },
];

// Navigation component
const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { label: "Assets", href: "/assets" },
    { label: "LaunchPad", href: "/coin-tags" },
    { label: "Portfolio", href: "/portfolio" },
    { label: "Market", href: "/market" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img
              src="/OPY.png"
              alt="Openyield logo"
              className="h-8 w-8 rounded-lg object-cover"
            />
            <span className="text-xl font-bold tracking-tight">OPY</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-foreground hover:bg-muted/50 transition-colors"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 border-t border-border/50">
              {navItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => {
                    navigate(item.href);
                    setIsMenuOpen(false);
                  }}
                  className="block px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors w-full text-left"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default function Index() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/assets');
  };

  const handleBuild = () => {
    navigate('/coin-tags');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-6">
              The Future of{" "}
              <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
                Digital Assets
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Setting the bar for liquidity and trading in DeFi—and making sure it's pretty damn high.
              Discover Liquidity Funded Tokens with guaranteed value floors.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={handleGetStarted} className="text-base px-8 py-3">
                Trade on OpenYield
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={handleBuild} className="text-base px-8 py-3">
                Build on OpenYield
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-foreground mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground uppercase tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="p-6 rounded-2xl border border-border/50 bg-card/50 hover:bg-card/80 transition-colors">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              How Liquidity Funded Tokens Work
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A revolutionary approach to digital asset ownership with guaranteed value floors and automatic appreciation.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Creator Locks Initial Liquidity</h3>
                  <p className="text-muted-foreground">An artist or developer locks real funds ($10,000) to create 100 LFTs. Each starts with a base Liquidity Per Unit (LPU) of $100.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Community Hunt Begins</h3>
                  <p className="text-muted-foreground">Your LFT gets listed for community hunting. 10% of each purchase goes straight into the communal liquidity pool, boosting everyone's LPU.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Instant Redemption</h3>
                  <p className="text-muted-foreground">At any point, you can redeem your LFT for its current LPU value. No waiting for buyers, no market manipulation—just instant liquidity.</p>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <img
                src="/hero Image.png"
                alt="How LFTs work"
                className="w-full h-auto rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
            Ready to Experience the Future?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of users already trading and building on OpenYield. Discover digital assets with real value backing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={handleGetStarted} className="text-base px-8 py-3">
              Start Trading Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8 py-3">
              View Documentation
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img
                  src="/OPY.png"
                  alt="Openyield logo"
                  className="h-8 w-8 rounded-lg object-cover"
                />
                <span className="text-xl font-bold">OPY</span>
              </div>
              <p className="text-muted-foreground">
                The future of digital asset ownership with guaranteed value floors and automatic appreciation.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground mb-4">Product</h3>
              <div className="space-y-2">
                <button onClick={() => navigate('/assets')} className="block text-muted-foreground hover:text-foreground transition-colors">Assets</button>
                <button onClick={() => navigate('/market')} className="block text-muted-foreground hover:text-foreground transition-colors">Market</button>
                <button onClick={() => navigate('/portfolio')} className="block text-muted-foreground hover:text-foreground transition-colors">Portfolio</button>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground mb-4">Developers</h3>
              <div className="space-y-2">
                <button onClick={() => navigate('/coin-tags')} className="block text-muted-foreground hover:text-foreground transition-colors">LaunchPad</button>
                <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">Documentation</a>
                <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">API</a>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground mb-4">Community</h3>
              <div className="space-y-2">
                <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">Discord</a>
                <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">Twitter</a>
                <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">GitHub</a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} OpenYield. All rights reserved.
            </p>
            <div className="flex items-center gap-6 mt-4 sm:mt-0">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Security</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}