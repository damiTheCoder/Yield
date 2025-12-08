import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";
import { Sun, Moon } from "lucide-react";

type SiteFooterProps = {
  className?: string;
};

const footerLinks = [
  { label: "All assets", href: "/assets/all" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "LaunchPad", href: "/coin-tags" },
  { label: "Revenue", href: "/revenue" },
];

const SiteFooter = ({ className }: SiteFooterProps) => {
  const { theme, setTheme } = useTheme();

  const getMobileThemeButtonClass = (mode: "dark" | "light") =>
    cn(
      "h-8 w-8 rounded-full border border-border/60 flex items-center justify-center text-sm transition-colors",
      theme === mode
        ? mode === "dark"
          ? "bg-white text-black"
          : "bg-neutral-900 text-white"
        : "text-muted-foreground bg-transparent"
    );

  return (
    <footer className={cn("bg-background/80", className)}>
      <div className="container mx-auto flex flex-col gap-3 px-4 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between gap-4 sm:block">
          <div>
            <p className="font-semibold text-foreground">Solaris</p>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Solaris. Liquidity orchestration for tokenized markets.
            </p>
          </div>
          <div className="flex items-center gap-2 sm:hidden">
            <button
              type="button"
              onClick={() => setTheme("light")}
              aria-label="Switch to light theme"
              className={getMobileThemeButtonClass("light")}
            >
              <Sun className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setTheme("dark")}
              aria-label="Switch to dark theme"
              className={getMobileThemeButtonClass("dark")}
            >
              <Moon className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-xs">
          {footerLinks.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-foreground">
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
