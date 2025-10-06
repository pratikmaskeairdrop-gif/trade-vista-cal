import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Trade } from "./TradingDashboard";

interface TradingCalendarProps {
  trades: Trade[];
  displayMode: "$" | "RR";
}

export const TradingCalendar = ({ trades, displayMode }: TradingCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const today = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  // Create calendar grid
  const calendarDays = [];
  
  // Empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getTradesForDate = (day: number) => {
    const targetDate = new Date(year, month, day);
    return trades.filter(trade => {
      const tradeDate = new Date(trade.date);
      return tradeDate.toDateString() === targetDate.toDateString();
    });
  };

  const getWeekData = (weekStart: Date) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const weekTrades = trades.filter(trade => {
      const tradeDate = new Date(trade.date);
      return tradeDate >= weekStart && tradeDate <= weekEnd;
    });

    const weekProfit = weekTrades.reduce((sum, trade) => sum + trade.profit, 0);
    const weekProfitRR = weekTrades.reduce((sum, trade) => sum + trade.profitRR, 0);
    const weekWins = weekTrades.filter(trade => trade.isWin).length;
    const weekLosses = weekTrades.filter(trade => !trade.isWin).length;
    const weekWinRate = weekTrades.length > 0 ? (weekWins / weekTrades.length) * 100 : 0;

    return {
      trades: weekTrades.length,
      profit: weekProfit,
      profitRR: weekProfitRR,
      wins: weekWins,
      losses: weekLosses,
      winRate: weekWinRate,
    };
  };

  // Calculate weekly data for the month
  const getWeeksInMonth = () => {
    const weeks = [];
    const firstWeekStart = new Date(firstDay);
    firstWeekStart.setDate(firstDay.getDate() - firstDay.getDay()); // Start from Sunday

    for (let i = 0; i < 6; i++) {
      const weekStart = new Date(firstWeekStart);
      weekStart.setDate(firstWeekStart.getDate() + (i * 7));
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      // Check if this week overlaps with current month
      if (weekStart.getMonth() === month || weekEnd.getMonth() === month) {
        weeks.push(getWeekData(weekStart));
      }
    }
    return weeks;
  };

  const monthTrades = trades.filter(trade => {
    const tradeDate = new Date(trade.date);
    return tradeDate.getMonth() === month && tradeDate.getFullYear() === year;
  });

  const monthProfit = monthTrades.reduce((sum, trade) => sum + trade.profit, 0);
  const monthProfitRR = monthTrades.reduce((sum, trade) => sum + trade.profitRR, 0);
  const monthWins = monthTrades.filter(trade => trade.isWin).length;
  const monthLosses = monthTrades.filter(trade => !trade.isWin).length;
  const monthWinRate = monthTrades.length > 0 ? (monthWins / monthTrades.length) * 100 : 0;

  // Generate chart data for the current month
  const generateChartData = () => {
    const chartData = [];
    let cumulativeProfit = 0;
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dayTrades = getTradesForDate(day);
      const dayProfit = dayTrades.reduce((sum, trade) => sum + (displayMode === "$" ? trade.profit : trade.profitRR), 0);
      cumulativeProfit += dayProfit;
      
      chartData.push({
        day,
        date: `${day}`,
        dailyPL: dayProfit,
        cumulativePL: cumulativeProfit,
        trades: dayTrades.length
      });
    }
    
    return chartData;
  };

  const chartData = generateChartData();

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-bold">
          {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Monthly P&L Chart */}
      <Card className="trading-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Monthly P&L Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Line type="monotone" dataKey="cumulativePL" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="p-1 sm:p-2 text-center text-xs sm:text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
        
        {calendarDays.map((day, index) => {
          if (!day) {
            return <div key={index} className="p-1 sm:p-2 h-12 sm:h-16" />;
          }

          const dayTrades = getTradesForDate(day);
          const dayProfit = dayTrades.reduce((sum, trade) => sum + trade.profit, 0);
          const dayProfitRR = dayTrades.reduce((sum, trade) => sum + trade.profitRR, 0);
          const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;

          return (
            <div
              key={day}
              className={`
                p-1 sm:p-2 h-12 sm:h-16 border border-border rounded-lg relative overflow-hidden
                ${isToday ? "ring-2 ring-primary" : ""}
                ${dayTrades.length > 0 ? (dayProfit > 0 ? "profit-positive" : "profit-negative") : ""}
              `}
            >
              <div className="text-xs sm:text-sm font-medium">{day}</div>
              {dayTrades.length > 0 && (
                <div className="absolute bottom-0.5 sm:bottom-1 left-0.5 sm:left-1 right-0.5 sm:right-1 text-xs">
                  <div className={`font-bold text-center text-xs ${dayProfit > 0 ? "text-green-400" : "text-red-400"}`}>
                    {displayMode === "$" ? `$${Math.abs(dayProfit) >= 1000 ? (dayProfit/1000).toFixed(1) + 'k' : dayProfit.toFixed(0)}` : `${dayProfitRR.toFixed(1)}R`}
                  </div>
                  <div className="text-muted-foreground text-center text-xs hidden sm:block">{dayTrades.length} trades</div>
                  <div className="text-muted-foreground text-center text-xs sm:hidden">{dayTrades.length}t</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Weekly Statistics */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Weekly & Monthly Performance</h3>
        
        {/* Monthly Summary */}
        <Card className="trading-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Monthly Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold">{monthTrades.length}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Total Trades</div>
              </div>
              <div className="text-center">
                <div className={`text-xl sm:text-2xl font-bold ${monthProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {displayMode === "$" ? `$${monthProfit.toFixed(2)}` : `${monthProfitRR.toFixed(2)}R`}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">Total P&L</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold">{monthWinRate.toFixed(1)}%</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Win Rate</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-green-400">{monthWins}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Wins</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-red-400">{monthLosses}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Losses</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Performance */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {getWeeksInMonth().map((week, index) => (
            <div key={index} className="trading-card p-4">
              <div className="text-sm text-muted-foreground mb-2 font-semibold">Week {index + 1}</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm">Trades:</span>
                  <span className="font-medium">{week.trades}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">P&L:</span>
                  <span className={`font-bold ${week.profit >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {displayMode === "$" ? `$${week.profit.toFixed(2)}` : `${week.profitRR.toFixed(2)}R`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Win Rate:</span>
                  <span className="font-medium">{week.winRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Wins:</span>
                  <span className="font-medium text-green-400">{week.wins}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Losses:</span>
                  <span className="font-medium text-red-400">{week.losses}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};