import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

  const handleDestroy = () => {
    console.log('Transaction form destroyed');
    setAmount('');
    setDescription('');
    setCategory('');
    setType('');
  };

  return (
    <Card className="brutal-border brutal-shadow bg-white p-6">
      <h2 className="brutal-text text-xl mb-6" data-testid="text-transaction-entry-title">
        ADD TRANSACTION
      </h2>
      
      <div className="space-y-4">
        <div>
          <label className="brutal-text text-sm block mb-2">AMOUNT:</label>
          <Input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="brutal-border brutal-mono text-lg font-black"
            data-testid="input-transaction-amount"
          />
        </div>

        <div>
          <label className="brutal-text text-sm block mb-2">DESCRIPTION:</label>
          <Input
            placeholder="TRANSACTION DESCRIPTION"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="brutal-border brutal-text"
            data-testid="input-transaction-description"
          />
        </div>

        <div>
          <label className="brutal-text text-sm block mb-2">TYPE:</label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="brutal-border brutal-text" data-testid="select-transaction-type">
              <SelectValue placeholder="SELECT TYPE" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INCOME">INCOME</SelectItem>
              <SelectItem value="EXPENSE">EXPENSE</SelectItem>
              <SelectItem value="RENT">RENT RECEIVED</SelectItem>
              <SelectItem value="BILL">BILL PAYMENT</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="brutal-text text-sm block mb-2">CATEGORY:</label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="brutal-border brutal-text" data-testid="select-transaction-category">
              <SelectValue placeholder="SELECT CATEGORY" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MORTGAGE">MORTGAGE</SelectItem>
              <SelectItem value="UTILITIES">UTILITIES</SelectItem>
              <SelectItem value="GROCERIES">GROCERIES</SelectItem>
              <SelectItem value="TRANSPORT">TRANSPORT</SelectItem>
              <SelectItem value="ENTERTAINMENT">ENTERTAINMENT</SelectItem>
              <SelectItem value="PROPERTY">PROPERTY</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex space-x-4 pt-4">
          <Button
            variant="default"
            className="brutal-border brutal-shadow brutal-text bg-black text-white hover:bg-white hover:text-black brutal-button flex-1"
            onClick={handleSubmit}
            data-testid="button-submit-transaction"
          >
            SUBMIT
          </Button>
          <Button
            variant="destructive"
            className="brutal-border brutal-shadow brutal-text bg-red-600 text-white hover:bg-white hover:text-red-600 brutal-button flex-1"
            onClick={handleDestroy}
            data-testid="button-destroy-transaction"
          >
            DESTROY
          </Button>
        </div>
      </div>
    </Card>
  );
}