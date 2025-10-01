import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Upload } from 'lucide-react';

interface CSVUploadTabProps {
  banks: any[];
  onImportSuccess: () => void;
}

export function CSVUploadTab({ banks, onImportSuccess }: CSVUploadTabProps) {
  const [selectedBank, setSelectedBank] = useState('');
  const [csvData, setCSVData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setCSVData(results.data);
        const cols = results.meta.fields || [];
        setHeaders(cols);

        // Auto-map common columns
        const autoMapping: Record<string, string> = {};
        cols.forEach(col => {
          const lower = col.toLowerCase();
          if (lower.includes('date')) autoMapping[col] = 'date';
          else if (lower.includes('narrative') || lower.includes('description') || lower.includes('merchant')) autoMapping[col] = 'description';
          else if (lower.includes('debit') && lower.includes('amount')) autoMapping[col] = 'debitAmount';
          else if (lower.includes('credit') && lower.includes('amount')) autoMapping[col] = 'creditAmount';
          else if (lower.includes('amount') || lower.includes('value')) autoMapping[col] = 'amount';
          else if (lower.includes('category')) autoMapping[col] = 'category';
          else if (lower.includes('tag')) autoMapping[col] = 'tags';
        });
        setColumnMapping(autoMapping);
      }
    });
  }, []);

  const handleImport = async () => {
    if (!selectedBank) {
      alert('Please select a bank account');
      return;
    }

    setImporting(true);
    try {
      const selectedBankObj = banks.find(b => b.id === selectedBank);
      console.log('📤 CSV Upload: Selected bank:', selectedBankObj);
      console.log('📤 CSV Upload: Column mapping:', columnMapping);

      const transactions = csvData.map((row, index) => {
        const txn: any = {
          bankId: selectedBank,
          account: selectedBankObj ? `${selectedBankObj.bankType} - ${selectedBankObj.name}` : 'Imported'
        };

        // Map columns from CSV to transaction fields
        Object.entries(columnMapping).forEach(([csvCol, ourField]) => {
          if (ourField !== 'skip') {
            const value = row[csvCol];

            // Handle debit/credit amounts - convert to numbers and store separately
            if (ourField === 'debitAmount' || ourField === 'creditAmount') {
              // Parse the value, removing any currency symbols or commas
              const numValue = typeof value === 'string'
                ? parseFloat(value.replace(/[$,]/g, ''))
                : parseFloat(value || '0');
              txn[ourField] = isNaN(numValue) ? 0 : numValue;
            } else {
              txn[ourField] = value;
            }
          }
        });

        // Log first 3 transactions for debugging
        if (index < 3) {
          console.log(`📤 Transaction ${index + 1}:`, txn);
        }

        return txn;
      });

      console.log(`📤 Sending ${transactions.length} transactions to server...`);

      const response = await fetch('/api/transactions/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions, mapping: columnMapping })
      });

      const result = await response.json();
      console.log('📥 Server response:', result);

      if (response.ok) {
        console.log(`✅ Import successful: ${result.data?.imported || 0} imported, ${result.data?.errors || 0} errors`);
        if (result.data?.errors > 0) {
          console.warn('⚠️ Some rows failed:', result.data.errorDetails);
        }
        onImportSuccess();
      } else {
        console.error('❌ Import failed:', result);
        alert(`Import failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Bank Selection */}
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

      {/* File Upload */}
      {!csvData.length && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-sm text-gray-600 mb-4">Drag and drop CSV file or click to browse</p>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            id="csv-upload"
          />
          <Button asChild variant="outline">
            <label htmlFor="csv-upload" className="cursor-pointer">
              Choose File
            </label>
          </Button>
        </div>
      )}

      {/* Column Mapping */}
      {csvData.length > 0 && (
        <>
          <div className="space-y-2">
            <Label>Map CSV Columns to Fields</Label>
            {headers.map(header => (
              <div key={header} className="flex items-center gap-2">
                <span className="text-sm w-40 truncate">{header}</span>
                <span>→</span>
                <Select
                  value={columnMapping[header] || 'skip'}
                  onValueChange={(value) => setColumnMapping({...columnMapping, [header]: value})}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="skip">Skip</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="description">Description</SelectItem>
                    <SelectItem value="amount">Amount (Single Column)</SelectItem>
                    <SelectItem value="debitAmount">Debit Amount (Expenses)</SelectItem>
                    <SelectItem value="creditAmount">Credit Amount (Income)</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                    <SelectItem value="tags">Tags</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          {/* Preview */}
          <div>
            <Label>Preview ({csvData.length} rows)</Label>
            <div className="border rounded overflow-auto max-h-64">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    {headers.map(h => (
                      <th key={h} className="px-2 py-1 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvData.slice(0, 10).map((row, i) => (
                    <tr key={i} className="border-t">
                      {headers.map(h => (
                        <td key={h} className="px-2 py-1">{row[h]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleImport} disabled={!selectedBank || importing}>
              {importing ? 'Importing...' : `Import ${csvData.length} transactions`}
            </Button>
            <Button variant="outline" onClick={() => {
              setCSVData([]);
              setHeaders([]);
              setColumnMapping({});
            }}>
              Cancel
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
