import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Target, Activity } from "lucide-react";
import { Trade } from "./TradingDashboard";

interface StatsCardsProps {
  trades: Trade[];
  displayMode: "$" | "RR";
}

export const StatsCards = ({ trades, displayMode }: StatsCardsProps) => {
  const totalTrades = trades.length;
  const winningTrades = trades.filter(trade => trade.isWin).length;
  const losingTrades = totalTrades - winningTrades;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  
  const totalProfit = trades.reduce((sum, trade) => sum + trade.profit, 0);
  const totalProfitRR = trades.reduce((sum, trade) => sum + trade.profitRR, 0);
  const avgWin = winningTrades > 0 ? trades.filter(trade => trade.isWin).reduce((sum, trade) => sum + (displayMode === "$" ? trade.profit : trade.profitRR), 0) / winningTrades : 0;
  const avgLoss = losingTrades > 0 ? Math.abs(trades.filter(trade => !trade.isWin).reduce((sum, trade) => sum + (displayMode === "$" ? trade.profit : trade.profitRR), 0) / losingTrades) : 0;
  const profitFactor = avgLoss > 0 ? (avgWin * winningTrades) / (avgLoss * losingTrades) : 0;

  const formatValue = (value: number) => {
    return displayMode === "$" ? `$${value.toFixed(2)}` : `${value.toFixed(2)}R`;
  };

  const formatRRValue = (rrValue: number) => {
    return displayMode === "RR" ? `${rrValue.toFixed(2)}R` : `$${(rrValue * (trades[0]?.accountBalance || 100000) * 0.01).toFixed(2)}`;
  };

  const stats = [
    {
      title: "Total P&L",
      value: displayMode === "$" ? formatValue(totalProfit) : `${totalProfitRR.toFixed(2)}R`,
      icon: totalProfit >= 0 ? TrendingUp : TrendingDown,
      trend: totalProfit >= 0 ? "positive" : "negative",
      subtitle: `From ${totalTrades} trades`,
    },
    {
      title: "Win Rate",
      value: `${winRate.toFixed(1)}%`,
      icon: Target,
      trend: winRate >= 50 ? "positive" : "negative",
      subtitle: `${winningTrades}W / ${losingTrades}L`,
    },
    {
      title: "Average Win",
      value: formatValue(avgWin),
      icon: TrendingUp,
      trend: "positive",
      subtitle: `Per winning trade`,
    },
    {
      title: "Profit Factor",
      value: profitFactor.toFixed(2),
      icon: Activity,
      trend: profitFactor >= 1 ? "positive" : "negative",
      subtitle: "Gross profit / Gross loss",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="trading-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon className={`h-3 w-3 sm:h-4 sm:w-4 ${
                stat.trend === "positive" ? "text-green-400" : "text-red-400"
              }`} />
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className={`text-lg sm:text-2xl font-bold mb-1 ${
                stat.trend === "positive" ? "text-green-400" : "text-red-400"
              }`}>
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground hidden sm:block">
                {stat.subtitle}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};