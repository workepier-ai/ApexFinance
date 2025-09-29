import { BillsTable } from '../BillsTable'

export default function BillsTableExample() {
  //todo: remove mock functionality
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
  ]

  return (
    <div className="p-4 bg-gray-50">
      <BillsTable 
        bills={mockBills}
        monthlyTotal={10234}
        quarterlyAvg={323}
        annualTotal={126789}
      />
    </div>
  )
}