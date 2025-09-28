import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    const weekWins = weekTrades.filter(trade => trade.isWin).length;
    const weekWinRate = weekTrades.length > 0 ? (weekWins / weekTrades.length) * 100 : 0;

    return {
      trades: weekTrades.length,
      profit: weekProfit,
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
  const monthWins = monthTrades.filter(trade => trade.isWin).length;
  const monthWinRate = monthTrades.length > 0 ? (monthWins / monthTrades.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
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

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
        
        {calendarDays.map((day, index) => {
          if (!day) {
            return <div key={index} className="p-2 h-16" />;
          }

          const dayTrades = getTradesForDate(day);
          const dayProfit = dayTrades.reduce((sum, trade) => sum + trade.profit, 0);
          const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;

          return (
            <div
              key={day}
              className={`
                p-2 h-16 border border-border rounded-lg relative
                ${isToday ? "ring-2 ring-primary" : ""}
                ${dayTrades.length > 0 ? (dayProfit > 0 ? "profit-positive" : "profit-negative") : ""}
              `}
            >
              <div className="text-sm font-medium">{day}</div>
              {dayTrades.length > 0 && (
                <div className="absolute bottom-1 left-1 right-1 text-xs">
                  <div className={`font-bold ${dayProfit > 0 ? "text-green-400" : "text-red-400"}`}>
                    {displayMode === "$" ? `$${dayProfit.toFixed(0)}` : `${dayProfit.toFixed(1)}R`}
                  </div>
                  <div className="text-muted-foreground">{dayTrades.length} trades</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Weekly Statistics */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Weekly Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {getWeeksInMonth().map((week, index) => (
            <div key={index} className="trading-card p-4">
              <div className="text-sm text-muted-foreground mb-2">Week {index + 1}</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Trades:</span>
                  <span className="font-medium">{week.trades}</span>
                </div>
                <div className="flex justify-between">
                  <span>P&L:</span>
                  <span className={`font-bold ${week.profit >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {displayMode === "$" ? `$${week.profit.toFixed(2)}` : `${week.profit.toFixed(2)}R`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Win Rate:</span>
                  <span className="font-medium">{week.winRate.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Statistics */}
      <div className="trading-card p-6">
        <h3 className="text-lg font-semibold mb-4">Monthly Performance</h3>
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold">{monthTrades.length}</div>
            <div className="text-sm text-muted-foreground">Total Trades</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${monthProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
              {displayMode === "$" ? `$${monthProfit.toFixed(2)}` : `${monthProfit.toFixed(2)}R`}
            </div>
            <div className="text-sm text-muted-foreground">Total P&L</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{monthWinRate.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">Win Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
};