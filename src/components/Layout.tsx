import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { Layers, DollarSign, Bell, ArrowLeftRight } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const hideShell = pathname === "/";
  const [assetsMarketMode, setAssetsMarketMode] = useState<"listed" | "live" | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleAssetsMarketMode = (event: Event) => {
      const detail = (event as CustomEvent<"listed" | "live">).detail;
      if (!detail) return;
      setAssetsMarketMode(detail);
    };

    window.addEventListener("trone-assets-market-mode", handleAssetsMarketMode as EventListener);
    return () => {
      window.removeEventListener("trone-assets-market-mode", handleAssetsMarketMode as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!pathname.startsWith("/assets")) {
      setAssetsMarketMode(null);
    }
  }, [pathname]);

  const handleToggleAssetsMarket = useCallback(() => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("trone-assets-toggle-market"));
  }, []);

  const handleSwitchClick = useCallback(() => {
    if (!pathname.startsWith("/assets")) {
      navigate("/assets");
      return;
    }
    handleToggleAssetsMarket();
  }, [handleToggleAssetsMarket, navigate, pathname]);

  const mobileNavLinks = useMemo(() => {
    const links = [
      { type: "link" as const, label: "Assets", href: "/assets", icon: Layers },
      { type: "link" as const, label: "Portfolio", href: "/portfolio", icon: DollarSign },
      { type: "link" as const, label: "Notifications", href: "/notifications", icon: Bell },
      ({
        type: "action" as const,
        label:
          assetsMarketMode === "live"
            ? "Live"
            : assetsMarketMode === "listed"
              ? "Listed"
              : "Switch",
        icon: ArrowLeftRight,
        active: pathname.startsWith("/assets") && assetsMarketMode === "live",
        onClick: handleSwitchClick,
      } satisfies {
        type: "action";
        label: string;
        icon: typeof ArrowLeftRight;
        active: boolean;
        onClick: () => void;
      }),
    ];

    return links as Array<
      | { type: "link"; label: string; href: string; icon: typeof Layers }
      | {
          type: "action";
          label: string;
          icon: typeof ArrowLeftRight;
          active: boolean;
          onClick: () => void;
        }
    >;
  }, [assetsMarketMode, handleSwitchClick, pathname]);

  const isActivePath = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

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
          hideShell ? "pb-24" : "md:ml-[19rem] md:mr-6 pb-32 md:pb-8"
        )}
      >
        {children}
      </main>
      {!hideShell && (
        <nav className="md:hidden fixed inset-x-0 bottom-0 z-40">
          <div
            className={cn(
              "flex items-center justify-between gap-2 px-3 py-1 backdrop-blur-lg",
              hideShell ? "bg-background/90" : "bg-background/95"
            )}
          >
          {mobileNavLinks.map((item) => {
            if (item.type === "link") {
              const { label, href, icon: Icon } = item;
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
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      active ? "text-emerald-400" : "text-muted-foreground"
                    )}
                  />
                  <span>{label}</span>
                </Link>
              );
            }

            const { label, icon: Icon, active, onClick } = item;
            return (
              <button
                key={`action-${label}`}
                type="button"
                onClick={onClick}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 px-2 py-1 text-[11px] font-semibold transition-colors",
                  active ? "text-emerald-400" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4",
                    active ? "text-emerald-400" : "text-muted-foreground"
                  )}
                />
                <span>{label}</span>
              </button>
            );
          })}
          </div>
        </nav>
      )}
    </div>
  );
};

export default Layout;
