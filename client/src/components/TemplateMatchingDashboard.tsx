import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NavigationTabs } from "./NavigationTabs";
import { UnifiedMortgageSection } from "./UnifiedMortgageSection";
import { EnhancedBillsManagementHub } from "./EnhancedBillsManagementHub";
import { Settings, Plus } from "lucide-react";

export function TemplateMatchingDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

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
      nextDue: 'SEP 21',
      status: 'DUE' as const,
      icon: '🌐'
    },
    {
      id: 'phone',
      name: 'PHONE',
      amount: 45,
      frequency: 'Monthly' as const,
      nextDue: 'SEP 25',
      status: 'READY' as const,
      icon: '📱'
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
    },
    {
      id: 'water',
      name: 'WATER',
      amount: 89,
      frequency: 'Quarterly' as const,
      nextDue: 'SEP 24',
      status: 'SCHEDULED' as const,
      icon: '💧',
      isVariable: true
    },
    {
      id: 'netflix',
      name: 'NETFLIX',
      amount: 24.99,
      frequency: 'Monthly' as const,
      nextDue: 'SEP 23',
      status: 'SCHEDULED' as const,
      icon: '🎬'
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Top Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6 bg-white/70 backdrop-blur-sm border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                      Total Balance
                    </h3>
                    <div className="text-3xl font-bold text-gray-900">$48,250</div>
                    <div className="text-sm text-green-600 flex items-center mt-1">
                      <span className="mr-1">↗</span>
                      +2.1%
                    </div>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <span className="text-2xl">💰</span>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>Last Month:</span>
                    <span>+$1,023</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Quarter:</span>
                    <span>+$4,567</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white/70 backdrop-blur-sm border-green-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                      Monthly Income
                    </h3>
                    <div className="text-3xl font-bold text-gray-900">$8,750</div>
                    <div className="text-sm text-green-600 flex items-center mt-1">
                      <span className="mr-1">↗</span>
                      +12%
                    </div>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <span className="text-2xl">📈</span>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>Last Month:</span>
                    <span>$7,814</span>
                  </div>
                  <div className="flex justify-between">
                    <span>3-Mo Avg:</span>
                    <span>$8,123</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white/70 backdrop-blur-sm border-green-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                      Cash Flow (30D)
                    </h3>
                    <div className="text-3xl font-bold text-green-600">+$4,250</div>
                    <div className="text-sm text-green-600 flex items-center mt-1">
                      <span className="mr-1">↗</span>
                      Positive
                    </div>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <span className="text-2xl">💚</span>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>Last Month:</span>
                    <span>+$3,892</span>
                  </div>
                  <div className="flex justify-between">
                    <span>3-Mo Avg:</span>
                    <span>+$3,789</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white/70 backdrop-blur-sm border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                      Collection Rate
                    </h3>
                    <div className="text-3xl font-bold text-purple-600">94%</div>
                    <div className="text-sm text-purple-600 flex items-center mt-1">
                      <span className="mr-1">↗</span>
                      Healthy
                    </div>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <span className="text-2xl">🎯</span>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>Last Month:</span>
                    <span>92%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>3-Mo Avg:</span>
                    <span>91%</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Two Column Layout - Unified Mortgage & Bills */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Left Column - Unified Mortgage Section (2/3 width) */}
              <div className="xl:col-span-2">
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

              {/* Right Column - Enhanced Bills Management Hub (1/3 width) */}
              <div className="xl:col-span-1">
                <EnhancedBillsManagementHub />
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

        {/* Other tabs content can be added here */}
        {['transactions', 'subscriptions', 'auto-tag'].includes(activeTab) && (
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