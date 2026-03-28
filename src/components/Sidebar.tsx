import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";
import Web3News from "./Web3News";
import { Layers, Rocket, DollarSign, LineChart, Bell, Wallet, type LucideIcon } from "lucide-react";

const NAV_LINKS: Array<{ label: string; href: string; icon: LucideIcon }> = [
  { label: "Assets", href: "/assets", icon: Layers },
  { label: "Portfolio", href: "/portfolio", icon: DollarSign },
  { label: "Wallet", href: "/wallet", icon: Wallet },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "LaunchPad", href: "/coin-tags", icon: Rocket },
  { label: "Revenue", href: "/revenue", icon: LineChart },
];

const Sidebar = () => {
  const { pathname } = useLocation();

  return (
    <aside className="fixed left-3 top-3 z-50 hidden w-64 md:block">
      <div className="flex h-[calc(100vh-1.5rem)] flex-col space-y-3.5">
        <nav className="rounded-2xl bg-gray-50 p-3.5 backdrop-blur-md dark:bg-[#1a1a1a]/95">
          <div className="flex flex-col space-y-1">
            {NAV_LINKS.map((link) => {
              const isActive =
                pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              const Icon = link.icon;

              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-muted text-foreground dark:bg-neutral-900"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground dark:hover:bg-neutral-900/80",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-colors",
                      isActive ? "text-foreground" : "text-muted-foreground",
                    )}
                  />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </nav>
        
        <div className="flex-1 flex flex-col justify-between min-h-0">
          <Web3News variant="sidebar" className="md:w-64" />
          
          {/* Fixed position logo/project section - positioned to extend below screen */}
          <Link
            to="/"
            className="mt-auto mb-[-1.75rem] block rounded-2xl bg-gray-50 px-4 py-3.5 text-sm font-semibold text-muted-foreground backdrop-blur-md transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 dark:bg-[#1a1a1f]/90"
          >
            <span className="block text-xs uppercase tracking-wide text-muted-foreground/70">Platform</span>
            <div className="mt-1 flex items-center gap-2">
              <img 
                src="/h4.png" 
                alt="Solaris" 
                className="h-6 w-6 rounded-2xl object-cover"
              />
              <span className="text-lg font-semibold text-foreground">Solaris</span>
            </div>
          </Link>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
