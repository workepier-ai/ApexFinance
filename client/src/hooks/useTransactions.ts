import { useState, useEffect } from 'react';
import type { Transaction } from '../types/AutoTagTypes';

interface TransactionFilters {
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  merchant?: string;
  category?: string;
  tags?: string;
  account?: string;
}

interface UseTransactionsResult {
  transactions: Transaction[];
  loading: boolean;
  error?: string;
  lastSync?: Date;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  filters: TransactionFilters;
  setFilters: (filters: TransactionFilters) => void;
  syncFromUpBank: () => Promise<void>;
  createTransaction: (transaction: Partial<Transaction>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  importCSV: (csvData: any[], mapping: any) => Promise<void>;
  refreshTransactions: () => Promise<void>;
}

export function useTransactions(): UseTransactionsResult {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [lastSync, setLastSync] = useState<Date>();
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [filters, setFilters] = useState<TransactionFilters>({});

  // Fetch transactions from local API (not UP Bank directly)
  const fetchTransactions = async (filterParams: TransactionFilters = {}) => {
    setLoading(true);
    setError(undefined);

    try {
      const params = new URLSearchParams();

      if (filterParams.dateFrom) params.append('dateFrom', filterParams.dateFrom);
      if (filterParams.dateTo) params.append('dateTo', filterParams.dateTo);
      if (filterParams.amountMin !== undefined) params.append('amountMin', String(filterParams.amountMin));
      if (filterParams.amountMax !== undefined) params.append('amountMax', String(filterParams.amountMax));
      if (filterParams.merchant) params.append('merchant', filterParams.merchant);
      if (filterParams.category) params.append('category', filterParams.category);
      if (filterParams.tags) params.append('tags', filterParams.tags);
      if (filterParams.account) params.append('account', filterParams.account);
      params.append('limit', '1000'); // Increased from 100 to support larger transaction sets

      const response = await fetch(`/api/transactions?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        // Convert date strings back to Date objects
        const parsedTransactions = result.data.map((txn: any) => ({
          ...txn,
          date: new Date(txn.date),
          createdAt: txn.createdAt ? new Date(txn.createdAt) : undefined,
          updatedAt: txn.updatedAt ? new Date(txn.updatedAt) : undefined,
        }));
        setTransactions(parsedTransactions);
      } else {
        throw new Error(result.error || 'Failed to fetch transactions');
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  // Sync from UP Bank (smart sync - only new transactions)
  const syncFromUpBank = async () => {
    setSyncStatus('syncing');
    setError(undefined);

    try {
      const response = await fetch('/api/transactions/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        setSyncStatus('success');
        setLastSync(new Date(result.data.lastSync));

        // Refresh transactions after successful sync
        await fetchTransactions(filters);

        // Reset success status after 3 seconds
        setTimeout(() => setSyncStatus('idle'), 3000);
      } else {
        // Provide better error messages
        let errorMessage = result.error || 'Sync failed';
        if (result.details) {
          errorMessage += `: ${result.details}`;
        }

        // Add helpful context for common errors
        if (errorMessage.includes('not configured')) {
          errorMessage = 'Please configure your UP Bank token in Settings first, then try syncing again.';
        }

        throw new Error(errorMessage);
      }
    } catch (err) {
      console.error('Failed to sync from UP Bank:', err);
      setError(err instanceof Error ? err.message : 'Sync failed');
      setSyncStatus('error');
    }
  };

  // Create manual transaction
  const createTransaction = async (transaction: Partial<Transaction>) => {
    setLoading(true);
    setError(undefined);

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transaction),
      });

      const result = await response.json();

      if (result.success) {
        // Refresh transactions after creation
        await fetchTransactions(filters);
      } else {
        throw new Error(result.error || 'Failed to create transaction');
      }
    } catch (err) {
      console.error('Failed to create transaction:', err);
      setError(err instanceof Error ? err.message : 'Failed to create transaction');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update transaction (tags/category)
  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    setError(undefined);

    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const result = await response.json();

      if (result.success) {
        // Update local state
        setTransactions(prev =>
          prev.map(txn => (txn.id === id ? { ...txn, ...updates } : txn))
        );
      } else {
        throw new Error(result.error || 'Failed to update transaction');
      }
    } catch (err) {
      console.error('Failed to update transaction:', err);
      setError(err instanceof Error ? err.message : 'Failed to update transaction');
      throw err;
    }
  };

  // Delete manual transaction
  const deleteTransaction = async (id: string) => {
    setError(undefined);

    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        // Remove from local state
        setTransactions(prev => prev.filter(txn => txn.id !== id));
      } else {
        throw new Error(result.error || 'Failed to delete transaction');
      }
    } catch (err) {
      console.error('Failed to delete transaction:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete transaction');
      throw err;
    }
  };

  // Import CSV transactions
  const importCSV = async (csvData: any[], mapping: any) => {
    setLoading(true);
    setError(undefined);

    try {
      const response = await fetch('/api/transactions/import-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactions: csvData,
          mapping,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Refresh transactions after import
        await fetchTransactions(filters);
      } else {
        throw new Error(result.error || 'Failed to import CSV');
      }
    } catch (err) {
      console.error('Failed to import CSV:', err);
      setError(err instanceof Error ? err.message : 'Failed to import CSV');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Refresh transactions
  const refreshTransactions = async () => {
    await fetchTransactions(filters);
  };

  // Load transactions on mount and do background sync
  useEffect(() => {
    // 1. Show local data immediately (instant)
    fetchTransactions();

    // 2. Background: smart sync to catch missed webhooks
    setTimeout(() => {
      syncFromUpBank().catch(err => {
        console.warn('Background sync failed:', err);
        // Don't show error to user for background sync
      });
    }, 100);
  }, []);

  // Reload when filters change
  useEffect(() => {
    if (Object.keys(filters).length > 0) {
      fetchTransactions(filters);
    }
  }, [filters]);

  return {
    transactions,
    loading,
    error,
    lastSync,
    syncStatus,
    filters,
    setFilters,
    syncFromUpBank,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    importCSV,
    refreshTransactions,
  };
}