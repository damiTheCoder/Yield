import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";

const COINGECKO_WIDGET_SRC = "https://widgets.coingecko.com/gecko-coin-price-marquee-widget.js";

export default function MarketTickerTape({ className }: { className?: string }) {
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.querySelector(`script[src="${COINGECKO_WIDGET_SRC}"]`)) return;

    const script = document.createElement("script");
    script.src = COINGECKO_WIDGET_SRC;
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <section className={cn("mb-4 overflow-hidden dark:rounded-none dark:bg-transparent", className)}>
      {React.createElement("gecko-coin-price-marquee-widget", {
        key: isDarkTheme ? "dark" : "light",
        locale: "en",
        "coin-ids": "global-dollar,gho,aave,monad,usd-coin,polymarket",
        "initial-currency": "usd",
        "dark-mode": isDarkTheme ? "true" : "false",
        "transparent-background": isDarkTheme ? "true" : "false",
      })}
    </section>
  );
}
