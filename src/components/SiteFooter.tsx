import { cn } from "@/lib/utils";

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
  return (
    <footer className={cn("bg-background/80", className)}>
      <div className="container mx-auto flex flex-col gap-3 px-4 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div>
            <p className="font-semibold text-foreground">Solaris</p>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Solaris. Liquidity orchestration for tokenized markets.
            </p>
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
