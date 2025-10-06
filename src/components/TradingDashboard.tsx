import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TradeEntryForm } from "./TradeEntryForm";
import { TradingCalendar } from "./TradingCalendar";
import { StatsCards } from "./StatsCards";
import { CirclePlus as PlusCircle, TrendingUp, Calendar, Settings, Download, Upload, DollarSign, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DatabaseService, TradeRecord, UserProfile } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

export interface Trade {
  id: string;
  pair: string;
  entry?: number;
  exit?: number;
  stopLoss?: number;
  takeProfit?: number;
  size: number;
  profit: number;
  profitRR: number;
  date: Date;
  isWin: boolean;
  entryMethod: 'detailed' | 'simple';
  accountBalance: number;
  riskPercent?: number;
}

export interface AccountSettings {
  balance: number;
  defaultRiskPercent: number;
}

interface TradingDashboardProps {
  user: User;
}

const TradingDashboard = ({ user }: TradingDashboardProps) => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [displayMode, setDisplayMode] = useState<"$" | "RR">("$");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountSettings, setAccountSettings] = useState<AccountSettings>({
    balance: 100000,
    defaultRiskPercent: 1
  });

  // Load user data on component mount
  useEffect(() => {
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    setLoading(true);
    
    // Load user profile
    let profile = await DatabaseService.getUserProfile(user.id);
    
    // Create profile if it doesn't exist
    if (!profile) {
      profile = await DatabaseService.createUserProfile({
        user_id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || '',
        account_balance: 100000,
        default_risk_percent: 1
      });
    }
    
    if (profile) {
      setUserProfile(profile);
      setAccountSettings({
        balance: profile.account_balance,
        defaultRiskPercent: profile.default_risk_percent
      });
    }
    
    // Load trades
    const tradeRecords = await DatabaseService.getUserTrades(user.id);
    const formattedTrades: Trade[] = tradeRecords.map(record => ({
      id: record.id,
      pair: record.pair,
      entry: record.entry_price || undefined,
      exit: record.exit_price || undefined,
      stopLoss: record.stop_loss || undefined,
      takeProfit: record.take_profit || undefined,
      size: record.position_size,
      profit: record.profit_usd,
      profitRR: record.profit_rr,
      date: new Date(record.trade_date),
      isWin: record.is_win,
      entryMethod: record.entry_method,
      accountBalance: record.account_balance_at_trade,
      riskPercent: record.risk_percent || undefined
    }));
    
    setTrades(formattedTrades);
    setLoading(false);
  };

  const addTrade = async (trade: Omit<Trade, "id">) => {
    // Save to database
    const tradeRecord: Omit<TradeRecord, 'id' | 'created_at' | 'updated_at'> = {
      user_id: user.id,
      pair: trade.pair,
      entry_price: trade.entry || null,
      exit_price: trade.exit || null,
      stop_loss: trade.stopLoss || null,
      take_profit: trade.takeProfit || null,
      position_size: trade.size,
      profit_usd: trade.profit,
      profit_rr: trade.profitRR,
      is_win: trade.isWin,
      entry_method: trade.entryMethod,
      account_balance_at_trade: trade.accountBalance,
      risk_percent: trade.riskPercent || null,
      trade_date: trade.date.toISOString().split('T')[0]
    };
    
    const savedTrade = await DatabaseService.createTrade(tradeRecord);
    
    if (savedTrade) {
      // Add to local state
      const newTrade: Trade = {
        id: savedTrade.id,
        pair: savedTrade.pair,
        entry: savedTrade.entry_price || undefined,
        exit: savedTrade.exit_price || undefined,
        stopLoss: savedTrade.stop_loss || undefined,
        takeProfit: savedTrade.take_profit || undefined,
        size: savedTrade.position_size,
        profit: savedTrade.profit_usd,
        profitRR: savedTrade.profit_rr,
        date: new Date(savedTrade.trade_date),
        isWin: savedTrade.is_win,
        entryMethod: savedTrade.entry_method,
        accountBalance: savedTrade.account_balance_at_trade,
        riskPercent: savedTrade.risk_percent || undefined
      };
      
      setTrades(prev => [newTrade, ...prev]);
      
      // Update user profile with new account balance
      if (userProfile) {
        const updatedProfile = await DatabaseService.updateUserProfile(user.id, {
          account_balance: trade.accountBalance,
          default_risk_percent: trade.riskPercent || userProfile.default_risk_percent
        });
        
        if (updatedProfile) {
          setUserProfile(updatedProfile);
          setAccountSettings({
            balance: updatedProfile.account_balance,
            defaultRiskPercent: updatedProfile.default_risk_percent
          });
        }
      }
    }
    
    setShowAddForm(false);
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Pair', 'Entry Method', 'Entry Price', 'Exit Price', 'Stop Loss', 'Take Profit', 'Size', 'Profit ($)', 'Profit (RR)', 'Win/Loss', 'Account Balance'];
    const csvData = trades.map(trade => [
      trade.date.toISOString().split('T')[0],
      trade.pair,
      trade.entryMethod,
      trade.entry || '',
      trade.exit || '',
      trade.stopLoss || '',
      trade.takeProfit || '',
      trade.size,
      trade.profit,
      trade.profitRR,
      trade.isWin ? 'Win' : 'Loss',
      trade.accountBalance
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trading-journal-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const importedTrades: Trade[] = [];

      // Skip header row
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const columns = line.split(',').map(cell => cell.replace(/"/g, ''));
        if (columns.length >= 11) {
          const trade: Trade = {
            id: crypto.randomUUID(),
            date: new Date(columns[0]),
            pair: columns[1],
            entryMethod: (columns[2] === 'simple' ? 'simple' : 'detailed') as 'detailed' | 'simple',
            entry: columns[3] ? parseFloat(columns[3]) : undefined,
            exit: columns[4] ? parseFloat(columns[4]) : undefined,
            stopLoss: columns[5] ? parseFloat(columns[5]) : undefined,
            takeProfit: columns[6] ? parseFloat(columns[6]) : undefined,
            size: parseFloat(columns[7]),
            profit: parseFloat(columns[8]),
            profitRR: parseFloat(columns[9]),
            isWin: columns[10] === 'Win',
            accountBalance: parseFloat(columns[11])
          };
          importedTrades.push(trade);
        }
      }

      setTrades(prev => [...prev, ...importedTrades]);
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const totalProfit = trades.reduce((sum, trade) => sum + trade.profit, 0);
  const totalProfitRR = trades.reduce((sum, trade) => sum + trade.profitRR, 0);
  const winRate = trades.length > 0 ? (trades.filter(trade => trade.isWin).length / trades.length) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your trading data...</p>
        </div>
      </div>
    );
  }

  const ActionButtons = () => (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" className="text-xs">
        <DollarSign className="w-3 h-3 mr-1" />
        <span className="hidden sm:inline">Account: </span>${accountSettings.balance.toLocaleString()}
      </Button>
      <Button variant="outline" size="sm" onClick={exportToCSV} className="text-xs">
        <Download className="w-3 h-3 mr-1" />
        <span className="hidden sm:inline">Export</span>
      </Button>
      <Button variant="outline" size="sm" onClick={() => document.getElementById('csv-import')?.click()} className="text-xs">
        <Upload className="w-3 h-3 mr-1" />
        <span className="hidden sm:inline">Import</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setDisplayMode(displayMode === "$" ? "RR" : "$")}
        className="text-xs"
      >
        <Settings className="w-3 h-3 mr-1" />
        {displayMode}
      </Button>
      <Button 
        onClick={() => setShowAddForm(true)}
        className="gradient-primary text-xs"
        size="sm"
      >
        <PlusCircle className="w-3 h-3 mr-1" />
        Add Trade
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 space-y-6">
        {/* Mobile Header */}
        <div className="flex justify-between items-center lg:hidden">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="px-4 py-2">
              <TrendingUp className="w-4 h-4 mr-2" />
              {trades.length} Trades Logged
            </Badge>
          </div>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Menu className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Badge 
                    variant={totalProfit >= 0 ? "default" : "destructive"} 
                    className={`w-full justify-center py-2 ${totalProfit >= 0 ? "gradient-success" : "gradient-destructive"}`}
                  >
                    Total P&L: {displayMode === "$" ? `$${totalProfit.toFixed(2)}` : `${totalProfitRR.toFixed(2)}R`}
                  </Badge>
                </div>
                <ActionButtons />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="px-4 py-2">
              <TrendingUp className="w-4 h-4 mr-2" />
              {trades.length} Trades Logged
            </Badge>
            <Badge 
              variant={totalProfit >= 0 ? "default" : "destructive"} 
              className={`px-4 py-2 ${totalProfit >= 0 ? "gradient-success" : "gradient-destructive"}`}
            >
              Total P&L: {displayMode === "$" ? `$${totalProfit.toFixed(2)}` : `${totalProfitRR.toFixed(2)}R`}
            </Badge>
          </div>
          <ActionButtons />
          <input
            id="csv-import"
            type="file"
            accept=".csv"
            onChange={handleFileImport}
            className="hidden"
          />
        </div>

        {/* Stats Cards */}
        <StatsCards trades={trades} displayMode={displayMode} />

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Calendar View */}
          <div className="xl:col-span-2">
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
                            {displayMode === "$" ? `$${trade.profit.toFixed(2)}` : `${trade.profitRR.toFixed(2)}R`}
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-card border border-border rounded-xl p-4 sm:p-6 w-full max-w-2xl my-8">
              <TradeEntryForm 
                onAddTrade={addTrade}
                onCancel={() => setShowAddForm(false)}
                accountSettings={accountSettings}
                defaultTab="simple"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TradingDashboard;