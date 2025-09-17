import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, RefreshCw, DollarSign } from "lucide-react";

export function TransactionEntry() {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState('');

  const handleSubmit = () => {
    console.log('Transaction submitted:', { amount, description, category, type });
    // Reset form
    setAmount('');
    setDescription('');
    setCategory('');
    setType('');
  };

  const handleReset = () => {
    console.log('Transaction form reset');
    setAmount('');
    setDescription('');
    setCategory('');
    setType('');
  };

  const isFormValid = amount && description && category && type;

  return (
    <Card className="modern-card p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-secondary/10 rounded-xl">
          <DollarSign className="w-5 h-5 text-secondary" />
        </div>
        <h2 className="text-lg font-semibold text-foreground" data-testid="text-transaction-entry-title">
          Add Transaction
        </h2>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="amount" className="text-sm font-medium text-foreground">Amount</Label>
          <Input
            id="amount"
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-lg font-semibold"
            data-testid="input-transaction-amount"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium text-foreground">Description</Label>
          <Input
            id="description"
            placeholder="Transaction description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            data-testid="input-transaction-description"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type" className="text-sm font-medium text-foreground">Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger data-testid="select-transaction-type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INCOME">Income</SelectItem>
              <SelectItem value="EXPENSE">Expense</SelectItem>
              <SelectItem value="RENT">Rent Received</SelectItem>
              <SelectItem value="BILL">Bill Payment</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category" className="text-sm font-medium text-foreground">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger data-testid="select-transaction-category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MORTGAGE">Mortgage</SelectItem>
              <SelectItem value="UTILITIES">Utilities</SelectItem>
              <SelectItem value="GROCERIES">Groceries</SelectItem>
              <SelectItem value="TRANSPORT">Transport</SelectItem>
              <SelectItem value="ENTERTAINMENT">Entertainment</SelectItem>
              <SelectItem value="PROPERTY">Property</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex space-x-3 pt-4">
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid}
            className="flex items-center space-x-2 bg-primary text-primary-foreground hover-elevate flex-1"
            data-testid="button-submit-transaction"
          >
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            className="hover-elevate"
            data-testid="button-reset-transaction"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}