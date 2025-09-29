import { BrutalHeader } from "./BrutalHeader";
import { FinancialCard } from "./FinancialCard";
import { RentTracker } from "./RentTracker";
import { MortgageCard } from "./MortgageCard";
import { BillsTable } from "./BillsTable";
import { TransactionEntry } from "./TransactionEntry";

export function FinancialDashboard() {
  //todo: remove mock functionality
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

  return (
    <div className="min-h-screen bg-gray-100">
      <BrutalHeader />
      
      <main className="p-6 space-y-8">
        {/* Financial Overview Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6" data-testid="section-financial-overview">
          <FinancialCard
            title="TOTAL BALANCE"
            amount="$14,234.67"
            trend="+2.3% TODAY"
            status="positive"
            actionText="VIEW ACCOUNTS"
          />
          <FinancialCard
            title="MONTHLY INCOME"
            amount="$11,627.00"
            subtitle="JOBS + RENT"
            trend="2 SOURCES"
            status="positive"
            actionText="BREAKDOWN"
          />
          <FinancialCard
            title="CASH FLOW"
            amount="+$3,393.00"
            subtitle="AFTER ALL EXPENSES"
            trend="POSITIVE FLOW"
            status="positive"
            actionText="OPTIMIZE"
          />
        </section>

        {/* Rent Management */}
        <section data-testid="section-rent-management">
          <RentTracker 
            tenants={mockTenants}
            totalCollected={5510}
            totalExpected={5640}
            collectionRate={97.7}
          />
        </section>

        {/* Mortgage & Bills Layout */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2" data-testid="section-mortgage-bills">
            <div className="space-y-6">
              <MortgageCard
                outstandingBalance={487234}
                interestRate={6.21}
                monthlyPayment={9000}
                principalAmount={6453}
                interestAmount={2547}
                nextPaymentDate="OCTOBER 8, 2025"
                daysUntilDue={22}
                accountProvider="BOQ"
              />
              
              <BillsTable 
                bills={mockBills}
                monthlyTotal={10234}
                quarterlyAvg={323}
                annualTotal={126789}
              />
            </div>
          </div>
          
          <div data-testid="section-transaction-entry">
            <TransactionEntry />
          </div>
        </section>

        {/* Brutal Footer */}
        <footer className="brutal-border brutal-shadow bg-black text-white p-6 mt-12">
          <div className="brutal-text text-center text-lg">
            FINANCEFLOW - BRUTALLY HONEST FINANCIAL COMMAND CENTER
          </div>
          <div className="text-center text-sm mt-2 brutal-mono">
            PROPERTIES: 4 | ACCOUNTS: 6 | BILLS: 14 | STATUS: OPERATIONAL
          </div>
        </footer>
      </main>
    </div>
  );
}