import {
  Transaction,
  AutoTagRule,
  AutoTagAnalytics,
  RecentAutoTagActivity,
  CategoryCount,
  TagCount,
  DYNAMIC_TAG_PATTERNS
} from '../types/AutoTagTypes';

/**
 * Generate mock transaction data for testing AutoTag system
 */
export function generateMockTransactions(): Transaction[] {
  const descriptions = [
    'Rental Payment - Unit 1A',
    'Mortgage Payment - BOQ',
    'Electricity Bill - AGL',
    'Grocery Store - Woolworths',
    'Coffee Shop - Local Cafe',
    'Internet Bill - Telstra',
    'Property Maintenance - Plumber',
    'Insurance Premium - AAMI',
    'Fuel - Shell Station',
    'Subscription - Netflix',
    'Rental Payment - Unit 2B',
    'Water Bill - Sydney Water',
    'Property Management Fee',
    'Restaurant - Fine Dining',
    'Subscription - Spotify',
    'Gas Bill - Origin Energy',
    'Repair Work - Electrician',
    'Phone Bill - Telstra',
    'Council Rates - Liverpool Council',
    'Supermarket - Coles'
  ];

  const accounts = ['Up', 'BOQ', 'WestPac', 'Cash', 'ANZ Saver'];
  const categories = ['rental', 'mortgage', 'utilities', 'groceries', 'entertainment', 'transport', 'maintenance', 'insurance'];

  const transactions: Transaction[] = [];

  for (let i = 0; i < 100; i++) {
    const desc = descriptions[Math.floor(Math.random() * descriptions.length)];
    const isIncome = desc.includes('Rental Payment') || Math.random() < 0.1;

    transactions.push({
      id: `tx_${i + 1}`,
      amount: isIncome
        ? Math.round((Math.random() * 2000 + 500) * 100) / 100
        : -Math.round((Math.random() * 500 + 20) * 100) / 100,
      date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Last 90 days
      description: desc,
      category: categories[Math.floor(Math.random() * categories.length)],
      tags: Math.random() > 0.5 ? 'auto-tagged, imported' : '',
      account: accounts[Math.floor(Math.random() * accounts.length)],
      type: isIncome ? 'income' : 'expense',
      uniqueId: `unique_${i + 1}`,
      upId: Math.random() > 0.3 ? `up_${i + 1}` : undefined,
      source: 'mock'
    });
  }

  return transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
}

/**
 * Generate mock AutoTag rules based on common patterns
 */
export function generateMockAutoTagRules(): AutoTagRule[] {
  return [
    {
      id: 'rule_1',
      name: 'Rental Income Auto-Tag',
      status: 'active',
      createdDate: new Date('2025-01-01'),
      lastRun: new Date('2025-09-22'),
      searchCriteria: {
        description: 'Rental Payment',
        amountMin: 400
      },
      applyCriteria: {
        category: 'rental',
        tags: 'income, rental, recurring, {mmyy}',
        removeOldTags: false
      },
      matches: 24,
      lastMatched: new Date('2025-09-20'),
      performance: {
        totalMatches: 24,
        successfulApplications: 24,
        failedApplications: 0,
        averageProcessingTime: 50,
        lastRunDuration: 120,
        efficiency: 100
      }
    },
    {
      id: 'rule_2',
      name: 'Mortgage Payments',
      status: 'active',
      createdDate: new Date('2025-01-01'),
      lastRun: new Date('2025-09-08'),
      searchCriteria: {
        description: 'Mortgage Payment',
        account: 'BOQ'
      },
      applyCriteria: {
        category: 'mortgage',
        tags: 'housing, recurring, mortgage-{yyyy}',
        removeOldTags: false
      },
      matches: 9,
      lastMatched: new Date('2025-09-08'),
      performance: {
        totalMatches: 9,
        successfulApplications: 9,
        failedApplications: 0,
        averageProcessingTime: 30,
        lastRunDuration: 45,
        efficiency: 100
      }
    },
    {
      id: 'rule_3',
      name: 'Utility Bills',
      status: 'active',
      createdDate: new Date('2025-01-15'),
      lastRun: new Date('2025-09-15'),
      searchCriteria: {
        description: 'Bill|Electricity|Water|Gas',
        amountMin: 50
      },
      applyCriteria: {
        category: 'utilities',
        tags: 'bills, utilities, {mmyy}',
        removeOldTags: false
      },
      matches: 18,
      lastMatched: new Date('2025-09-15'),
      performance: {
        totalMatches: 18,
        successfulApplications: 17,
        failedApplications: 1,
        averageProcessingTime: 40,
        lastRunDuration: 72,
        efficiency: 94
      }
    },
    {
      id: 'rule_4',
      name: 'Grocery Stores',
      status: 'active',
      createdDate: new Date('2025-02-01'),
      lastRun: new Date('2025-09-21'),
      searchCriteria: {
        description: 'Woolworths|Coles|Supermarket|Grocery',
        amountMax: 300
      },
      applyCriteria: {
        category: 'groceries',
        tags: 'food, groceries, essential',
        removeOldTags: false
      },
      matches: 15,
      lastMatched: new Date('2025-09-21'),
      performance: {
        totalMatches: 15,
        successfulApplications: 15,
        failedApplications: 0,
        averageProcessingTime: 25,
        lastRunDuration: 38,
        efficiency: 100
      }
    },
    {
      id: 'rule_5',
      name: 'Property Maintenance',
      status: 'active',
      createdDate: new Date('2025-02-15'),
      lastRun: new Date('2025-09-10'),
      searchCriteria: {
        description: 'Maintenance|Repair|Plumber|Electrician',
        type: 'expense'
      },
      applyCriteria: {
        category: 'maintenance',
        tags: 'property, maintenance, deductible, business-{yy}',
        removeOldTags: false
      },
      matches: 6,
      lastMatched: new Date('2025-09-10'),
      performance: {
        totalMatches: 6,
        successfulApplications: 6,
        failedApplications: 0,
        averageProcessingTime: 35,
        lastRunDuration: 21,
        efficiency: 100
      }
    },
    {
      id: 'rule_6',
      name: 'Entertainment & Dining',
      status: 'inactive',
      createdDate: new Date('2025-03-01'),
      lastRun: new Date('2025-09-01'),
      searchCriteria: {
        description: 'Restaurant|Cafe|Cinema|Entertainment',
        amountMin: 15,
        amountMax: 200
      },
      applyCriteria: {
        category: 'entertainment',
        tags: 'dining, entertainment, discretionary',
        removeOldTags: false
      },
      matches: 0,
      performance: {
        totalMatches: 8,
        successfulApplications: 8,
        failedApplications: 0,
        averageProcessingTime: 20,
        lastRunDuration: 16,
        efficiency: 100
      }
    }
  ];
}

