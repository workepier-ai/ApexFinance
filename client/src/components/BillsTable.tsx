import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit3, Trash2, Clock, CheckCircle, AlertCircle } from "lucide-react";

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
      case 'PAID': return { text: 'Paid', class: 'status-paid', icon: CheckCircle };
      case 'DUE': return { text: '3 days', class: 'status-due', icon: AlertCircle };
      case 'SCHEDULED': return { text: 'Scheduled', class: 'status-scheduled', icon: Clock };
      case 'OVERDUE': return { text: 'Overdue', class: 'status-late', icon: AlertCircle };
      case 'READY': return { text: 'Ready', class: 'status-ready', icon: CheckCircle };
      default: return { text: status, class: 'status-ready', icon: Clock };
    }
  };

  const handleAddBill = () => {
    console.log('Add bill clicked');
  };

  const handleBillAction = (billId: string, action: string) => {
    console.log(`Bill ${billId} - ${action} clicked`);
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="data-block">
          <div className="space-y-1">
            <h3 className="modern-text text-sm font-medium text-muted-foreground uppercase tracking-wide">Monthly Total</h3>
            <div className="metric-large">${monthlyTotal.toLocaleString()}</div>
          </div>
        </Card>
        <Card className="data-block">
          <div className="space-y-1">
            <h3 className="modern-text text-sm font-medium text-muted-foreground uppercase tracking-wide">Quarterly Average</h3>
            <div className="metric-large">${quarterlyAvg.toLocaleString()}</div>
          </div>
        </Card>
        <Card className="data-block">
          <div className="space-y-1">
            <h3 className="modern-text text-sm font-medium text-muted-foreground uppercase tracking-wide">Annual Total</h3>
            <div className="metric-large">${annualTotal.toLocaleString()}</div>
          </div>
        </Card>
      </div>

      {/* Bills Management */}
      <Card className="modern-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground" data-testid="text-bills-table-title">
            Active Bills
          </h2>
          <Button
            className="flex items-center space-x-2 bg-primary text-primary-foreground hover-elevate"
            onClick={handleAddBill}
            data-testid="button-add-bill"
          >
            <Plus className="w-4 h-4" />
            <span>Add Bill</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bills.map((bill) => {
            const statusDisplay = getStatusDisplay(bill.status);
            const StatusIcon = statusDisplay.icon;
            
            return (
              <Card key={bill.id} className="hover-elevate p-4 group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{bill.icon}</span>
                    <div>
                      <h3 className="font-medium text-foreground" data-testid={`text-bill-name-${bill.id}`}>
                        {bill.name}
                      </h3>
                      <div className="text-xs text-muted-foreground" data-testid={`text-bill-frequency-${bill.id}`}>
                        {bill.frequency}
                      </div>
                    </div>
                  </div>
                  <div className={statusDisplay.class} data-testid={`status-bill-${bill.id}`}>
                    <StatusIcon className="w-3 h-3" />
                    <span className="ml-1">{statusDisplay.text}</span>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="metric-small" data-testid={`text-bill-amount-${bill.id}`}>
                    {bill.isVariable ? '~' : ''}${bill.amount.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground" data-testid={`text-bill-due-${bill.id}`}>
                    Due {bill.nextDue}
                  </div>
                </div>

                <div className="flex space-x-2 opacity-60 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleBillAction(bill.id, 'EDIT')}
                    data-testid={`button-edit-bill-${bill.id}`}
                  >
                    <Edit3 className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-destructive hover:text-destructive"
                    onClick={() => handleBillAction(bill.id, 'DELETE')}
                    data-testid={`button-delete-bill-${bill.id}`}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </Card>
    </div>
  );
}