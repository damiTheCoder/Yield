import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import Header from "./Header";
import SiteFooter from "./SiteFooter";

interface LayoutProps {
  children: ReactNode;
}

type MobileNavItem =
  | { type: "link"; label: string; href: string }
  | { type: "action"; label: string; active: boolean; onClick: () => void };

const Layout = ({ children }: LayoutProps) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const hideShell = pathname === "/";
  const isHuntPage = pathname.includes("/hunt");
  const [assetsMarketMode, setAssetsMarketMode] = useState<"listed" | "live" | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleAssetsMarketMode = (event: Event) => {
      const detail = (event as CustomEvent<"listed" | "live">).detail;
      if (!detail) return;
      setAssetsMarketMode(detail);
    };

    window.addEventListener("solaris-assets-market-mode", handleAssetsMarketMode as EventListener);
    return () => {
      window.removeEventListener("solaris-assets-market-mode", handleAssetsMarketMode as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!pathname.startsWith("/assets")) {
      setAssetsMarketMode(null);
    }
  }, [pathname]);

  const handleToggleAssetsMarket = useCallback(() => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("solaris-assets-toggle-market"));
  }, []);

  const handleSwitchClick = useCallback(() => {
    if (!pathname.startsWith("/assets")) {
      navigate("/assets");
      return;
    }
    handleToggleAssetsMarket();
  }, [handleToggleAssetsMarket, navigate, pathname]);

  const mobileNavLinks = useMemo<MobileNavItem[]>(() => {
    return [
      { type: "link", label: "Assets", href: "/assets" },
      { type: "link", label: "Portfolio", href: "/portfolio" },
      { type: "link", label: "Wallet", href: "/wallet" },
      { type: "link", label: "Notifications", href: "/notifications" },
      { type: "link", label: "LaunchPad", href: "/coin-tags" },
      { type: "link", label: "Revenue", href: "/revenue" },
      { type: "link", label: "View all posts", href: "/blog" },
      {
        type: "action",
        label:
          assetsMarketMode === "live"
            ? "Live"
            : assetsMarketMode === "listed"
              ? "Listed"
              : "Switch",
        active: pathname.startsWith("/assets") && assetsMarketMode === "live",
        onClick: handleSwitchClick,
      },
    ];
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
          <Header mobileNavItems={mobileNavLinks} />
        </>
      )}
      <main
        className={cn(
          "transition-all duration-300",
          hideShell ? "pb-16" : "pb-8"
        )}
      >
        {children}
      </main>
      {!hideShell && !isHuntPage && <SiteFooter className="sm:hidden" />}
    </div>
  );
};

export default Layout;
