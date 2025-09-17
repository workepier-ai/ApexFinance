import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Home, Calendar, CreditCard, TrendingDown, TrendingUp, Clock, History, Calculator, RefreshCw } from "lucide-react";

interface MortgageCardProps {
  outstandingBalance: number;
  interestRate: number;
  monthlyPayment: number;
  principalAmount: number;
  interestAmount: number;
  nextPaymentDate: string;
  daysUntilDue: number;
  accountProvider: string;
}

export function MortgageCard({
  outstandingBalance,
  interestRate,
  monthlyPayment,
  principalAmount,
  interestAmount,
  nextPaymentDate,
  daysUntilDue,
  accountProvider
}: MortgageCardProps) {
  
  const principalPercentage = (principalAmount / monthlyPayment) * 100;
  const interestPercentage = (interestAmount / monthlyPayment) * 100;

  const handleAction = (action: string) => {
    console.log(`Mortgage ${action} clicked`);
  };

  return (
    <Card className="modern-card p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Home className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground" data-testid="text-mortgage-title">
              Home Mortgage
            </h2>
            <div className="text-sm text-muted-foreground" data-testid="text-account-provider">
              {accountProvider} Account
            </div>
          </div>
        </div>
        <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${
          daysUntilDue <= 7 ? 'bg-destructive/20 text-destructive' : 'bg-success/20 text-success'
        }`}>
          <Clock className="w-3 h-3" />
          <span>{daysUntilDue} days</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 hover-elevate">
          <div className="flex items-center justify-between mb-3">
            <div className="space-y-1">
              <h3 className="modern-text text-sm font-medium text-muted-foreground uppercase tracking-wide">Outstanding Balance</h3>
              <div className="metric-large text-destructive" data-testid="text-outstanding-balance">
                ${outstandingBalance.toLocaleString()}
              </div>
            </div>
            <div className="p-2 bg-destructive/10 rounded-xl">
              <TrendingDown className="w-4 h-4 text-destructive" />
            </div>
          </div>
          <div className="flex items-center space-x-2 text-success" data-testid="text-balance-change">
            <TrendingDown className="w-3 h-3" />
            <span className="text-sm font-medium">-$7,249 this month</span>
          </div>
        </Card>

        <Card className="p-4 hover-elevate">
          <div className="flex items-center justify-between mb-3">
            <div className="space-y-1">
              <h3 className="modern-text text-sm font-medium text-muted-foreground uppercase tracking-wide">Interest Rate</h3>
              <div className="metric-large" data-testid="text-interest-rate">
                {interestRate}% p.a.
              </div>
            </div>
            <div className="p-2 bg-warning/10 rounded-xl">
              <TrendingUp className="w-4 h-4 text-warning" />
            </div>
          </div>
          <div className="flex items-center space-x-2 text-destructive" data-testid="text-rate-change">
            <TrendingUp className="w-3 h-3" />
            <span className="text-sm font-medium">+0.25% YTD</span>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="modern-text text-sm font-medium text-muted-foreground uppercase tracking-wide">Monthly Payment</h3>
          <div className="metric-small" data-testid="text-monthly-payment">
            ${monthlyPayment.toLocaleString()}
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-foreground">Principal: ${principalAmount.toLocaleString()}</span>
              <span className="text-sm font-medium text-success">({principalPercentage.toFixed(1)}%)</span>
            </div>
            <Progress value={principalPercentage} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-foreground">Interest: ${interestAmount.toLocaleString()}</span>
              <span className="text-sm font-medium text-muted-foreground">({interestPercentage.toFixed(1)}%)</span>
            </div>
            <Progress value={interestPercentage} className="h-2 bg-muted" />
          </div>
        </div>
      </Card>

      <Card className={`p-4 ${daysUntilDue <= 7 ? 'bg-destructive/5 border-destructive/20' : 'bg-card'}`}>
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-xl ${
            daysUntilDue <= 7 ? 'bg-destructive/10' : 'bg-primary/10'
          }`}>
            <Calendar className={`w-4 h-4 ${
              daysUntilDue <= 7 ? 'text-destructive' : 'text-primary'
            }`} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-muted-foreground mb-1">Next Payment Due</div>
            <div className="font-semibold text-foreground" data-testid="text-next-payment-date">
              {nextPaymentDate}
            </div>
          </div>
          <div className={`text-right ${
            daysUntilDue <= 7 ? 'text-destructive' : 'text-muted-foreground'
          }`} data-testid="text-days-until-due">
            <div className="text-sm font-medium">{daysUntilDue} days</div>
            <div className="text-xs">14h 32m</div>
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button
          className="flex items-center space-x-2 bg-primary text-primary-foreground hover-elevate"
          onClick={() => handleAction('MAKE_PAYMENT')}
          data-testid="button-make-payment"
        >
          <CreditCard className="w-4 h-4" />
          <span>Make Payment</span>
        </Button>
        <Button
          variant="outline"
          className="hover-elevate"
          onClick={() => handleAction('PAYMENT_HISTORY')}
          data-testid="button-payment-history"
        >
          <History className="w-4 h-4 mr-2" />
          History
        </Button>
        <Button
          variant="outline"
          className="hover-elevate"
          onClick={() => handleAction('AMORTIZATION')}
          data-testid="button-amortization"
        >
          <Calculator className="w-4 h-4 mr-2" />
          Schedule
        </Button>
        <Button
          variant="outline"
          className="hover-elevate"
          onClick={() => handleAction('REFINANCE_CALC')}
          data-testid="button-refinance-calc"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refinance
        </Button>
      </div>
    </Card>
  );
}