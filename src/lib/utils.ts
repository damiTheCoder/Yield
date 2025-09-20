import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, options?: { decimals?: number; symbol?: string }) {
  const decimals = options?.decimals ?? (value >= 100 ? 2 : 2);
  const symbol = options?.symbol ?? "$";
  return (
    symbol +
    Number(value)
      .toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
  );
}

export function formatCurrencyK(value: number, decimals: number = 2, symbol: string = "$") {
  const abs = Math.abs(value);
  if (abs >= 1000) {
    const k = value / 1000;
    const fixed = Math.abs(k) >= 100 ? k.toFixed(0) : k.toFixed(1);
    return `${symbol}${fixed}K`;
  }
  return `${symbol}${value.toFixed(decimals)}`;
}
