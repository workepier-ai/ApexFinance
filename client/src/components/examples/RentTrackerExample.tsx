import { RentTracker } from '../RentTracker'

export default function RentTrackerExample() {
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
  ]

  return (
    <div className="p-4 bg-gray-50">
      <RentTracker 
        tenants={mockTenants}
        totalCollected={5510}
        totalExpected={5640}
        collectionRate={97.7}
      />
    </div>
  )
}