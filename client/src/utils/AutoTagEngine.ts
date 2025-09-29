import {
  Transaction,
  AutoTagRule,
  SearchCriteria,
  AutoTagPreview,
  AutoTagResults,
  RuleApplicationResult,
  AutoTagError,
  AutoTagConfig,
  DEFAULT_AUTOTAG_CONFIG,
  RuleValidationResult
} from '../types/AutoTagTypes';

export class AutoTagEngine {
  private config: AutoTagConfig;
  private errors: AutoTagError[] = [];

  constructor(config: Partial<AutoTagConfig> = {}) {
    this.config = { ...DEFAULT_AUTOTAG_CONFIG, ...config };
  }

  /**
   * Search transactions based on criteria (mirrors Google Sheets searchTransactionsPreview)
   */
  searchTransactions(transactions: Transaction[], criteria: SearchCriteria): Transaction[] {
    return transactions.filter(transaction => this.matchesSearchCriteria(transaction, criteria));
  }

  /**
   * Match transaction against search criteria
   */
  private matchesSearchCriteria(transaction: Transaction, criteria: SearchCriteria): boolean {
    // Description filter
    if (criteria.description) {
      if (!this.matchesDescription(transaction.description, criteria.description)) {
        return false;
      }
    }

    // Amount filters
    if (criteria.amount !== undefined) {
      if (Math.abs(transaction.amount - criteria.amount) > 0.01) {
        return false;
      }
    }

    if (criteria.amountMin !== undefined) {
      if (Math.abs(transaction.amount) < criteria.amountMin) {
        return false;
      }
    }

    if (criteria.amountMax !== undefined) {
      if (Math.abs(transaction.amount) > criteria.amountMax) {
        return false;
      }
    }

    // Date filters
    if (criteria.dateFrom && transaction.date < criteria.dateFrom) {
      return false;
    }

    if (criteria.dateTo && transaction.date > criteria.dateTo) {
      return false;
    }

    if (criteria.dateMin && transaction.date < criteria.dateMin) {
      return false;
    }

    if (criteria.dateMax && transaction.date > criteria.dateMax) {
      return false;
    }

    // Category filter
    if (criteria.category) {
      if (!transaction.category.toLowerCase().includes(criteria.category.toLowerCase())) {
        return false;
      }
    }

    // Tags filter (must match ALL specified tags)
    if (criteria.tags) {
      const requiredTags = criteria.tags.split(',').map(t => t.trim().toLowerCase());
      const transactionTags = transaction.tags.toLowerCase().split(',').map(t => t.trim());

      for (const requiredTag of requiredTags) {
        if (!transactionTags.some(tag => tag.includes(requiredTag))) {
          return false;
        }
      }
    }

    // Account filter
    if (criteria.account) {
      if (!transaction.account.toLowerCase().includes(criteria.account.toLowerCase())) {
        return false;
      }
    }

    // Type filter
    if (criteria.type && transaction.type !== criteria.type) {
      return false;
    }

    return true;
  }

  /**
   * Enhanced description matching with regex support
   */
  private matchesDescription(description: string, pattern: string): boolean {
    const desc = description.toLowerCase();
    const pat = pattern.toLowerCase();

    // Check for regex patterns (indicated by | for OR conditions)
    if (pat.includes('|')) {
      const patterns = pat.split('|').map(p => p.trim());
      return patterns.some(p => desc.includes(p));
    }

    return desc.includes(pat);
  }

  /**
   * Preview what changes would be made without applying them
   */
  previewRuleApplication(transactions: Transaction[], rule: AutoTagRule): AutoTagPreview[] {
    const matchingTransactions = this.searchTransactions(transactions, rule.searchCriteria);

    return matchingTransactions.slice(0, this.config.maxPreviewResults).map(transaction => {
      const currentTags = transaction.tags ? transaction.tags.split(',').map(t => t.trim()).filter(t => t) : [];
      const newTags = this.calculateNewTags(currentTags, rule.applyCriteria.tags || '', rule.applyCriteria.removeOldTags || false);

      return {
        transaction,
        matchedRules: [rule],
        proposedChanges: {
          currentCategory: transaction.category,
          newCategory: rule.applyCriteria.category,
          currentTags,
          newTags,
          tagsToRemove: rule.applyCriteria.removeOldTags ? currentTags : [],
          tagsToAdd: newTags.filter(tag => !currentTags.includes(tag))
        },
        matchScore: this.calculateMatchScore(transaction, rule)
      };
    });
  }

