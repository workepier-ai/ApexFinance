import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

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
    <Card className="brutal-border brutal-shadow bg-white p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="brutal-text text-xl" data-testid="text-mortgage-title">
          ANZ HOME MORTGAGE
        </h2>
        <div className="brutal-text text-sm bg-gray-100 px-3 py-1" data-testid="text-account-provider">
          ACCOUNT: {accountProvider}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="brutal-border bg-gray-50 p-4">
          <div className="text-sm text-gray-600 mb-1">OUTSTANDING BALANCE</div>
          <div className="brutal-mono text-3xl font-black text-red-600" data-testid="text-outstanding-balance">
            ${outstandingBalance.toLocaleString()}
          </div>
          <div className="text-sm text-green-600 mt-1" data-testid="text-balance-change">
            ▼ -$7,249 THIS MONTH
          </div>
        </div>

        <div className="brutal-border bg-gray-50 p-4">
          <div className="text-sm text-gray-600 mb-1">INTEREST RATE</div>
          <div className="brutal-mono text-3xl font-black" data-testid="text-interest-rate">
            {interestRate}% P.A.
          </div>
          <div className="text-sm text-red-600 mt-1" data-testid="text-rate-change">
            ▲ +0.25% YTD
          </div>
        </div>
      </div>

      <div className="brutal-border bg-gray-50 p-4 mb-6">
        <div className="flex justify-between items-center mb-3">
          <div className="text-sm text-gray-600">MONTHLY PAYMENT</div>
          <div className="brutal-mono text-2xl font-black" data-testid="text-monthly-payment">
            ${monthlyPayment.toLocaleString()}
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>├── PRINCIPAL: ${principalAmount.toLocaleString()}</span>
            <span className="brutal-text">({principalPercentage.toFixed(1)}%)</span>
          </div>
          <Progress value={principalPercentage} className="h-2" />
          
          <div className="flex justify-between text-sm">
            <span>└── INTEREST: ${interestAmount.toLocaleString()}</span>
            <span className="brutal-text">({interestPercentage.toFixed(1)}%)</span>
          </div>
        </div>
      </div>

      <div className="brutal-border bg-red-50 p-4 mb-6">
        <div className="text-sm text-gray-600 mb-1">NEXT PAYMENT DUE</div>
        <div className="brutal-mono text-lg font-black" data-testid="text-next-payment-date">
          {nextPaymentDate}
        </div>
        <div className="brutal-text text-sm text-red-600" data-testid="text-days-until-due">
          ⏱️ {daysUntilDue} DAYS 14 HOURS 32 MINUTES
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Button
          variant="default"
          className="brutal-border brutal-text bg-black text-white hover:bg-white hover:text-black"
          onClick={() => handleAction('MAKE_PAYMENT')}
          data-testid="button-make-payment"
        >
          MAKE PAYMENT
        </Button>
        <Button
          variant="outline"
          className="brutal-border brutal-text"
          onClick={() => handleAction('PAYMENT_HISTORY')}
          data-testid="button-payment-history"
        >
          HISTORY
        </Button>
        <Button
          variant="outline"
          className="brutal-border brutal-text"
          onClick={() => handleAction('AMORTIZATION')}
          data-testid="button-amortization"
        >
          SCHEDULE
        </Button>
        <Button
          variant="outline"
          className="brutal-border brutal-text"
          onClick={() => handleAction('REFINANCE_CALC')}
          data-testid="button-refinance-calc"
        >
          REFINANCE
        </Button>
      </div>
    </Card>
  );
}