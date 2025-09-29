import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import {
  Home,
  Calendar,
  CreditCard,
  TrendingDown,
  TrendingUp,
  Clock,
  History,
  Calculator,
  RefreshCw,
  Eye,
  EyeOff,
  ChevronDown
} from "lucide-react";

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

interface ScheduleRecord {
  id: string;
  date: string;
  paymentNumber: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  cumulativeInterest: number;
}

interface MetricsPeriod {
  value: string;
  label: string;
  data: {
    principalPaid: number;
    interestPaid: number;
    extraPayments: number;
    paymentsCount: number;
  };
}

interface UnifiedMortgageSectionProps {
  outstandingBalance: number;
  interestRate: number;
  monthlyPayment: number;
  principalAmount: number;
  interestAmount: number;
  nextPaymentDate: string;
  daysUntilDue: number;
  accountProvider: string;
  originalBalance?: number;
  className?: string;
}

export function UnifiedMortgageSection({
  outstandingBalance,
  interestRate,
  monthlyPayment,
  principalAmount,
  interestAmount,
  nextPaymentDate,
  daysUntilDue,
  accountProvider,
  originalBalance = 500000,
  className = ""
}: UnifiedMortgageSectionProps) {

  const [activeView, setActiveView] = useState<'history' | 'schedule' | 'amortization'>('history');
  const [selectedPeriod, setSelectedPeriod] = useState('1month');
  const [showPaymentSection, setShowPaymentSection] = useState(true);

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

  // Mock data for different periods
  const metricsPeriods: MetricsPeriod[] = [
    {
      value: '1month',
      label: 'Last Month',
      data: {
        principalPaid: 6453,
        interestPaid: 2547,
        extraPayments: 0,
        paymentsCount: 1
      }
    },
    {
      value: '3month',
      label: 'Last 3 Months',
      data: {
        principalPaid: 19263,
        interestPaid: 7737,
        extraPayments: 7249,
        paymentsCount: 3
      }
    },
    {
      value: '6month',
      label: 'Last 6 Months',
      data: {
        principalPaid: 38526,
        interestPaid: 15474,
        extraPayments: 12000,
        paymentsCount: 6
      }
    },
    {
      value: '1year',
      label: 'Last Year',
      data: {
        principalPaid: 77052,
        interestPaid: 30948,
        extraPayments: 25000,
        paymentsCount: 12
      }
    },
    {
      value: 'ytd',
      label: 'Year to Date',
      data: {
        principalPaid: 58289,
        interestPaid: 23211,
        extraPayments: 18500,
        paymentsCount: 9
      }
    }
  ];

  const currentPeriodData = metricsPeriods.find(p => p.value === selectedPeriod)?.data || metricsPeriods[0].data;

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
      amount: 16249.55,
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
    },
    {
      id: '5',
      date: '08 Oct 25',
      amount: 9000,
      principal: 6485,
      interest: 2515,
      balance: 480749,
      status: 'SCHEDULED'
    },
    {
      id: '6',
      date: '08 Nov 25',
      amount: 9000,
      principal: 6517,
      interest: 2483,
      balance: 474232,
      status: 'SCHEDULED'
    }
  ];

  const mockSchedule: ScheduleRecord[] = [
    {
      id: '1',
      date: 'Oct 2025',
      paymentNumber: 85,
      payment: 9000,
      principal: 6485,
      interest: 2515,
      balance: 480749,
      cumulativeInterest: 285420
    },
    {
      id: '2',
      date: 'Nov 2025',
      paymentNumber: 86,
      payment: 9000,
      principal: 6517,
      interest: 2483,
      balance: 474232,
      cumulativeInterest: 287903
    },
    {
      id: '3',
      date: 'Dec 2025',
      paymentNumber: 87,
      payment: 9000,
      principal: 6549,
      interest: 2451,
      balance: 467683,
      cumulativeInterest: 290354
    },
    {
      id: '4',
      date: 'Jan 2026',
      paymentNumber: 88,
      payment: 9000,
      principal: 6581,
      interest: 2419,
      balance: 461102,
      cumulativeInterest: 292773
    }
  ];

  return (
    <div className={`${className}`}>
      {/* Smart Transforming Mortgage Card */}
      <Card className="bg-white border-gray-200 transition-all duration-300 ease-in-out">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Home className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {showPaymentSection ? 'Mortgage Payment Details' : 'Home Mortgage'}
                </h2>
                <div className="text-sm text-gray-600">
                  {accountProvider} Account
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {!showPaymentSection && (
                <>
                  {/* Period Selector - Only in overview mode */}
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="period-select" className="text-sm text-gray-600">
                      Period:
                    </Label>
                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {metricsPeriods.map((period) => (
                          <SelectItem key={period.value} value={period.value}>
                            {period.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {showPaymentSection && (
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    Export CSV
                  </Button>
                </div>
              )}

              <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${
                daysUntilDue <= 7 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
              }`}>
                <Clock className="w-3 h-3" />
                <span>{daysUntilDue} days</span>
              </div>
            </div>
          </div>

          {/* Integrated Tabs - Only show when payment details active */}
          {showPaymentSection && (
            <div className="mt-4">
              <Tabs value={activeView} onValueChange={(value) => setActiveView(value as any)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="history" className="flex items-center space-x-2">
                    <History className="w-4 h-4" />
                    <span>Payment History</span>
                  </TabsTrigger>
                  <TabsTrigger value="schedule" className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Upcoming Schedule</span>
                  </TabsTrigger>
                  <TabsTrigger value="amortization" className="flex items-center space-x-2">
                    <Calculator className="w-4 h-4" />
                    <span>Amortization</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-6 transition-all duration-300 ease-in-out">
          {/* Smart Content Area - Overview or Payment Details */}
          {!showPaymentSection ? (
            <>
              {/* Overview Mode - Full 4-card metrics grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                    Principal Paid
                  </h3>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(currentPeriodData.principalPaid)}
                  </div>
                </div>
                <div className="p-2 bg-green-100 rounded-xl">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
              </div>
              <div className="text-xs text-gray-600">
                {metricsPeriods.find(p => p.value === selectedPeriod)?.label}
              </div>
            </Card>

            <Card className="p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                    Interest Paid
                  </h3>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(currentPeriodData.interestPaid)}
                  </div>
                </div>
                <div className="p-2 bg-red-100 rounded-xl">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                </div>
              </div>
              <div className="text-xs text-gray-600">
                {currentPeriodData.paymentsCount} payments
              </div>
            </Card>

            <Card className="p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                    Extra Payments
                  </h3>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(currentPeriodData.extraPayments)}
                  </div>
                </div>
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Calculator className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              <div className="text-xs text-gray-600">
                Accelerated payoff
              </div>
            </Card>

            <Card className="p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                    Outstanding Balance
                  </h3>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(outstandingBalance)}
                  </div>
                </div>
                <div className="p-2 bg-gray-100 rounded-xl">
                  <Home className="w-4 h-4 text-gray-600" />
                </div>
              </div>
              <div className="text-xs text-gray-600">
                {interestRate}% p.a.
              </div>
            </Card>
              </div>

              {/* Monthly Payment Breakdown */}
              <div>
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
              </div>

              {/* Next Payment Due Card */}
              <div>
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
              </div>
            </>
          ) : (
            <>
              {/* Payment Details Mode - Compact layout with integrated content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Compact Summary Cards */}
                <Card className="p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-1">
                        Outstanding Balance
                      </h3>
                      <div className="text-2xl font-bold text-gray-900">
                        {formatCurrency(outstandingBalance)}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {interestRate}% p.a. • {formatCurrency(monthlyPayment)}/month
                      </div>
                    </div>
                    <div className="p-2 bg-gray-100 rounded-xl">
                      <Home className="w-5 h-5 text-gray-600" />
                    </div>
                  </div>
                </Card>

                <Card className={`p-4 border ${daysUntilDue <= 7 ? 'bg-red-50 border-red-200' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-1">
                        Next Payment Due
                      </h3>
                      <div className="text-xl font-bold text-gray-900">
                        {nextPaymentDate}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Principal: {formatCurrency(principalAmount)} • Interest: {formatCurrency(interestAmount)}
                      </div>
                    </div>
                    <div className={`text-center ${
                      daysUntilDue <= 7 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      <div className="text-2xl font-bold">{daysUntilDue}</div>
                      <div className="text-xs">days left</div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Payment Details Content */}
              <Tabs value={activeView} onValueChange={(value) => setActiveView(value as any)}>
                {/* Payment History View */}
                <TabsContent value="history" className="mt-0">
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
                          <th className="text-center py-3 text-sm font-medium text-gray-600">Status</th>
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
                            <td className="py-3 text-center">
                              <Badge className={
                                payment.status === 'PAID' ? 'bg-green-100 text-green-800' :
                                payment.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                                'bg-red-100 text-red-800'
                              }>
                                {payment.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                {/* Schedule View */}
                <TabsContent value="schedule" className="mt-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 text-sm font-medium text-gray-600">Date</th>
                          <th className="text-center py-3 text-sm font-medium text-gray-600">Payment #</th>
                          <th className="text-right py-3 text-sm font-medium text-gray-600">Payment</th>
                          <th className="text-right py-3 text-sm font-medium text-gray-600">Principal</th>
                          <th className="text-right py-3 text-sm font-medium text-gray-600">Interest</th>
                          <th className="text-right py-3 text-sm font-medium text-gray-600">Balance</th>
                          <th className="text-right py-3 text-sm font-medium text-gray-600">Total Interest</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockSchedule.map((payment) => (
                          <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 text-sm text-gray-900">{payment.date}</td>
                            <td className="py-3 text-center text-sm text-gray-600">{payment.paymentNumber}</td>
                            <td className="py-3 text-right text-sm font-semibold text-gray-900">
                              {formatCurrency(payment.payment)}
                            </td>
                            <td className="py-3 text-right text-sm text-green-600 font-medium">
                              {formatCurrency(payment.principal)}
                            </td>
                            <td className="py-3 text-right text-sm text-gray-600">
                              {formatCurrency(payment.interest)}
                            </td>
                            <td className="py-3 text-right text-sm font-semibold text-gray-900">
                              {formatCurrency(payment.balance)}
                            </td>
                            <td className="py-3 text-right text-sm text-red-600">
                              {formatCurrency(payment.cumulativeInterest)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                {/* Amortization View */}
                <TabsContent value="amortization" className="mt-0">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="p-4 border border-blue-200 bg-blue-50">
                        <h4 className="text-sm font-medium text-blue-800 mb-2">Current Status</h4>
                        <div className="text-2xl font-bold text-blue-900">{((originalBalance - outstandingBalance) / originalBalance * 100).toFixed(1)}%</div>
                        <div className="text-sm text-blue-700">Loan Paid Off</div>
                      </Card>

                      <Card className="p-4 border border-green-200 bg-green-50">
                        <h4 className="text-sm font-medium text-green-800 mb-2">Remaining Term</h4>
                        <div className="text-2xl font-bold text-green-900">28.5</div>
                        <div className="text-sm text-green-700">Years Left</div>
                      </Card>

                      <Card className="p-4 border border-purple-200 bg-purple-50">
                        <h4 className="text-sm font-medium text-purple-800 mb-2">Total Interest</h4>
                        <div className="text-2xl font-bold text-purple-900">{formatCurrency(285420)}</div>
                        <div className="text-sm text-purple-700">Paid So Far</div>
                      </Card>
                    </div>

                    <div className="mt-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Payoff Scenarios</h4>
                      <div className="space-y-3">
                        {[
                          { extra: 0, years: 28.5, totalInterest: 578000, monthlyPayment: 9000 },
                          { extra: 500, years: 22.8, totalInterest: 445000, monthlyPayment: 9500 },
                          { extra: 1000, years: 19.2, totalInterest: 378000, monthlyPayment: 10000 },
                          { extra: 2000, years: 15.1, totalInterest: 289000, monthlyPayment: 11000 }
                        ].map((scenario, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                            <div className="flex items-center space-x-4">
                              <span className="text-sm font-medium text-gray-900">
                                {scenario.extra === 0 ? 'Current Plan' : `+${formatCurrency(scenario.extra)}/month`}
                              </span>
                              <span className="text-sm text-gray-600">
                                {scenario.years} years
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-gray-900">
                                {formatCurrency(scenario.totalInterest)}
                              </div>
                              <div className="text-xs text-gray-600">Total Interest</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-6">
            <Button
              className="flex items-center space-x-2 bg-blue-500 text-white hover:bg-blue-600"
              onClick={() => handleAction('MAKE_PAYMENT')}
            >
              <CreditCard className="w-4 h-4" />
              <span>Make Payment</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAction('EXTRA_PAYMENT')}
            >
              <Calculator className="w-4 h-4 mr-2" />
              Extra Payment
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAction('REFINANCE_CALC')}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refinance
            </Button>
            <Button
              variant={showPaymentSection ? "default" : "outline"}
              className={showPaymentSection ? "bg-green-500 text-white hover:bg-green-600 transform scale-105" : "hover:bg-gray-50"}
              onClick={() => setShowPaymentSection(!showPaymentSection)}
            >
              {showPaymentSection ? (
                <><ChevronDown className="w-4 h-4 mr-2" />Hide Details</>
              ) : (
                <><History className="w-4 h-4 mr-2" />Payment Details</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}