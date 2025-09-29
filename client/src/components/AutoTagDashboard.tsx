import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Tags,
  Plus,
  Edit,
  Trash2,
  Zap,
  Target,
  CheckCircle,
  AlertCircle,
  Search,
  Play,
  BarChart3,
  Clock,
  TrendingUp,
  Eye,
  Settings,
  Download,
  Upload,
  RefreshCw
} from "lucide-react";

import {
  AutoTagRule,
  Transaction,
  SearchCriteria,
  CreateRuleForm,
  AutoTagPreview,
  AutoTagResults,
  DYNAMIC_TAG_PATTERNS
} from "../types/AutoTagTypes";
import { AutoTagEngine } from "../utils/AutoTagEngine";
import {
  generateMockTransactions,
  generateMockAutoTagRules,
  calculateAutoTagAnalytics,
  formatCurrency,
  formatDate,
  formatRelativeTime,
  getPerformanceColor,
  getStatusBadgeVariant,
  getSuggestedTags,
  getSuggestedCategory,
  generateRuleId
} from "../utils/AutoTagHelpers";

// Categories and account options
const CATEGORIES = [
  'rental', 'mortgage', 'utilities', 'groceries', 'entertainment',
  'transport', 'insurance', 'maintenance', 'subscriptions', 'healthcare',
  'business', 'shopping', 'dining', 'education', 'travel'
];

const ACCOUNTS = ['Up', 'BOQ', 'WestPac', 'Cash', 'ANZ Saver', 'ANZ Mortgage'];

const CONDITION_TYPES = [
  { value: 'description_contains', label: 'Description contains' },
  { value: 'description_equals', label: 'Description equals' },
  { value: 'amount_equals', label: 'Amount equals' },
  { value: 'amount_greater_than', label: 'Amount greater than' },
  { value: 'amount_less_than', label: 'Amount less than' },
  { value: 'account_equals', label: 'Account equals' },
  { value: 'category_equals', label: 'Category equals' }
];

