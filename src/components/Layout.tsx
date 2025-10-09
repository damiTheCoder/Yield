import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import Header from "./Header";
import Sidebar from "./Sidebar";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { pathname } = useLocation();
  const hideShell = pathname === "/";

  return (
    <div className="min-h-screen bg-background">
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
        )}
      >
        {children}
      </main>
    </div>
  );
};

export default Layout;
