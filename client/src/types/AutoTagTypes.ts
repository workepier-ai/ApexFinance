// Core transaction interface for auto-tag system
export interface Transaction {
  id: string;
  upTransactionId?: string;
  accountId?: string;
  bankId?: string;
  amount: number;
  date: Date;
  description: string;
  category: string;
  tags: string;
  type: string;
  status?: 'HELD' | 'SETTLED';
  account: string;
  uniqueId: string;
  source?: 'up_bank' | 'manual' | 'transfer' | 'import';
  syncStatus?: 'pending' | 'synced' | 'failed' | 'conflict';
  createdAt?: Date;
  updatedAt?: Date;
}

// Search criteria for auto-tag rules (mirrors Google Sheets functionality)
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
  tags?: string; // Comma-separated tags (must match ALL)
  account?: string;
  type?: string;
}

// Apply criteria for auto-tag rules
export interface ApplyCriteria {
  category?: string;
  tags?: string; // Comma-separated tags to apply
  removeOldTags?: boolean; // True = replace, False = merge
}

// Auto-tag rule definition
export interface AutoTagRule {
  id: string;
  userId: string;
  name: string;
  status: 'active' | 'inactive' | 'draft';
  searchCriteria: SearchCriteria;
  applyCriteria: ApplyCriteria;

  // Performance tracking
  matches?: number;
  lastRun?: Date;
  lastMatched?: Date;
  performance?: {
    totalMatches: number;
    successfulApplications: number;
    failedApplications: number;
    lastRunDuration: number;
    efficiency: number; // Percentage of successful applications
  };

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// Preview interface for showing rule effects before applying
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
  matchScore: number; // 0-100 score of how well the rule matches
}

// Result of applying a single rule
export interface RuleApplicationResult {
  ruleId: string;
  ruleName: string;
  matches: number;
  successful: number;
  failed: number;
  transactions: Transaction[];
}

// Overall results of auto-tag run
export interface AutoTagResults {
  totalProcessed: number;
  totalUpdated: number;
  rulesApplied: RuleApplicationResult[];
  errors: AutoTagError[];
  processingTime: number;
}

// Error tracking
export interface AutoTagError {
  type: 'rule_error' | 'transaction_error' | 'api_error';
  message: string;
  ruleId?: string;
  transactionId?: string;
  timestamp: Date;
}

// Configuration for auto-tag engine
export interface AutoTagConfig {
  maxPreviewResults: number;
  maxRulesPerBatch: number;
  processingDelayMs: number;
  enableDynamicTags: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export const DEFAULT_AUTOTAG_CONFIG: AutoTagConfig = {
  maxPreviewResults: 20,
  maxRulesPerBatch: 10,
  processingDelayMs: 100,
  enableDynamicTags: true,
  logLevel: 'info'
};

// Dynamic tag patterns for auto-tag system
export const DYNAMIC_TAG_PATTERNS = [
  { pattern: '{yyyy}', description: 'Current year (2025)', example: '2025' },
  { pattern: '{yy}', description: 'Current year (25)', example: '25' },
  { pattern: '{mm}', description: 'Current month (09)', example: '09' },
  { pattern: '{dd}', description: 'Current day (30)', example: '30' },
  { pattern: '{mmyy}', description: 'Month + year (0925)', example: '0925' },
  { pattern: '{ddmm}', description: 'Day + month (3009)', example: '3009' },
  { pattern: '{ddmmyy}', description: 'Day + month + year (300925)', example: '300925' },
  { pattern: '{ddmmyyyy}', description: 'Day + month + full year (30092025)', example: '30092025' }
];

// Rule validation result
export interface RuleValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

// UP Bank specific types
export interface UpBankAccount {
  id: string;
  type: string;
  attributes: {
    displayName: string;
    accountType: string;
    balance: {
      currencyCode: string;
      value: string;
      valueInBaseUnits: number;
    };
    createdAt: string;
  };
}

export interface UpBankTransaction {
  id: string;
  status: 'HELD' | 'SETTLED';
  rawText?: string;
  description: string;
  message?: string;
  amount: {
    currencyCode: string;
    value: string;
    valueInBaseUnits: number;
  };
  settledAt?: string;
  createdAt: string;
  account?: {
    data: {
      id: string;
    };
  };
  category?: {
    data: {
      id: string;
    };
  };
  parentCategory?: {
    data: {
      id: string;
    };
  };
  tags?: {
    data: Array<{
      id: string;
    }>;
  };
}

export interface UpBankCategory {
  id: string;
  name: string;
  parent?: {
    data: {
      id: string;
    };
  };
}

export interface UpBankTag {
  id: string;
}

// Webhook event types
export interface UpBankWebhookEvent {
  data: {
    attributes: {
      eventType: 'TRANSACTION_CREATED' | 'TRANSACTION_SETTLED' | 'TRANSACTION_DELETED' | 'PING';
      createdAt: string;
    };
    relationships?: {
      transaction?: {
        data: {
          id: string;
        };
      };
    };
  };
}

// Settings management
export interface ApiSettings {
  upBankToken?: string;
  webhookSecret?: string;
  autoSync: boolean;
  syncInterval: number; // minutes
  autoTagEnabled: boolean;
  transferDetection: boolean;
}

export interface SettingsState {
  apiSettings: ApiSettings;
  loading: boolean;
  error?: string;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  lastSync?: Date;
}