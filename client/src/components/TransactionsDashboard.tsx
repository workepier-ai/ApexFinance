import { useState, useEffect, useRef } from "react";
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
import { Calendar } from "./ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import {
  RefreshCw,
  Plus,
  Upload,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useTransactions } from "../hooks/useTransactions";
import type { Transaction } from "../types/AutoTagTypes";
import { CategoryDropdown } from "./CategoryDropdown";
import { TagsMultiSelect } from "./TagsMultiSelect";
import { AccountsSidebar } from "./AccountsSidebar";
import { TransactionImportModal } from "./TransactionImport/TransactionImportModal";

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
    refreshTransactions,
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
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [bankFilter, setBankFilter] = useState<string[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);

  // Advanced search state
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [searchFields, setSearchFields] = useState({
    merchant: true,
    category: true,
    tags: true,
    account: true,
    amount: true
  });
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  });
  const [amountExact, setAmountExact] = useState('');
  const [amountRange, setAmountRange] = useState({ min: '', max: '' });

  // Ref for calendar button to enable double-click on date inputs
  const calendarButtonRef = useRef<HTMLButtonElement>(null);

  // UP Bank categories and tags
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);

  // Fetch categories, tags, and banks on mount
  useEffect(() => {
    fetchCategoriesAndTags();
    fetchBanks();
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

  const fetchBanks = async () => {
    try {
      const response = await fetch('/api/banks');
      const result = await response.json();
      if (result.success) {
        setBanks(result.data.filter((b: any) => b.enabled));
      }
    } catch (err) {
      console.error('Failed to fetch banks:', err);
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
    // Global search with field-specific filtering
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matches: boolean[] = [];

      if (searchFields.merchant) {
        matches.push(txn.description.toLowerCase().includes(search));
      }
      if (searchFields.account) {
        matches.push(txn.account.toLowerCase().includes(search));
      }
      if (searchFields.category) {
        const categoryObj = categories.find(c => c.id === txn.category);
        matches.push(
          txn.category?.toLowerCase().includes(search) ||
          categoryObj?.attributes.name.toLowerCase().includes(search)
        );
      }
      if (searchFields.tags) {
        matches.push(txn.tags?.toLowerCase().includes(search));
      }
      if (searchFields.amount) {
        matches.push(txn.amount.toString().includes(search));
      }

      // If all fields are disabled, search everywhere (fallback)
      if (!Object.values(searchFields).some(v => v)) {
        matches.push(
          txn.description.toLowerCase().includes(search) ||
          txn.account.toLowerCase().includes(search) ||
          txn.category?.toLowerCase().includes(search) ||
          txn.tags?.toLowerCase().includes(search) ||
          txn.amount.toString().includes(search)
        );
      }

      if (!matches.some(m => m)) {
        return false;
      }
    }

    // Date range filter (advanced search)
    if (dateRange.from || dateRange.to) {
      const txnDate = new Date(txn.date);
      txnDate.setHours(0, 0, 0, 0); // Normalize to start of day

      if (dateRange.from) {
        const from = new Date(dateRange.from);
        from.setHours(0, 0, 0, 0);
        if (txnDate < from) return false;
      }
      if (dateRange.to) {
        const to = new Date(dateRange.to);
        to.setHours(23, 59, 59, 999); // End of day
        if (txnDate > to) return false;
      }
    }

    // Exact amount filter (advanced search)
    if (amountExact) {
      const exactValue = parseFloat(amountExact);
      if (Math.abs(txn.amount) !== exactValue) return false;
    }

    // Amount range filter (advanced search)
    if (amountRange.min || amountRange.max) {
      const absAmount = Math.abs(txn.amount);
      if (amountRange.min && absAmount < parseFloat(amountRange.min)) return false;
      if (amountRange.max && absAmount > parseFloat(amountRange.max)) return false;
    }

    // Tag filter (multi-select)
    if (tagFilter.length > 0) {
      const txnTags = txn.tags ? txn.tags.split(',').map(t => t.trim()) : [];
      const hasAllTags = tagFilter.every(tag => txnTags.includes(tag));
      if (!hasAllTags) return false;
    }

    // Category filter
    if (categoryFilter !== 'all' && txn.category !== categoryFilter) {
      return false;
    }

    // Account filter with type support
    if (accountFilter !== 'all') {
      if (accountFilter === 'up-all') {
        if (!txn.account.startsWith('Up-')) {
          return false;
        }
      } else if (accountFilter === 'up-spending') {
        if (!txn.account.includes('🏦')) {
          return false;
        }
      } else if (accountFilter === 'up-savers') {
        if (!txn.account.includes('💰')) {
          return false;
        }
      } else if (txn.account !== accountFilter) {
        return false;
      }
    }

    // Bank filter (multi-select by bank ID)
    if (bankFilter.length > 0) {
      if (!txn.bankId || !bankFilter.includes(txn.bankId)) {
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
    <>
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
              {/* Add Transactions Button */}
              <Button
                onClick={() => setShowImportModal(true)}
                variant="outline"
                size="sm"
                className="h-8 text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Transactions
              </Button>

              {/* Banks Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                  >
                    {bankFilter.length === 0 ? 'All banks' : `${bankFilter.length} bank(s)`}
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0" align="end">
                  <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold">Select Banks</span>
                      {bankFilter.length > 0 && (
                        <button
                          onClick={() => setBankFilter([])}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                    <div className="space-y-1">
                      {banks.map((bank) => (
                        <label key={bank.id} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={bankFilter.includes(bank.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setBankFilter([...bankFilter, bank.id]);
                              } else {
                                setBankFilter(bankFilter.filter(b => b !== bank.id));
                              }
                            }}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                          <span className="text-xs flex-1">{bank.name}</span>
                        </label>
                      ))}
                      {banks.length === 0 && (
                        <div className="text-center py-4 text-gray-500 text-xs">
                          No banks configured. Add banks in Settings.
                        </div>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

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

          {/* Global Search with Advanced Button */}
          <div className="flex gap-2">
            <div className="relative flex-1">
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
            <Button
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              variant={showAdvancedSearch ? "default" : "outline"}
              size="sm"
              className="h-9 text-xs whitespace-nowrap"
            >
              🎯 Advanced
              <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${showAdvancedSearch ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Advanced Search Panel */}
      {showAdvancedSearch && (
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="p-4 space-y-4">
            <div className="text-xs font-semibold text-gray-700 mb-2">Advanced Search</div>

            {/* Search In Fields */}
            <div>
              <div className="text-xs font-medium text-gray-600 mb-2">Search In:</div>
              <div className="flex flex-wrap gap-3">
                {Object.entries(searchFields).map(([field, enabled]) => (
                  <label key={field} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => setSearchFields({...searchFields, [field]: e.target.checked})}
                      className="w-3.5 h-3.5 rounded border-gray-300"
                    />
                    <span className="text-xs capitalize">{field}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Range - Hybrid Text + Calendar */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-gray-600">Date Range:</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button ref={calendarButtonRef} variant="outline" size="sm" className="h-6 px-2">
                      <CalendarIcon className="h-3.5 w-3.5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="p-2 border-b flex justify-between items-center">
                      <span className="text-xs font-semibold text-gray-700">Select Range</span>
                      <button
                        onClick={() => setDateRange({ from: undefined, to: undefined })}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Clear
                      </button>
                    </div>
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={(range: any) => {
                        if (range?.from) {
                          // Normalize to local midnight to avoid timezone shifts
                          range.from = new Date(range.from.getFullYear(), range.from.getMonth(), range.from.getDate());
                        }
                        if (range?.to) {
                          range.to = new Date(range.to.getFullYear(), range.to.getMonth(), range.to.getDate());
                        }
                        setDateRange(range || { from: undefined, to: undefined });
                      }}
                      numberOfMonths={2}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex gap-2 items-center">
                <div className="flex items-center gap-1 flex-1">
                  <span className="text-xs text-gray-500 whitespace-nowrap">From:</span>
                  <Input
                    type="text"
                    placeholder="DD/MM/YY"
                    value={dateRange.from ? dateRange.from.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }) : ''}
                    onChange={(e) => {
                      const input = e.target.value.trim();
                      if (!input) {
                        setDateRange({...dateRange, from: undefined});
                        return;
                      }

                      // Smart parser: accepts DD/MM/YY, DD-MM-YY, DDMMYY
                      let cleaned = input.replace(/[\/\-]/g, '');
                      if (cleaned.length === 6) {
                        const day = parseInt(cleaned.substring(0, 2), 10);
                        const month = parseInt(cleaned.substring(2, 4), 10) - 1; // 0-indexed
                        let year = parseInt(cleaned.substring(4, 6), 10);
                        year = year < 50 ? 2000 + year : 1900 + year; // 00-49 = 2000s, 50-99 = 1900s

                        const date = new Date(year, month, day);
                        if (!isNaN(date.getTime())) {
                          setDateRange({...dateRange, from: date});
                        }
                      }
                    }}
                    onDoubleClick={() => calendarButtonRef.current?.click()}
                    className="h-8 text-xs flex-1 cursor-pointer"
                  />
                </div>
                <div className="flex items-center gap-1 flex-1">
                  <span className="text-xs text-gray-500 whitespace-nowrap">To:</span>
                  <Input
                    type="text"
                    placeholder="DD/MM/YY"
                    value={dateRange.to ? dateRange.to.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }) : ''}
                    onChange={(e) => {
                      const input = e.target.value.trim();
                      if (!input) {
                        setDateRange({...dateRange, to: undefined});
                        return;
                      }

                      // Smart parser: accepts DD/MM/YY, DD-MM-YY, DDMMYY
                      let cleaned = input.replace(/[\/\-]/g, '');
                      if (cleaned.length === 6) {
                        const day = parseInt(cleaned.substring(0, 2), 10);
                        const month = parseInt(cleaned.substring(2, 4), 10) - 1; // 0-indexed
                        let year = parseInt(cleaned.substring(4, 6), 10);
                        year = year < 50 ? 2000 + year : 1900 + year; // 00-49 = 2000s, 50-99 = 1900s

                        const date = new Date(year, month, day);
                        if (!isNaN(date.getTime())) {
                          setDateRange({...dateRange, to: date});
                        }
                      }
                    }}
                    onDoubleClick={() => calendarButtonRef.current?.click()}
                    className="h-8 text-xs flex-1 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Amount Filters - Improved Layout */}
            <div>
              <div className="text-xs font-medium text-gray-600 mb-2">Amount:</div>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={!!amountExact && !amountRange.min && !amountRange.max}
                    onChange={() => {
                      setAmountRange({ min: '', max: '' });
                    }}
                    className="w-3.5 h-3.5"
                  />
                  <span className="text-xs text-gray-600 w-24 flex-shrink-0">Exact Amount:</span>
                  <Input
                    type="number"
                    step="0.01"
                    value={amountExact}
                    onChange={(e) => {
                      setAmountExact(e.target.value);
                      if (e.target.value) {
                        setAmountRange({ min: '', max: '' });
                      }
                    }}
                    onFocus={() => {
                      if (amountRange.min || amountRange.max) {
                        setAmountRange({ min: '', max: '' });
                      }
                    }}
                    className="h-8 text-xs flex-1"
                    placeholder="$0.00"
                  />
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={!!(amountRange.min || amountRange.max) && !amountExact}
                    onChange={() => {
                      setAmountExact('');
                    }}
                    className="w-3.5 h-3.5"
                  />
                  <span className="text-xs text-gray-600 w-24 flex-shrink-0">Range:</span>
                  <div className="flex gap-2 items-center flex-1">
                    <Input
                      type="number"
                      step="0.01"
                      value={amountRange.min}
                      onChange={(e) => {
                        setAmountRange({...amountRange, min: e.target.value});
                        if (e.target.value) {
                          setAmountExact('');
                        }
                      }}
                      onFocus={() => {
                        if (amountExact) {
                          setAmountExact('');
                        }
                      }}
                      className="h-8 text-xs flex-1"
                      placeholder="Min $"
                    />
                    <span className="text-xs text-gray-400">to</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={amountRange.max}
                      onChange={(e) => {
                        setAmountRange({...amountRange, max: e.target.value});
                        if (e.target.value) {
                          setAmountExact('');
                        }
                      }}
                      onFocus={() => {
                        if (amountExact) {
                          setAmountExact('');
                        }
                      }}
                      className="h-8 text-xs flex-1"
                      placeholder="Max $"
                    />
                  </div>
                </label>
              </div>
            </div>

            {/* Clear Button */}
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setShowAdvancedSearch(false)}
                variant="default"
                size="sm"
                className="h-8 text-xs"
              >
                Search
              </Button>
              <Button
                onClick={() => {
                  setSearchFields({ merchant: true, category: true, tags: true, account: true, amount: true });
                  setDateRange({ from: undefined, to: undefined });
                  setAmountExact('');
                  setAmountRange({ min: '', max: '' });
                }}
                variant="outline"
                size="sm"
                className="h-8 text-xs"
              >
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compact Filters */}
      <Card className="border-gray-200">
        <CardContent className="p-3">
            <div className="grid grid-cols-5 gap-2">
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

              {/* Tags Filter - Multi-select with Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-full justify-between text-xs font-normal"
                  >
                    <span className="truncate">
                      {tagFilter.length === 0 ? 'All tags' : `${tagFilter.length} tag(s)`}
                    </span>
                    <ChevronDown className="w-3 h-3 ml-1 flex-shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0" align="end">
                  <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold">Select Tags</span>
                      {tagFilter.length > 0 && (
                        <button
                          onClick={() => setTagFilter([])}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                    <div className="space-y-1">
                      {tags.filter(tag => !['good-life', 'personal', 'home', 'transport', 'income'].includes(tag.id.toLowerCase())).map(tag => (
                        <label key={tag.id} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={tagFilter.includes(tag.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setTagFilter([...tagFilter, tag.id]);
                              } else {
                                setTagFilter(tagFilter.filter(t => t !== tag.id));
                              }
                            }}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                          <span className="text-xs flex-1">{tag.id}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
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

    {/* Transaction Import Modal */}
    <TransactionImportModal
      open={showImportModal}
      onClose={() => setShowImportModal(false)}
      banks={banks}
      onImportSuccess={refreshTransactions}
    />
  </>
  );
}