  /**
   * Apply a single rule to matching transactions
   */
  applyRule(transactions: Transaction[], rule: AutoTagRule): RuleApplicationResult {
    const startTime = Date.now();
    const matchingTransactions = this.searchTransactions(transactions, rule.searchCriteria);
    let successful = 0;
    let failed = 0;
    const updatedTransactions: Transaction[] = [];

    for (const transaction of matchingTransactions) {
      try {
        const updated = this.applyRuleToTransaction(transaction, rule);
        if (updated) {
          updatedTransactions.push(transaction);
          successful++;
        }
      } catch (error) {
        failed++;
        this.errors.push({
          type: 'transaction_error',
          message: `Failed to apply rule ${rule.name} to transaction ${transaction.id}: ${error}`,
          ruleId: rule.id,
          transactionId: transaction.id,
          timestamp: new Date()
        });
      }
    }

    // Update rule performance
    rule.matches = matchingTransactions.length;
    rule.lastRun = new Date();
    rule.lastMatched = updatedTransactions.length > 0 ? new Date() : rule.lastMatched;

    if (rule.performance) {
      rule.performance.totalMatches += matchingTransactions.length;
      rule.performance.successfulApplications += successful;
      rule.performance.failedApplications += failed;
      rule.performance.lastRunDuration = Date.now() - startTime;
      rule.performance.efficiency = rule.performance.totalMatches > 0
        ? (rule.performance.successfulApplications / rule.performance.totalMatches) * 100
        : 0;
    }

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      matches: matchingTransactions.length,
      successful,
      failed,
      transactions: updatedTransactions
    };
  }

  /**
   * Apply rule to a single transaction
   */
  private applyRuleToTransaction(transaction: Transaction, rule: AutoTagRule): boolean {
    let updated = false;

    // Apply category if specified
    if (rule.applyCriteria.category && rule.applyCriteria.category !== transaction.category) {
      transaction.category = rule.applyCriteria.category;
      updated = true;
    }

    // Apply tags with smart merging
    if (rule.applyCriteria.tags) {
      const resolvedTags = this.resolveDynamicTags(rule.applyCriteria.tags);
      const currentTags = transaction.tags ? transaction.tags.split(',').map(t => t.trim()).filter(t => t) : [];
      const newTags = this.calculateNewTags(currentTags, resolvedTags, rule.applyCriteria.removeOldTags || false);

      const newTagsString = newTags.join(', ');
      if (newTagsString !== transaction.tags) {
        transaction.tags = newTagsString;
        updated = true;
      }
    }

    return updated;
  }

  /**
   * Calculate new tags based on merge/replace logic
   */
  private calculateNewTags(currentTags: string[], newTagsString: string, removeOldTags: boolean): string[] {
    const newTags = newTagsString.split(',').map(t => t.trim()).filter(t => t);

    if (removeOldTags) {
      return newTags;
    }

    // Smart merging - add only new tags
    const mergedTags = [...currentTags];
    for (const newTag of newTags) {
      if (!mergedTags.some(existingTag => existingTag.toLowerCase() === newTag.toLowerCase())) {
        mergedTags.push(newTag);
      }
    }

    return mergedTags;
  }

  /**
   * Resolve dynamic date patterns in tags (from Google Sheets functionality)
   */
  resolveDynamicTags(tagString: string): string {
    if (!tagString || !this.config.enableDynamicTags) return tagString;

    const today = new Date();
    const patterns: Record<string, string> = {
      '{yy}': today.getFullYear().toString().slice(-2),
      '{yyyy}': today.getFullYear().toString(),
      '{mm}': (today.getMonth() + 1).toString().padStart(2, '0'),
      '{dd}': today.getDate().toString().padStart(2, '0'),
      '{mmyy}': (today.getMonth() + 1).toString().padStart(2, '0') + today.getFullYear().toString().slice(-2),
      '{ddmm}': today.getDate().toString().padStart(2, '0') + (today.getMonth() + 1).toString().padStart(2, '0'),
      '{ddmmyy}': today.getDate().toString().padStart(2, '0') + (today.getMonth() + 1).toString().padStart(2, '0') + today.getFullYear().toString().slice(-2),
      '{ddmmyyyy}': today.getDate().toString().padStart(2, '0') + (today.getMonth() + 1).toString().padStart(2, '0') + today.getFullYear().toString()
    };

    let resolvedTags = tagString;
    for (const [pattern, value] of Object.entries(patterns)) {
      resolvedTags = resolvedTags.replace(new RegExp(pattern.replace(/[{}]/g, '\\$&'), 'g'), value);
    }

    return resolvedTags;
  }

  /**
   * Calculate match score for a transaction against a rule
   */
  private calculateMatchScore(transaction: Transaction, rule: AutoTagRule): number {
    let score = 0;
    let criteria = 0;

    // Each criterion that matches adds to the score
    if (rule.searchCriteria.description) {
      criteria++;
      if (this.matchesDescription(transaction.description, rule.searchCriteria.description)) {
        score++;
      }
    }

    if (rule.searchCriteria.amount !== undefined) {
      criteria++;
      if (Math.abs(transaction.amount - rule.searchCriteria.amount) <= 0.01) {
        score++;
      }
    }

    if (rule.searchCriteria.category) {
      criteria++;
      if (transaction.category.toLowerCase().includes(rule.searchCriteria.category.toLowerCase())) {
        score++;
      }
    }

    if (rule.searchCriteria.account) {
      criteria++;
      if (transaction.account.toLowerCase().includes(rule.searchCriteria.account.toLowerCase())) {
        score++;
      }
    }

    return criteria > 0 ? Math.round((score / criteria) * 100) : 0;
  }

  /**
   * Run multiple rules with batch processing
   */
  async runAutoTagRules(transactions: Transaction[], rules: AutoTagRule[]): Promise<AutoTagResults> {
    const startTime = Date.now();
    const activeRules = rules.filter(rule => rule.status === 'active');
    const results: RuleApplicationResult[] = [];
    let totalUpdated = 0;

    this.errors = []; // Reset errors

    // Process rules in batches
    for (let i = 0; i < activeRules.length; i += this.config.maxRulesPerBatch) {
      const batch = activeRules.slice(i, i + this.config.maxRulesPerBatch);

      for (const rule of batch) {
        try {
          const result = this.applyRule(transactions, rule);
          results.push(result);
          totalUpdated += result.successful;
        } catch (error) {
          this.errors.push({
            type: 'rule_error',
            message: `Failed to process rule ${rule.name}: ${error}`,
            ruleId: rule.id,
            timestamp: new Date()
          });
        }
      }

      // Add delay between batches to prevent UI freezing
      if (i + this.config.maxRulesPerBatch < activeRules.length) {
        await new Promise(resolve => setTimeout(resolve, this.config.processingDelayMs));
      }
    }

    return {
      totalProcessed: transactions.length,
      totalUpdated,
      rulesApplied: results,
      errors: this.errors,
      processingTime: Date.now() - startTime
    };
  }

  /**
   * Validate rule configuration
   */
  validateRule(rule: Partial<AutoTagRule>): RuleValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Must have a name
    if (!rule.name || rule.name.trim().length === 0) {
      errors.push('Rule name is required');
    }

    // Must have at least one search criteria
    const searchCriteria = rule.searchCriteria;
    if (!searchCriteria) {
      errors.push('Search criteria is required');
    } else {
      const hasSearchCriteria = Object.values(searchCriteria).some(value =>
        value !== undefined && value !== null && value !== ''
      );

      if (!hasSearchCriteria) {
        errors.push('At least one search criteria must be specified');
      }
    }

    // Must have at least one apply action
    const applyCriteria = rule.applyCriteria;
    if (!applyCriteria) {
      errors.push('Apply criteria is required');
    } else {
      const hasApplyCriteria = applyCriteria.category || applyCriteria.tags;
      if (!hasApplyCriteria) {
        errors.push('Must specify at least Category or Tags to apply');
      }
    }

    // Validate amount ranges
    if (searchCriteria?.amountMin !== undefined && searchCriteria?.amountMax !== undefined) {
      if (searchCriteria.amountMin > searchCriteria.amountMax) {
        errors.push('Amount minimum cannot be greater than maximum');
      }
    }

    // Validate date ranges
    if (searchCriteria?.dateFrom && searchCriteria?.dateTo) {
      if (searchCriteria.dateFrom > searchCriteria.dateTo) {
        errors.push('Date from cannot be after date to');
      }
    }

    // Suggestions for optimization
    if (searchCriteria?.description && searchCriteria.description.includes('|')) {
      suggestions.push('Using OR conditions (|) in description - consider splitting into separate rules for better performance tracking');
    }

    if (applyCriteria?.tags && !applyCriteria.removeOldTags) {
      suggestions.push('Consider enabling "Remove Old Tags" if you want to replace existing tags completely');
    }

    // Warnings
    if (!applyCriteria?.category && !applyCriteria?.tags) {
      warnings.push('Rule will not make any changes - specify category or tags to apply');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * Get recent errors
   */
  getErrors(): AutoTagError[] {
    return this.errors;
  }

  /**
   * Clear errors
   */
  clearErrors(): void {
    this.errors = [];
  }
}