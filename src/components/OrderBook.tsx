import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatCurrencyK } from '@/lib/utils';
import { TrendingUp, TrendingDown, Clock, BookOpen } from 'lucide-react';

interface Transaction {
  timestamp: number;
  price: number;
  amount: number;
  type: 'buy' | 'sell';
}

interface Seller {
  id: string;
  price: number;
  quantity: number;
  active: boolean;
}

interface OrderBookProps {
  sellers: Seller[];
  transactions: Transaction[];
  currentPrice: number;
  vwapPrice: number;
}

export default function OrderBook({ sellers, transactions, currentPrice, vwapPrice }: OrderBookProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Dynamic sell orders based on current market conditions and trading activity
  const recentTrades = transactions.slice(-3); // Last 3 trades for market adjustment
  const marketAdjustment = recentTrades.length > 0 ? 
    recentTrades.reduce((sum, tx) => sum + (tx.type === 'buy' ? 0.01 : -0.01), 0) : 0;

  const sellOrders = sellers
    .filter(s => s.active && s.quantity > 0)
    .map(seller => ({
      ...seller,
      // Adjust prices based on recent trading activity
      price: seller.price * (1 + marketAdjustment),
      // Adjust quantities based on market activity
      quantity: Math.max(100, seller.quantity - (recentTrades.length * 50))
    }))
    .sort((a, b) => a.price - b.price); // Cheapest first

  // Generate buy orders based on real trading activity
  const buyOrders = transactions
    .filter(tx => tx.type === 'buy')
    .slice(-5) // Last 5 buy transactions
    .map((tx, index) => ({
      id: `B${tx.timestamp}`,
      price: tx.price * 0.99, // Slightly below execution price for realistic bid
      quantity: tx.amount * (0.8 + Math.random() * 0.4), // Realistic quantity variation
      type: 'buy' as const,
      timestamp: tx.timestamp
    }))
    .sort((a, b) => b.price - a.price); // Highest bid first

  // Recent executed trades with HybridDEX execution details (last 15)
  const executedTrades = transactions
    .slice(-15)
    .map(trade => ({
      ...trade,
      // Add execution method based on HybridDEX logic
      executionMethod: trade.type === 'buy' ? 'Orderbook Aggregation' : 'VWAP Execution',
      // Calculate price impact from VWAP
      priceImpact: ((trade.price - vwapPrice) / vwapPrice * 100).toFixed(2)
    }))
    .reverse(); // Most recent first

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2"
          onClick={() => setIsOpen(true)}
        >
          <BookOpen className="h-4 w-4" />
          View Order Book
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            HybridDEX Order Book - cLT Trading
          </DialogTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div>Current Price: <span className="font-mono font-semibold text-foreground">{formatCurrency(currentPrice)}</span></div>
            <div>VWAP: <span className="font-mono font-semibold text-foreground">{formatCurrency(vwapPrice)}</span></div>
          </div>
        </DialogHeader>

        {/* Order Book Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          
          {/* Sell Orders - Left Side */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-red-600">
                <TrendingDown className="h-5 w-5" />
                Sell Orders (Ask)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {/* Header */}
                <div className="grid grid-cols-3 gap-2 px-4 py-2 text-xs font-medium text-muted-foreground bg-muted/50">
                  <div>Price (USDC)</div>
                  <div className="text-right">Quantity (cLT)</div>
                  <div className="text-right">Total (USDC)</div>
                </div>
                
                {/* Sell Order Rows */}
                {sellOrders.length === 0 ? (
                  <div className="px-4 py-8 text-center text-muted-foreground">
                    No sell orders available
                  </div>
                ) : (
                  sellOrders.map((order) => (
                    <div 
                      key={order.id} 
                      className="grid grid-cols-3 gap-2 px-4 py-2 text-sm hover:bg-red-50 border-l-2 border-red-200"
                    >
                      <div className="font-mono text-red-600 font-medium">
                        {formatCurrency(order.price)}
                      </div>
                      <div className="text-right font-mono">
                        {order.quantity.toLocaleString()}
                      </div>
                      <div className="text-right font-mono text-muted-foreground">
                        {formatCurrency(order.price * order.quantity)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Buy Orders - Right Side */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-green-600">
                <TrendingUp className="h-5 w-5" />
                Buy Orders (Bid)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {/* Header */}
                <div className="grid grid-cols-3 gap-2 px-4 py-2 text-xs font-medium text-muted-foreground bg-muted/50">
                  <div>Price (USDC)</div>
                  <div className="text-right">Quantity (cLT)</div>
                  <div className="text-right">Total (USDC)</div>
                </div>
                
                {/* Buy Order Rows */}
                {buyOrders.length === 0 ? (
                  <div className="px-4 py-8 text-center text-muted-foreground">
                    <div className="text-sm">No active buy orders</div>
                    <div className="text-xs mt-1">Start trading to see real buy activity</div>
                  </div>
                ) : (
                  buyOrders.map((order) => (
                  <div 
                    key={order.id} 
                    className="grid grid-cols-3 gap-2 px-4 py-2 text-sm hover:bg-green-50 border-l-2 border-green-200"
                  >
                    <div className="font-mono text-green-600 font-medium">
                      {formatCurrency(order.price)}
                    </div>
                    <div className="text-right font-mono">
                      {order.quantity.toLocaleString()}
                    </div>
                    <div className="text-right font-mono text-muted-foreground">
                      {formatCurrency(order.price * order.quantity)}
                    </div>
                  </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Executed Trades - Bottom Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Executed Trades (HybridDEX Logic)
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Trades executed through orderbook aggregation with Smart Price Window Logic
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1">
              {/* Header */}
              <div className="grid grid-cols-5 gap-2 px-4 py-2 text-xs font-medium text-muted-foreground bg-muted/50">
                <div>Time</div>
                <div>Type</div>
                <div className="text-right">Price (USDC)</div>
                <div className="text-right">Amount (cLT)</div>
                <div className="text-right">Impact %</div>
              </div>
              
              {/* Trade Rows */}
              {executedTrades.length === 0 ? (
                <div className="px-4 py-8 text-center text-muted-foreground">
                  No trades executed yet. Start trading to see HybridDEX executions.
                </div>
              ) : (
                executedTrades.map((trade, index) => (
                  <div 
                    key={`${trade.timestamp}-${index}`} 
                    className="grid grid-cols-5 gap-2 px-4 py-2 text-sm hover:bg-muted/30"
                  >
                    <div className="text-muted-foreground font-mono text-xs">
                      {formatTime(trade.timestamp)}
                    </div>
                    <div>
                      <Badge 
                        variant={trade.type === 'buy' ? 'default' : 'destructive'}
                        className={`text-xs ${trade.type === 'buy' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-red-100 text-red-700 hover:bg-red-100'}`}
                      >
                        {trade.type === 'buy' ? '🟢 BUY' : '🔴 SELL'}
                      </Badge>
                    </div>
                    <div className="text-right font-mono font-medium">
                      {formatCurrency(trade.price)}
                    </div>
                    <div className="text-right font-mono">
                      {trade.amount.toFixed(4)}
                    </div>
                    <div className={`text-right font-mono text-xs ${
                      parseFloat(trade.priceImpact) > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {parseFloat(trade.priceImpact) > 0 ? '+' : ''}{trade.priceImpact}%
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* HybridDEX Info */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 animate-pulse"></div>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">HybridDEX Protocol</h4>
              <p className="text-sm text-blue-700">
                Orders are aggregated and executed through Smart Price Window Logic (±5% range). 
                Buying consumes cheapest sellers first, creating natural price discovery through demand and supply.
              </p>
            </div>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}