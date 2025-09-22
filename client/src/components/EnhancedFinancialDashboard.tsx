import { BrutalHeader } from "./BrutalHeader";
import { RentTracker } from "./RentTracker";
import { MortgageCard } from "./MortgageCard";
import { BillsTable } from "./BillsTable";
import { QuickActions } from "./QuickActions";
import { TransactionEntry } from "./TransactionEntry";

export function EnhancedFinancialDashboard() {
  const mockTenants = [
    {
      id: '1',
      bedNumber: 'BED 1',
      status: 'PAID' as const,
      amount: 1410,
      dueDate: '15 SEP'
    },
    {
      id: '2',
      bedNumber: 'BED 2',
      status: 'LATE' as const,
      amount: 1410,
      dueDate: '15 SEP'
    },
    {
      id: '3',
      bedNumber: 'BED 3',
      status: 'PAID' as const,
      amount: 1410,
      dueDate: '15 SEP'
    },
    {
      id: '4',
      bedNumber: 'BED 4',
      status: 'PENDING' as const,
      amount: 1410,
      dueDate: '15 SEP'
    }
  ];

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
    },
    {
      id: '4',
      date: 'OCT 8, 2025',
      amount: 9000,
      principal: 6485,
      interest: 2515,
      balance: 480749,
      status: 'SCHEDULED' as const
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <BrutalHeader />

      <main className="p-6 space-y-6">
        {/* Primary Layout - Mortgage Calculator & Bill Management Hub */}
        <section className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main Content - Mortgage & Bills */}
          <div className="xl:col-span-3 space-y-6">
            {/* Enhanced Mortgage Card with Payment History */}
            <MortgageCard
              outstandingBalance={487234}
              interestRate={6.21}
              monthlyPayment={9000}
              principalAmount={6453}
              interestAmount={2547}
              nextPaymentDate="OCTOBER 8, 2025"
              daysUntilDue={22}
              accountProvider="BOQ"
              originalBalance={500000}
              paymentHistory={mockPaymentHistory}
              showHistory={true}
            />

            {/* Bill Management Hub */}
            <BillsTable
              bills={mockBills}
              monthlyTotal={10234}
              quarterlyAvg={323}
              annualTotal={126789}
            />
          </div>

          {/* Sidebar - Quick Actions & Transaction Entry */}
          <div className="xl:col-span-1 space-y-6">
            <QuickActions
              tenants={mockTenants}
              className="sticky top-6"
            />

            <TransactionEntry />
          </div>
        </section>

        {/* Secondary Section - Rent Management */}
        <section>
          <RentTracker
            tenants={mockTenants}
            totalCollected={5510}
            totalExpected={5640}
            collectionRate={97.7}
          />
        </section>

        {/* Minimal Footer */}
        <footer className="brutal-border brutal-shadow bg-black text-white p-4 mt-8">
          <div className="flex justify-between items-center">
            <div className="brutal-text text-sm">
              FINANCEFLOW - COMMAND CENTER
            </div>
            <div className="text-xs brutal-mono">
              PROPERTIES: 4 | BILLS: 14 | STATUS: OPERATIONAL
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}