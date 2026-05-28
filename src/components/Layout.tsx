import { ReactNode, useMemo } from "react";
import { useLocation } from "react-router-dom";
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
  const hideShell = pathname === "/";
  const isHuntPage = pathname.includes("/hunt");

  const mobileNavLinks = useMemo<MobileNavItem[]>(() => {
    return [
      { type: "link", label: "Assets", href: "/assets" },
      { type: "link", label: "Portfolio", href: "/portfolio" },
      { type: "link", label: "Wallet", href: "/wallet" },
      { type: "link", label: "Notifications", href: "/notifications" },
      { type: "link", label: "LaunchPad", href: "/coin-tags" },
      { type: "link", label: "Revenue", href: "/revenue" },
      { type: "link", label: "View all posts", href: "/blog" },
    ];
  }, []);



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
          hideShell ? "pb-16" : "pb-0 md:pb-8"
        )}
      >
        {children}
      </main>
      {!hideShell && !isHuntPage && <SiteFooter className="pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:hidden" />}
    </div>
  );
};

export default Layout;
