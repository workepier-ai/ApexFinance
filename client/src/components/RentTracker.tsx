import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TenantStatus {
  id: string;
  bedNumber: string;
  status: 'PAID' | 'LATE' | 'PENDING';
  amount: number;
  dueDate: string;
}

interface RentTrackerProps {
  tenants: TenantStatus[];
  totalCollected: number;
  totalExpected: number;
  collectionRate: number;
}

export function RentTracker({ tenants, totalCollected, totalExpected, collectionRate }: RentTrackerProps) {
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'PAID': return 'status-paid';
      case 'LATE': return 'status-late';
      case 'PENDING': return 'status-pending';
      default: return 'bg-gray-200 text-black';
    }
  };

  const handleTenantAction = (bedNumber: string, status: string) => {
    console.log(`${status} action for ${bedNumber}`);
  };

  return (
    <Card className="brutal-border brutal-shadow bg-white p-6">
      <div className="mb-6">
        <h2 className="brutal-text text-2xl mb-2" data-testid="text-rent-tracker-title">
          TENANT PAYMENT STATUS
        </h2>
        <div className="flex items-center space-x-6 brutal-mono">
          <div data-testid="text-collected-amount">
            COLLECTED: <span className="font-black">${totalCollected.toLocaleString()}</span>
          </div>
          <div data-testid="text-collection-rate">
            RATE: <span className="font-black status-paid px-2">{collectionRate}%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {tenants.map((tenant) => (
          <div key={tenant.id} className="brutal-border bg-gray-50 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="brutal-text text-lg" data-testid={`text-${tenant.bedNumber.toLowerCase()}-title`}>
                {tenant.bedNumber}
              </h3>
              <div 
                className={`px-2 py-1 brutal-text text-sm ${getStatusClass(tenant.status)}`}
                data-testid={`status-${tenant.bedNumber.toLowerCase()}`}
              >
                {tenant.status}
              </div>
            </div>
            
            <div className="brutal-mono mb-3">
              <div className="text-xl font-black" data-testid={`amount-${tenant.bedNumber.toLowerCase()}`}>
                ${tenant.amount}
              </div>
              <div className="text-sm text-gray-600" data-testid={`due-date-${tenant.bedNumber.toLowerCase()}`}>
                DUE: {tenant.dueDate}
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="brutal-border brutal-text text-xs flex-1"
                onClick={() => handleTenantAction(tenant.bedNumber, 'VIEW')}
                data-testid={`button-view-${tenant.bedNumber.toLowerCase()}`}
              >
                VIEW
              </Button>
              <Button
                variant="default"
                size="sm"
                className="brutal-border brutal-text text-xs bg-black text-white hover:bg-white hover:text-black flex-1"
                onClick={() => handleTenantAction(tenant.bedNumber, 'CONTACT')}
                data-testid={`button-contact-${tenant.bedNumber.toLowerCase()}`}
              >
                CONTACT
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}