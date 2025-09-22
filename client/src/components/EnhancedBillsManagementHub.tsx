import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";

interface Bill {
  id: string;
  name: string;
  amount: number;
  nextDue: string;
  status: 'Ready' | 'Due' | 'Scheduled' | 'Auto-pay' | 'Paid';
  icon: string;
  checked: boolean;
}

interface EnhancedBillsManagementHubProps {
  className?: string;
}

export function EnhancedBillsManagementHub({ className = "" }: EnhancedBillsManagementHubProps) {
  const [bills, setBills] = useState<Bill[]>([
    {
      id: 'mortgage',
      name: 'Mortgage',
      amount: 9000.00,
      nextDue: 'Oct 8',
      status: 'Ready',
      icon: '🏠',
      checked: true
    },
    {
      id: 'nbn',
      name: 'NBN Internet',
      amount: 65.99,
      nextDue: 'Sep 21',
      status: 'Due',
      icon: '🌐',
      checked: false
    },
    {
      id: 'phone',
      name: 'Phone',
      amount: 45.00,
      nextDue: 'Sep 25',
      status: 'Ready',
      icon: '📱',
      checked: false
    },
    {
      id: 'electricity',
      name: 'Electricity',
      amount: 234.00,
      nextDue: 'Oct 15',
      status: 'Ready',
      icon: '⚡',
      checked: false
    },
    {
      id: 'water',
      name: 'Water',
      amount: 89.00,
      nextDue: 'Sep 24',
      status: 'Scheduled',
      icon: '💧',
      checked: false
    },
    {
      id: 'netflix',
      name: 'Netflix',
      amount: 24.99,
      nextDue: 'Sep 23',
      status: 'Auto-pay',
      icon: '📺',
      checked: false
    },
    {
      id: 'spotify',
      name: 'Spotify',
      amount: 22.99,
      nextDue: 'Sep 16',
      status: 'Paid',
      icon: '🎵',
      checked: false
    }
  ]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Ready':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Ready</Badge>;
      case 'Due':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">⚠ 3 days</Badge>;
      case 'Scheduled':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Scheduled</Badge>;
      case 'Auto-pay':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Auto-pay</Badge>;
      case 'Paid':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">✓ Paid</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const toggleBill = (billId: string) => {
    setBills(prev => prev.map(bill =>
      bill.id === billId ? { ...bill, checked: !bill.checked } : bill
    ));
  };

  const totalAmount = bills.reduce((sum, bill) => sum + bill.amount, 0);

  return (
    <Card className={`bg-white border-gray-200 ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Bills Management Hub
          </CardTitle>
          <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white">
            <Plus className="w-4 h-4 mr-1" />
            Add Bill
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Bills Analytics Section */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Bills Analytics (excluding mortgage)
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">vs Last Month:</span>
              <span className="ml-2 text-red-600">+$394.03</span>
            </div>
            <div>
              <span className="text-gray-600">3-Mo Avg:</span>
              <span className="ml-2">$902</span>
            </div>
            <div>
              <span className="text-gray-600">YTD:</span>
              <span className="ml-2 text-green-600">$89,456</span>
            </div>
          </div>
        </div>

        {/* This Month Section */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-1">This Month</h4>
            <div className="text-2xl font-bold text-blue-600">$481.97</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Fixed vs Variable</h4>
            <div className="text-lg font-semibold text-green-600">87% / 13%</div>
          </div>
        </div>

        {/* Active Bills Table */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Active Bills</h3>

          {/* Table Header */}
          <div className="grid grid-cols-12 gap-3 text-xs font-medium text-gray-500 uppercase tracking-wide pb-2 border-b border-gray-200">
            <div className="col-span-1">Excl.</div>
            <div className="col-span-4">Bill Name</div>
            <div className="col-span-2 text-right">Amount</div>
            <div className="col-span-2">Next Due</div>
            <div className="col-span-3">Status</div>
          </div>

          {/* Bills List */}
          <div className="space-y-1 mt-2">
            {bills.map((bill) => (
              <div key={bill.id} className="grid grid-cols-12 gap-3 items-center py-2 hover:bg-gray-50 rounded">
                {/* Checkbox */}
                <div className="col-span-1">
                  <Checkbox
                    checked={bill.checked}
                    onCheckedChange={() => toggleBill(bill.id)}
                    className="border-gray-300"
                  />
                </div>

                {/* Bill Name with Icon */}
                <div className="col-span-4 flex items-center space-x-2">
                  <span className="text-lg">{bill.icon}</span>
                  <span className="font-medium text-gray-900">{bill.name}</span>
                </div>

                {/* Amount */}
                <div className="col-span-2 text-right font-semibold text-gray-900">
                  {formatCurrency(bill.amount)}
                </div>

                {/* Next Due */}
                <div className="col-span-2 text-sm text-gray-600">
                  {bill.nextDue}
                </div>

                {/* Status */}
                <div className="col-span-3">
                  {getStatusBadge(bill.status)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Total Monthly Bills:</span>
            <span className="font-bold text-lg">{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}