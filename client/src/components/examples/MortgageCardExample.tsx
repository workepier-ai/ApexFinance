import { MortgageCard } from '../MortgageCard'

export default function MortgageCardExample() {
  return (
    <div className="p-4 bg-gray-50">
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
    </div>
  )
}