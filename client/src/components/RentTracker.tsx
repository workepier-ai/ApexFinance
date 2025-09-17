import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DollarSign, Users, TrendingUp, Eye, MessageCircle } from "lucide-react";

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
      default: return 'status-ready';
    }
  };

  const handleTenantAction = (bedNumber: string, status: string) => {
    console.log(`${status} action for ${bedNumber}`);
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="data-block">
          <div className="flex items-center justify-between mb-3">
            <div className="space-y-1">
              <h3 className="modern-text text-sm font-medium text-muted-foreground uppercase tracking-wide">Total Collected</h3>
              <div className="metric-large text-success" data-testid="text-collected-amount">
                ${totalCollected.toLocaleString()}
              </div>
            </div>
            <div className="p-2 bg-success/10 rounded-xl">
              <DollarSign className="w-5 h-5 text-success" />
            </div>
          </div>
          <div className="text-sm text-muted-foreground">of ${totalExpected.toLocaleString()} expected</div>
        </Card>

        <Card className="data-block">
          <div className="flex items-center justify-between mb-3">
            <div className="space-y-1">
              <h3 className="modern-text text-sm font-medium text-muted-foreground uppercase tracking-wide">Collection Rate</h3>
              <div className="metric-large" data-testid="text-collection-rate">
                {collectionRate}%
              </div>
            </div>
            <div className="p-2 bg-primary/10 rounded-xl">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
          </div>
          <Progress value={collectionRate} className="h-2 mt-3" />
        </Card>

        <Card className="data-block">
          <div className="flex items-center justify-between mb-3">
            <div className="space-y-1">
              <h3 className="modern-text text-sm font-medium text-muted-foreground uppercase tracking-wide">Total Tenants</h3>
              <div className="metric-large">
                {tenants.length}
              </div>
            </div>
            <div className="p-2 bg-secondary/10 rounded-xl">
              <Users className="w-5 h-5 text-secondary" />
            </div>
          </div>
          <div className="text-sm text-muted-foreground">{tenants.filter(t => t.status === 'PAID').length} paid, {tenants.filter(t => t.status === 'PENDING').length} pending</div>
        </Card>
      </div>

      {/* Tenant Cards */}
      <Card className="modern-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-6" data-testid="text-rent-tracker-title">
          Tenant Status
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {tenants.map((tenant) => (
            <Card key={tenant.id} className="hover-elevate p-4 group">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground" data-testid={`text-${tenant.bedNumber.toLowerCase()}-title`}>
                  {tenant.bedNumber}
                </h3>
                <div 
                  className={getStatusClass(tenant.status)}
                  data-testid={`status-${tenant.bedNumber.toLowerCase()}`}
                >
                  {tenant.status}
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="metric-small" data-testid={`amount-${tenant.bedNumber.toLowerCase()}`}>
                  ${tenant.amount.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground" data-testid={`due-date-${tenant.bedNumber.toLowerCase()}`}>
                  Due {tenant.dueDate}
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 opacity-60 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleTenantAction(tenant.bedNumber, 'VIEW')}
                  data-testid={`button-view-${tenant.bedNumber.toLowerCase()}`}
                >
                  <Eye className="w-3 h-3 mr-1" />
                  View
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 opacity-60 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleTenantAction(tenant.bedNumber, 'CONTACT')}
                  data-testid={`button-contact-${tenant.bedNumber.toLowerCase()}`}
                >
                  <MessageCircle className="w-3 h-3 mr-1" />
                  Contact
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}