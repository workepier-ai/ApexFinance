import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Home, Calendar, CreditCard, TrendingDown, TrendingUp, Clock, History, Calculator, RefreshCw } from "lucide-react";

interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  principal: number;
  interest: number;
  extra?: number;
  balance: number;
  status: 'PAID' | 'SCHEDULED' | 'LATE';
}

interface EnhancedMortgageCardProps {
  outstandingBalance: number;
  interestRate: number;
  monthlyPayment: number;
  principalAmount: number;
  interestAmount: number;
  nextPaymentDate: string;
  daysUntilDue: number;
  accountProvider: string;
  originalBalance?: number;
  paymentHistory?: PaymentRecord[];
  className?: string;
}

export function EnhancedMortgageCard({
  outstandingBalance,
  interestRate,
  monthlyPayment,
  principalAmount,
  interestAmount,
  nextPaymentDate,
  daysUntilDue,
  accountProvider,
  originalBalance = 500000,
  paymentHistory = [],
  className = ""
}: EnhancedMortgageCardProps) {

  const principalPercentage = (principalAmount / monthlyPayment) * 100;
  const interestPercentage = (interestAmount / monthlyPayment) * 100;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleAction = (action: string) => {
    console.log(`Mortgage ${action} clicked`);
  };

  const mockPaymentHistory: PaymentRecord[] = [
    {
      id: '1',
      date: '08 Sep 25',
      amount: 9000,
      principal: 6453,
      interest: 2547,
      balance: 487234,
      status: 'PAID'
    },
    {
      id: '2',
      date: '08 Aug 25',
      amount: 14249.55,
      principal: 13701,
      interest: 2547,
      extra: 7249,
      balance: 493687,
      status: 'PAID'
    },
    {
      id: '3',
      date: '08 Jul 25',
      amount: 9000,
      principal: 6421,
      interest: 2579,
      balance: 507388,
      status: 'PAID'
    },
    {
      id: '4',
      date: '08 Jun 25',
      amount: 9000,
      principal: 6389,
      interest: 2611,
      balance: 513811,
      status: 'PAID'
    }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Mortgage Card */}
      <Card className="bg-white border-gray-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Home className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Home Mortgage
                </h2>
                <div className="text-sm text-gray-600">
                  {accountProvider} Account
                </div>
              </div>
            </div>
            <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${
              daysUntilDue <= 7 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
            }`}>
              <Clock className="w-3 h-3" />
              <span>{daysUntilDue} days</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Outstanding Balance</h3>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(outstandingBalance)}
                  </div>
                </div>
                <div className="p-2 bg-red-100 rounded-xl">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                </div>
              </div>
              <div className="flex items-center space-x-2 text-green-600">
                <TrendingDown className="w-3 h-3" />
                <span className="text-sm font-medium">-$7,249 this month</span>
              </div>
            </Card>

            <Card className="p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Interest Rate</h3>
                  <div className="text-2xl font-bold">
                    {interestRate}% p.a.
                  </div>
                </div>
                <div className="p-2 bg-yellow-100 rounded-xl">
                  <TrendingUp className="w-4 h-4 text-yellow-600" />
                </div>
              </div>
              <div className="flex items-center space-x-2 text-red-600">
                <TrendingUp className="w-3 h-3" />
                <span className="text-sm font-medium">+0.25% YTD</span>
              </div>
            </Card>
          </div>

          <Card className="p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Monthly Payment</h3>
              <div className="text-lg font-semibold">
                {formatCurrency(monthlyPayment)}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-900">Principal: {formatCurrency(principalAmount)}</span>
                  <span className="text-sm font-medium text-green-600">({principalPercentage.toFixed(1)}%)</span>
                </div>
                <Progress value={principalPercentage} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-900">Interest: {formatCurrency(interestAmount)}</span>
                  <span className="text-sm font-medium text-gray-600">({interestPercentage.toFixed(1)}%)</span>
                </div>
                <Progress value={interestPercentage} className="h-2 bg-gray-200" />
              </div>
            </div>
          </Card>

          <Card className={`p-4 border ${daysUntilDue <= 7 ? 'bg-red-50 border-red-200' : 'border-gray-200'}`}>
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-xl ${
                daysUntilDue <= 7 ? 'bg-red-100' : 'bg-blue-100'
              }`}>
                <Calendar className={`w-4 h-4 ${
                  daysUntilDue <= 7 ? 'text-red-600' : 'text-blue-600'
                }`} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-600 mb-1">Next Payment Due</div>
                <div className="font-semibold text-gray-900">
                  {nextPaymentDate}
                </div>
              </div>
              <div className={`text-right ${
                daysUntilDue <= 7 ? 'text-red-600' : 'text-gray-600'
              }`}>
                <div className="text-sm font-medium">{daysUntilDue} days</div>
                <div className="text-xs">14h 32m</div>
              </div>
            </div>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Button
              className="flex items-center space-x-2 bg-blue-500 text-white hover:bg-blue-600"
              onClick={() => handleAction('MAKE_PAYMENT')}
            >
              <CreditCard className="w-4 h-4" />
              <span>Make Payment</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAction('PAYMENT_HISTORY')}
            >
              <History className="w-4 h-4 mr-2" />
              History
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAction('AMORTIZATION')}
            >
              <Calculator className="w-4 h-4 mr-2" />
              Schedule
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAction('REFINANCE_CALC')}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refinance
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mortgage Payment History Table */}
      <Card className="bg-white border-gray-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Mortgage Payment History
            </CardTitle>
            <Button variant="outline" size="sm">
              Export CSV
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 text-sm font-medium text-gray-600">Date</th>
                  <th className="text-right py-3 text-sm font-medium text-gray-600">Amount</th>
                  <th className="text-right py-3 text-sm font-medium text-gray-600">Principal</th>
                  <th className="text-right py-3 text-sm font-medium text-gray-600">Interest</th>
                  <th className="text-right py-3 text-sm font-medium text-gray-600">Extra</th>
                  <th className="text-right py-3 text-sm font-medium text-gray-600">Balance</th>
                </tr>
              </thead>
              <tbody>
                {mockPaymentHistory.map((payment) => (
                  <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 text-sm text-gray-900">{payment.date}</td>
                    <td className="py-3 text-right text-sm font-semibold text-gray-900">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="py-3 text-right text-sm text-green-600 font-medium">
                      {formatCurrency(payment.principal)}
                    </td>
                    <td className="py-3 text-right text-sm text-gray-600">
                      {formatCurrency(payment.interest)}
                    </td>
                    <td className="py-3 text-right text-sm text-blue-600">
                      {payment.extra ? formatCurrency(payment.extra) : '-'}
                    </td>
                    <td className="py-3 text-right text-sm font-semibold text-gray-900">
                      {formatCurrency(payment.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}