import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Clock, AlertTriangle, DollarSign, Bell, ExternalLink } from "lucide-react";

interface BillConfig {
  showPayNow: boolean;
  payNowLink?: string;
  showReminder: boolean;
  reminderType: 'urgent' | 'normal' | 'low' | 'auto';
  reminderDays: number;
  category: 'utility' | 'subscription' | 'finance' | 'other';
}

interface Bill {
  id: string;
  name: string;
  amount: number;
  nextDue: string;
  status: 'Ready' | 'Due' | 'Scheduled' | 'Auto-pay' | 'Paid';
  icon: string;
  daysUntil: number;
  config: BillConfig;
}

export function UpcomingBillsSection() {
  const [bills] = useState<Bill[]>([
    {
      id: 'nbn',
      name: 'NBN Internet',
      amount: 65.99,
      nextDue: 'Sep 21',
      status: 'Due',
      icon: '🌐',
      daysUntil: 1,
      config: {
        showPayNow: true,
        payNowLink: 'https://myaccount.telstra.com.au',
        showReminder: true,
        reminderType: 'urgent',
        reminderDays: 3,
        category: 'utility'
      }
    },
    {
      id: 'netflix',
      name: 'Netflix',
      amount: 24.99,
      nextDue: 'Sep 23',
      status: 'Auto-pay',
      icon: '📺',
      daysUntil: 3,
      config: {
        showPayNow: false,
        showReminder: true,
        reminderType: 'auto',
        reminderDays: 1,
        category: 'subscription'
      }
    },
    {
      id: 'water',
      name: 'Water',
      amount: 89.00,
      nextDue: 'Sep 24',
      status: 'Scheduled',
      icon: '💧',
      daysUntil: 4,
      config: {
        showPayNow: true,
        payNowLink: 'https://www.sydneywater.com.au/accounts-billing',
        showReminder: true,
        reminderType: 'normal',
        reminderDays: 7,
        category: 'utility'
      }
    },
    {
      id: 'phone',
      name: 'Phone',
      amount: 45.00,
      nextDue: 'Sep 25',
      status: 'Ready',
      icon: '📱',
      daysUntil: 5,
      config: {
        showPayNow: true,
        payNowLink: 'https://www.optus.com.au/my-account',
        showReminder: true,
        reminderType: 'low',
        reminderDays: 5,
        category: 'utility'
      }
    }
  ]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getUrgencyColor = (daysUntil: number) => {
    if (daysUntil <= 1) return 'border-l-red-500 bg-red-50';
    if (daysUntil <= 3) return 'border-l-yellow-500 bg-yellow-50';
    if (daysUntil <= 7) return 'border-l-blue-500 bg-blue-50';
    return 'border-l-green-500 bg-green-50';
  };

  const getReminderColor = (reminderType: string) => {
    switch (reminderType) {
      case 'urgent':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'normal':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'auto':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusBadge = (status: string, daysUntil: number) => {
    if (daysUntil <= 1) {
      return <Badge className="bg-red-100 text-red-800 border-red-200">⚠ Due Now</Badge>;
    }
    switch (status) {
      case 'Due':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Due Soon</Badge>;
      case 'Auto-pay':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Auto-pay</Badge>;
      case 'Scheduled':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Scheduled</Badge>;
      default:
        return <Badge className="bg-green-100 text-green-800 border-green-200">Ready</Badge>;
    }
  };

  const handlePayNow = (bill: Bill) => {
    if (bill.config.payNowLink) {
      window.open(bill.config.payNowLink, '_blank');
    }
  };

  const handleReminder = (bill: Bill) => {
    // This would integrate with your reminder system
    console.log(`Setting ${bill.config.reminderType} reminder for ${bill.name} - ${bill.config.reminderDays} days`);
  };

  const upcomingTotal = bills.reduce((sum, bill) => sum + bill.amount, 0);

  return (
    <Card className="bg-white border-gray-200 h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-blue-500" />
            Upcoming Bills
          </CardTitle>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
            Manage All Bills
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Pay Now links • Color-coded reminders
          </div>
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-gray-500" />
            <span className="font-bold text-lg">{formatCurrency(upcomingTotal)}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-3">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-red-50 rounded-lg p-2 text-center">
            <div className="text-xl font-bold text-red-600">1</div>
            <div className="text-xs text-red-700">Due Now</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-2 text-center">
            <div className="text-xl font-bold text-yellow-600">2</div>
            <div className="text-xs text-yellow-700">This Week</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-2 text-center">
            <div className="text-xl font-bold text-blue-600">4</div>
            <div className="text-xs text-blue-700">Total</div>
          </div>
        </div>

        {/* Upcoming Bills List */}
        <div className="flex-1 space-y-1">
          {bills.map((bill) => (
            <div
              key={bill.id}
              className={`border-l-4 rounded-r-lg p-3 transition-all hover:shadow-md ${getUrgencyColor(bill.daysUntil)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{bill.icon}</span>
                  <div>
                    <div className="font-medium text-gray-900 text-sm">{bill.name}</div>
                    <div className="text-xs text-gray-600 flex items-center">
                      <span>Due {bill.nextDue}</span>
                      {bill.daysUntil <= 1 && (
                        <AlertTriangle className="w-3 h-3 ml-1 text-red-500" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-gray-900 text-sm">{formatCurrency(bill.amount)}</div>
                  <div className="mt-0.5">
                    {getStatusBadge(bill.status, bill.daysUntil)}
                  </div>
                </div>
              </div>

              {(bill.config.showPayNow || bill.config.showReminder) && (
                <div className="mt-2 flex space-x-1">
                  {bill.config.showPayNow && (
                    <Button
                      size="sm"
                      className="bg-blue-500 hover:bg-blue-600 text-white flex items-center space-x-1 h-7 px-2 text-xs"
                      onClick={() => handlePayNow(bill)}
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Pay Now</span>
                    </Button>
                  )}
                  {bill.config.showReminder && (
                    <Button
                      size="sm"
                      variant="outline"
                      className={`flex items-center space-x-1 border h-7 px-2 text-xs ${getReminderColor(bill.config.reminderType)}`}
                      onClick={() => handleReminder(bill)}
                    >
                      <Bell className="w-3 h-3" />
                      <span>Reminder</span>
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-3 mt-auto">
          <div className="text-center text-xs text-gray-500">
            Configure in Bills/Subscriptions tabs
          </div>
        </div>
      </CardContent>
    </Card>
  );
}