/**
 * Calculate AutoTag analytics from rules and transactions
 */
export function calculateAutoTagAnalytics(
  rules: AutoTagRule[],
  transactions: Transaction[]
): AutoTagAnalytics {
  const activeRules = rules.filter(rule => rule.status === 'active');
  const totalTransactionsTagged = transactions.filter(t =>
    t.tags && t.tags.includes('auto-tagged')
  ).length;

  // Calculate category distribution
  const categoryMap = new Map<string, number>();
  transactions.forEach(t => {
    if (t.category) {
      categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + 1);
    }
  });

  const categoryDistribution: CategoryCount[] = Array.from(categoryMap.entries())
    .map(([category, count]) => ({
      category,
      count,
      percentage: Math.round((count / transactions.length) * 100)
    }))
    .sort((a, b) => b.count - a.count);

  // Calculate tag distribution
  const tagMap = new Map<string, number>();
  transactions.forEach(t => {
    if (t.tags) {
      const tags = t.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      tags.forEach(tag => {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
      });
    }
  });

  const tagDistribution: TagCount[] = Array.from(tagMap.entries())
    .map(([tag, count]) => ({
      tag,
      count,
      percentage: Math.round((count / transactions.length) * 100)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 tags

  // Get top performing rules
  const topPerformingRules = rules
    .filter(rule => rule.performance && rule.performance.totalMatches > 0)
    .sort((a, b) => (b.performance?.efficiency || 0) - (a.performance?.efficiency || 0))
    .slice(0, 5);

  // Generate recent activity
  const recentActivity: RecentAutoTagActivity[] = rules
    .filter(rule => rule.lastMatched)
    .sort((a, b) => (b.lastMatched?.getTime() || 0) - (a.lastMatched?.getTime() || 0))
    .slice(0, 10)
    .map(rule => ({
      date: rule.lastMatched!,
      ruleId: rule.id,
      ruleName: rule.name,
      transactionId: `tx_${Math.floor(Math.random() * 100)}`,
      description: `Applied ${rule.name}`,
      action: rule.applyCriteria.category && rule.applyCriteria.tags ? 'both' :
              rule.applyCriteria.category ? 'categorized' : 'tagged',
      changes: [
        rule.applyCriteria.category ? `Category: ${rule.applyCriteria.category}` : '',
        rule.applyCriteria.tags ? `Tags: ${rule.applyCriteria.tags}` : ''
      ].filter(change => change)
    }));

  return {
    totalRules: rules.length,
    activeRules: activeRules.length,
    totalTransactionsProcessed: transactions.length,
    totalTransactionsTagged,
    automationRate: transactions.length > 0
      ? Math.round((totalTransactionsTagged / transactions.length) * 100)
      : 0,
    topPerformingRules,
    recentActivity,
    categoryDistribution,
    tagDistribution
  };
}

/**
 * Format currency values consistently
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2
  }).format(Math.abs(amount));
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 30) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    return formatDate(date);
  }
}

/**
 * Validate and sanitize rule input
 */
export function sanitizeRuleInput(input: string): string {
  return input.trim()
    .replace(/[<>'"]/g, '') // Remove potentially dangerous characters
    .replace(/\s+/g, ' '); // Normalize whitespace
}

/**
 * Generate a unique rule ID
 */
export function generateRuleId(): string {
  return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Export rules to JSON for backup/sharing
 */
export function exportRulesToJson(rules: AutoTagRule[]): string {
  const exportData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    rules: rules.map(rule => ({
      ...rule,
      // Remove performance data from export
      performance: undefined
    }))
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Import rules from JSON
 */
export function importRulesFromJson(jsonString: string): AutoTagRule[] {
  try {
    const data = JSON.parse(jsonString);

    if (!data.rules || !Array.isArray(data.rules)) {
      throw new Error('Invalid format: rules array not found');
    }

    return data.rules.map((rule: any) => ({
      ...rule,
      id: generateRuleId(), // Generate new IDs to avoid conflicts
      createdDate: new Date(rule.createdDate),
      lastRun: rule.lastRun ? new Date(rule.lastRun) : undefined,
      lastMatched: rule.lastMatched ? new Date(rule.lastMatched) : undefined,
      performance: undefined // Reset performance data
    }));
  } catch (error) {
    throw new Error(`Failed to import rules: ${error}`);
  }
}

/**
 * Get suggested tags based on transaction description
 */
export function getSuggestedTags(description: string): string[] {
  const desc = description.toLowerCase();
  const suggestions: string[] = [];

  // Common patterns and their suggested tags
  const patterns = [
    { pattern: /rental|rent/i, tags: ['rental', 'income', 'recurring'] },
    { pattern: /mortgage/i, tags: ['mortgage', 'housing', 'recurring'] },
    { pattern: /electricity|electric|power/i, tags: ['utilities', 'electricity', 'bills'] },
    { pattern: /water|sewer/i, tags: ['utilities', 'water', 'bills'] },
    { pattern: /gas/i, tags: ['utilities', 'gas', 'bills'] },
    { pattern: /internet|broadband|nbn/i, tags: ['utilities', 'internet', 'bills'] },
    { pattern: /phone|mobile|telstra|optus/i, tags: ['utilities', 'phone', 'bills'] },
    { pattern: /grocery|supermarket|woolworths|coles/i, tags: ['groceries', 'food', 'essential'] },
    { pattern: /restaurant|cafe|dining/i, tags: ['dining', 'entertainment', 'discretionary'] },
    { pattern: /fuel|petrol|shell|bp|caltex/i, tags: ['transport', 'fuel'] },
    { pattern: /insurance/i, tags: ['insurance', 'bills', 'recurring'] },
    { pattern: /maintenance|repair|plumber|electrician/i, tags: ['maintenance', 'property', 'business'] },
    { pattern: /netflix|spotify|subscription/i, tags: ['subscription', 'entertainment', 'recurring'] }
  ];

  patterns.forEach(({ pattern, tags }) => {
    if (pattern.test(desc)) {
      suggestions.push(...tags);
    }
  });

  // Remove duplicates and return
  return [...new Set(suggestions)];
}

/**
 * Get suggested category based on transaction description
 */
export function getSuggestedCategory(description: string): string | null {
  const desc = description.toLowerCase();

  const categoryPatterns = [
    { pattern: /rental|rent/i, category: 'rental' },
    { pattern: /mortgage/i, category: 'mortgage' },
    { pattern: /electricity|electric|power|water|gas|internet|phone/i, category: 'utilities' },
    { pattern: /grocery|supermarket|woolworths|coles/i, category: 'groceries' },
    { pattern: /restaurant|cafe|dining|entertainment/i, category: 'entertainment' },
    { pattern: /fuel|petrol|transport/i, category: 'transport' },
    { pattern: /insurance/i, category: 'insurance' },
    { pattern: /maintenance|repair/i, category: 'maintenance' },
    { pattern: /subscription/i, category: 'subscriptions' }
  ];

  for (const { pattern, category } of categoryPatterns) {
    if (pattern.test(desc)) {
      return category;
    }
  }

  return null;
}

/**
 * Get performance color based on efficiency percentage
 */
export function getPerformanceColor(efficiency: number): string {
  if (efficiency >= 90) return 'text-green-600';
  if (efficiency >= 70) return 'text-yellow-600';
  return 'text-red-600';
}

/**
 * Get status badge variant
 */
export function getStatusBadgeVariant(status: 'active' | 'inactive' | 'draft'): 'default' | 'secondary' | 'destructive' {
  switch (status) {
    case 'active': return 'default';
    case 'inactive': return 'secondary';
    case 'draft': return 'destructive';
    default: return 'secondary';
  }
}