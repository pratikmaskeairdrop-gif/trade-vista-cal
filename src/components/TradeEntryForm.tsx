import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";
import { Trade } from "./TradingDashboard";

interface TradeEntryFormProps {
  onAddTrade: (trade: Omit<Trade, "id">) => void;
  onCancel: () => void;
}

export const TradeEntryForm = ({ onAddTrade, onCancel }: TradeEntryFormProps) => {
  const [formData, setFormData] = useState({
    pair: "",
    entry: "",
    exit: "",
    size: "",
    date: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const entry = parseFloat(formData.entry);
    const exit = parseFloat(formData.exit);
    const size = parseFloat(formData.size);
    
    if (!formData.pair || isNaN(entry) || isNaN(exit) || isNaN(size)) {
      return;
    }

    const profit = (exit - entry) * (size / entry);
    const isWin = profit > 0;

    onAddTrade({
      pair: formData.pair,
      entry,
      exit,
      size,
      profit,
      isWin,
      date: new Date(formData.date),
    });

    setFormData({
      pair: "",
      entry: "",
      exit: "",
      size: "",
      date: new Date().toISOString().split("T")[0],
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Add New Trade</CardTitle>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pair">Trading Pair</Label>
              <Input
                id="pair"
                value={formData.pair}
                onChange={(e) => handleChange("pair", e.target.value)}
                placeholder="e.g., EURUSD"
                required
              />
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleChange("date", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="entry">Entry Price</Label>
              <Input
                id="entry"
                type="number"
                step="0.00001"
                value={formData.entry}
                onChange={(e) => handleChange("entry", e.target.value)}
                placeholder="1.12345"
                required
              />
            </div>
            <div>
              <Label htmlFor="exit">Exit Price</Label>
              <Input
                id="exit"
                type="number"
                step="0.00001"
                value={formData.exit}
                onChange={(e) => handleChange("exit", e.target.value)}
                placeholder="1.12445"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="size">Position Size ($)</Label>
            <Input
              id="size"
              type="number"
              step="0.01"
              value={formData.size}
              onChange={(e) => handleChange("size", e.target.value)}
              placeholder="1000.00"
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1 gradient-primary">
              Add Trade
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};