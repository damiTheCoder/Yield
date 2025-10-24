import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";
import Web3News from "./Web3News";
import { Layers, Rocket, DollarSign, LineChart, Bell, type LucideIcon } from "lucide-react";

const NAV_LINKS: Array<{ label: string; href: string; icon: LucideIcon }> = [
  { label: "Assets", href: "/assets", icon: Layers },
  { label: "Portfolio", href: "/portfolio", icon: DollarSign },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "LaunchPad", href: "/coin-tags", icon: Rocket },
  { label: "Revenue", href: "/revenue", icon: LineChart },
];

const Sidebar = () => {
  const { pathname } = useLocation();

  return (
    <aside className="hidden md:block fixed left-6 top-6 w-64 z-50">
      <div className="flex flex-col h-[calc(100vh-3rem)] space-y-5">
        <nav className="rounded-2xl bg-card p-5 shadow-none dark:bg-[#0a0a0f]/95">
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
                    "flex items-center gap-3 px-5 py-3.5 text-sm font-medium rounded-xl transition-colors",
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
            className="block rounded-2xl bg-card/80 px-5 py-4 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 dark:bg-[#0a0a0f]/90 mt-auto mb-[-1.75rem]"
          >
            <span className="block text-xs uppercase tracking-wide text-muted-foreground/70">Platform</span>
            <div className="mt-1 flex items-center gap-2">
              <img 
                src="/OPY.png" 
                alt="Trone" 
                className="h-6 w-6 rounded-md object-cover"
              />
              <span className="text-lg font-semibold text-foreground">Trone</span>
            </div>
          </Link>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
