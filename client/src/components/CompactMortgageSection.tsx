import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Home, Calendar, TrendingDown, Clock } from "lucide-react";

interface CompactMortgageSectionProps {
  outstandingBalance: number;
  interestRate: number;
  monthlyPayment: number;
  principalAmount: number;
  interestAmount: number;
  nextPaymentDate: string;
  daysUntilDue: number;
  accountProvider: string;
  originalBalance: number;
}

export function CompactMortgageSection({
  outstandingBalance,
  interestRate,
  monthlyPayment,
  principalAmount,
  interestAmount,
  nextPaymentDate,
  daysUntilDue,
  accountProvider,
  originalBalance
}: CompactMortgageSectionProps) {
  const paidAmount = originalBalance - outstandingBalance;
  const progressPercentage = (paidAmount / originalBalance) * 100;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="bg-white border-gray-200 h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
            <Home className="w-5 h-5 mr-2 text-blue-500" />
            Mortgage Overview
          </CardTitle>
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">{accountProvider}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Key Numbers Row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(outstandingBalance)}</div>
            <div className="text-xs text-gray-500">Outstanding</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(monthlyPayment)}</div>
            <div className="text-xs text-gray-500">Monthly Payment</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{interestRate}%</div>
            <div className="text-xs text-gray-500">Interest Rate</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Loan Progress</span>
            <span className="font-medium">{progressPercentage.toFixed(1)}% paid</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{formatCurrency(paidAmount)} paid</span>
            <span>{formatCurrency(outstandingBalance)} remaining</span>
          </div>
        </div>

        {/* Next Payment Details */}
        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm font-medium text-gray-700">
              <Calendar className="w-4 h-4 mr-2" />
              Next Payment
            </div>
            <Badge variant="outline" className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {daysUntilDue} days
            </Badge>
          </div>
          <div className="text-sm text-gray-600">{nextPaymentDate}</div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Principal:</span>
              <span className="font-medium text-green-600">{formatCurrency(principalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Interest:</span>
              <span className="font-medium text-orange-600">{formatCurrency(interestAmount)}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button size="sm" className="flex-1 h-8 text-xs bg-blue-500 hover:bg-blue-600">
            Make Payment
          </Button>
          <Button size="sm" variant="outline" className="flex-1 h-8 text-xs">
            Extra Payment
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-xs">
            <TrendingDown className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}