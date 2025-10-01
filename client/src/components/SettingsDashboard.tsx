import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import {
  Shield,
  Zap,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  ExternalLink,
  Clock,
  Activity,
  Settings as SettingsIcon,
  Plus,
  X
} from "lucide-react";
import { UpBankApiClient } from "../services/UpBankApiClient";
import type { ApiSettings, SettingsState, UpBankAccount } from "../types/AutoTagTypes";

interface SettingsDashboardProps {
  className?: string;
}

export function SettingsDashboard({ className = "" }: SettingsDashboardProps) {
  const [state, setState] = useState<SettingsState>({
    apiSettings: {
      upBankToken: '',
      webhookSecret: '',
      autoSync: false,
      syncInterval: 15,
      autoTagEnabled: false,
      transferDetection: true
    },
    loading: false,
    connectionStatus: 'disconnected'
  });

  const [upBankClient, setUpBankClient] = useState<UpBankApiClient | null>(null);
  const [accounts, setAccounts] = useState<UpBankAccount[]>([]);
  const [tokenVisible, setTokenVisible] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // Webhook management state
  const [webhookStatus, setWebhookStatus] = useState<any>(null);
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [showWebhookLogs, setShowWebhookLogs] = useState(false);

  // Banks configuration
  const [banks, setBanks] = useState<any[]>([]);
  const [newBank, setNewBank] = useState({ name: '', bankType: 'up_bank', apiToken: '', enabled: true });
  const [showAddBank, setShowAddBank] = useState(false);

  // Load settings and banks on mount
  useEffect(() => {
    loadSettings();
    loadBanks();
    loadWebhookStatus();
  }, []);

  // Initialize UP Bank client when token changes
  useEffect(() => {
    if (state.apiSettings.upBankToken && state.apiSettings.upBankToken.trim() !== '') {
      try {
        console.log('🔄 Creating UP Bank client with token:', state.apiSettings.upBankToken.substring(0, 15) + '...');
        const client = new UpBankApiClient(state.apiSettings.upBankToken);
        setUpBankClient(client);
        console.log('✅ UP Bank client created successfully');
      } catch (error) {
        console.error('❌ Failed to create UP Bank client:', error);
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to initialize UP Bank client',
          connectionStatus: 'error'
        }));
        setUpBankClient(null);
      }
    } else {
      setUpBankClient(null);
    }
  }, [state.apiSettings.upBankToken]);

  const loadSettings = async () => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      // First try to load from localStorage for quick access
      const cachedToken = localStorage.getItem('upBankToken');

      const response = await fetch('/api/settings');
      const result = await response.json();

      if (result.success) {
        // Use server token if available, otherwise fall back to cached
        const finalToken = result.data.apiSettings.upBankToken || cachedToken || '';

        setState(prev => ({
          ...prev,
          apiSettings: {
            ...prev.apiSettings,
            ...result.data.apiSettings,
            upBankToken: finalToken
          },
          lastSync: result.data.lastSync ? new Date(result.data.lastSync) : undefined,
          loading: false
        }));

        // Cache token in localStorage if we got it from server
        if (result.data.apiSettings.upBankToken) {
          localStorage.setItem('upBankToken', result.data.apiSettings.upBankToken);
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);

      // Fall back to cached token if server fails
      const cachedToken = localStorage.getItem('upBankToken');
      if (cachedToken) {
        setState(prev => ({
          ...prev,
          apiSettings: {
            ...prev.apiSettings,
            upBankToken: cachedToken
          },
          loading: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load settings'
        }));
      }
    }
  };

  const saveSettings = async () => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiSettings: state.apiSettings
        }),
      });

      const result = await response.json();

      if (result.success) {
        setUnsavedChanges(false);
        setState(prev => ({
          ...prev,
          loading: false,
          error: undefined
        }));

        // Cache token in localStorage
        if (state.apiSettings.upBankToken) {
          localStorage.setItem('upBankToken', state.apiSettings.upBankToken);
          testConnection();
        }
      } else {
        throw new Error(result.error || 'Failed to save settings');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to save settings'
      }));
    }
  };

  const testConnection = async () => {
    const currentToken = state.apiSettings.upBankToken?.trim();

    if (!currentToken) {
      setState(prev => ({
        ...prev,
        connectionStatus: 'error',
        error: 'Please enter a UP Bank token first'
      }));
      return;
    }

    setTestingConnection(true);
    setState(prev => ({ ...prev, connectionStatus: 'connecting', error: undefined }));

    try {
      console.log('🧪 Testing connection with token:', currentToken.substring(0, 15) + '...');

      // Create a fresh client for testing to ensure we're using the latest token
      const testClient = new UpBankApiClient(currentToken);
      const result = await testClient.testConnection();

      if (result.success && result.accounts) {
        setAccounts(result.accounts);
        setState(prev => ({
          ...prev,
          connectionStatus: 'connected',
          error: undefined
        }));
        console.log('✅ Connection test successful, found', result.accounts.length, 'accounts');
      } else {
        throw new Error(result.error || 'Connection test failed');
      }
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      setState(prev => ({
        ...prev,
        connectionStatus: 'error',
        error: error instanceof Error ? error.message : 'Connection failed'
      }));
      setAccounts([]);
    } finally {
      setTestingConnection(false);
    }
  };

  const updateSetting = (key: keyof ApiSettings, value: any) => {
    setState(prev => ({
      ...prev,
      apiSettings: {
        ...prev.apiSettings,
        [key]: value
      }
    }));
    setUnsavedChanges(true);
  };

  const getConnectionStatusBadge = () => {
    switch (state.connectionStatus) {
      case 'connected':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Connected
          </Badge>
        );
      case 'connecting':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Connecting...
          </Badge>
        );
      case 'error':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Disconnected
          </Badge>
        );
    }
  };

  const formatLastSync = () => {
    if (!state.lastSync) return 'Never';
    const now = new Date();
    const diff = now.getTime() - state.lastSync.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;

    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;

    return state.lastSync.toLocaleDateString();
  };

  const triggerManualSync = async () => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      const response = await fetch('/api/sync/pull', {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        setState(prev => ({
          ...prev,
          loading: false,
          lastSync: new Date()
        }));
      } else {
        throw new Error(result.error || 'Sync failed');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Sync failed'
      }));
    }
  };

  const loadBanks = async () => {
    try {
      const response = await fetch('/api/banks');
      const result = await response.json();
      console.log('Load banks response:', result);
      if (result.success) {
        console.log('Setting banks state to:', result.data);
        setBanks(result.data);
      }
    } catch (error) {
      console.error('Failed to load banks:', error);
    }
  };

  const addBank = async () => {
    try {
      console.log('Adding bank:', newBank);
      const response = await fetch('/api/banks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBank)
      });
      const result = await response.json();
      console.log('Add bank response:', result);
      if (result.success) {
        // Reload banks from server to ensure sync
        await loadBanks();
        setNewBank({ name: '', bankType: 'up_bank', apiToken: '', enabled: true });
        setShowAddBank(false);
      }
    } catch (error) {
      console.error('Failed to add bank:', error);
    }
  };

  const toggleBankEnabled = async (bankId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/banks/${bankId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      const result = await response.json();
      if (result.success) {
        setBanks(banks.map(b => b.id === bankId ? { ...b, enabled } : b));
      }
    } catch (error) {
      console.error('Failed to update bank:', error);
    }
  };

  const deleteBank = async (bankId: string) => {
    try {
      const response = await fetch(`/api/banks/${bankId}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      if (result.success) {
        setBanks(banks.filter(b => b.id !== bankId));
      }
    } catch (error) {
      console.error('Failed to delete bank:', error);
    }
  };

  // Webhook management functions
  const loadWebhookStatus = async () => {
    try {
      const response = await fetch('/api/webhooks/status');
      const result = await response.json();
      if (result.success) {
        setWebhookStatus(result.data);
      }
    } catch (error) {
      console.error('Failed to load webhook status:', error);
    }
  };

  const setupWebhook = async () => {
    setWebhookLoading(true);
    try {
      const response = await fetch('/api/webhooks/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: `${window.location.origin}/api/webhooks/up-bank`
        })
      });
      const result = await response.json();
      if (result.success) {
        await loadWebhookStatus();
        setState(prev => ({ ...prev, error: undefined }));
      } else {
        setState(prev => ({ ...prev, error: result.error || 'Failed to setup webhook' }));
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to setup webhook' }));
    } finally {
      setWebhookLoading(false);
    }
  };

  const testWebhook = async () => {
    setWebhookLoading(true);
    try {
      const response = await fetch('/api/webhooks/test', { method: 'POST' });
      const result = await response.json();
      if (result.success) {
        setState(prev => ({ ...prev, error: undefined }));
        alert('Webhook ping sent successfully! Check delivery logs.');
      } else {
        setState(prev => ({ ...prev, error: result.error || 'Failed to test webhook' }));
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to test webhook' }));
    } finally {
      setWebhookLoading(false);
    }
  };

  const deleteWebhook = async () => {
    setWebhookLoading(true);
    try {
      const response = await fetch('/api/webhooks', { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        await loadWebhookStatus();
        setState(prev => ({ ...prev, error: undefined }));
      } else {
        setState(prev => ({ ...prev, error: result.error || 'Failed to delete webhook' }));
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to delete webhook' }));
    } finally {
      setWebhookLoading(false);
    }
  };

  const loadWebhookLogs = async () => {
    try {
      const response = await fetch('/api/webhooks/logs');
      const result = await response.json();
      if (result.success) {
        setWebhookLogs(result.data);
      }
    } catch (error) {
      console.error('Failed to load webhook logs:', error);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <SettingsIcon className="w-6 h-6 mr-2" />
            Settings & API Configuration
          </h1>
          <p className="text-gray-600">Configure UP Bank API integration and automation settings</p>
        </div>
        {unsavedChanges && (
          <Button onClick={saveSettings} disabled={state.loading}>
            {state.loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Shield className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        )}
      </div>

      {/* Error Display */}
      {state.error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-800">{state.error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* UP Bank API Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="w-5 h-5 mr-2 text-orange-500" />
                UP Bank API Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* API Token */}
              <div>
                <Label htmlFor="upBankToken">Personal Access Token</Label>
                <div className="flex gap-2 mt-1">
                  <div className="relative flex-1">
                    <Input
                      id="upBankToken"
                      type={tokenVisible ? "text" : "password"}
                      value={state.apiSettings.upBankToken}
                      onChange={(e) => {
                        const value = e.target.value.trim();
                        updateSetting('upBankToken', value);

                        // Clear any existing error when user types
                        if (state.error && state.error.includes('token')) {
                          setState(prev => ({
                            ...prev,
                            error: undefined,
                            connectionStatus: 'disconnected'
                          }));
                        }
                      }}
                      placeholder="up:yeah:..."
                      className={`pr-10 ${
                        state.apiSettings.upBankToken && !state.apiSettings.upBankToken.startsWith('up:yeah:')
                          ? 'border-red-300 focus:border-red-500'
                          : ''
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setTokenVisible(!tokenVisible)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {tokenVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <Button
                    onClick={testConnection}
                    disabled={!state.apiSettings.upBankToken || testingConnection}
                    size="sm"
                  >
                    {testingConnection ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Test
                  </Button>
                </div>
                <div className="mt-1">
                  <p className="text-xs text-gray-500">
                    Get your token from{" "}
                    <a
                      href="https://api.up.com.au"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700 inline-flex items-center"
                    >
                      api.up.com.au
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </p>
                  {state.apiSettings.upBankToken &&
                   !state.apiSettings.upBankToken.startsWith('up:yeah:') && (
                    <p className="text-xs text-red-500 mt-1">
                      ⚠️ Token should start with "up:yeah:"
                    </p>
                  )}
                  {state.apiSettings.upBankToken &&
                   state.apiSettings.upBankToken.startsWith('up:yeah:') &&
                   state.apiSettings.upBankToken.length < 120 && (
                    <p className="text-xs text-yellow-500 mt-1">
                      ⚠️ Token seems too short (should be 120+ characters)
                    </p>
                  )}
                  {state.apiSettings.upBankToken &&
                   state.apiSettings.upBankToken.startsWith('up:yeah:') &&
                   state.apiSettings.upBankToken.length >= 120 && (
                    <p className="text-xs text-green-500 mt-1">
                      ✅ Token format looks correct
                    </p>
                  )}
                </div>
              </div>

              {/* Connection Status */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Connection Status</span>
                {getConnectionStatusBadge()}
              </div>

              {/* Webhook Secret */}
              <div>
                <Label htmlFor="webhookSecret">Webhook Secret (Optional)</Label>
                <Input
                  id="webhookSecret"
                  type="password"
                  value={state.apiSettings.webhookSecret}
                  onChange={(e) => updateSetting('webhookSecret', e.target.value)}
                  placeholder="Optional webhook verification secret"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Used for webhook signature verification for enhanced security
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Webhook Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2 text-purple-500" />
                Webhook Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Webhooks enable real-time transaction sync with minimal API calls. Instead of polling for new transactions, UP Bank will notify your app instantly when events occur.
              </p>

              {/* Webhook Status */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Webhook Status</span>
                {webhookStatus?.configured ? (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Configured
                  </Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Not Configured
                  </Badge>
                )}
              </div>

              {/* Webhook URL */}
              {webhookStatus?.configured && (
                <div>
                  <Label>Webhook URL</Label>
                  <Input
                    value={webhookStatus.url || ''}
                    readOnly
                    className="bg-gray-50 text-xs"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Last event: {webhookStatus.lastProcessed ? new Date(webhookStatus.lastProcessed).toLocaleString() : 'Never'}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                {!webhookStatus?.configured ? (
                  <Button
                    onClick={setupWebhook}
                    disabled={!state.apiSettings.upBankToken || webhookLoading}
                    size="sm"
                  >
                    {webhookLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4 mr-2" />
                    )}
                    Setup Webhook
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={testWebhook}
                      disabled={webhookLoading}
                      size="sm"
                      variant="outline"
                    >
                      {webhookLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Activity className="w-4 h-4 mr-2" />
                      )}
                      Test Webhook
                    </Button>
                    <Button
                      onClick={() => {
                        setShowWebhookLogs(!showWebhookLogs);
                        if (!showWebhookLogs) loadWebhookLogs();
                      }}
                      size="sm"
                      variant="outline"
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      {showWebhookLogs ? 'Hide' : 'View'} Logs
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Webhook?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove the webhook from UP Bank and disable real-time sync. You can set it up again later.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={deleteWebhook}
                          >
                            Delete Webhook
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </div>

              {/* Environment-specific instructions */}
              {!webhookStatus?.configured && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                  {window.location.hostname.includes('app.github.dev') ? (
                    <>
                      <strong>✅ GitHub Codespaces Detected</strong>
                      <p className="mt-1">
                        Your webhook URL will be automatically configured.
                        <br />
                        <strong>Important:</strong> Ensure port 5000 is set to <strong>Public</strong> in the VS Code PORTS tab.
                      </p>
                      <p className="mt-1 font-mono text-xs bg-blue-100 p-1 rounded">
                        {window.location.origin}/api/webhooks/up-bank
                      </p>
                    </>
                  ) : (
                    <>
                      ⚠️ <strong>Development Note:</strong> Webhooks require a public HTTPS URL. On localhost, use ngrok or deploy to a server with a public URL.
                    </>
                  )}
                </div>
              )}

              {/* Webhook Logs */}
              {showWebhookLogs && (
                <div>
                  <Label>Recent Webhook Deliveries</Label>
                  <div className="border rounded-lg overflow-auto max-h-64 mt-2">
                    {webhookLogs.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        No webhook deliveries yet
                      </div>
                    ) : (
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium">Event</th>
                            <th className="px-3 py-2 text-left font-medium">Status</th>
                            <th className="px-3 py-2 text-left font-medium">Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {webhookLogs.map((log: any, i: number) => (
                            <tr key={i} className="border-t">
                              <td className="px-3 py-2">{log.attributes?.eventType || 'Unknown'}</td>
                              <td className="px-3 py-2">
                                {log.attributes?.deliveryStatus === 'DELIVERED' ? (
                                  <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                                    Delivered
                                  </Badge>
                                ) : (
                                  <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                                    Failed
                                  </Badge>
                                )}
                              </td>
                              <td className="px-3 py-2">
                                {log.attributes?.createdAt ? new Date(log.attributes.createdAt).toLocaleString() : 'Unknown'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Automation Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <RefreshCw className="w-5 h-5 mr-2 text-blue-500" />
                Automation Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Auto Sync */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoSync">Automatic Sync</Label>
                  <p className="text-xs text-gray-500">
                    Automatically sync transactions from UP Bank
                  </p>
                </div>
                <Switch
                  id="autoSync"
                  checked={state.apiSettings.autoSync}
                  onCheckedChange={(checked) => updateSetting('autoSync', checked)}
                />
              </div>

              {/* Sync Interval */}
              {state.apiSettings.autoSync && (
                <div>
                  <Label htmlFor="syncInterval">Sync Interval</Label>
                  <Select
                    value={state.apiSettings.syncInterval.toString()}
                    onValueChange={(value) => updateSetting('syncInterval', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">Every 5 minutes</SelectItem>
                      <SelectItem value="15">Every 15 minutes</SelectItem>
                      <SelectItem value="30">Every 30 minutes</SelectItem>
                      <SelectItem value="60">Every hour</SelectItem>
                      <SelectItem value="240">Every 4 hours</SelectItem>
                      <SelectItem value="1440">Daily</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Separator />

              {/* Auto-tag */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoTagEnabled">Auto-tag New Transactions</Label>
                  <p className="text-xs text-gray-500">
                    Automatically apply rules to new transactions
                  </p>
                </div>
                <Switch
                  id="autoTagEnabled"
                  checked={state.apiSettings.autoTagEnabled}
                  onCheckedChange={(checked) => updateSetting('autoTagEnabled', checked)}
                />
              </div>

              {/* Transfer Detection */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="transferDetection">Transfer Detection</Label>
                  <p className="text-xs text-gray-500">
                    Automatically detect and create dual entries for transfers
                  </p>
                </div>
                <Switch
                  id="transferDetection"
                  checked={state.apiSettings.transferDetection}
                  onCheckedChange={(checked) => updateSetting('transferDetection', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status & Information Column */}
        <div className="space-y-6">
          {/* Sync Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-sm">
                <Activity className="w-4 h-4 mr-2" />
                Sync Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span>Last Sync</span>
                <div className="flex items-center">
                  <Clock className="w-3 h-3 mr-1 text-gray-400" />
                  <span className="text-gray-600">{formatLastSync()}</span>
                </div>
              </div>

              <Button
                onClick={triggerManualSync}
                disabled={!state.apiSettings.upBankToken || state.loading}
                size="sm"
                className="w-full"
              >
                {state.loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Sync Now
              </Button>

              {upBankClient && (
                <div className="text-xs text-gray-500 mt-2">
                  <div>Rate Limit: {upBankClient.getRateLimitInfo()?.remaining || 'Unknown'} remaining</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Connected Accounts */}
          {accounts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  Connected Accounts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    className="p-2 bg-gray-50 rounded-lg text-sm"
                  >
                    <div className="font-medium">{account.attributes?.displayName}</div>
                    <div className="text-gray-500 text-xs">{account.attributes?.accountType}</div>
                    <div className="font-semibold text-green-600">
                      ${((account.attributes?.balance?.valueInBaseUnits ?? 0) / 100).toFixed(2)}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Danger Zone */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center text-sm text-red-600">
                <AlertCircle className="w-4 h-4 mr-2" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="w-full">
                    Clear All Settings
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear All Settings?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove all API tokens, webhook configurations, and automation settings.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-red-600 hover:bg-red-700">
                      Clear Settings
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          {/* Banks Configuration Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Banks Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Configure multiple banks for transaction imports and sync.
              </p>

              {/* Banks List */}
              <div className="space-y-2">
                {banks.map((bank) => (
                  <div key={bank.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex-1">
                        <div className="font-medium">
                          {bank.bankType === 'up_bank' ? 'UP Bank' :
                           bank.bankType === 'commbank' ? 'CommBank' :
                           bank.bankType === 'nab' ? 'NAB' :
                           bank.bankType === 'anz' ? 'ANZ' :
                           bank.bankType === 'westpac' ? 'Westpac' : bank.bankType} - {bank.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {bank.apiToken ? 'API configured' : 'Manual entry only'}
                        </div>
                      </div>
                      {bank.enabled ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800 border-gray-200">Inactive</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={bank.enabled}
                        onCheckedChange={(checked) => toggleBankEnabled(bank.id, checked)}
                      />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-800 hover:bg-red-50">
                            <X className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Bank?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove {bank.name} from your configuration. Existing transactions will not be affected.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => deleteBank(bank.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}

                {banks.length === 0 && (
                  <div className="text-center py-6 text-gray-500 text-sm">
                    No banks configured yet. Add your first bank below.
                  </div>
                )}
              </div>

              {/* Add Bank Form */}
              {showAddBank && (
                <div className="p-4 border rounded-lg space-y-3 bg-white">
                  <div>
                    <Label>Bank Type</Label>
                    <Select
                      value={newBank.bankType}
                      onValueChange={(value) => setNewBank({ ...newBank, bankType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="up_bank">UP Bank</SelectItem>
                        <SelectItem value="commbank">CommBank</SelectItem>
                        <SelectItem value="nab">NAB</SelectItem>
                        <SelectItem value="anz">ANZ</SelectItem>
                        <SelectItem value="westpac">Westpac</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">Select which bank this account belongs to</p>
                  </div>
                  <div>
                    <Label>Account Name</Label>
                    <Input
                      value={newBank.name}
                      onChange={(e) => setNewBank({ ...newBank, name: e.target.value })}
                      placeholder="e.g., Spending, Savings, Bills"
                    />
                    <p className="text-xs text-gray-500 mt-1">A friendly name for this account</p>
                  </div>
                  {newBank.bankType === 'up_bank' && (
                    <div>
                      <Label>API Token</Label>
                      <Input
                        type="password"
                        value={newBank.apiToken}
                        onChange={(e) => setNewBank({ ...newBank, apiToken: e.target.value })}
                        placeholder="Enter UP Bank API token"
                      />
                      <p className="text-xs text-gray-500 mt-1">Required for automatic transaction sync</p>
                    </div>
                  )}
                  {newBank.bankType !== 'up_bank' && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                      ℹ️ Only UP Bank supports API sync currently. Other banks require manual CSV import.
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button onClick={addBank} disabled={!newBank.name || !newBank.bankType}>
                      Add Bank
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddBank(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {!showAddBank && (
                <Button onClick={() => setShowAddBank(true)} variant="outline" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Bank
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}