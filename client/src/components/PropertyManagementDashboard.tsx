import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import {
  Home,
  Users,
  DollarSign,
  FileText,
  Settings,
  Plus,
  Search,
  Mail,
  Building,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  MapPin,
  Phone,
  Calendar,
  CreditCard,
  Filter,
  Bell,
  UserPlus,
  Zap,
  BarChart3
} from "lucide-react";

// Types
interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  property: string;
  unit: string;
  rentAmount: number;
  rentDue: string;
  status: 'active' | 'pending' | 'overdue' | 'notice';
  leaseStart: string;
  leaseEnd: string;
  deposit: number;
  lastPayment: string;
  avatar?: string;
}

interface Property {
  id: string;
  address: string;
  units: number;
  occupied: number;
  monthlyRent: number;
  type: 'apartment' | 'house' | 'commercial';
}

interface Activity {
  id: string;
  type: 'payment' | 'application' | 'maintenance' | 'notice';
  description: string;
  tenant?: string;
  amount?: number;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
}

// Mock Data
const mockTenants: Tenant[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    phone: '+61 412 345 678',
    property: '123 Collins Street',
    unit: 'Unit 1A',
    rentAmount: 2800,
    rentDue: '2025-10-01',
    status: 'active',
    leaseStart: '2024-01-15',
    leaseEnd: '2025-01-15',
    deposit: 5600,
    lastPayment: '2025-09-01'
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'michael.chen@email.com',
    phone: '+61 423 456 789',
    property: '456 Swanston Street',
    unit: 'Unit 2B',
    rentAmount: 3200,
    rentDue: '2025-09-28',
    status: 'overdue',
    leaseStart: '2023-06-01',
    leaseEnd: '2025-06-01',
    deposit: 6400,
    lastPayment: '2025-08-28'
  },
  {
    id: '3',
    name: 'Emma Thompson',
    email: 'emma.thompson@email.com',
    phone: '+61 434 567 890',
    property: '789 Chapel Street',
    unit: 'House',
    rentAmount: 4500,
    rentDue: '2025-10-05',
    status: 'active',
    leaseStart: '2024-03-01',
    leaseEnd: '2026-03-01',
    deposit: 9000,
    lastPayment: '2025-09-05'
  },
  {
    id: '4',
    name: 'David Wilson',
    email: 'david.wilson@email.com',
    phone: '+61 445 678 901',
    property: '321 Bourke Street',
    unit: 'Unit 3C',
    rentAmount: 2400,
    rentDue: '2025-10-10',
    status: 'pending',
    leaseStart: '2025-10-10',
    leaseEnd: '2026-10-10',
    deposit: 4800,
    lastPayment: 'N/A'
  }
];

const mockProperties: Property[] = [
  { id: '1', address: '123 Collins Street', units: 12, occupied: 10, monthlyRent: 28000, type: 'apartment' },
  { id: '2', address: '456 Swanston Street', units: 8, occupied: 7, monthlyRent: 22400, type: 'apartment' },
  { id: '3', address: '789 Chapel Street', units: 1, occupied: 1, monthlyRent: 4500, type: 'house' },
  { id: '4', address: '321 Bourke Street', units: 15, occupied: 12, monthlyRent: 36000, type: 'apartment' }
];

const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'payment',
    description: 'Rent payment received from Sarah Johnson',
    tenant: 'Sarah Johnson',
    amount: 2800,
    timestamp: '2025-09-22T10:30:00Z',
    status: 'completed'
  },
  {
    id: '2',
    type: 'application',
    description: 'New rental application submitted',
    tenant: 'Alex Rodriguez',
    timestamp: '2025-09-22T09:15:00Z',
    status: 'pending'
  },
  {
    id: '3',
    type: 'maintenance',
    description: 'Maintenance request - Unit 2B heating issue',
    tenant: 'Michael Chen',
    timestamp: '2025-09-21T14:45:00Z',
    status: 'pending'
  },
  {
    id: '4',
    type: 'notice',
    description: 'Lease renewal notice sent',
    tenant: 'Emma Thompson',
    timestamp: '2025-09-21T11:20:00Z',
    status: 'completed'
  }
];

