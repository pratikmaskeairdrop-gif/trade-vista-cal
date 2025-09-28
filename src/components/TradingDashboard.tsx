import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TradeEntryForm } from "./TradeEntryForm";
import { TradingCalendar } from "./TradingCalendar";
import { StatsCards } from "./StatsCards";
import { PlusCircle, TrendingUp, Calendar, Settings } from "lucide-react";
import tradingHero from "@/assets/trading-hero.jpg";

export interface Trade {
  id: string;
  pair: string;
  entry: number;
  exit: number;
  size: number;
  profit: number;
  date: Date;
  isWin: boolean;
}

const TradingDashboard = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [displayMode, setDisplayMode] = useState<"$" | "RR">("$");

  const addTrade = (trade: Omit<Trade, "id">) => {
    const newTrade: Trade = {
      ...trade,
      id: crypto.randomUUID(),
    };
    setTrades([...trades, newTrade]);
    setShowAddForm(false);
  };

  const totalProfit = trades.reduce((sum, trade) => sum + trade.profit, 0);
  const winRate = trades.length > 0 ? (trades.filter(trade => trade.isWin).length / trades.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-64 overflow-hidden rounded-b-3xl">
        <img 
          src={tradingHero} 
          alt="Trading Dashboard" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-background/40" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2 text-foreground">
              Trading Journal Pro
            </h1>
            <p className="text-xl text-muted-foreground">
              Track, analyze, and optimize your trading performance
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 space-y-8">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="px-4 py-2">
              <TrendingUp className="w-4 h-4 mr-2" />
              {trades.length} Trades Logged
            </Badge>
            <Badge 
              variant={totalProfit >= 0 ? "default" : "destructive"} 
              className={`px-4 py-2 ${totalProfit >= 0 ? "gradient-success" : "gradient-destructive"}`}
            >
              Total P&L: {displayMode === "$" ? `$${totalProfit.toFixed(2)}` : `${totalProfit.toFixed(2)}R`}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setDisplayMode(displayMode === "$" ? "RR" : "$")}
            >
              <Settings className="w-4 h-4 mr-2" />
              Display: {displayMode}
            </Button>
            <Button 
              onClick={() => setShowAddForm(true)}
              className="gradient-primary"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Trade
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <StatsCards trades={trades} displayMode={displayMode} />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar View */}
          <div className="lg:col-span-2">
            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Trading Calendar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TradingCalendar trades={trades} displayMode={displayMode} />
              </CardContent>
            </Card>
          </div>

          {/* Recent Trades */}
          <div>
            <Card className="trading-card">
              <CardHeader>
                <CardTitle>Recent Trades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {trades.slice(-5).reverse().map((trade) => (
                    <div 
                      key={trade.id}
                      className={`p-3 rounded-lg border ${
                        trade.isWin ? "profit-positive" : "profit-negative"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{trade.pair}</p>
                          <p className="text-sm text-muted-foreground">
                            {trade.date.toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${trade.isWin ? "text-green-400" : "text-red-400"}`}>
                            {displayMode === "$" ? `$${trade.profit.toFixed(2)}` : `${trade.profit.toFixed(2)}R`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Size: ${trade.size.toFixed(0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {trades.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">
                      No trades yet. Add your first trade to get started!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Trade Entry Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md">
              <TradeEntryForm 
                onAddTrade={addTrade}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TradingDashboard;