export function AutoTagDashboard() {
  // State management
  const [rules, setRules] = useState<AutoTagRule[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [autoTagEngine] = useState(() => new AutoTagEngine());
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<AutoTagPreview[]>([]);
  const [results, setResults] = useState<AutoTagResults | null>(null);

  // Rule creation form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRule, setEditingRule] = useState<AutoTagRule | null>(null);
  const [createForm, setCreateForm] = useState<CreateRuleForm>({
    name: '',
    status: 'active',
    searchCriteria: {},
    applyCriteria: {}
  });

  // Search and preview
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({});
  const [showDynamicTagHelp, setShowDynamicTagHelp] = useState(false);

  // Initialize data
  useEffect(() => {
    const mockRules = generateMockAutoTagRules();
    const mockTransactions = generateMockTransactions();
    setRules(mockRules);
    setTransactions(mockTransactions);
  }, []);

  // Calculate analytics
  const analytics = calculateAutoTagAnalytics(rules, transactions);

  // Handle rule toggle
  const toggleRule = (ruleId: string) => {
    setRules(prev => prev.map(rule =>
      rule.id === ruleId
        ? { ...rule, status: rule.status === 'active' ? 'inactive' : 'active' }
        : rule
    ));
  };

  // Handle rule deletion
  const deleteRule = (ruleId: string) => {
    if (confirm('Are you sure you want to delete this rule?')) {
      setRules(prev => prev.filter(rule => rule.id !== ruleId));
    }
  };

  // Handle search and preview
  const handleSearchPreview = () => {
    setIsLoading(true);
    try {
      const matchingTransactions = autoTagEngine.searchTransactions(transactions, searchCriteria);
      setPreview(matchingTransactions.slice(0, 20).map(transaction => ({
        transaction,
        matchedRules: [],
        proposedChanges: {
          currentCategory: transaction.category,
          currentTags: transaction.tags ? transaction.tags.split(',').map(t => t.trim()) : [],
          newTags: [],
          tagsToRemove: [],
          tagsToAdd: []
        },
        matchScore: 100
      })));
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle rule creation
  const handleCreateRule = () => {
    const validation = autoTagEngine.validateRule(createForm);
    if (!validation.isValid) {
      alert('Validation failed:\n' + validation.errors.join('\n'));
      return;
    }

    const newRule: AutoTagRule = {
      ...createForm,
      id: generateRuleId(),
      createdDate: new Date(),
      matches: 0,
      performance: {
        totalMatches: 0,
        successfulApplications: 0,
        failedApplications: 0,
        averageProcessingTime: 0,
        lastRunDuration: 0,
        efficiency: 0
      }
    };

    setRules(prev => [...prev, newRule]);
    setCreateForm({
      name: '',
      status: 'active',
      searchCriteria: {},
      applyCriteria: {}
    });
    setShowCreateForm(false);
  };

  // Handle running all rules
  const handleRunAllRules = async () => {
    setIsLoading(true);
    try {
      const result = await autoTagEngine.runAutoTagRules(transactions, rules);
      setResults(result);

      // Update rules with new performance data
      setRules(prev => prev.map(rule => {
        const ruleResult = result.rulesApplied.find(r => r.ruleId === rule.id);
        if (ruleResult) {
          return {
            ...rule,
            matches: ruleResult.matches,
            lastRun: new Date()
          };
        }
        return rule;
      }));

      alert(`AutoTag complete! ${result.totalUpdated} transactions updated.`);
    } catch (error) {
      console.error('AutoTag failed:', error);
      alert('AutoTag failed: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle rule preview
  const handleRulePreview = (rule: AutoTagRule) => {
    const preview = autoTagEngine.previewRuleApplication(transactions, rule);
    setPreview(preview);
    setActiveTab('preview');
  };

  // Auto-suggest tags and category
  const handleDescriptionChange = (description: string) => {
    setCreateForm(prev => ({
      ...prev,
      searchCriteria: { ...prev.searchCriteria, description }
    }));

    // Auto-suggest category and tags
    if (description.length > 3) {
      const suggestedCategory = getSuggestedCategory(description);
      const suggestedTags = getSuggestedTags(description);

      if (suggestedCategory && !createForm.applyCriteria.category) {
        setCreateForm(prev => ({
          ...prev,
          applyCriteria: { ...prev.applyCriteria, category: suggestedCategory }
        }));
      }

      if (suggestedTags.length > 0 && !createForm.applyCriteria.tags) {
        setCreateForm(prev => ({
          ...prev,
          applyCriteria: { ...prev.applyCriteria, tags: suggestedTags.join(', ') }
        }));
      }
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AutoTag System</h1>
          <p className="text-gray-600">Automatically categorize and tag your transactions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSearchPreview} disabled={isLoading}>
            <Search className="w-4 h-4 mr-2" />
            Search & Preview
          </Button>
          <Button onClick={handleRunAllRules} disabled={isLoading} className="bg-blue-500 hover:bg-blue-600">
            <Play className="w-4 h-4 mr-2" />
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Run All Rules'}
          </Button>
          <Button onClick={() => setShowCreateForm(true)} className="bg-green-500 hover:bg-green-600">
            <Plus className="w-4 h-4 mr-2" />
            Create Rule
          </Button>
        </div>
      </div>

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
              Active Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{analytics.activeRules}</div>
            <p className="text-xs text-gray-600">of {analytics.totalRules} total</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Target className="w-4 h-4 mr-2 text-blue-600" />
              Automation Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{analytics.automationRate}%</div>
            <p className="text-xs text-gray-600">{analytics.totalTransactionsTagged} auto-tagged</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <BarChart3 className="w-4 h-4 mr-2 text-purple-600" />
              Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{analytics.categoryDistribution.length}</div>
            <p className="text-xs text-gray-600">active categories</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Clock className="w-4 h-4 mr-2 text-orange-600" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{analytics.recentActivity.length}</div>
            <p className="text-xs text-gray-600">recent matches</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rules">Rules Management</TabsTrigger>
          <TabsTrigger value="search">Search & Preview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Top Performing Rules */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Top Performing Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.topPerformingRules.slice(0, 5).map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant={getStatusBadgeVariant(rule.status)}>
                        {rule.status}
                      </Badge>
                      <div>
                        <p className="font-medium">{rule.name}</p>
                        <p className="text-sm text-gray-600">
                          {rule.matches} matches • {formatRelativeTime(rule.lastRun || rule.createdDate)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${getPerformanceColor(rule.performance?.efficiency || 0)}`}>
                        {rule.performance?.efficiency || 0}%
                      </p>
                      <p className="text-xs text-gray-600">efficiency</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent AutoTag Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analytics.recentActivity.slice(0, 10).map((activity, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{activity.ruleName}</p>
                      <p className="text-sm text-gray-600">{activity.changes.join(', ')}</p>
                    </div>
                    <div className="text-right text-sm text-gray-600">
                      {formatRelativeTime(activity.date)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rules Management Tab */}
        <TabsContent value="rules" className="space-y-6">
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tags className="w-5 h-5" />
                AutoTag Rules ({rules.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule</TableHead>
                    <TableHead>Conditions</TableHead>
                    <TableHead>Actions</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Controls</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{rule.name}</p>
                          <p className="text-sm text-gray-600">
                            Created {formatDate(rule.createdDate)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {rule.searchCriteria.description && (
                            <p>Description: "{rule.searchCriteria.description}"</p>
                          )}
                          {rule.searchCriteria.amount && (
                            <p>Amount: {formatCurrency(rule.searchCriteria.amount)}</p>
                          )}
                          {(rule.searchCriteria.amountMin || rule.searchCriteria.amountMax) && (
                            <p>
                              Amount: {rule.searchCriteria.amountMin ? formatCurrency(rule.searchCriteria.amountMin) : '0'} -
                              {rule.searchCriteria.amountMax ? formatCurrency(rule.searchCriteria.amountMax) : '∞'}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {rule.applyCriteria.category && (
                            <Badge variant="outline" className="mb-1 mr-1">
                              {rule.applyCriteria.category}
                            </Badge>
                          )}
                          {rule.applyCriteria.tags && (
                            <p className="text-xs text-gray-600">
                              Tags: {rule.applyCriteria.tags}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium">{rule.matches} matches</p>
                          <p className={`text-xs ${getPerformanceColor(rule.performance?.efficiency || 0)}`}>
                            {rule.performance?.efficiency || 0}% efficiency
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={rule.status === 'active'}
                            onCheckedChange={() => toggleRule(rule.id)}
                          />
                          <Badge variant={getStatusBadgeVariant(rule.status)}>
                            {rule.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleRulePreview(rule)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteRule(rule.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Search & Preview Tab */}
        <TabsContent value="search" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Search Criteria */}
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle>Search Criteria</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="search-description">Description</Label>
                  <Input
                    id="search-description"
                    placeholder="e.g., Rental Payment, Grocery"
                    value={searchCriteria.description || ''}
                    onChange={(e) => setSearchCriteria(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="search-amount-min">Amount Min</Label>
                    <Input
                      id="search-amount-min"
                      type="number"
                      placeholder="0"
                      value={searchCriteria.amountMin || ''}
                      onChange={(e) => setSearchCriteria(prev => ({
                        ...prev,
                        amountMin: e.target.value ? parseFloat(e.target.value) : undefined
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="search-amount-max">Amount Max</Label>
                    <Input
                      id="search-amount-max"
                      type="number"
                      placeholder="1000"
                      value={searchCriteria.amountMax || ''}
                      onChange={(e) => setSearchCriteria(prev => ({
                        ...prev,
                        amountMax: e.target.value ? parseFloat(e.target.value) : undefined
                      }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="search-category">Category</Label>
                  <Select
                    value={searchCriteria.category || ''}
                    onValueChange={(value) => setSearchCriteria(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(category => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="search-account">Account</Label>
                  <Select
                    value={searchCriteria.account || ''}
                    onValueChange={(value) => setSearchCriteria(prev => ({ ...prev, account: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCOUNTS.map(account => (
                        <SelectItem key={account} value={account}>
                          {account}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleSearchPreview} className="w-full" disabled={isLoading}>
                  <Search className="w-4 h-4 mr-2" />
                  Search Transactions
                </Button>
              </CardContent>
            </Card>

            {/* Preview Results */}
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle>Preview Results ({preview.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {preview.length === 0 ? (
                    <p className="text-gray-600 text-center py-8">
                      No transactions found. Adjust your search criteria.
                    </p>
                  ) : (
                    preview.map((item, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">{item.transaction.description}</p>
                            <p className="text-sm text-gray-600">
                              {formatDate(item.transaction.date)} • {item.transaction.account}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${item.transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(item.transaction.amount)}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {item.matchScore}% match
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline">{item.transaction.category}</Badge>
                          {item.transaction.tags && (
                            <Badge variant="outline" className="text-xs">
                              {item.transaction.tags}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Distribution */}
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.categoryDistribution.slice(0, 10).map((cat) => (
                    <div key={cat.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{cat.category}</Badge>
                        <span className="text-sm text-gray-600">{cat.count} transactions</span>
                      </div>
                      <span className="font-medium">{cat.percentage}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tag Distribution */}
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle>Top Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.tagDistribution.slice(0, 10).map((tag) => (
                    <div key={tag.tag} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{tag.tag}</Badge>
                        <span className="text-sm text-gray-600">{tag.count} uses</span>
                      </div>
                      <span className="font-medium">{tag.percentage}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Rule Modal/Form */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Create New AutoTag Rule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Rule Name */}
              <div>
                <Label htmlFor="rule-name">Rule Name</Label>
                <Input
                  id="rule-name"
                  placeholder="e.g., Rental Income Auto-Tag"
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              {/* Search Criteria Section */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Search Criteria</h3>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="create-description">Description Contains</Label>
                    <Input
                      id="create-description"
                      placeholder="e.g., Rental Payment (use | for OR: Rental|Rent)"
                      value={createForm.searchCriteria.description || ''}
                      onChange={(e) => handleDescriptionChange(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="create-amount-min">Amount Min</Label>
                      <Input
                        id="create-amount-min"
                        type="number"
                        placeholder="0"
                        value={createForm.searchCriteria.amountMin || ''}
                        onChange={(e) => setCreateForm(prev => ({
                          ...prev,
                          searchCriteria: {
                            ...prev.searchCriteria,
                            amountMin: e.target.value ? parseFloat(e.target.value) : undefined
                          }
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="create-amount-max">Amount Max</Label>
                      <Input
                        id="create-amount-max"
                        type="number"
                        placeholder="1000"
                        value={createForm.searchCriteria.amountMax || ''}
                        onChange={(e) => setCreateForm(prev => ({
                          ...prev,
                          searchCriteria: {
                            ...prev.searchCriteria,
                            amountMax: e.target.value ? parseFloat(e.target.value) : undefined
                          }
                        }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="create-account">Account</Label>
                    <Select
                      value={createForm.searchCriteria.account || ''}
                      onValueChange={(value) => setCreateForm(prev => ({
                        ...prev,
                        searchCriteria: { ...prev.searchCriteria, account: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select account (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {ACCOUNTS.map(account => (
                          <SelectItem key={account} value={account}>
                            {account}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Apply Actions Section */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Apply Actions</h3>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="apply-category">Set Category</Label>
                    <Select
                      value={createForm.applyCriteria.category || ''}
                      onValueChange={(value) => setCreateForm(prev => ({
                        ...prev,
                        applyCriteria: { ...prev.applyCriteria, category: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(category => (
                          <SelectItem key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="apply-tags">Set Tags</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDynamicTagHelp(!showDynamicTagHelp)}
                      >
                        <Settings className="w-4 h-4" />
                        Dynamic Tags
                      </Button>
                    </div>
                    <Textarea
                      id="apply-tags"
                      placeholder="e.g., rental, income, recurring, {mmyy}"
                      value={createForm.applyCriteria.tags || ''}
                      onChange={(e) => setCreateForm(prev => ({
                        ...prev,
                        applyCriteria: { ...prev.applyCriteria, tags: e.target.value }
                      }))}
                    />
                    {showDynamicTagHelp && (
                      <div className="mt-2 p-3 bg-blue-50 rounded-lg text-sm">
                        <p className="font-medium mb-2">Dynamic Tag Patterns:</p>
                        <div className="grid grid-cols-2 gap-2">
                          {DYNAMIC_TAG_PATTERNS.map((pattern) => (
                            <div key={pattern.pattern} className="flex items-center gap-2">
                              <code className="bg-white px-1 rounded">{pattern.pattern}</code>
                              <span className="text-gray-600">→ {pattern.example}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="remove-old-tags"
                      checked={createForm.applyCriteria.removeOldTags || false}
                      onCheckedChange={(checked) => setCreateForm(prev => ({
                        ...prev,
                        applyCriteria: { ...prev.applyCriteria, removeOldTags: checked }
                      }))}
                    />
                    <Label htmlFor="remove-old-tags">Remove old tags (replace instead of merge)</Label>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateRule} className="bg-green-500 hover:bg-green-600">
                  Create Rule
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}