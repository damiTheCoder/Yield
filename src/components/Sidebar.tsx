import { cn } from "@/lib/utils";
import Web3News from "./Web3News";
import {
  Layers,
  Rocket,
  Wallet,
  LineChart,
  Store,
  Bell,
  type LucideIcon,
} from "lucide-react";

const NAV_LINKS: Array<{ label: string; href: string; icon: LucideIcon }> = [
  { label: "Assets", href: "/assets", icon: Layers },
  { label: "LaunchPad", href: "/coin-tags", icon: Rocket },
  { label: "Portfolio", href: "/portfolio", icon: Wallet },
  { label: "Revenue", href: "/revenue", icon: LineChart },
  { label: "Market", href: "/market", icon: Store },
  { label: "Notifications", href: "/notifications", icon: Bell },
];

const Sidebar = () => {
  const currentPath = window.location.pathname;

  return (
    <aside className="hidden md:block fixed left-6 top-6 w-64 z-50">
      <div className="space-y-5">
        <nav className="rounded-2xl border border-border/50 bg-card p-5 shadow-none dark:border-none dark:bg-[#0a0a0f]/95">
          <div className="flex flex-col space-y-1">
            {NAV_LINKS.map((link) => {
              const isActive =
                currentPath === link.href || (link.href !== "/" && currentPath.startsWith(link.href));
              const Icon = link.icon;

              return (
                <a
                  key={link.href}
                  href={link.href}
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
                </a>
              );
            })}
          </div>
        </nav>
        <Web3News variant="sidebar" className="md:w-64" />
        <div className="rounded-2xl border border-border/50 bg-card/80 px-5 py-4 text-sm font-semibold text-muted-foreground dark:border-none dark:bg-[#0a0a0f]/90">
          <span className="block text-xs uppercase tracking-wide text-muted-foreground/70">Platform</span>
          <span className="mt-1 block text-lg font-semibold text-foreground">Openyield</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
