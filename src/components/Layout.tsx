import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { Layers, DollarSign, Store, ArrowLeftRight } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [isLiveMobileMarket, setIsLiveMobileMarket] = useState(false);
  const hideShell = pathname === "/";
  const isAssetsRoute = pathname.startsWith("/assets");

  const mobileNavLinks = [
    { label: "Assets", href: "/assets", icon: Layers },
    { label: "Portfolio", href: "/portfolio", icon: DollarSign },
    { label: "Market", href: "/market", icon: Store },
  ];

  const isActivePath = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleMarketModeUpdate = (event: Event) => {
      const detail = (event as CustomEvent<"listed" | "live">).detail;
      if (detail === "live" || detail === "listed") {
        setIsLiveMobileMarket(detail === "live");
      }
    };
    window.addEventListener("trone-market-mode", handleMarketModeUpdate as EventListener);
    return () => window.removeEventListener("trone-market-mode", handleMarketModeUpdate as EventListener);
  }, []);

  useEffect(() => {
    if (!isAssetsRoute) {
      setIsLiveMobileMarket(false);
    }
  }, [isAssetsRoute]);

  const handleMobileMarketToggle = () => {
    const nextMode: "live" | "listed" = isLiveMobileMarket ? "listed" : "live";
    if (!isAssetsRoute) {
      navigate(`/assets?market=${nextMode}`);
      return;
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("trone-market-set", { detail: nextMode }));
    }
  };

  return (
    <div
      className={cn(
        "min-h-screen font-glacial",
        hideShell ? "bg-transparent" : "bg-background"
      )}
    >
      {!hideShell && (
        <>
          <Header />
          <Sidebar />
        </>
      )}
      <main
        className={cn(
          "transition-all duration-300",
          hideShell ? "" : "md:ml-[19rem] md:mr-6",
          !hideShell ? "pb-32 md:pb-8" : ""
        )}
      >
        {children}
      </main>
      {!hideShell && (
        <nav className="md:hidden fixed inset-x-0 bottom-0 z-40">
          <div className="flex items-center justify-between gap-2 bg-background/95 px-3 py-1 backdrop-blur-lg">
            {mobileNavLinks.map(({ label, href, icon: Icon }) => {
              const active = isActivePath(href);
              return (
                <Link
                  key={href}
                  to={href}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-1 px-2 py-1 text-[11px] font-semibold transition-colors",
                    active
                      ? "text-emerald-400"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className={cn("h-4 w-4", active ? "text-emerald-400" : "text-muted-foreground")} />
                  <span>{label}</span>
                </Link>
              );
            })}
            <button
              type="button"
              onClick={handleMobileMarketToggle}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 px-2 py-1 text-[11px] font-semibold transition-colors",
                isAssetsRoute && isLiveMobileMarket
                  ? "text-emerald-400"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-pressed={isAssetsRoute && isLiveMobileMarket}
              aria-label="Toggle market view"
            >
              <ArrowLeftRight
                className={cn(
                  "h-4 w-4",
                  isAssetsRoute && isLiveMobileMarket ? "text-emerald-400" : "text-muted-foreground"
                )}
              />
              <span>{isLiveMobileMarket ? "Live" : "Listed"}</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
};

export default Layout;
