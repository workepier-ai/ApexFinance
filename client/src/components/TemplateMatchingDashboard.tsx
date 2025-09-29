import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { NavigationTabs } from "./NavigationTabs";
import { UnifiedMortgageSection } from "./UnifiedMortgageSection";
import { CompactMortgageSection } from "./CompactMortgageSection";
import { EnhancedBillsManagementHub } from "./EnhancedBillsManagementHub";
import { BillManagementAdvanced } from "./BillManagementAdvanced";
import { UpcomingBillsSection } from "./UpcomingBillsSection";
import { AutoTagDashboard } from "./AutoTagDashboard";
import { PropertyManagementDashboard } from "./PropertyManagementDashboard";
import { SettingsDashboard } from "./SettingsDashboard";
import { Settings, Plus } from "lucide-react";

export function TemplateMatchingDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  // Bank account data (configurable)
  const bankAccounts = [
    { name: 'BOQ Everyday', balance: 12450, type: 'everyday', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { name: 'Westpac Savings', balance: 18200, type: 'savings', color: 'bg-green-100 text-green-700 border-green-200' },
    { name: 'ANZ Term Deposit', balance: 15600, type: 'term_deposit', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    { name: 'BOQ Mortgage Offset', balance: 2000, type: 'mortgage_offset', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    { name: 'Cash', balance: 500, type: 'cash', color: 'bg-gray-100 text-gray-700 border-gray-200' }
  ];

  // Financial calculation functions
  const calculateFinancialProjections = (bills: any[]) => {
    const monthlyIncome = 8750;
    const mortgagePayment = 9000;
    const extraMortgagePayments = 500; // configurable
    const savingsTransfer = 1200; // configurable
    const nextMortgageDue = new Date('2025-10-08');
    const today = new Date();

    // Calculate total current balance across all accounts
    const totalCurrentBalance = bankAccounts.reduce((sum, account) => sum + account.balance, 0);

    // Calculate bills due before next mortgage payment
    const billsDueBeforeMortgage = bills.filter(bill => {
      // Parse dates like "SEP 25", "OCT 3" etc.
      const [month, day] = bill.nextDue.split(' ');
      const monthMap: { [key: string]: number } = {
        'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'MAY': 4, 'JUN': 5,
        'JUL': 6, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11
      };
      const billDate = new Date(2025, monthMap[month], parseInt(day));
      return billDate <= nextMortgageDue;
    });

    const totalBillsBeforeMortgage = billsDueBeforeMortgage.reduce((sum, bill) => sum + bill.amount, 0);
    const urgentBills = billsDueBeforeMortgage.filter(bill => bill.status === 'DUE' || bill.status === 'READY').length;
    const autoPayBills = billsDueBeforeMortgage.filter(bill => bill.status === 'SCHEDULED').length;

    // Calculate spendable balance before mortgage (income - bills due before mortgage)
    const daysUntilMortgage = Math.ceil((nextMortgageDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const dailyIncome = monthlyIncome / 30; // approximate
    const incomeUntilMortgage = dailyIncome * daysUntilMortgage;
    const spendableBeforeMortgage = incomeUntilMortgage - totalBillsBeforeMortgage;

    // Calculate savings rate
    const totalMonthlyCosts = totalBillsBeforeMortgage + mortgagePayment; // approximate monthly costs
    const mortgagePercentage = (mortgagePayment / monthlyIncome) * 100;
    const extraPaymentsPercentage = (extraMortgagePayments / monthlyIncome) * 100;
    const savingsPercentage = (savingsTransfer / monthlyIncome) * 100;
    const totalSavingsRate = extraPaymentsPercentage + savingsPercentage;

    // Calculate emergency runway (months of expenses coverage)
    const monthlyExpenses = mortgagePayment + (totalBillsBeforeMortgage * 12 / 12); // Approximate monthly bills
    const emergencyRunway = totalCurrentBalance / monthlyExpenses;

    // Calculate income vs obligations
    const totalMonthlyObligations = mortgagePayment + totalBillsBeforeMortgage;
    const netCashFlow = monthlyIncome - totalMonthlyObligations;

    // Calculate cash after next mortgage payment
    const cashAfterMortgage = totalCurrentBalance + incomeUntilMortgage - totalBillsBeforeMortgage - mortgagePayment;

    // Format next mortgage date
    const nextMortgageDate = nextMortgageDue.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });

    // Cash flow runway (same as emergency runway)
    const cashFlowRunway = emergencyRunway.toFixed(1);

    // Financial safety assessment
    const financialSafety = emergencyRunway >= 6 ? 'Excellent' :
                           emergencyRunway >= 3 ? 'Good' :
                           emergencyRunway >= 1 ? 'Fair' : 'Low';

    return {
      totalCurrentBalance,
      bankAccounts,
      monthlyIncome,
      totalBillsBeforeMortgage,
      billsDueBeforeMortgage: billsDueBeforeMortgage.length,
      urgentBills,
      autoPayBills,
      daysUntilMortgage,
      spendableBeforeMortgage,
      incomeUntilMortgage,
      mortgagePercentage,
      extraPaymentsPercentage,
      savingsPercentage,
      totalSavingsRate,
      emergencyRunway,
      netCashFlow,
      totalMonthlyObligations,
      cashAfterMortgage,
      nextMortgageDate,
      cashFlowRunway,
      financialSafety
    };
  };

  const mockBills = [
    {
      id: 'mortgage',
      name: 'MORTGAGE',
      amount: 9000,
      frequency: 'Monthly' as const,
      nextDue: 'OCT 8',
      status: 'READY' as const,
      icon: '🏠'
    },
    {
      id: 'internet',
      name: 'NBN INTERNET',
      amount: 65.99,
      frequency: 'Monthly' as const,
      nextDue: 'SEP 25',
      status: 'DUE' as const,
      icon: '🌐'
    },
    {
      id: 'phone',
      name: 'PHONE',
      amount: 45,
      frequency: 'Monthly' as const,
      nextDue: 'SEP 28',
      status: 'READY' as const,
      icon: '📱'
    },
    {
      id: 'water',
      name: 'WATER',
      amount: 89,
      frequency: 'Quarterly' as const,
      nextDue: 'SEP 30',
      status: 'SCHEDULED' as const,
      icon: '💧',
      isVariable: true
    },
    {
      id: 'netflix',
      name: 'NETFLIX',
      amount: 24.99,
      frequency: 'Monthly' as const,
      nextDue: 'OCT 2',
      status: 'SCHEDULED' as const,
      icon: '🎬'
    },
    {
      id: 'groceries',
      name: 'GROCERIES',
      amount: 450,
      frequency: 'Weekly' as const,
      nextDue: 'SEP 26',
      status: 'READY' as const,
      icon: '🛒'
    },
    {
      id: 'fuel',
      name: 'FUEL',
      amount: 120,
      frequency: 'Weekly' as const,
      nextDue: 'SEP 27',
      status: 'READY' as const,
      icon: '⛽'
    },
    {
      id: 'insurance',
      name: 'CAR INSURANCE',
      amount: 280,
      frequency: 'Monthly' as const,
      nextDue: 'OCT 3',
      status: 'READY' as const,
      icon: '🚗'
    },
    {
      id: 'spotify',
      name: 'SPOTIFY',
      amount: 22.99,
      frequency: 'Monthly' as const,
      nextDue: 'OCT 5',
      status: 'SCHEDULED' as const,
      icon: '🎵'
    },
    {
      id: 'gym',
      name: 'GYM MEMBERSHIP',
      amount: 75,
      frequency: 'Monthly' as const,
      nextDue: 'OCT 7',
      status: 'READY' as const,
      icon: '💪'
    },
    {
      id: 'electricity',
      name: 'ELECTRICITY',
      amount: 234,
      frequency: 'Quarterly' as const,
      nextDue: 'OCT 15',
      status: 'READY' as const,
      icon: '⚡',
      isVariable: true
    }
  ];

  const mockPaymentHistory = [
    {
      id: '1',
      date: 'SEP 8, 2025',
      amount: 9000,
      principal: 6453,
      interest: 2547,
      balance: 487234,
      status: 'PAID' as const
    },
    {
      id: '2',
      date: 'AUG 8, 2025',
      amount: 9000,
      principal: 6421,
      interest: 2579,
      balance: 493687,
      status: 'PAID' as const
    },
    {
      id: '3',
      date: 'JUL 8, 2025',
      amount: 9000,
      principal: 6389,
      interest: 2611,
      balance: 500108,
      status: 'PAID' as const
    }
  ];

  const financials = calculateFinancialProjections(mockBills);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Financial Dashboard</h1>
              <p className="text-sm text-gray-600">Personal and rental finance management</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                <Plus className="w-4 h-4 mr-2" />
                Add Transaction
              </Button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-4">
            <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
        </div>
      </header>

      {/* Main Content - Wider for better screen utilization */}
      <main className="max-w-full mx-auto px-4 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Top Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-6">
              {/* Slimline Horizontal Bank Balances & Income Tile */}
              <Card className="p-4 bg-white/70 backdrop-blur-sm border-blue-200 col-span-1 md:col-span-2 lg:col-span-2">
                <div className="space-y-3">
                  {/* Horizontal Layout - Bank Balances Left, Monthly Income Right */}
                  <div className="flex items-start justify-between">
                    {/* Left Side - Bank Balances */}
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <span className="text-lg">💳</span>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                          Bank Balances
                        </h3>
                        <div className="text-2xl font-bold text-blue-600">
                          ${financials.totalCurrentBalance.toLocaleString()}
                        </div>
                        <div className="text-xs text-blue-500 flex items-center">
                          <span className="mr-1">🏛️</span>
                          {financials.bankAccounts.length} accounts
                        </div>
                      </div>
                    </div>

                    {/* Right Side - Monthly Income */}
                    <div className="flex items-center space-x-3">
                      <div>
                        <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide text-right">
                          Monthly Income
                        </h3>
                        <div className="text-2xl font-bold text-green-600 text-right">
                          ${financials.monthlyIncome.toLocaleString()}
                        </div>
                        <div className="text-xs text-green-600 flex items-center justify-end">
                          <span className="mr-1">💰</span>
                          Net: +${financials.netCashFlow.toLocaleString()}
                        </div>
                      </div>
                      <div className="p-2 bg-green-100 rounded-lg">
                        <span className="text-lg">💰</span>
                      </div>
                    </div>
                  </div>

                  {/* Bank Account Bubbles - Full Width Bottom */}
                  <div className="flex flex-wrap gap-1">
                    {financials.bankAccounts.map((account, index) => (
                      <div key={index} className={`px-2 py-1 rounded-md text-xs font-medium border ${account.color} flex-shrink-0`}>
                        {account.name.split(' ')[0]} ${(account.balance / 1000).toFixed(0)}k
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Combined Spendable & Savings Tile - Vertical Split */}
              <Card className="p-6 bg-white/70 backdrop-blur-sm border-green-200 col-span-1">
                <div className="h-full flex flex-col">
                  {/* Top Half - Spendable Before Mortgage */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                          Spendable Before Mortgage
                        </h3>
                        <div className="text-2xl font-bold text-green-600">
                          ${Math.max(0, financials.spendableBeforeMortgage).toLocaleString()}
                        </div>
                      </div>
                      <div className="p-2 bg-green-100 rounded-full">
                        <span className="text-xl">🛍️</span>
                      </div>
                    </div>
                    <div className="space-y-1 text-xs text-gray-500">
                      <div className="flex justify-between">
                        <span>Income ({financials.daysUntilMortgage}d):</span>
                        <span>${financials.incomeUntilMortgage.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bills Due:</span>
                        <span>-${financials.totalBillsBeforeMortgage.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-200 my-3"></div>

                  {/* Bottom Half - Savings Rate */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                          Savings Rate
                        </h3>
                        <div className="text-2xl font-bold text-purple-600">
                          {financials.totalSavingsRate.toFixed(1)}%
                        </div>
                      </div>
                      <div className="p-2 bg-purple-100 rounded-full">
                        <span className="text-xl">💎</span>
                      </div>
                    </div>
                    <div className="space-y-1 text-xs text-gray-500">
                      <div className="flex justify-between">
                        <span>Mortgage:</span>
                        <span>{financials.mortgagePercentage.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Extra + Savings:</span>
                        <span>{financials.totalSavingsRate.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Enhanced Tenancy Occupancy Tracking Tile */}
              <Card className="p-6 bg-white/70 backdrop-blur-sm border-indigo-200 col-span-1">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                      Tenancy Management
                    </h3>
                    <div className="text-2xl font-bold text-indigo-600">
                      4/4 Units
                    </div>
                    <div className="text-sm text-indigo-600 flex items-center mt-1">
                      <span className="mr-1">🏘️</span>
                      $3,200/month income
                    </div>
                  </div>
                  <div className="p-3 bg-indigo-100 rounded-full">
                    <span className="text-xl">🏢</span>
                  </div>
                </div>

                {/* Tenant Status List */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="font-medium">John Smith</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-green-600 font-medium">On Time</span>
                      <span className="text-gray-500">$800</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="font-medium">Sarah Chen</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-yellow-600 font-medium">2d Late</span>
                      <span className="text-gray-500">$850</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="font-medium">Mike Johnson</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-green-600 font-medium">Paid</span>
                      <span className="text-gray-500">$775</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="font-medium">Emma Wilson</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-green-600 font-medium">Auto-pay</span>
                      <span className="text-gray-500">$775</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="flex-1 h-7 text-xs bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100">
                    Send Reminder
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 h-7 text-xs bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100">
                    Manage Tenants
                  </Button>
                </div>
              </Card>


            </div>

            {/* Optimized Layout - More Mortgage Space, Less Bills Empty Space */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              {/* Left Section - Mortgage Payment Details (9 columns = 75% width) */}
              <div className="xl:col-span-9">
                <UnifiedMortgageSection
                  outstandingBalance={487234}
                  interestRate={6.21}
                  monthlyPayment={9000}
                  principalAmount={6453}
                  interestAmount={2547}
                  nextPaymentDate="OCTOBER 8, 2025"
                  daysUntilDue={22}
                  accountProvider="BOQ"
                  originalBalance={500000}
                />
              </div>

              {/* Right Section - Upcoming Bills (3 columns = 25% width) */}
              <div className="xl:col-span-3">
                <UpcomingBillsSection />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'mortgage' && (
          <div className="space-y-6">
            <UnifiedMortgageSection
              outstandingBalance={487234}
              interestRate={6.21}
              monthlyPayment={9000}
              principalAmount={6453}
              interestAmount={2547}
              nextPaymentDate="OCTOBER 8, 2025"
              daysUntilDue={22}
              accountProvider="BOQ"
              originalBalance={500000}
            />
          </div>
        )}

        {activeTab === 'bills' && (
          <div className="space-y-6">
            <EnhancedBillsManagementHub />
          </div>
        )}

        {activeTab === 'bills-advanced' && (
          <div className="space-y-6">
            <BillManagementAdvanced />
          </div>
        )}

        {activeTab === 'auto-tag' && (
          <div className="space-y-6">
            <AutoTagDashboard />
          </div>
        )}

        {activeTab === 'property' && (
          <div className="space-y-6">
            <PropertyManagementDashboard />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <SettingsDashboard />
          </div>
        )}

        {/* Other tabs content can be added here */}
        {['transactions', 'subscriptions'].includes(activeTab) && (
          <Card className="p-12 bg-white/70 backdrop-blur-sm border-gray-200">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} View
              </h3>
              <p className="text-gray-600">This section is coming soon!</p>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}