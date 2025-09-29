import { useState, useEffect } from 'react';

export interface BillConfig {
  showPayNow: boolean;
  payNowLink?: string;
  showReminder: boolean;
  reminderType: 'urgent' | 'normal' | 'low' | 'auto';
  reminderDays: number;
  category: 'utility' | 'subscription' | 'finance' | 'entertainment' | 'telecom' | 'insurance' | 'fitness' | 'other';
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  category: string;
  frequency: string;
  status: 'active' | 'paused';
  paymentMethod: 'auto' | 'manual';
  account?: string;
  subAccount?: string;
  isRecurring: boolean;
  cancelReminder?: boolean;
  reminderTiming?: string;
  dueDate: string;
  websiteUrl?: string;

  // Additional fields for upcoming bills display
  nextDue?: string;
  displayStatus?: 'Ready' | 'Due' | 'Scheduled' | 'Auto-pay' | 'Paid';
  icon?: string;
  daysUntil?: number;
  config?: BillConfig;
}

export interface QuickEntry {
  id: number;
  billName: string;
  notes: string;
  amount: string;
  type: 'quick-entry';
  status: 'pending-processing';
  createdAt: string;
}

// Category to icon mapping
const categoryIconMap: Record<string, string> = {
  utility: '💧',
  entertainment: '📺',
  telecom: '📱',
  insurance: '🛡️',
  fitness: '💪',
  finance: '💳',
  subscription: '🔄',
  other: '📄'
};

// Category to urgency mapping for reminders
const categoryReminderMap: Record<string, BillConfig['reminderType']> = {
  utility: 'urgent',
  finance: 'urgent',
  insurance: 'normal',
  entertainment: 'low',
  telecom: 'normal',
  fitness: 'low',
  subscription: 'auto',
  other: 'normal'
};

export function useBillData() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [quickEntries, setQuickEntries] = useState<QuickEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBillsData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/bills');
      const result = await response.json();

      if (result.success) {
        const allItems = result.data;
        const detailedBills = allItems.filter((item: any) => item.type !== 'quick-entry');
        const quickEntryItems = allItems.filter((item: any) => item.type === 'quick-entry');

        // Convert detailed bills to proper format with upcoming bills enhancements
        const formattedBills: Bill[] = detailedBills.map((item: any) => {
          const bill: Bill = {
            id: item.id.toString(),
            name: item.name || item.billName,
            amount: typeof item.amount === 'string' ? parseFloat(item.amount) : item.amount,
            category: item.category || 'other',
            frequency: item.frequency || 'monthly',
            status: item.status === 'active' ? 'active' : 'paused',
            paymentMethod: item.paymentMethod || 'manual',
            account: item.account,
            subAccount: item.subAccount,
            isRecurring: item.isRecurring || false,
            cancelReminder: item.cancelReminder,
            reminderTiming: item.reminderTiming,
            dueDate: item.dueDate || new Date().toISOString().split('T')[0],
            websiteUrl: item.websiteUrl,
          };

          // Add upcoming bills specific fields
          const dueDate = new Date(bill.dueDate);
          const today = new Date();
          const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          // Format next due date
          bill.nextDue = dueDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          }).replace(',', '').toUpperCase();

          // Calculate days until due
          bill.daysUntil = daysDiff;

          // Assign icon based on category
          bill.icon = categoryIconMap[bill.category] || categoryIconMap.other;

          // Determine display status
          if (daysDiff < 0) {
            bill.displayStatus = 'Due';
          } else if (bill.paymentMethod === 'auto') {
            bill.displayStatus = 'Auto-pay';
          } else if (daysDiff <= 7) {
            bill.displayStatus = 'Due';
          } else {
            bill.displayStatus = 'Ready';
          }

          // Create bill config for Pay Now and Reminder functionality
          bill.config = {
            showPayNow: !!bill.websiteUrl || bill.category === 'utility' || bill.category === 'telecom',
            payNowLink: bill.websiteUrl,
            showReminder: true,
            reminderType: categoryReminderMap[bill.category] || 'normal',
            reminderDays: parseInt(bill.reminderTiming || '7'),
            category: bill.category as BillConfig['category']
          };

          return bill;
        });

        setBills(formattedBills);
        setQuickEntries(quickEntryItems);
      }
    } catch (error) {
      console.error('Failed to load bills:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBillsData();
  }, []);

  // Helper functions for bill calculations
  const getActiveBills = () => bills.filter(b => b.status === 'active');

  const getDueBills = (days: number = 7) => {
    return getActiveBills().filter(bill => {
      const today = new Date();
      const dueDate = new Date(bill.dueDate);
      const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= days && daysDiff >= 0;
    });
  };

  const getOverdueBills = () => {
    return getActiveBills().filter(bill => {
      const today = new Date();
      const dueDate = new Date(bill.dueDate);
      return dueDate < today;
    });
  };

  const getUpcomingBills = () => {
    return getActiveBills()
      .filter(bill => (bill.daysUntil || 0) >= 0)
      .sort((a, b) => (a.daysUntil || 0) - (b.daysUntil || 0))
      .slice(0, 10); // Limit to top 10 upcoming bills
  };

  const getMonthlyTotal = () => {
    return getActiveBills().reduce((sum, bill) => sum + bill.amount, 0);
  };

  return {
    bills,
    quickEntries,
    loading,
    loadBillsData,

    // Helper functions
    getActiveBills,
    getDueBills,
    getOverdueBills,
    getUpcomingBills,
    getMonthlyTotal,

    // Statistics
    activeBillsCount: getActiveBills().length,
    dueBillsCount: getDueBills().length,
    overdueBillsCount: getOverdueBills().length,
    monthlyTotal: getMonthlyTotal(),
    pendingCount: quickEntries.length
  };
}