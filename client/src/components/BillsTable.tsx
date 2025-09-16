import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Bill {
  id: string;
  name: string;
  amount: number;
  frequency: 'Monthly' | 'Quarterly' | 'Annually';
  nextDue: string;
  status: 'PAID' | 'DUE' | 'SCHEDULED' | 'OVERDUE' | 'READY';
  icon: string;
  isVariable?: boolean;
}

interface BillsTableProps {
  bills: Bill[];
  monthlyTotal: number;
  quarterlyAvg: number;
  annualTotal: number;
}

export function BillsTable({ bills, monthlyTotal, quarterlyAvg, annualTotal }: BillsTableProps) {
  
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'PAID': return { text: '✅ PAID', class: 'status-paid' };
      case 'DUE': return { text: '🔔 3 DAYS', class: 'status-late' };
      case 'SCHEDULED': return { text: '⏳ SCHEDULED', class: 'status-pending' };
      case 'OVERDUE': return { text: '⚠️ OVERDUE', class: 'status-late' };
      case 'READY': return { text: '✅ READY', class: 'status-paid' };
      default: return { text: status, class: 'bg-gray-200' };
    }
  };

  const handleAddBill = () => {
    console.log('Add bill clicked');
  };

  const handleBillAction = (billId: string, action: string) => {
    console.log(`Bill ${billId} - ${action} clicked`);
  };

  return (
    <Card className="brutal-border brutal-shadow bg-white p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="brutal-text text-2xl" data-testid="text-bills-table-title">
          ACTIVE BILLS
        </h2>
        <Button
          variant="default"
          className="brutal-border brutal-text bg-black text-white hover:bg-white hover:text-black"
          onClick={handleAddBill}
          data-testid="button-add-bill"
        >
          + ADD BILL
        </Button>
      </div>

      <div className="brutal-table overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b-4 border-black">
              <TableHead className="brutal-text font-black">BILL NAME</TableHead>
              <TableHead className="brutal-text font-black">AMOUNT</TableHead>
              <TableHead className="brutal-text font-black">FREQUENCY</TableHead>
              <TableHead className="brutal-text font-black">NEXT DUE</TableHead>
              <TableHead className="brutal-text font-black">STATUS</TableHead>
              <TableHead className="brutal-text font-black">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bills.map((bill) => {
              const statusDisplay = getStatusDisplay(bill.status);
              return (
                <TableRow key={bill.id} className="border-b-2 border-black">
                  <TableCell className="brutal-mono font-bold" data-testid={`text-bill-name-${bill.id}`}>
                    {bill.icon} {bill.name}
                  </TableCell>
                  <TableCell className="brutal-mono font-black" data-testid={`text-bill-amount-${bill.id}`}>
                    {bill.isVariable ? '~' : ''}${bill.amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="brutal-text" data-testid={`text-bill-frequency-${bill.id}`}>
                    {bill.frequency}
                  </TableCell>
                  <TableCell className="brutal-mono" data-testid={`text-bill-due-${bill.id}`}>
                    {bill.nextDue}
                  </TableCell>
                  <TableCell data-testid={`status-bill-${bill.id}`}>
                    <span className={`px-2 py-1 brutal-text text-xs ${statusDisplay.class}`}>
                      {statusDisplay.text}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="brutal-border brutal-text text-xs"
                        onClick={() => handleBillAction(bill.id, 'EDIT')}
                        data-testid={`button-edit-bill-${bill.id}`}
                      >
                        EDIT
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="brutal-border brutal-text text-xs"
                        onClick={() => handleBillAction(bill.id, 'PAY')}
                        data-testid={`button-pay-bill-${bill.id}`}
                      >
                        PAY
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="brutal-border bg-gray-100 p-4 mt-6">
        <div className="brutal-mono text-lg font-black flex justify-between" data-testid="text-bills-summary">
          <span>MONTHLY TOTAL: ${monthlyTotal.toLocaleString()}</span>
          <span>QUARTERLY AVG: ${quarterlyAvg}</span>
          <span>ANNUAL: ${annualTotal.toLocaleString()}</span>
        </div>
      </div>
    </Card>
  );
}