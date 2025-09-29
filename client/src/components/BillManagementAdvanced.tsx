import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Play,
  Upload,
  X,
  ArrowLeft,
  DollarSign,
  CheckCircle,
  Clock,
  AlertTriangle,
  Bell,
  ExternalLink,
} from "lucide-react";
import { useBillData, type Bill, type QuickEntry } from "../hooks/useBillData";


interface Account {
  id: string;
  name: string;
  subAccounts: SubAccount[];
}

interface SubAccount {
  id: string;
  name: string;
  balance: number;
}

interface BillManagementAdvancedProps {
  className?: string;
}

export function BillManagementAdvanced({ className = "" }: BillManagementAdvancedProps) {
  const {
    bills,
    quickEntries,
    loading,
    loadBillsData,
    activeBillsCount,
    dueBillsCount,
    overdueBillsCount,
    monthlyTotal,
    pendingCount
  } = useBillData();

  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all-categories');
  const [statusFilter, setStatusFilter] = useState('all-status');
  const [showQuickEntry, setShowQuickEntry] = useState(false);
  const [showDetailedEntry, setShowDetailedEntry] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [currentEditBill, setCurrentEditBill] = useState<Bill | null>(null);
  const [originalBillData, setOriginalBillData] = useState<Bill | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [currentResumeBill, setCurrentResumeBill] = useState<string | null>(null);
  const [currentQuickEntryId, setCurrentQuickEntryId] = useState<number | null>(null);
  const [resumeOption, setResumeOption] = useState<string>('');
  const [paymentToggle, setPaymentToggle] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedSubAccount, setSelectedSubAccount] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [cancelReminder, setCancelReminder] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [quickBillName, setQuickBillName] = useState('');
  const [quickNotes, setQuickNotes] = useState('');
  const [quickAmount, setQuickAmount] = useState('');
  const [billName, setBillName] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billCategory, setBillCategory] = useState('');
  const [billFrequency, setBillFrequency] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [firstDueDate, setFirstDueDate] = useState('');
  const [reminderTiming, setReminderTiming] = useState('7');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [cancelUrl, setCancelUrl] = useState('');
  const [resumeDate, setResumeDate] = useState(new Date().toISOString().split('T')[0]);

  const accountConfigs: Record<string, Account> = {
    'up': {
      id: 'up',
      name: 'UP Bank',
      subAccounts: [
        { id: 'spending', name: 'Spending Account', balance: 2547.83 },
        { id: 'saver', name: 'Saver Account', balance: 15420.12 },
        { id: 'bills', name: 'Bills Account', balance: 890.45 }
      ]
    },
    'commonwealth': {
      id: 'commonwealth',
      name: 'Commonwealth Bank',
      subAccounts: [
        { id: 'everyday', name: 'Everyday Account', balance: 1234.56 },
        { id: 'savings', name: 'Savings Account', balance: 8765.43 }
      ]
    },
    'anz': {
      id: 'anz',
      name: 'ANZ Bank',
      subAccounts: [
        { id: 'transaction', name: 'Transaction Account', balance: 987.65 },
        { id: 'savings', name: 'Savings Account', balance: 5432.10 }
      ]
    },
    'westpac': {
      id: 'westpac',
      name: 'Westpac',
      subAccounts: [
        { id: 'choice', name: 'Choice Account', balance: 654.32 },
        { id: 'savings', name: 'Savings Account', balance: 3210.98 }
      ]
    },
    'nab': {
      id: 'nab',
      name: 'NAB',
      subAccounts: [
        { id: 'classic', name: 'Classic Banking', balance: 432.10 },
        { id: 'isaver', name: 'iSaver Account', balance: 7654.32 }
      ]
    }
  };


  // Styling helper functions from UpcomingBillsSection
  const getUrgencyColor = (daysUntil: number) => {
    if (daysUntil <= 0) return 'border-l-red-500 bg-red-50';
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

  const handlePayNow = (bill: Bill) => {
    if (bill.config?.payNowLink || bill.websiteUrl) {
      window.open(bill.config?.payNowLink || bill.websiteUrl, '_blank');
    }
  };

  const handleReminder = (bill: Bill) => {
    console.log(`Setting ${bill.config?.reminderType || 'normal'} reminder for ${bill.name} - ${bill.config?.reminderDays || 7} days`);
  };

  // Filter functions
  const getFilteredBills = () => {
    if (activeTab === 'pending') {
      // Return quick entries for pending processing tab
      return quickEntries.filter(entry => {
        if (searchTerm) {
          return entry.billName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 entry.notes.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return true;
      });
    }

    let filtered = bills;

    // Tab filter
    if (activeTab === 'upcoming') {
      filtered = filtered.filter(bill => {
        const today = new Date();
        const dueDate = new Date(bill.dueDate);
        const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff <= 7 && daysDiff >= 0;
      });
    } else if (activeTab === 'overdue') {
      filtered = filtered.filter(bill => {
        const today = new Date();
        const dueDate = new Date(bill.dueDate);
        return dueDate < today;
      });
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(bill =>
        bill.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter && categoryFilter !== 'all-categories') {
      filtered = filtered.filter(bill => bill.category === categoryFilter);
    }

    // Status filter
    if (statusFilter && statusFilter !== 'all-status') {
      filtered = filtered.filter(bill => bill.status === statusFilter);
    }

    return filtered;
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const daysDiff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff < 0) return { text: 'Overdue', class: 'text-red-600' };
    if (daysDiff === 0) return { text: 'Due today', class: 'text-red-600' };
    if (daysDiff <= 7) return { text: `Due in ${daysDiff} days`, class: 'text-yellow-600' };
    return { text: `Due in ${daysDiff} days`, class: 'text-green-600' };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Paused</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const resetQuickForm = () => {
    setQuickBillName('');
    setQuickNotes('');
    setQuickAmount('');
  };

  const resetDetailedForm = () => {
    setBillName('');
    setBillAmount('');
    setBillCategory('');
    setBillFrequency('');
    setDueDay('');
    setFirstDueDate('');
    setSelectedAccount('');
    setSelectedSubAccount('');
    setWebsiteUrl('');
    setIsRecurring(false);
    setCancelReminder(false);
    setPaymentToggle(false);
    setReminderTiming('7');
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('File selected:', file.name);

      const formData = new FormData();
      formData.append('image', file);

      try {
        const response = await fetch('/api/bills/upload-image', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (result.success) {
          // Auto-populate fields with OCR results
          setQuickBillName(result.data.billName);
          setQuickAmount(result.data.amount);
          alert(`OCR Success! Found: ${result.data.billName} - $${result.data.amount}`);
        } else {
          alert('OCR processing failed. Please enter details manually.');
        }
      } catch (error) {
        console.error('Upload error:', error);
        alert('Image upload failed. Please try again.');
      }
    }
  };

  const handleCompleteEntry = async (quickEntry: QuickEntry) => {
    // Pre-fill detailed form with quick entry data
    setBillName(quickEntry.billName);
    setBillAmount(quickEntry.amount);
    setQuickNotes(quickEntry.notes);

    // Store the quick entry ID for deletion after completion
    setCurrentQuickEntryId(quickEntry.id);

    setShowDetailedEntry(true);
  };

  const handleDeleteQuickEntry = async (quickEntryId: number) => {
    if (!confirm('Are you sure you want to delete this quick entry?')) {
      return;
    }

    try {
      const response = await fetch(`/api/bills/${quickEntryId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        alert('Quick entry deleted successfully!');
        loadBillsData(); // Refresh data
      } else {
        alert('Failed to delete quick entry. Please try again.');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete. Please check your connection.');
    }
  };

  const handleSaveQuickEntry = async () => {
    if (!quickBillName && !quickNotes && !quickAmount) {
      alert('Please add at least a bill name, notes, or an amount.');
      return;
    }

    try {
      const response = await fetch('/api/bills/quick-entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          billName: quickBillName,
          notes: quickNotes,
          amount: quickAmount,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('Quick entry saved to process later!');
        setShowQuickEntry(false);
        resetQuickForm();
        loadBillsData(); // Refresh data to show new quick entry
      } else {
        alert('Failed to save quick entry. Please try again.');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save. Please check your connection.');
    }
  };

  const handleSaveBill = async () => {
    if (!billName || !billAmount) {
      alert('Please fill in the required fields (Bill Name and Amount).');
      return;
    }

    const billData = {
      name: billName,
      amount: parseFloat(billAmount),
      category: billCategory,
      frequency: billFrequency,
      status: 'active',
      paymentMethod: paymentToggle ? 'auto' : 'manual',
      account: selectedAccount,
      subAccount: selectedSubAccount,
      isRecurring: isRecurring,
      cancelReminder: cancelReminder,
      reminderTiming: reminderTiming,
      dueDate: firstDueDate || '2025-02-01',
      websiteUrl: websiteUrl,
      cancelUrl: cancelUrl
    };

    try {
      const response = await fetch('/api/bills/detailed-entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(billData),
      });

      const result = await response.json();

      if (result.success) {
        // If this was completing a quick entry, delete the quick entry
        if (currentQuickEntryId) {
          try {
            await fetch(`/api/bills/${currentQuickEntryId}`, {
              method: 'DELETE',
            });
            setCurrentQuickEntryId(null);
          } catch (error) {
            console.error('Failed to delete quick entry:', error);
          }
        }

        let confirmationMessage = 'Bill saved successfully!\n\n';
        confirmationMessage += `💳 Payment: ${billData.paymentMethod === 'auto' ? 'Direct Debit' : 'Manual'}\n`;

        if (billData.account && billData.subAccount) {
          const accountConfig = accountConfigs[billData.account];
          const subAccount = accountConfig?.subAccounts.find(acc => acc.id === billData.subAccount);
          if (accountConfig && subAccount) {
            confirmationMessage += `🏦 Account: ${accountConfig.name} - ${subAccount.name}\n`;
          }
        }

        if (billData.isRecurring) {
          confirmationMessage += `🔄 Recurring subscription`;
          if (billData.cancelReminder) {
            confirmationMessage += ` (reminder set for ${billData.reminderTiming} days before renewal)`;
          }
        }

        alert(confirmationMessage);
        setShowDetailedEntry(false);
        resetDetailedForm();
        loadBillsData(); // Refresh data to show new bill
      } else {
        alert('Failed to save bill. Please try again.');
      }
    } catch (error) {
      console.error('Save bill error:', error);
      alert('Failed to save bill. Please check your connection.');
    }
  };

  const handleResumeBill = (billId: string) => {
    setCurrentResumeBill(billId);
    setResumeOption('');
    setShowResumeModal(true);
  };

  const handleConfirmResume = () => {
    if (!resumeOption || !currentResumeBill) return;

    const billIndex = bills.findIndex(b => b.id === currentResumeBill);
    if (billIndex === -1) return;

    const updatedBills = [...bills];
    const bill = updatedBills[billIndex];

    switch (resumeOption) {
      case 'same':
        bill.status = 'active';
        alert('Bill resumed with same settings!');
        break;
      case 'new-date':
        bill.status = 'active';
        bill.dueDate = resumeDate;
        alert(`Bill resumed with new start date: ${resumeDate}`);
        break;
      default:
        return;
    }

    setBills(updatedBills);
    setShowResumeModal(false);
  };

  const handleEditBill = (bill: Bill) => {
    // Store original data for change detection
    setOriginalBillData({ ...bill });
    setCurrentEditBill({ ...bill });

    // Pre-fill form with bill data
    setBillName(bill.name);
    setBillAmount(bill.amount.toString());
    setBillCategory(bill.category);
    setBillFrequency(bill.frequency);
    setDueDay(''); // Extract from dueDate if needed
    setFirstDueDate(bill.dueDate);
    setPaymentToggle(bill.paymentMethod === 'auto');
    setSelectedAccount(bill.account || '');
    setSelectedSubAccount(bill.subAccount || '');
    setIsRecurring(bill.isRecurring);
    setCancelReminder(bill.cancelReminder || false);
    setReminderTiming(bill.reminderTiming || '7');
    setWebsiteUrl(bill.websiteUrl || '');
    setCancelUrl(''); // Will need to extract from bill if stored

    // Reset change tracking
    setHasUnsavedChanges(false);

    // Open edit modal
    setShowEditModal(true);
  };

  const handleUpdateBill = async () => {
    if (!currentEditBill || !billName || !billAmount) {
      alert('Please fill in the required fields (Bill Name and Amount).');
      return;
    }

    const updatedBillData = {
      name: billName,
      amount: parseFloat(billAmount),
      category: billCategory,
      frequency: billFrequency,
      status: currentEditBill.status, // Keep existing status
      paymentMethod: paymentToggle ? 'auto' : 'manual',
      account: selectedAccount,
      subAccount: selectedSubAccount,
      isRecurring: isRecurring,
      cancelReminder: cancelReminder,
      reminderTiming: reminderTiming,
      dueDate: firstDueDate,
      websiteUrl: websiteUrl,
      cancelUrl: cancelUrl
    };

    try {
      const response = await fetch(`/api/bills/${currentEditBill.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedBillData),
      });

      const result = await response.json();

      if (result.success) {
        alert('Bill updated successfully!');
        setShowEditModal(false);
        setHasUnsavedChanges(false);
        setCurrentEditBill(null);
        setOriginalBillData(null);
        loadBillsData(); // Refresh bill list
      } else {
        alert('Failed to update bill. Please try again.');
      }
    } catch (error) {
      console.error('Update bill error:', error);
      alert('Failed to update bill. Please check your connection.');
    }
  };

  const handleDeleteBill = async (billId: string) => {
    if (confirm('Are you sure you want to delete this bill?')) {
      try {
        const response = await fetch(`/api/bills/${billId}`, {
          method: 'DELETE',
        });

        const result = await response.json();

        if (result.success) {
          alert('Bill deleted successfully!');
          loadBillsData(); // Refresh bill list
        } else {
          alert('Failed to delete bill. Please try again.');
        }
      } catch (error) {
        console.error('Delete bill error:', error);
        alert('Failed to delete bill. Please check your connection.');
      }
    }
  };

  const getSelectedSubAccountBalance = () => {
    if (!selectedAccount || !selectedSubAccount) return null;
    const account = accountConfigs[selectedAccount];
    const subAccount = account?.subAccounts.find(acc => acc.id === selectedSubAccount);
    return subAccount?.balance;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advanced Bill Management</h1>
          <p className="text-gray-600">Comprehensive bill tracking and automation</p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column - Bills Section (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="bg-white/70 backdrop-blur-sm border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                      Monthly Total
                    </h3>
                    <div className="text-2xl font-bold text-blue-600">
                      ${monthlyTotal.toFixed(2)}
                    </div>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-full">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                      Active Bills
                    </h3>
                    <div className="text-2xl font-bold text-green-600">
                      {activeBillsCount}
                    </div>
                  </div>
                  <div className="p-2 bg-green-100 rounded-full">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border-yellow-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                      Due This Week
                    </h3>
                    <div className="text-2xl font-bold text-yellow-600">
                      {dueBillsCount}
                    </div>
                  </div>
                  <div className="p-2 bg-yellow-100 rounded-full">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                      Overdue
                    </h3>
                    <div className="text-2xl font-bold text-red-600">
                      {overdueBillsCount}
                    </div>
                  </div>
                  <div className="p-2 bg-red-100 rounded-full">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Navigation Tabs */}
          <Card className="bg-white/50 backdrop-blur-sm border-0 shadow-sm">
            <div className="flex gap-1 p-1">
              {[
                { id: 'all', label: 'All Bills' },
                { id: 'upcoming', label: `Upcoming (${dueBillsCount})` },
                { id: 'overdue', label: `Overdue (${overdueBillsCount})` },
                { id: 'pending', label: `Pending Processing (${pendingCount})` }
              ].map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab(tab.id)}
                  className={`transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          </Card>

          {/* Controls */}
          <Card className="bg-white/70 backdrop-blur-sm border-gray-200">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex gap-2 flex-1 min-w-[250px]">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search bills..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-categories">All Categories</SelectItem>
                        <SelectItem value="entertainment">Entertainment</SelectItem>
                        <SelectItem value="utilities">Utilities</SelectItem>
                        <SelectItem value="telecom">Telecom</SelectItem>
                        <SelectItem value="insurance">Insurance</SelectItem>
                        <SelectItem value="fitness">Fitness</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-status">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Dialog open={showQuickEntry} onOpenChange={setShowQuickEntry}>
                    <DialogTrigger asChild>
                      <Button className="bg-gray-900 hover:bg-gray-800 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Bill
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

          {/* Bills List */}
          <Card className="bg-white/70 backdrop-blur-sm border-gray-200">
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-gray-500">
                  Loading bills...
                </div>
              ) : (
                <div className="space-y-0">
              {getFilteredBills().map((item: any) => {
                // Check if this is a quick entry or a regular bill
                const isQuickEntry = item.type === 'quick-entry';

                if (isQuickEntry) {
                  // Render quick entry
                  return (
                    <div
                      key={`quick-${item.id}`}
                      className="flex items-center justify-between p-4 border-b border-gray-100 last:border-b-0 hover:bg-yellow-50 transition-colors border-l-4 border-l-yellow-400"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div>
                          <div className="font-semibold text-gray-900">
                            {item.billName || 'Unnamed Bill'}
                          </div>
                          <div className="flex gap-4 text-sm text-gray-600">
                            {item.amount && <span>${item.amount}</span>}
                            {item.notes && <span>📝 {item.notes}</span>}
                            <span>🕒 Quick Entry</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                          Pending Processing
                        </Badge>

                        <div className="text-right">
                          <div className="text-sm text-gray-500">
                            Created: {new Date(item.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCompleteEntry(item)}
                            className="p-2 text-green-600 hover:text-green-700"
                            title="Complete Entry"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteQuickEntry(item.id)}
                            className="p-2 text-red-600 hover:text-red-700"
                            title="Delete Quick Entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  // Render regular bill
                  const bill = item as Bill;
                  const dueInfo = getDaysUntilDue(bill.dueDate);
                  const daysUntil = bill.daysUntil || 0;

                  return (
                    <div
                      key={bill.id}
                      className={`border-l-4 rounded-r-lg p-3 border-b border-gray-100 last:border-b-0 transition-all hover:shadow-md ${getUrgencyColor(daysUntil)}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{bill.icon}</span>
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{bill.name}</div>
                            <div className="flex gap-4 text-xs text-gray-600">
                              <span>${bill.amount}</span>
                              <span>📅 {bill.frequency}</span>
                              <span>{bill.paymentMethod === 'auto' ? '🔄 Auto' : '✋ Manual'}</span>
                              {daysUntil <= 0 && (
                                <AlertTriangle className="w-3 h-3 text-red-500" />
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {getStatusBadge(bill.status)}

                          <div className="text-right">
                            <div className={`font-semibold text-sm ${dueInfo.class}`}>
                              {dueInfo.text}
                            </div>
                            <div className="text-xs text-gray-500">
                              {bill.nextDue || bill.dueDate}
                            </div>
                          </div>

                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditBill(bill)}
                              className="p-1"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            {bill.status === 'paused' ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleResumeBill(bill.id)}
                                className="p-1"
                              >
                                <Play className="w-3 h-3" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteBill(bill.id)}
                                className="p-1 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Pay Now and Reminder buttons */}
                      {bill.config && (bill.config.showPayNow || bill.config.showReminder) && (
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
                  );
                }
              })}
                  {getFilteredBills().length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                      {activeTab === 'pending'
                        ? 'No pending quick entries. Create a quick entry to see it here!'
                        : 'No bills found. Add some bills to get started!'
                      }
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Savers Section */}
        <div className="lg:col-span-1 space-y-4">
          {/* UP Bank Savers */}
          <div className="space-y-2">
            <div className="text-sm font-semibold text-gray-700 mb-3">UP Bank Savers</div>

            {/* Water Saver */}
            <Card className="bg-white border-l-4 border-l-blue-500 hover:shadow-md transition-all duration-200">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">💧</span>
                    <span className="font-medium text-sm">Water</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">$62.90</div>
                    <div className="text-xs text-gray-500">of $100</div>
                  </div>
                </div>
                <div className="mb-2">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-blue-500 h-1.5 rounded-full" style={{width: '62.9%'}}></div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="text-xs h-6 px-2 bg-blue-50 text-blue-700 border-blue-200">
                    View Saver
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs h-6 px-2 bg-gray-50 text-gray-700 border-gray-200">
                    Saver Bills
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Electric Saver */}
            <Card className="bg-white border-l-4 border-l-yellow-500 hover:shadow-md transition-all duration-200">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">⚡</span>
                    <span className="font-medium text-sm">Electric</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">$113.14</div>
                    <div className="text-xs text-gray-500">of $100</div>
                  </div>
                </div>
                <div className="mb-2">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-yellow-500 h-1.5 rounded-full" style={{width: '100%'}}></div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="text-xs h-6 px-2 bg-yellow-50 text-yellow-700 border-yellow-200">
                    View Saver
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs h-6 px-2 bg-gray-50 text-gray-700 border-gray-200">
                    Saver Bills
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Kettle BBQ Saver */}
            <Card className="bg-white border-l-4 border-l-purple-500 hover:shadow-md transition-all duration-200">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">🔍</span>
                    <span className="font-medium text-sm">Kettle BBQ</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">$1527.10</div>
                    <div className="text-xs text-gray-500">of $100</div>
                  </div>
                </div>
                <div className="mb-2">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-purple-500 h-1.5 rounded-full" style={{width: '100%'}}></div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="text-xs h-6 px-2 bg-purple-50 text-purple-700 border-purple-200">
                    View Saver
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs h-6 px-2 bg-gray-50 text-gray-700 border-gray-200">
                    Saver Bills
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Bills Saver */}
            <Card className="bg-white border-l-4 border-l-gray-400 hover:shadow-md transition-all duration-200">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">📄</span>
                    <span className="font-medium text-sm">Bills</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">$0.00</div>
                    <div className="text-xs text-gray-500">of $100</div>
                  </div>
                </div>
                <div className="mb-2">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-gray-400 h-1.5 rounded-full" style={{width: '0%'}}></div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="text-xs h-6 px-2 bg-gray-50 text-gray-700 border-gray-200">
                    View Saver
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs h-6 px-2 bg-gray-50 text-gray-700 border-gray-200">
                    Saver Bills
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Savings Saver */}
            <Card className="bg-white border-l-4 border-l-green-500 hover:shadow-md transition-all duration-200">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">💰</span>
                    <span className="font-medium text-sm">Savings</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">$0.00</div>
                    <div className="text-xs text-gray-500">of $100</div>
                  </div>
                </div>
                <div className="mb-2">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-green-500 h-1.5 rounded-full" style={{width: '0%'}}></div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="text-xs h-6 px-2 bg-green-50 text-green-700 border-green-200">
                    View Saver
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs h-6 px-2 bg-gray-50 text-gray-700 border-gray-200">
                    Saver Bills
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Bed Saver */}
            <Card className="bg-white border-l-4 border-l-indigo-500 hover:shadow-md transition-all duration-200">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">🛏️</span>
                    <span className="font-medium text-sm">Bed</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">$0.00</div>
                    <div className="text-xs text-gray-500">of $100</div>
                  </div>
                </div>
                <div className="mb-2">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-indigo-500 h-1.5 rounded-full" style={{width: '0%'}}></div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="text-xs h-6 px-2 bg-indigo-50 text-indigo-700 border-indigo-200">
                    View Saver
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs h-6 px-2 bg-gray-50 text-gray-700 border-gray-200">
                    Saver Bills
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Aeron Chair Saver */}
            <Card className="bg-white border-l-4 border-l-amber-500 hover:shadow-md transition-all duration-200">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">🪑</span>
                    <span className="font-medium text-sm">Aeron chair</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">$5284.90</div>
                    <div className="text-xs text-gray-500">of $100</div>
                  </div>
                </div>
                <div className="mb-2">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-amber-500 h-1.5 rounded-full" style={{width: '100%'}}></div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="text-xs h-6 px-2 bg-amber-50 text-amber-700 border-amber-200">
                    View Saver
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs h-6 px-2 bg-gray-50 text-gray-700 border-gray-200">
                    Saver Bills
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* BOQ Bank Section */}
          <div className="space-y-2">
            <div className="text-sm font-semibold text-gray-700 mb-3">BOQ Bank</div>

            {/* BOQ Everyday */}
            <Card className="bg-white border-l-4 border-l-blue-600 hover:shadow-md transition-all duration-200">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">💳</span>
                    <span className="font-medium text-sm">Everyday</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">$12,450.00</div>
                    <div className="text-xs text-gray-500">Available</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* BOQ Offset */}
            <Card className="bg-white border-l-4 border-l-orange-500 hover:shadow-md transition-all duration-200">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">🏠</span>
                    <span className="font-medium text-sm">Mortgage Offset</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">$2,000.00</div>
                    <div className="text-xs text-gray-500">6.21% saving</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Quick Entry Modal */}
      <Dialog open={showQuickEntry} onOpenChange={setShowQuickEntry}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Quick Bill Entry</DialogTitle>
            <p className="text-gray-600">Just snap, note, and go. Zero required fields.</p>
          </DialogHeader>

          <div className="space-y-6">
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <div className="text-lg text-gray-600 mb-2">Drop an image or click to upload</div>
              <div className="text-sm text-gray-500">Bill, receipt, or reminder photo</div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            <div>
              <Label htmlFor="quickBillName">Bill Name</Label>
              <Input
                id="quickBillName"
                placeholder="Netflix Subscription"
                value={quickBillName}
                onChange={(e) => setQuickBillName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="quickNotes">Quick Notes</Label>
              <Textarea
                id="quickNotes"
                placeholder="Additional notes or details"
                value={quickNotes}
                onChange={(e) => setQuickNotes(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="quickAmount">Amount (optional)</Label>
              <Input
                id="quickAmount"
                placeholder="0.00"
                value={quickAmount}
                onChange={(e) => setQuickAmount(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSaveQuickEntry} className="flex-1">
                💾 Save to Process Later
              </Button>
              <Button
                onClick={() => {
                  // Transfer data from quick entry to detailed entry
                  if (quickBillName) setBillName(quickBillName);
                  if (quickAmount) setBillAmount(quickAmount);
                  setShowQuickEntry(false);
                  setShowDetailedEntry(true);
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                ➡️ Continue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detailed Entry Modal */}
      <Dialog open={showDetailedEntry} onOpenChange={setShowDetailedEntry}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowDetailedEntry(false);
                  setShowQuickEntry(true);
                }}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <DialogTitle>Detailed Bill Entry</DialogTitle>
                <p className="text-gray-600">Complete bill information</p>
              </div>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="billName">Bill Name *</Label>
              <Input
                id="billName"
                placeholder="Netflix Subscription"
                value={billName}
                onChange={(e) => setBillName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="billAmount">Amount *</Label>
              <Input
                id="billAmount"
                placeholder="0.00"
                value={billAmount}
                onChange={(e) => setBillAmount(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="billCategory">Category</Label>
              <Select value={billCategory} onValueChange={setBillCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                  <SelectItem value="utilities">Utilities</SelectItem>
                  <SelectItem value="telecom">Telecom</SelectItem>
                  <SelectItem value="insurance">Insurance</SelectItem>
                  <SelectItem value="fitness">Fitness</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="billFrequency">Frequency</Label>
              <Select value={billFrequency} onValueChange={setBillFrequency}>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="6months">6 Months</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="custom-days">Custom Days</SelectItem>
                  <SelectItem value="custom-weeks">Custom Weeks</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dueDay">Due Day (1-31)</Label>
              <Input
                id="dueDay"
                type="number"
                min="1"
                max="31"
                placeholder="15"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="firstDueDate">First Due Date</Label>
              <Input
                id="firstDueDate"
                type="date"
                value={firstDueDate}
                onChange={(e) => setFirstDueDate(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <Label>Payment Method</Label>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-sm">Manual Payment</span>
                <div
                  onClick={() => setPaymentToggle(!paymentToggle)}
                  className={`relative w-12 h-6 rounded-full cursor-pointer transition-colors ${
                    paymentToggle ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ease-in-out ${
                      paymentToggle ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </div>
                <span className="text-sm">Direct Debit</span>
              </div>
            </div>

            {paymentToggle && (
              <>
                <div>
                  <Label htmlFor="sourceAccount">Payment Account</Label>
                  <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(accountConfigs).map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedAccount && (
                  <div>
                    <Label htmlFor="subAccount">Sub Account</Label>
                    <Select value={selectedSubAccount} onValueChange={setSelectedSubAccount}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sub account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accountConfigs[selectedAccount]?.subAccounts.map((subAccount) => (
                          <SelectItem key={subAccount.id} value={subAccount.id}>
                            {subAccount.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {getSelectedSubAccountBalance() && (
                      <div className="mt-2 p-2 bg-green-50 border-l-3 border-green-500 text-sm text-green-700">
                        💰 Available: ${getSelectedSubAccountBalance()?.toFixed(2)}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            <div className="md:col-span-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isRecurring"
                  checked={isRecurring}
                  onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
                />
                <Label htmlFor="isRecurring">Recurring Subscription</Label>
              </div>
            </div>

            {isRecurring && (
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="cancelReminder"
                    checked={cancelReminder}
                    onCheckedChange={(checked) => setCancelReminder(checked as boolean)}
                  />
                  <Label htmlFor="cancelReminder">Remind me to cancel this subscription</Label>
                </div>

                {cancelReminder && (
                  <div className="ml-6">
                    <Label htmlFor="reminderTiming">Reminder Timing</Label>
                    <Select value={reminderTiming} onValueChange={setReminderTiming}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 days before renewal</SelectItem>
                        <SelectItem value="14">14 days before renewal</SelectItem>
                        <SelectItem value="30">30 days before renewal</SelectItem>
                        <SelectItem value="custom">Custom timing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="websiteUrl">Website/Manage Account URL</Label>
              <Input
                id="websiteUrl"
                type="url"
                placeholder="https://netflix.com/account"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="cancelUrl">Cancel URL</Label>
              <Input
                id="cancelUrl"
                type="url"
                placeholder="https://netflix.com/cancel"
                value={cancelUrl}
                onChange={(e) => setCancelUrl(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button onClick={handleSaveBill}>
              💾 Save Bill
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Resume Bill Modal */}
      <Dialog open={showResumeModal} onOpenChange={setShowResumeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resume Bill Payment</DialogTitle>
            <p className="text-gray-600">Choose how you'd like to resume this bill</p>
          </DialogHeader>

          <div className="space-y-4">
            <div
              className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                resumeOption === 'same' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => setResumeOption('same')}
            >
              <div className="font-semibold">Resume with same settings</div>
              <div className="text-sm text-gray-600">Keep all existing bill details unchanged</div>
            </div>

            <div
              className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                resumeOption === 'new-date' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => setResumeOption('new-date')}
            >
              <div className="font-semibold">Set new start date</div>
              <div className="text-sm text-gray-600">Resume with a specific date</div>
              {resumeOption === 'new-date' && (
                <div className="mt-3">
                  <Label htmlFor="resumeDate">New start date:</Label>
                  <Input
                    id="resumeDate"
                    type="date"
                    value={resumeDate}
                    onChange={(e) => setResumeDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              onClick={handleConfirmResume}
              disabled={!resumeOption}
              className="flex-1"
            >
              Resume Bill
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowResumeModal(false)}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Bill Modal */}
      <Dialog open={showEditModal} onOpenChange={(open) => {
        if (!open && hasUnsavedChanges) {
          // User is trying to close with unsaved changes
          const shouldClose = confirm('You have unsaved changes. Do you want to discard them?');
          if (shouldClose) {
            setShowEditModal(false);
            setHasUnsavedChanges(false);
            setCurrentEditBill(null);
            setOriginalBillData(null);
          }
        } else if (!open) {
          // No changes, close normally
          setShowEditModal(false);
          setCurrentEditBill(null);
          setOriginalBillData(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Bill: {currentEditBill?.name}</DialogTitle>
            <p className="text-gray-600">Update bill information</p>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="editBillName">Bill Name *</Label>
              <Input
                id="editBillName"
                placeholder="Netflix Subscription"
                value={billName}
                onChange={(e) => {
                  setBillName(e.target.value);
                  setHasUnsavedChanges(true);
                }}
              />
            </div>

            <div>
              <Label htmlFor="editBillAmount">Amount *</Label>
              <Input
                id="editBillAmount"
                placeholder="0.00"
                value={billAmount}
                onChange={(e) => {
                  setBillAmount(e.target.value);
                  setHasUnsavedChanges(true);
                }}
              />
            </div>

            <div>
              <Label htmlFor="editBillCategory">Category</Label>
              <Select value={billCategory} onValueChange={(value) => {
                setBillCategory(value);
                setHasUnsavedChanges(true);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                  <SelectItem value="utilities">Utilities</SelectItem>
                  <SelectItem value="telecom">Telecom</SelectItem>
                  <SelectItem value="insurance">Insurance</SelectItem>
                  <SelectItem value="fitness">Fitness</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="editBillFrequency">Frequency</Label>
              <Select value={billFrequency} onValueChange={(value) => {
                setBillFrequency(value);
                setHasUnsavedChanges(true);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="6months">6 Months</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="custom-days">Custom Days</SelectItem>
                  <SelectItem value="custom-weeks">Custom Weeks</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="editFirstDueDate">Due Date</Label>
              <Input
                id="editFirstDueDate"
                type="date"
                value={firstDueDate}
                onChange={(e) => {
                  setFirstDueDate(e.target.value);
                  setHasUnsavedChanges(true);
                }}
              />
            </div>

            <div className="md:col-span-2">
              <Label>Payment Method</Label>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-sm">Manual Payment</span>
                <div
                  onClick={() => {
                    setPaymentToggle(!paymentToggle);
                    setHasUnsavedChanges(true);
                  }}
                  className={`relative w-12 h-6 rounded-full cursor-pointer transition-colors ${
                    paymentToggle ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ease-in-out ${
                      paymentToggle ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </div>
                <span className="text-sm">Direct Debit</span>
              </div>
            </div>

            {paymentToggle && (
              <>
                <div>
                  <Label htmlFor="editSourceAccount">Payment Account</Label>
                  <Select value={selectedAccount} onValueChange={(value) => {
                    setSelectedAccount(value);
                    setHasUnsavedChanges(true);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(accountConfigs).map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedAccount && (
                  <div>
                    <Label htmlFor="editSubAccount">Sub Account</Label>
                    <Select value={selectedSubAccount} onValueChange={(value) => {
                      setSelectedSubAccount(value);
                      setHasUnsavedChanges(true);
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sub account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accountConfigs[selectedAccount]?.subAccounts.map((subAccount) => (
                          <SelectItem key={subAccount.id} value={subAccount.id}>
                            {subAccount.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {getSelectedSubAccountBalance() && (
                      <div className="mt-2 p-2 bg-green-50 border-l-3 border-green-500 text-sm text-green-700">
                        💰 Available: ${getSelectedSubAccountBalance()?.toFixed(2)}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            <div className="md:col-span-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="editIsRecurring"
                  checked={isRecurring}
                  onCheckedChange={(checked) => {
                    setIsRecurring(checked as boolean);
                    setHasUnsavedChanges(true);
                  }}
                />
                <Label htmlFor="editIsRecurring">Recurring Subscription</Label>
              </div>
            </div>

            {isRecurring && (
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="editCancelReminder"
                    checked={cancelReminder}
                    onCheckedChange={(checked) => {
                      setCancelReminder(checked as boolean);
                      setHasUnsavedChanges(true);
                    }}
                  />
                  <Label htmlFor="editCancelReminder">Remind me to cancel this subscription</Label>
                </div>

                {cancelReminder && (
                  <div className="ml-6">
                    <Label htmlFor="editReminderTiming">Reminder Timing</Label>
                    <Select value={reminderTiming} onValueChange={(value) => {
                      setReminderTiming(value);
                      setHasUnsavedChanges(true);
                    }}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 days before renewal</SelectItem>
                        <SelectItem value="14">14 days before renewal</SelectItem>
                        <SelectItem value="30">30 days before renewal</SelectItem>
                        <SelectItem value="custom">Custom timing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="editWebsiteUrl">Website/Manage Account URL</Label>
              <Input
                id="editWebsiteUrl"
                type="url"
                placeholder="https://netflix.com/account"
                value={websiteUrl}
                onChange={(e) => {
                  setWebsiteUrl(e.target.value);
                  setHasUnsavedChanges(true);
                }}
              />
            </div>

            <div>
              <Label htmlFor="editCancelUrl">Cancel URL</Label>
              <Input
                id="editCancelUrl"
                type="url"
                placeholder="https://netflix.com/cancel"
                value={cancelUrl}
                onChange={(e) => {
                  setCancelUrl(e.target.value);
                  setHasUnsavedChanges(true);
                }}
              />
            </div>
          </div>

          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-gray-500">
              {hasUnsavedChanges ? (
                <span className="text-yellow-600">● Unsaved changes</span>
              ) : (
                <span className="text-green-600">✓ No changes</span>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  if (hasUnsavedChanges) {
                    const shouldDiscard = confirm('You have unsaved changes. Are you sure you want to discard them?');
                    if (shouldDiscard) {
                      setShowEditModal(false);
                      setHasUnsavedChanges(false);
                      setCurrentEditBill(null);
                      setOriginalBillData(null);
                    }
                  } else {
                    setShowEditModal(false);
                    setCurrentEditBill(null);
                    setOriginalBillData(null);
                  }
                }}
              >
                {hasUnsavedChanges ? 'Discard Changes' : 'Close'}
              </Button>
              <Button
                onClick={handleUpdateBill}
                disabled={!hasUnsavedChanges}
              >
                💾 Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}