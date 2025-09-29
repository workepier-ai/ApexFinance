import { FinancialCard } from '../FinancialCard'

export default function FinancialCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-gray-50">
      <FinancialCard
        title="TOTAL BALANCE"
        amount="$14,234.67"
        trend="+2.3% TODAY"
        status="positive"
        actionText="VIEW"
      />
      <FinancialCard
        title="RENT COLLECTED"
        amount="$5,510.00"
        subtitle="97.7% COLLECTED"
        trend="4 TENANTS"
        status="positive"
        actionText="MANAGE"
      />
      <FinancialCard
        title="MONTHLY BILLS"
        amount="$10,234.00"
        subtitle="MORTGAGE + EXPENSES"
        trend="DUE IN 5 DAYS"
        status="negative"
        actionText="PAY NOW"
      />
    </div>
  )
}