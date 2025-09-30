import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  RefreshCw,
  Plus,
  Upload,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { useTransactions } from "../hooks/useTransactions";
import type { Transaction } from "../types/AutoTagTypes";
import { CategoryDropdown } from "./CategoryDropdown";
import { TagsMultiSelect } from "./TagsMultiSelect";
import { AccountsSidebar } from "./AccountsSidebar";

const ACCOUNT_TYPE_EMOJI: { [key: string]: string } = {
  'Saver': '💰',
  'saver': '💰',
  'Transactional': '🏦',
  'transactional': '🏦',
  'Spending': '💳',
  'spending': '💳',
  'Bills': '📄',
  'bills': '📄',
  'Home Loan': '🏠',
  'default': '🏦'
};

export function TransactionsDashboard() {
  const {
    transactions,
    loading,
    error,
    lastSync,
    syncStatus,
    filters,
    setFilters,
    syncFromUpBank,
    updateTransaction,
    importCSV,
  } = useTransactions();

  const [showManualAdd, setShowManualAdd] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [amountFilter, setAmountFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');

  // UP Bank categories and tags
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);

  // Fetch categories and tags on mount
  useEffect(() => {
    fetchCategoriesAndTags();
  }, []);

  const fetchCategoriesAndTags = async () => {
    try {
      const [catResponse, tagResponse] = await Promise.all([
        fetch('/api/up-bank/categories'),
        fetch('/api/up-bank/tags')
      ]);

      if (catResponse.ok) {
        const catData = await catResponse.json();
        setCategories(catData.data || []);
      }

      if (tagResponse.ok) {
        const tagData = await tagResponse.json();
        setTags(tagData.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch categories/tags:', err);
    }
  };

  const handleSync = async () => {
    try {
      await syncFromUpBank();
      await fetchCategoriesAndTags(); // Refresh categories/tags after sync
    } catch (err) {
      console.error('Sync failed:', err);
    }
  };

  const handleCategoryChange = async (transactionId: string, newCategory: string) => {
    await updateTransaction(transactionId, { category: newCategory });
  };

  const handleTagsChange = async (transactionId: string, newTags: string[]) => {
    await updateTransaction(transactionId, { tags: newTags.join(',') });
  };

  const getAccountEmoji = (accountName: string): string => {
    // Try to match account type from name
    const lowerName = accountName.toLowerCase();
    for (const [key, emoji] of Object.entries(ACCOUNT_TYPE_EMOJI)) {
      if (lowerName.includes(key.toLowerCase())) {
        return emoji;
      }
    }
    return ACCOUNT_TYPE_EMOJI.default;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-AU', {
      day: '2-digit',
      month: 'short',
    });
  };

  // Apply filters
  const filteredTransactions = transactions.filter(txn => {
    // Global search across multiple fields
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesDescription = txn.description.toLowerCase().includes(search);
      const matchesAccount = txn.account.toLowerCase().includes(search);
      const matchesCategory = txn.category?.toLowerCase().includes(search);
      const matchesTags = txn.tags?.toLowerCase().includes(search);
      const matchesAmount = txn.amount.toString().includes(search);

      // Find category name for better search
      const categoryObj = categories.find(c => c.id === txn.category);
      const matchesCategoryName = categoryObj?.attributes.name.toLowerCase().includes(search);

      if (!matchesDescription && !matchesAccount && !matchesCategory && !matchesTags && !matchesAmount && !matchesCategoryName) {
        return false;
      }
    }

    // Additional filters
    if (categoryFilter !== 'all' && txn.category !== categoryFilter) {
      return false;
    }

    // Account filter with type support
    if (accountFilter !== 'all') {
      if (accountFilter === 'up-all') {
        // Show all UP Bank accounts
        if (!txn.account.startsWith('Up-')) {
          return false;
        }
      } else if (accountFilter === 'up-spending') {
        // Show only spending accounts (with 🏦 emoji)
        if (!txn.account.includes('🏦')) {
          return false;
        }
      } else if (accountFilter === 'up-savers') {
        // Show only saver accounts (with 💰 emoji)
        if (!txn.account.includes('💰')) {
          return false;
        }
      } else if (txn.account !== accountFilter) {
        // Exact account match
        return false;
      }
    }

    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

  // Get unique accounts for filter
  const uniqueAccounts = Array.from(new Set(transactions.map(t => t.account)));

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Left: Transactions (1/3 width) */}
      <div className="col-span-1 space-y-4">
      {/* Header */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">Transactions</CardTitle>
              <p className="text-xs text-gray-600 mt-1">
                {filteredTransactions.length} transactions
                {lastSync && (
                  <span className="ml-2">· Last synced {formatDate(lastSync)}</span>
                )}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleSync}
                disabled={syncStatus === 'syncing'}
                variant="outline"
                size="sm"
                className="h-8 text-xs"
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                Sync
              </Button>
            </div>
          </div>

          {/* Global Search */}
          <div className="relative">
            <Input
              placeholder="🔍 Search by merchant, category, tags, account, or amount..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 text-xs pr-8"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Compact Filters */}
      <Card className="border-gray-200">
        <CardContent className="p-3">
            <div className="grid grid-cols-4 gap-2">
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All dates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All dates</SelectItem>
                  <SelectItem value="today" className="text-xs">Today</SelectItem>
                  <SelectItem value="week" className="text-xs">Last 7 days</SelectItem>
                  <SelectItem value="month" className="text-xs">This month</SelectItem>
                </SelectContent>
              </Select>
              <Select value={amountFilter} onValueChange={setAmountFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All amounts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All amounts</SelectItem>
                  <SelectItem value="small" className="text-xs">$0 - $50</SelectItem>
                  <SelectItem value="medium" className="text-xs">$50 - $200</SelectItem>
                  <SelectItem value="large" className="text-xs">$200+</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id} className="text-xs">
                      {cat.attributes.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={accountFilter} onValueChange={setAccountFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All accounts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Accounts</SelectItem>
                  <SelectItem value="up-all" className="text-xs">🏦 UP Bank - All</SelectItem>
                  <SelectItem value="up-spending" className="text-xs">🏦 UP Bank - Spending</SelectItem>
                  <SelectItem value="up-savers" className="text-xs">💰 UP Bank - Savers</SelectItem>
                  {uniqueAccounts.map(account => (
                    <SelectItem key={account} value={account} className="text-xs">
                      {getAccountEmoji(account)} {account}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-2">
            <p className="text-xs text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Dense Table */}
      <Card className="bg-white border-gray-200">
        <CardContent className="p-0">
          {loading && (
            <div className="text-center py-8 text-gray-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-xs">Loading transactions...</p>
            </div>
          )}

          {!loading && paginatedTransactions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-xs">No transactions found</p>
            </div>
          )}

          {!loading && paginatedTransactions.length > 0 && (
            <div className="overflow-x-auto max-h-[calc(100vh-300px)] overflow-y-auto">
              {/* Table Header */}
              <div className="grid grid-cols-[100px_80px_150px_1fr_150px_220px] gap-2 px-3 py-2 bg-gray-50 border-b font-semibold text-xs text-gray-700 sticky top-0 z-10">
                <div>Amount</div>
                <div>Date</div>
                <div>Account</div>
                <div>Merchant</div>
                <div>Category</div>
                <div>Tags</div>
              </div>

              {/* Table Rows */}
              <div className="divide-y divide-gray-100">
                {paginatedTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="grid grid-cols-[100px_80px_150px_1fr_150px_220px] gap-2 px-3 py-1.5 hover:bg-gray-50 transition-colors items-center text-xs"
                  >
                    {/* Amount */}
                    <div className={`font-semibold ${Number(transaction.amount) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(Number(transaction.amount))}
                    </div>

                    {/* Date */}
                    <div className="text-gray-600">
                      {formatDate(transaction.date)}
                    </div>

                    {/* Account with Emoji */}
                    <div className="flex items-center gap-1">
                      <span className="text-base">{getAccountEmoji(transaction.account)}</span>
                      <span className="text-gray-700 truncate text-xs">{transaction.account.split(' ')[0]}</span>
                    </div>

                    {/* Merchant */}
                    <div className="text-gray-900 truncate font-medium">
                      {transaction.description}
                    </div>

                    {/* Category Dropdown */}
                    <div>
                      <CategoryDropdown
                        value={transaction.category || 'uncategorized'}
                        categories={categories}
                        onChange={(newCategory) => handleCategoryChange(transaction.id, newCategory)}
                      />
                    </div>

                    {/* Tags Multi-Select */}
                    <div>
                      <TagsMultiSelect
                        selectedTags={transaction.tags ? transaction.tags.split(',').filter(Boolean) : []}
                        availableTags={tags}
                        maxTags={6}
                        onChange={(newTags) => handleTagsChange(transaction.id, newTags)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card className="border-gray-200">
          <CardContent className="py-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-600">
                Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-3 h-3" />
                </Button>

                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      className="h-7 w-7 px-0 text-xs"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  );
                })}

                {totalPages > 5 && (
                  <>
                    <span className="text-xs text-gray-500">...</span>
                    <Button
                      variant={currentPage === totalPages ? "default" : "outline"}
                      size="sm"
                      className="h-7 w-7 px-0 text-xs"
                      onClick={() => setCurrentPage(totalPages)}
                    >
                      {totalPages}
                    </Button>
                  </>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      </div>

      {/* Middle: Placeholder (1/3 width) */}
      <div className="col-span-1">
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-900">Coming Soon</CardTitle>
            <p className="text-xs text-gray-600">This section is under development</p>
          </CardHeader>
        </Card>
      </div>

      {/* Right: Accounts Sidebar (1/3 width) */}
      <div className="col-span-1">
        <AccountsSidebar />
      </div>
    </div>
  );
}