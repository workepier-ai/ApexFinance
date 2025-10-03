import { useState, useEffect } from 'react';

export interface AccountSettings {
  id: string;
  userId: string;
  upAccountId: string;
  displayOrder: number;
  isPinned: boolean;
  goalAmount: string | null;
  goalName: string | null;
  customGroup: string | null;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateAccountSettings {
  goalAmount?: string | null;
  goalName?: string | null;
  customGroup?: string | null;
  isPinned?: boolean;
  isHidden?: boolean;
  displayOrder?: number;
}

export function useAccountSettings() {
  const [settings, setSettings] = useState<AccountSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all account settings
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/account-settings');
      const data = await response.json();

      if (data.success) {
        setSettings(data.data);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch account settings');
      }
    } catch (err) {
      console.error('Failed to fetch account settings:', err);
      setError('Failed to fetch account settings');
    } finally {
      setLoading(false);
    }
  };

  // Update account settings
  const updateAccountSettings = async (
    accountId: string,
    updates: UpdateAccountSettings
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/account-settings/${accountId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setSettings(prev => {
          const existing = prev.find(s => s.upAccountId === accountId);
          if (existing) {
            return prev.map(s =>
              s.upAccountId === accountId ? { ...s, ...data.data } : s
            );
          } else {
            return [...prev, data.data];
          }
        });
        return true;
      } else {
        setError(data.error || 'Failed to update account settings');
        return false;
      }
    } catch (err) {
      console.error('Failed to update account settings:', err);
      setError('Failed to update account settings');
      return false;
    }
  };

  // Reorder accounts
  const reorderAccounts = async (
    accountOrders: { accountId: string; displayOrder: number }[]
  ): Promise<boolean> => {
    try {
      const response = await fetch('/api/account-settings/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountOrders }),
      });

      const data = await response.json();

      if (data.success) {
        // Optimistically update local state
        setSettings(prev => {
          const updated = [...prev];
          accountOrders.forEach(({ accountId, displayOrder }) => {
            const index = updated.findIndex(s => s.upAccountId === accountId);
            if (index !== -1) {
              updated[index] = { ...updated[index], displayOrder };
            }
          });
          return updated.sort((a, b) => a.displayOrder - b.displayOrder);
        });
        return true;
      } else {
        setError(data.error || 'Failed to reorder accounts');
        return false;
      }
    } catch (err) {
      console.error('Failed to reorder accounts:', err);
      setError('Failed to reorder accounts');
      return false;
    }
  };

  // Check for removed accounts
  const checkRemovedAccounts = async (
    currentAccountIds: string[]
  ): Promise<{ id: string; upAccountId: string; goalName: string | null }[]> => {
    try {
      const response = await fetch('/api/account-settings/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentAccountIds }),
      });

      const data = await response.json();

      if (data.success) {
        return data.data.removedAccounts;
      }
      return [];
    } catch (err) {
      console.error('Failed to check removed accounts:', err);
      return [];
    }
  };

  // Delete account settings
  const deleteAccountSettings = async (accountId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/account-settings/${accountId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setSettings(prev => prev.filter(s => s.upAccountId !== accountId));
        return true;
      } else {
        setError(data.error || 'Failed to delete account settings');
        return false;
      }
    } catch (err) {
      console.error('Failed to delete account settings:', err);
      setError('Failed to delete account settings');
      return false;
    }
  };

  // Get settings for specific account
  const getAccountSettings = (accountId: string): AccountSettings | undefined => {
    return settings.find(s => s.upAccountId === accountId);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    error,
    updateAccountSettings,
    reorderAccounts,
    checkRemovedAccounts,
    deleteAccountSettings,
    getAccountSettings,
    refreshSettings: fetchSettings,
  };
}