// Simulated API functions
const simulatedFunctions = {
  setupNewTenant: async (tenantData: Partial<Tenant>) => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { success: true, message: 'Tenant setup completed successfully', tenantId: Math.random().toString(36).substr(2, 9) };
  },

  getAllTenants: async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, data: mockTenants };
  },

  processDocuments: async () => {
    await new Promise(resolve => setTimeout(resolve, 3000));
    return { success: true, message: 'Documents processed successfully', processed: 12 };
  },

  syncBankData: async () => {
    await new Promise(resolve => setTimeout(resolve, 2500));
    return { success: true, message: 'Bank data synchronized', transactions: 24 };
  }
};

export function PropertyManagementDashboard() {
  // State Management
  const [activeSection, setActiveSection] = useState('dashboard');
  const [tenants, setTenants] = useState<Tenant[]>(mockTenants);
  const [properties] = useState<Property[]>(mockProperties);
  const [activities] = useState<Activity[]>(mockActivities);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showNewTenantForm, setShowNewTenantForm] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string; message: string; type: 'success' | 'error' }[]>([]);

  // New Tenant Form State
  const [newTenantForm, setNewTenantForm] = useState({
    name: '',
    email: '',
    phone: '',
    property: '',
    unit: '',
    rentAmount: '',
    leaseStart: '',
    leaseEnd: '',
    deposit: ''
  });

  // Up Bank style assistant state
  const [showAssistant, setShowAssistant] = useState(false);

  // Calculated Stats
  const stats = {
    totalTenants: tenants.length,
    activeTenants: tenants.filter(t => t.status === 'active').length,
    overduePayments: tenants.filter(t => t.status === 'overdue').length,
    totalRent: tenants.reduce((sum, t) => sum + t.rentAmount, 0),
    occupancyRate: Math.round((properties.reduce((sum, p) => sum + p.occupied, 0) / properties.reduce((sum, p) => sum + p.units, 0)) * 100),
    monthlyRevenue: properties.reduce((sum, p) => sum + p.monthlyRent, 0)
  };

  // Utility Functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'notice': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'payment': return <DollarSign className="w-4 h-4 text-green-600" />;
      case 'application': return <FileText className="w-4 h-4 text-blue-600" />;
      case 'maintenance': return <Settings className="w-4 h-4 text-orange-600" />;
      case 'notice': return <Bell className="w-4 h-4 text-purple-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  // Action Handlers
  const handleNewTenant = async () => {
    setIsLoading(true);
    try {
      const result = await simulatedFunctions.setupNewTenant(newTenantForm);
      if (result.success) {
        const newTenant: Tenant = {
          id: result.tenantId,
          name: newTenantForm.name,
          email: newTenantForm.email,
          phone: newTenantForm.phone,
          property: newTenantForm.property,
          unit: newTenantForm.unit,
          rentAmount: parseFloat(newTenantForm.rentAmount),
          rentDue: new Date(newTenantForm.leaseStart).toISOString().split('T')[0],
          status: 'pending',
          leaseStart: newTenantForm.leaseStart,
          leaseEnd: newTenantForm.leaseEnd,
          deposit: parseFloat(newTenantForm.deposit),
          lastPayment: 'N/A'
        };
        setTenants(prev => [...prev, newTenant]);
        setNewTenantForm({ name: '', email: '', phone: '', property: '', unit: '', rentAmount: '', leaseStart: '', leaseEnd: '', deposit: '' });
        setShowNewTenantForm(false);
        addNotification('Tenant added successfully!', 'success');
      }
    } catch (error) {
      addNotification('Failed to add tenant', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncBank = async () => {
    setIsLoading(true);
    try {
      const result = await simulatedFunctions.syncBankData();
      addNotification(`Bank sync complete! ${result.transactions} transactions processed.`, 'success');
    } catch (error) {
      addNotification('Bank sync failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessDocuments = async () => {
    setIsLoading(true);
    try {
      const result = await simulatedFunctions.processDocuments();
      addNotification(`Document processing complete! ${result.processed} documents processed.`, 'success');
    } catch (error) {
      addNotification('Document processing failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const addNotification = (message: string, type: 'success' | 'error') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  // Filter tenants
  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.property.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Sidebar Navigation Items
  const navigationItems = [
    {
      section: 'main',
      title: 'Main',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: Home },
        { id: 'overview', label: 'Overview', icon: BarChart3 }
      ]
    },
    {
      section: 'tenants',
      title: 'Tenant Management',
      items: [
        { id: 'new-tenant', label: 'New Tenant', icon: UserPlus },
        { id: 'all-tenants', label: 'All Tenants', icon: Users },
        { id: 'applications', label: 'Applications', icon: FileText }
      ]
    },
    {
      section: 'financial',
      title: 'Financial',
      items: [
        { id: 'rent-tracking', label: 'Rent Tracking', icon: DollarSign },
        { id: 'bank-sync', label: 'Bank Sync', icon: CreditCard },
        { id: 'reports', label: 'Reports', icon: TrendingUp }
      ]
    },
    {
      section: 'automation',
      title: 'Automation',
      items: [
        { id: 'email-processing', label: 'Email Processing', icon: Mail },
        { id: 'auto-tagging', label: 'Auto-tagging', icon: Zap }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg shadow-lg border transition-all duration-300 ${
              notification.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              {notification.message}
            </div>
          </div>
        ))}
      </div>

      <div className="flex h-screen">
        {/* Sidebar - Hidden on mobile, shown as drawer */}
        <div className="hidden lg:flex w-64 bg-white shadow-xl border-r border-gray-200 flex-col">
          {/* Logo/Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl flex items-center justify-center">
                <Building className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">PropManager</h1>
                <p className="text-sm text-gray-600">Property Management</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto p-4">
            {navigationItems.map((group) => (
              <div key={group.section} className="mb-6">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  {group.title}
                </h3>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
                          isActive
                            ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-lg'
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">JD</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">John Doe</p>
                <p className="text-xs text-gray-600">Property Manager</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
          {/* Header */}
          <header className="bg-white shadow-sm border-b border-gray-200 p-4 lg:p-6">
            <div className="flex items-center justify-between">
              {/* Mobile Logo and Menu */}
              <div className="flex items-center gap-3 lg:hidden">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-500 rounded-lg flex items-center justify-center">
                  <Building className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">PropManager</h1>
                </div>
              </div>

              {/* Desktop Header Content */}
              <div className="hidden lg:block">
                <h2 className="text-2xl font-bold text-gray-900">
                  {activeSection === 'dashboard' && 'Dashboard Overview'}
                  {activeSection === 'new-tenant' && 'Add New Tenant'}
                  {activeSection === 'all-tenants' && 'All Tenants'}
                  {activeSection === 'bank-sync' && 'Bank Synchronization'}
                  {activeSection === 'email-processing' && 'Email Processing'}
                  {navigationItems.flatMap(g => g.items).find(i => i.id === activeSection)?.label || 'Dashboard'}
                </h2>
                <p className="text-gray-600 mt-1">
                  {activeSection === 'dashboard' && 'Monitor your property portfolio performance'}
                  {activeSection === 'new-tenant' && 'Set up a new tenant and lease agreement'}
                  {activeSection === 'all-tenants' && 'Manage all your tenants and their details'}
                  {activeSection === 'bank-sync' && 'Synchronize bank transactions and payments'}
                  {activeSection === 'email-processing' && 'Automate email processing and document handling'}
                </p>
              </div>

              {/* Mobile Page Title */}
              <div className="lg:hidden text-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  {navigationItems.flatMap(g => g.items).find(i => i.id === activeSection)?.label || 'Dashboard'}
                </h2>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Desktop Actions */}
                <div className="hidden lg:flex items-center gap-3">
                  <Button variant="outline" className="border-orange-200 text-orange-500 hover:bg-orange-50">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button className="bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white shadow-lg">
                    <Plus className="w-4 h-4 mr-2" />
                    Quick Action
                  </Button>
                </div>

                {/* Mobile Action - Single button */}
                <Button
                  size="sm"
                  className="lg:hidden bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white h-10 w-10 p-0 rounded-full"
                  onClick={() => setActiveSection('new-tenant')}
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </header>

          {/* Content Area */}
          <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20 lg:pb-6">
            {/* Dashboard Overview */}
            {activeSection === 'dashboard' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-600 mb-1">Total Tenants</p>
                          <p className="text-3xl font-bold text-blue-900">{stats.totalTenants}</p>
                          <p className="text-sm text-blue-700">{stats.activeTenants} active</p>
                        </div>
                        <div className="p-3 bg-blue-500 rounded-xl group-hover:bg-blue-600 transition-colors duration-300">
                          <Users className="w-8 h-8 text-white group-hover:scale-110 transition-transform duration-300" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-600 mb-1">Monthly Revenue</p>
                          <p className="text-3xl font-bold text-green-900">{formatCurrency(stats.monthlyRevenue)}</p>
                          <p className="text-sm text-green-700">From {properties.length} properties</p>
                        </div>
                        <div className="p-3 bg-green-500 rounded-xl group-hover:bg-green-600 transition-colors duration-300">
                          <DollarSign className="w-8 h-8 text-white group-hover:scale-110 transition-transform duration-300" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-orange-600 mb-1">Occupancy Rate</p>
                          <p className="text-3xl font-bold text-orange-900">{stats.occupancyRate}%</p>
                          <p className="text-sm text-orange-700">Above industry average</p>
                        </div>
                        <div className="p-3 bg-orange-400 rounded-xl group-hover:bg-orange-500 transition-colors duration-300">
                          <TrendingUp className="w-8 h-8 text-white group-hover:scale-110 transition-transform duration-300" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-red-600 mb-1">Overdue Payments</p>
                          <p className="text-3xl font-bold text-red-900">{stats.overduePayments}</p>
                          <p className="text-sm text-red-700">Requires attention</p>
                        </div>
                        <div className="p-3 bg-red-500 rounded-xl group-hover:bg-red-600 transition-colors duration-300">
                          <AlertCircle className="w-8 h-8 text-white group-hover:scale-110 transition-transform duration-300" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <Card className="hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-orange-400" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                      <Button
                        onClick={() => setActiveSection('new-tenant')}
                        className="h-20 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 hover:scale-105 text-white flex flex-col items-center justify-center gap-2 transition-all duration-300 group"
                      >
                        <UserPlus className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                        <span>Add Tenant</span>
                      </Button>
                      <Button
                        onClick={handleSyncBank}
                        disabled={isLoading}
                        className="h-20 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white flex flex-col items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <RefreshCw className="w-6 h-6 animate-spin" />
                        ) : (
                          <CreditCard className="w-6 h-6" />
                        )}
                        <span>Sync Bank</span>
                      </Button>
                      <Button
                        onClick={handleProcessDocuments}
                        disabled={isLoading}
                        className="h-20 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white flex flex-col items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <RefreshCw className="w-6 h-6 animate-spin" />
                        ) : (
                          <FileText className="w-6 h-6" />
                        )}
                        <span>Process Docs</span>
                      </Button>
                      <Button
                        onClick={() => setActiveSection('reports')}
                        className="h-20 bg-gradient-to-br from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white flex flex-col items-center justify-center gap-2"
                      >
                        <TrendingUp className="w-6 h-6" />
                        <span>Generate Report</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Layout for Recent Activity and Smart Insights */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {/* Recent Activity */}
                  <div className="xl:col-span-2">
                    <Card className="hover:shadow-lg transition-all duration-300">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="w-5 h-5 text-orange-400" />
                          Recent Activity
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {activities.slice(0, 5).map((activity) => (
                            <div key={activity.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                              <div className="p-2 bg-white rounded-lg shadow-sm">
                                {getActivityIcon(activity.type)}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{activity.description}</p>
                                {activity.tenant && (
                                  <p className="text-sm text-gray-600">Tenant: {activity.tenant}</p>
                                )}
                                {activity.amount && (
                                  <p className="text-sm font-medium text-green-600">{formatCurrency(activity.amount)}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-600">{new Date(activity.timestamp).toLocaleDateString()}</p>
                                <Badge className={`text-xs ${activity.status === 'completed' ? 'bg-green-100 text-green-800' : activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                  {activity.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Smart Insights - Up Bank style conversational UI */}
                  <div className="xl:col-span-1">
                    <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-300">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-700">
                          <TrendingUp className="w-5 h-5" />
                          Smart Insights
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Insight 1 */}
                        <div className="p-3 bg-white rounded-lg border border-orange-200">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                              <CheckCircle className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 mb-1">Great job!</p>
                              <p className="text-xs text-gray-600">Your occupancy rate is 94% - above the market average of 85%.</p>
                            </div>
                          </div>
                        </div>

                        {/* Insight 2 */}
                        <div className="p-3 bg-white rounded-lg border border-orange-200">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                              <AlertCircle className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 mb-1">Action needed</p>
                              <p className="text-xs text-gray-600 mb-2">Michael Chen's rent is 3 days overdue.</p>
                              <Button size="sm" className="text-xs h-6 bg-orange-400 hover:bg-orange-500 text-white">
                                Send reminder
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Insight 3 */}
                        <div className="p-3 bg-white rounded-lg border border-orange-200">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                              <TrendingUp className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 mb-1">Opportunity</p>
                              <p className="text-xs text-gray-600 mb-2">Consider increasing rent by 3-5% for Unit 1A when lease renews in 4 months.</p>
                              <Button size="sm" variant="outline" className="text-xs h-6 border-orange-300 text-orange-600 hover:bg-orange-50">
                                Learn more
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Progressive disclosure - Show more insights */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                        >
                          <span className="text-sm">View all insights</span>
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}

            {/* New Tenant Form */}
            {activeSection === 'new-tenant' && (
              <Card className="max-w-4xl mx-auto hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="w-6 h-6 text-orange-400" />
                    Add New Tenant
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                    <div>
                      <Label htmlFor="tenant-name">Full Name</Label>
                      <Input
                        id="tenant-name"
                        placeholder="Enter tenant's full name"
                        value={newTenantForm.name}
                        onChange={(e) => setNewTenantForm(prev => ({ ...prev, name: e.target.value }))}
                        className="border-gray-300 focus:border-orange-400 focus:ring-orange-400"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tenant-email">Email Address</Label>
                      <Input
                        id="tenant-email"
                        type="email"
                        placeholder="tenant@email.com"
                        value={newTenantForm.email}
                        onChange={(e) => setNewTenantForm(prev => ({ ...prev, email: e.target.value }))}
                        className="border-gray-300 focus:border-orange-400 focus:ring-orange-400"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tenant-phone">Phone Number</Label>
                      <Input
                        id="tenant-phone"
                        placeholder="+61 4XX XXX XXX"
                        value={newTenantForm.phone}
                        onChange={(e) => setNewTenantForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="border-gray-300 focus:border-orange-400 focus:ring-orange-400"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tenant-property">Property</Label>
                      <Select
                        value={newTenantForm.property}
                        onValueChange={(value) => setNewTenantForm(prev => ({ ...prev, property: value }))}
                      >
                        <SelectTrigger className="border-gray-300 focus:border-orange-400 focus:ring-orange-400">
                          <SelectValue placeholder="Select property" />
                        </SelectTrigger>
                        <SelectContent>
                          {properties.map((property) => (
                            <SelectItem key={property.id} value={property.address}>
                              {property.address}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="tenant-unit">Unit/Apartment</Label>
                      <Input
                        id="tenant-unit"
                        placeholder="Unit 1A"
                        value={newTenantForm.unit}
                        onChange={(e) => setNewTenantForm(prev => ({ ...prev, unit: e.target.value }))}
                        className="border-gray-300 focus:border-orange-400 focus:ring-orange-400"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tenant-rent">Weekly Rent Amount</Label>
                      <Input
                        id="tenant-rent"
                        type="number"
                        placeholder="750"
                        value={newTenantForm.rentAmount}
                        onChange={(e) => setNewTenantForm(prev => ({ ...prev, rentAmount: e.target.value }))}
                        className="border-gray-300 focus:border-orange-400 focus:ring-orange-400"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lease-start">Lease Start Date</Label>
                      <Input
                        id="lease-start"
                        type="date"
                        value={newTenantForm.leaseStart}
                        onChange={(e) => setNewTenantForm(prev => ({ ...prev, leaseStart: e.target.value }))}
                        className="border-gray-300 focus:border-orange-400 focus:ring-orange-400"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lease-end">Lease End Date</Label>
                      <Input
                        id="lease-end"
                        type="date"
                        value={newTenantForm.leaseEnd}
                        onChange={(e) => setNewTenantForm(prev => ({ ...prev, leaseEnd: e.target.value }))}
                        className="border-gray-300 focus:border-orange-400 focus:ring-orange-400"
                      />
                    </div>
                    <div className="lg:col-span-2">
                      <Label htmlFor="tenant-deposit">Security Deposit</Label>
                      <Input
                        id="tenant-deposit"
                        type="number"
                        placeholder="3000"
                        value={newTenantForm.deposit}
                        onChange={(e) => setNewTenantForm(prev => ({ ...prev, deposit: e.target.value }))}
                        className="border-gray-300 focus:border-orange-400 focus:ring-orange-400"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-4">
                    <Button variant="outline" onClick={() => setActiveSection('dashboard')}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleNewTenant}
                      disabled={isLoading || !newTenantForm.name || !newTenantForm.email}
                      className="bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Setting up...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Tenant
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* All Tenants */}
            {activeSection === 'all-tenants' && (
              <div className="space-y-6">
                {/* Search and Filters */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            placeholder="Search tenants or properties..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 border-gray-300 focus:border-orange-400 focus:ring-orange-400"
                          />
                        </div>
                      </div>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-48 border-gray-300 focus:border-orange-400 focus:ring-orange-400">
                          <Filter className="w-4 h-4 mr-2" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="notice">Notice</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Tenants Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                  {filteredTenants.map((tenant) => (
                    <Card key={tenant.id} className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                              {tenant.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 group-hover:text-orange-500 transition-colors">
                                {tenant.name}
                              </h3>
                              <p className="text-sm text-gray-600">{tenant.email}</p>
                            </div>
                          </div>
                          <Badge className={getStatusColor(tenant.status)}>
                            {tenant.status}
                          </Badge>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">{tenant.property}, {tenant.unit}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{formatCurrency(tenant.rentAmount)}/week</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">Due: {formatDate(tenant.rentDue)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">{tenant.phone}</span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="text-orange-500 border-orange-200 hover:bg-orange-50">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500">
                            Last payment: {tenant.lastPayment !== 'N/A' ? formatDate(tenant.lastPayment) : 'N/A'}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Other Sections - Conversational UI */}
            {!['dashboard', 'new-tenant', 'all-tenants'].includes(activeSection) && (
              <div className="space-y-6">
                {/* Coming Soon with Progress */}
                <Card className="text-center py-16 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                  <CardContent>
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                      <Settings className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      {navigationItems.flatMap(g => g.items).find(i => i.id === activeSection)?.label} is coming soon!
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-lg mx-auto text-lg">
                      We're working hard to bring you the best {navigationItems.flatMap(g => g.items).find(i => i.id === activeSection)?.label?.toLowerCase()} experience.
                      While you wait, here's what you can do:
                    </p>

                    {/* Progress indication */}
                    <div className="max-w-md mx-auto mb-8">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Development Progress</span>
                        <span>75%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-gradient-to-r from-orange-400 to-orange-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                    </div>

                    {/* Suggested actions */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
                      <div className="p-4 bg-white rounded-lg border border-orange-200">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                          <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">Manage Tenants</h4>
                        <p className="text-sm text-gray-600 mb-3">Add and organize your tenant information</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setActiveSection('all-tenants')}
                          className="border-blue-200 text-blue-600 hover:bg-blue-50"
                        >
                          View Tenants
                        </Button>
                      </div>

                      <div className="p-4 bg-white rounded-lg border border-orange-200">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                          <UserPlus className="w-6 h-6 text-green-600" />
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">Add New Tenant</h4>
                        <p className="text-sm text-gray-600 mb-3">Set up a new tenant quickly</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setActiveSection('new-tenant')}
                          className="border-green-200 text-green-600 hover:bg-green-50"
                        >
                          Add Tenant
                        </Button>
                      </div>

                      <div className="p-4 bg-white rounded-lg border border-orange-200">
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                          <Home className="w-6 h-6 text-orange-600" />
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">Dashboard</h4>
                        <p className="text-sm text-gray-600 mb-3">See your portfolio overview</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setActiveSection('dashboard')}
                          className="border-orange-200 text-orange-600 hover:bg-orange-50"
                        >
                          View Dashboard
                        </Button>
                      </div>
                    </div>

                    {/* Up Bank style conversational element */}
                    <div className="max-w-md mx-auto p-4 bg-white rounded-lg border border-orange-200">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-sm font-bold">💡</span>
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900 mb-1">Tip:</p>
                          <p className="text-xs text-gray-600">Want to be notified when this feature launches? Set up notifications in your profile settings.</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation - Up Bank Style */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="grid grid-cols-5 h-16">
          {navigationItems.slice(0, 2).flatMap(group => group.items).slice(0, 4).map((item, index) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`flex flex-col items-center justify-center gap-1 px-2 py-2 transition-all duration-200 ${
                  isActive
                    ? 'text-orange-500'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium truncate">{item.label}</span>
              </button>
            );
          })}
          {/* Action Button - Up Bank style circular action */}
          <button
            onClick={() => setActiveSection('new-tenant')}
            className="flex flex-col items-center justify-center gap-1 px-2 py-2 text-white relative"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg absolute -top-2">
              <Plus className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-transparent mt-8">Add</span>
          </button>
        </div>
      </div>

      {/* Mobile Content Padding */}
      <div className="lg:hidden h-16" />

      {/* Up Bank Style Floating Assistant */}
      <div className="fixed bottom-20 lg:bottom-6 right-6 z-40">
        {showAssistant && (
          <div className="mb-4 w-80 bg-white rounded-2xl shadow-2xl border border-orange-200 overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
            <div className="p-4 bg-gradient-to-r from-orange-400 to-orange-500 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold">🤖</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">PropBot Assistant</h4>
                    <p className="text-xs text-white/80">Here to help</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowAssistant(false)}
                  className="h-6 w-6 p-0 text-white hover:bg-white/20"
                >
                  ×
                </Button>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700 mb-2">
                  👋 Hi! I noticed you're viewing the {navigationItems.flatMap(g => g.items).find(i => i.id === activeSection)?.label?.toLowerCase()} section.
                </p>
                <p className="text-xs text-gray-600">
                  {activeSection === 'dashboard' && "Your portfolio looks healthy! Would you like me to highlight any areas needing attention?"}
                  {activeSection === 'new-tenant' && "Setting up a new tenant? I can help you complete the form quickly and ensure all required information is included."}
                  {activeSection === 'all-tenants' && "Need help finding a specific tenant or updating their details? I can guide you through the process."}
                  {!['dashboard', 'new-tenant', 'all-tenants'].includes(activeSection) && "This feature is coming soon! In the meantime, I can help you with tenant management or show you around the dashboard."}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 text-xs h-8 bg-orange-400 hover:bg-orange-500 text-white">
                  Get Help
                </Button>
                <Button size="sm" variant="outline" className="flex-1 text-xs h-8 border-orange-200 text-orange-600 hover:bg-orange-50">
                  Quick Tour
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Assistant Toggle Button */}
        <Button
          onClick={() => setShowAssistant(!showAssistant)}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white shadow-2xl hover:scale-110 transition-all duration-300 group"
        >
          <div className="flex flex-col items-center">
            <span className="text-lg group-hover:animate-bounce">🤖</span>
            <span className="text-xs font-medium">Help</span>
          </div>
        </Button>
      </div>
    </div>
  );
}