export type OrderSide = "buy" | "sell";

export type HybridDexOrder = {
  id: string;
  owner: "external" | "user";
  source: "aggregated" | "limit";
  type: "sell";
  price: number;
  quantity: number;
  remaining: number;
  status: "open" | "filled" | "cancelled";
  createdAt: number;
};

export type HybridDexTransaction = {
  id: string;
  timestamp: number;
  type: OrderSide;
  price: number;
  amount: number;
  counterparty: "external" | "user";
};

export type HybridDexState = {
  currentPrice: number;
  tradingFee: number;
  sellers: HybridDexOrder[];
  transactions: HybridDexTransaction[];
};

export type HybridDexMetrics = {
  vwapPrice: number;
  lowerBound: number;
  upperBound: number;
  validSellers: HybridDexOrder[];
  activeSellerCount: number;
  validSellerCount: number;
};

export const HYBRID_DEX_PRICE_WINDOW = 0.05;

export function seedAggregatedSellers(): HybridDexOrder[] {
  const now = Date.now();
  const base: Array<{ id: string; price: number; quantity: number }> = [
    { id: "S1", price: 12.5, quantity: 1000 },
    { id: "S2", price: 13.25, quantity: 750 },
    { id: "S3", price: 13.75, quantity: 500 },
    { id: "S4", price: 14.0, quantity: 300 },
    { id: "S5", price: 14.5, quantity: 200 },
    { id: "S6", price: 12.8, quantity: 600 },
    { id: "S7", price: 13.6, quantity: 400 },
  ];

  return base.map((entry, index) => ({
    id: entry.id,
    owner: "external" as const,
    source: "aggregated" as const,
    type: "sell" as const,
    price: entry.price,
    quantity: entry.quantity,
    remaining: entry.quantity,
    status: "open" as const,
    createdAt: now - index * 1000,
  }));
}

export function computeHybridDexMetrics(state: HybridDexState): HybridDexMetrics {
  const activeSellers = state.sellers.filter(
    (order) => order.status === "open" && order.remaining > 0
  );
  const sorted = [...activeSellers].sort((a, b) => a.price - b.price);
  const outlierCount = Math.floor(sorted.length * 0.1);

  let cleaned = sorted;
  if (outlierCount > 0 && sorted.length > outlierCount * 2) {
    cleaned = sorted.slice(outlierCount, sorted.length - outlierCount);
  }

  let vwapPrice = state.currentPrice;
  if (state.transactions.length > 0) {
    const recentTrades = state.transactions.slice(-10);
    const totalVolume = recentTrades.reduce((sum, trade) => sum + trade.amount, 0);
    const weighted = recentTrades.reduce(
      (sum, trade) => sum + trade.price * trade.amount,
      0
    );
    vwapPrice = totalVolume > 0 ? weighted / totalVolume : state.currentPrice;
  } else if (cleaned.length > 0) {
    const totalVolume = cleaned.reduce((sum, seller) => sum + seller.remaining, 0);
    const weighted = cleaned.reduce(
      (sum, seller) => sum + seller.price * seller.remaining,
      0
    );
    vwapPrice = totalVolume > 0 ? weighted / totalVolume : state.currentPrice;
  }

  const lowerBound = vwapPrice * (1 - HYBRID_DEX_PRICE_WINDOW);
  const upperBound = vwapPrice * (1 + HYBRID_DEX_PRICE_WINDOW);

  const validSellers = cleaned
    .filter((seller) => seller.price >= lowerBound && seller.price <= upperBound)
    .sort((a, b) => a.price - b.price);

  return {
    vwapPrice,
    lowerBound,
    upperBound,
    validSellers,
    activeSellerCount: activeSellers.length,
    validSellerCount: validSellers.length,
  };
}

export function isPriceWithinFairWindow(
  price: number,
  metrics: HybridDexMetrics
): boolean {
  return price >= metrics.lowerBound && price <= metrics.upperBound;
}
