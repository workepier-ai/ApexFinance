// AutoTag System Types - Based on Google Sheets functionality

export interface Transaction {
  id: string;
  amount: number;
  date: Date;
  description: string;
  category: string;
  tags: string;
  account: string;
  type: 'income' | 'expense';
  uniqueId?: string;
  upId?: string;
  source?: string;
}

export interface SearchCriteria {
  description?: string;
  amount?: number;
  amountMin?: number;
  amountMax?: number;
  dateFrom?: Date;
  dateTo?: Date;
  dateMin?: Date;
  dateMax?: Date;
  category?: string;
  tags?: string;
  account?: string;
  type?: 'income' | 'expense';
}

export interface ApplyCriteria {
  category?: string;
  tags?: string;
  removeOldTags?: boolean;
  paymentType?: 'recurring' | 'one-time' | 'variable';
  recurring?: boolean;
  recurringEnd?: Date | 'indefinite';
  applyReminder?: boolean;
  reminderType?: 'email' | 'notification' | 'dashboard';
  alarmTypes?: string[];
}

export interface AutoTagRule {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'draft';
  createdDate: Date;
  lastRun?: Date;
  searchCriteria: SearchCriteria;
  applyCriteria: ApplyCriteria;
  matches: number;
  lastMatched?: Date;
  performance?: RulePerformance;
}

export interface RulePerformance {
  totalMatches: number;
  successfulApplications: number;
  failedApplications: number;
  averageProcessingTime: number;
  lastRunDuration: number;
  efficiency: number; // 0-100%
}

export interface AutoTagPreview {
  transaction: Transaction;
  matchedRules: AutoTagRule[];
  proposedChanges: {
    currentCategory: string;
    newCategory?: string;
    currentTags: string[];
    newTags: string[];
    tagsToRemove: string[];
    tagsToAdd: string[];
  };
  matchScore: number; // 0-100%
}

export interface AutoTagResults {
  totalProcessed: number;
  totalUpdated: number;
  rulesApplied: RuleApplicationResult[];
  errors: AutoTagError[];
  processingTime: number;
}

export interface RuleApplicationResult {
  ruleId: string;
  ruleName: string;
  matches: number;
  successful: number;
  failed: number;
  transactions: Transaction[];
}

export interface AutoTagError {
  type: 'rule_error' | 'transaction_error' | 'system_error';
  message: string;
  ruleId?: string;
  transactionId?: string;
  timestamp: Date;
}

// Rule Condition Types (mirrors Google Sheets conditions)
export type ConditionType =
  | 'description_contains'
  | 'description_equals'
  | 'description_regex'
  | 'amount_equals'
  | 'amount_greater_than'
  | 'amount_less_than'
  | 'amount_between'
  | 'date_equals'
  | 'date_after'
  | 'date_before'
  | 'date_between'
  | 'category_equals'
  | 'category_contains'
  | 'tags_contains'
  | 'tags_includes_all'
  | 'tags_includes_any'
  | 'account_equals';

export interface RuleCondition {
  type: ConditionType;
  field: keyof Transaction;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'regex';
  value: string | number | Date;
  secondaryValue?: string | number | Date; // For 'between' operations
  caseSensitive?: boolean;
}

// Dynamic Tag Patterns (from Google Sheets script)
export interface DynamicTagPattern {
  pattern: string;
  description: string;
  example: string;
}

export const DYNAMIC_TAG_PATTERNS: DynamicTagPattern[] = [
  { pattern: '{yy}', description: 'Current year (2 digits)', example: '25' },
  { pattern: '{yyyy}', description: 'Current year (4 digits)', example: '2025' },
  { pattern: '{mm}', description: 'Current month (2 digits)', example: '09' },
  { pattern: '{dd}', description: 'Current day (2 digits)', example: '22' },
  { pattern: '{mmyy}', description: 'Current month + year', example: '0925' },
  { pattern: '{ddmm}', description: 'Current day + month', example: '2209' },
  { pattern: '{ddmmyy}', description: 'Current day + month + year (2 digits)', example: '220925' },
  { pattern: '{ddmmyyyy}', description: 'Current day + month + year (4 digits)', example: '22092025' }
];

// AutoTag Configuration
export interface AutoTagConfig {
  batchSize: number;
  maxPreviewResults: number;
  enableDynamicTags: boolean;
  enablePreview: boolean;
  defaultRemoveOldTags: boolean;
  processingDelayMs: number;
  maxRulesPerBatch: number;
}

export const DEFAULT_AUTOTAG_CONFIG: AutoTagConfig = {
  batchSize: 10,
  maxPreviewResults: 20,
  enableDynamicTags: true,
  enablePreview: true,
  defaultRemoveOldTags: false,
  processingDelayMs: 100,
  maxRulesPerBatch: 5
};

// AutoTag Analytics
export interface AutoTagAnalytics {
  totalRules: number;
  activeRules: number;
  totalTransactionsProcessed: number;
  totalTransactionsTagged: number;
  automationRate: number; // Percentage of transactions auto-tagged
  topPerformingRules: AutoTagRule[];
  recentActivity: RecentAutoTagActivity[];
  categoryDistribution: CategoryCount[];
  tagDistribution: TagCount[];
}

export interface RecentAutoTagActivity {
  date: Date;
  ruleId: string;
  ruleName: string;
  transactionId: string;
  description: string;
  action: 'tagged' | 'categorized' | 'both';
  changes: string[];
}

export interface CategoryCount {
  category: string;
  count: number;
  percentage: number;
}

export interface TagCount {
  tag: string;
  count: number;
  percentage: number;
}

// Rule Validation
export interface RuleValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

// Export utility type for form handling
export type CreateRuleForm = Omit<AutoTagRule, 'id' | 'createdDate' | 'matches' | 'lastMatched' | 'performance'>;