import { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Plus, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

interface ManualEntryGridProps {
  banks: any[];
  onImportSuccess: () => void;
}

interface ManualTransaction {
  id: string;
  date: string;
  description: string;
  amount: string;
  category: string;
  tags: string;
}

export function ManualEntryGrid({ banks, onImportSuccess }: ManualEntryGridProps) {
  const [selectedBank, setSelectedBank] = useState('');
  const [rows, setRows] = useState<ManualTransaction[]>([
    { id: '1', date: '', description: '', amount: '', category: '', tags: '' }
  ]);
  const [importing, setImporting] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState<string | null>(null);

  const addRow = () => {
    setRows([...rows, {
      id: Date.now().toString(),
      date: '',
      description: '',
      amount: '',
      category: '',
      tags: ''
    }]);
  };

  const deleteRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter(r => r.id !== id));
    }
  };

  const updateRow = (id: string, field: keyof ManualTransaction, value: string) => {
    setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleImport = async () => {
    if (!selectedBank) {
      alert('Please select a bank account');
      return;
    }

    const validRows = rows.filter(r => r.date && r.description && r.amount);
    if (validRows.length === 0) {
      alert('Please fill in at least one complete transaction');
      return;
    }

    setImporting(true);
    try {
      const selectedBankObj = banks.find(b => b.id === selectedBank);
      for (const row of validRows) {
        await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: new Date(row.date),
            description: row.description,
            amount: parseFloat(row.amount),
            category: row.category || 'uncategorized',
            tags: row.tags,
            bankId: selectedBank,
            account: selectedBankObj ? `${selectedBankObj.bankType} - ${selectedBankObj.name}` : 'Manual Entry',
            source: 'manual'
          })
        });
      }
      onImportSuccess();
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Select Bank Account</Label>
        <Select value={selectedBank} onValueChange={setSelectedBank}>
          <SelectTrigger>
            <SelectValue placeholder="Choose account" />
          </SelectTrigger>
          <SelectContent>
            {banks.map(bank => (
              <SelectItem key={bank.id} value={bank.id}>
                {bank.bankType === 'up_bank' ? 'UP Bank' : bank.bankType} - {bank.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg overflow-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-2 text-left font-medium w-32">Date</th>
              <th className="px-2 py-2 text-left font-medium flex-1">Description</th>
              <th className="px-2 py-2 text-left font-medium w-28">Amount</th>
              <th className="px-2 py-2 text-left font-medium w-32">Category</th>
              <th className="px-2 py-2 text-left font-medium w-32">Tags</th>
              <th className="px-2 py-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="px-2 py-1">
                  <div className="flex items-center gap-1">
                    <Input
                      type="text"
                      placeholder="DD/MM/YY"
                      value={row.date ? new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }) : ''}
                      onChange={(e) => {
                        const input = e.target.value.trim();
                        if (!input) {
                          updateRow(row.id, 'date', '');
                          return;
                        }

                        // Smart parser: accepts DD/MM/YY, DD-MM-YY, DDMMYY
                        let cleaned = input.replace(/[\/\-]/g, '');
                        if (cleaned.length === 6) {
                          const day = parseInt(cleaned.substring(0, 2), 10);
                          const month = parseInt(cleaned.substring(2, 4), 10) - 1; // 0-indexed
                          let year = parseInt(cleaned.substring(4, 6), 10);
                          year = year < 50 ? 2000 + year : 1900 + year; // 00-49 = 2000s, 50-99 = 1900s

                          const date = new Date(year, month, day);
                          if (!isNaN(date.getTime())) {
                            updateRow(row.id, 'date', date.toISOString().split('T')[0]);
                          }
                        }
                      }}
                      onDoubleClick={() => setCalendarOpen(row.id)}
                      className="h-8 text-xs flex-1 cursor-pointer"
                    />
                    <Popover open={calendarOpen === row.id} onOpenChange={(open) => !open && setCalendarOpen(null)}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCalendarOpen(row.id)}
                          className="h-8 w-8 p-0"
                        >
                          <CalendarIcon className="h-3.5 w-3.5" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={row.date ? new Date(row.date) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              updateRow(row.id, 'date', date.toISOString().split('T')[0]);
                            }
                            setCalendarOpen(null);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </td>
                <td className="px-2 py-1">
                  <Input
                    placeholder="Transaction description"
                    value={row.description}
                    onChange={(e) => updateRow(row.id, 'description', e.target.value)}
                    className="h-8 text-xs"
                  />
                </td>
                <td className="px-2 py-1">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={row.amount}
                    onChange={(e) => updateRow(row.id, 'amount', e.target.value)}
                    className="h-8 text-xs"
                  />
                </td>
                <td className="px-2 py-1">
                  <Input
                    placeholder="Category"
                    value={row.category}
                    onChange={(e) => updateRow(row.id, 'category', e.target.value)}
                    className="h-8 text-xs"
                  />
                </td>
                <td className="px-2 py-1">
                  <Input
                    placeholder="Tags"
                    value={row.tags}
                    onChange={(e) => updateRow(row.id, 'tags', e.target.value)}
                    className="h-8 text-xs"
                  />
                </td>
                <td className="px-2 py-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteRow(row.id)}
                    disabled={rows.length === 1}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={addRow}>
          <Plus className="w-3 h-3 mr-1" />
          Add Row
        </Button>
      </div>

      <div className="flex gap-2 pt-4 border-t">
        <Button onClick={handleImport} disabled={!selectedBank || importing}>
          {importing ? 'Importing...' : `Import ${rows.filter(r => r.date && r.description && r.amount).length} transactions`}
        </Button>
        <Button variant="outline" onClick={() => {
          setRows([{ id: '1', date: '', description: '', amount: '', category: '', tags: '' }]);
        }}>
          Clear All
        </Button>
      </div>
    </div>
  );
}
