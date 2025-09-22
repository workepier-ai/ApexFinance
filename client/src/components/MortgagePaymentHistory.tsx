import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ChevronDown,
  ChevronUp,
  TrendingDown,
  TrendingUp,
  Calendar,
  DollarSign,
  Home,
  CheckCircle2
} from "lucide-react";
import { useState } from "react";

interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  principal: number;
  interest: number;
  balance: number;
  status: 'PAID' | 'SCHEDULED' | 'LATE';
}

interface MortgagePaymentHistoryProps {
  payments: PaymentRecord[];
  currentBalance: number;
  originalBalance: number;
  className?: string;
}

export function MortgagePaymentHistory({
  payments,
  currentBalance,
  originalBalance,
  className = ""
}: MortgagePaymentHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const displayedPayments = showAll ? payments : payments.slice(0, 6);
  const totalPaid = originalBalance - currentBalance;
  const payoffProgress = (totalPaid / originalBalance) * 100;

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'PAID':
        return { text: 'Paid', class: 'text-success', icon: CheckCircle2 };
      case 'SCHEDULED':
        return { text: 'Scheduled', class: 'text-warning', icon: Calendar };
      case 'LATE':
        return { text: 'Late', class: 'text-destructive', icon: TrendingUp };
      default:
        return { text: status, class: 'text-muted-foreground', icon: Calendar };
    }
  };

  const calculateEquityGain = (principal: number) => {
    return ((principal / currentBalance) * 100).toFixed(2);
  };

  return (
    <Card className={`modern-card ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Home className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Payment History & Progress
              </h3>
              <div className="text-sm text-muted-foreground">
                {payments.length} payments tracked
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="hover-elevate"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Paid</span>
              <TrendingDown className="w-4 h-4 text-success" />
            </div>
            <div className="metric-large text-success">
              ${totalPaid.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {payoffProgress.toFixed(1)}% of original loan
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Remaining</span>
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
            <div className="metric-large">
              ${currentBalance.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {(100 - payoffProgress).toFixed(1)}% remaining
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Avg Payment</span>
              <Calendar className="w-4 h-4 text-secondary" />
            </div>
            <div className="metric-large">
              ${Math.round(payments.reduce((sum, p) => sum + p.amount, 0) / payments.length).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Monthly average
            </div>
          </Card>
        </div>

        {/* Loan Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Loan Progress</span>
            <span className="text-sm text-muted-foreground">
              {payoffProgress.toFixed(1)}% paid off
            </span>
          </div>
          <Progress value={payoffProgress} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Started: ${originalBalance.toLocaleString()}</span>
            <span>Current: ${currentBalance.toLocaleString()}</span>
          </div>
        </div>

        {/* Payment History */}
        {isExpanded && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-foreground">Recent Payments</h4>
              {payments.length > 6 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll ? 'Show Less' : `Show All (${payments.length})`}
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {displayedPayments.map((payment, index) => {
                const statusDisplay = getStatusDisplay(payment.status);
                const StatusIcon = statusDisplay.icon;
                const equityGain = calculateEquityGain(payment.principal);

                return (
                  <Card key={payment.id} className="p-4 hover-elevate">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-1.5 rounded-lg bg-muted ${statusDisplay.class}`}>
                          <StatusIcon className="w-3 h-3" />
                        </div>
                        <div>
                          <div className="font-medium text-foreground">
                            {payment.date}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Payment #{payments.length - index}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-semibold text-foreground">
                          ${payment.amount.toLocaleString()}
                        </div>
                        <div className={`text-xs ${statusDisplay.class}`}>
                          {statusDisplay.text}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-border/50">
                      <div>
                        <div className="text-xs text-muted-foreground">Principal</div>
                        <div className="text-sm font-medium text-success">
                          ${payment.principal.toLocaleString()}
                        </div>
                        <div className="text-xs text-success">
                          +{equityGain}% equity
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Interest</div>
                        <div className="text-sm font-medium">
                          ${payment.interest.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Balance After</div>
                        <div className="text-sm font-medium">
                          ${payment.balance.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}