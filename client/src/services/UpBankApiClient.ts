import type {
  UpBankAccount,
  UpBankTransaction,
  UpBankCategory,
  UpBankTag,
  Transaction
} from '../types/AutoTagTypes';

export interface UpBankApiResponse<T> {
  data: T;
  links?: {
    prev?: string;
    next?: string;
  };
  meta?: {
    totalPages?: number;
    totalRecords?: number;
  };
}

export interface UpBankErrorResponse {
  errors: Array<{
    status: string;
    title: string;
    detail: string;
    source?: {
      parameter?: string;
      pointer?: string;
    };
  }>;
}

export interface RateLimitInfo {
  remaining: number;
  reset: Date;
  limit: number;
}

export class UpBankApiClient {
  private baseUrl = 'https://api.up.com.au/api/v1';
  private token: string;
  private rateLimitInfo?: RateLimitInfo;
  private requestQueue: Array<() => Promise<any>> = [];
  private processing = false;

  constructor(token: string) {
    this.token = this.sanitizeToken(token);
  }

  /**
   * Update the API token
   */
  setToken(token: string): void {
    this.token = this.sanitizeToken(token);
  }

  /**
   * Sanitize and validate UP Bank token
   */
  private sanitizeToken(token: string): string {
    if (!token) {
      throw new Error('UP Bank token is required');
    }

    // Trim whitespace
    const cleanToken = token.trim();

    // Validate token format
    if (!this.isValidUpBankToken(cleanToken)) {
      throw new Error('Invalid UP Bank token format. Token should start with "up:yeah:" and be approximately 120+ characters long.');
    }

    return cleanToken;
  }

  /**
   * Validate UP Bank token format
   */
  private isValidUpBankToken(token: string): boolean {
    // UP Bank tokens start with "up:yeah:" and are typically 120+ characters
    return token.startsWith('up:yeah:') && token.length > 50;
  }

  /**
   * Get current token (for debugging)
   */
  getToken(): string {
    return this.token;
  }

  /**
   * Make authenticated request with rate limiting and error handling
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<UpBankApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    // Log request for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔗 UP Bank API Request: ${options.method || 'GET'} ${url}`);
      console.log(`🔑 Authorization: Bearer ${this.token.substring(0, 15)}...`);
    }

    const requestOptions: RequestInit = {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, requestOptions);

      // Log response for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log(`📡 UP Bank API Response: ${response.status} ${response.statusText}`);
      }

      // Update rate limit info
      this.updateRateLimitInfo(response);

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 60000; // Default 1 minute

        console.log(`Rate limited. Waiting ${waitTime}ms before retry...`);
        await this.wait(waitTime);

        // Retry the request
        return this.makeRequest<T>(endpoint, options);
      }

      // Handle authentication errors specifically
      if (response.status === 401) {
        const errorText = await response.text();
        console.error('🚫 Authentication failed:', errorText);
        throw new Error('Authentication failed: Invalid or expired UP Bank token. Please check your token and try again.');
      }

      if (response.status === 403) {
        const errorText = await response.text();
        console.error('🚫 Authorization failed:', errorText);
        throw new Error('Authorization failed: Your token does not have permission to access this resource.');
      }

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

        try {
          const errorData: UpBankErrorResponse = await response.json();
          if (errorData.errors && errorData.errors.length > 0) {
            errorMessage = errorData.errors[0].detail || errorMessage;
          }
        } catch (jsonError) {
          // If JSON parsing fails, use the status text
          console.warn('Failed to parse error response as JSON:', jsonError);
        }

        console.error(`🚫 UP Bank API Error: ${errorMessage}`);
        throw new Error(`UP Bank API Error: ${errorMessage}`);
      }

      const responseData = await response.json();

      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ UP Bank API Success:`, responseData);
      }

      return responseData;

    } catch (error) {
      if (error instanceof Error) {
        // If it's already a formatted error, re-throw it
        if (error.message.startsWith('UP Bank API Error:') ||
            error.message.startsWith('Authentication failed:') ||
            error.message.startsWith('Authorization failed:')) {
          throw error;
        }

        // Handle network errors
        if (error.message.includes('fetch')) {
          throw new Error('Network error: Unable to connect to UP Bank API. Please check your internet connection.');
        }
      }

      // Generic error fallback
      console.error('🚫 Unexpected error:', error);
      throw new Error(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    }
  }

  /**
   * Update rate limit information from response headers
   */
  private updateRateLimitInfo(response: Response): void {
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const reset = response.headers.get('X-RateLimit-Reset');
    const limit = response.headers.get('X-RateLimit-Limit');

    if (remaining && reset && limit) {
      this.rateLimitInfo = {
        remaining: parseInt(remaining),
        reset: new Date(parseInt(reset) * 1000),
        limit: parseInt(limit)
      };
    }
  }

  /**
   * Wait for specified milliseconds
   */
  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get rate limit information
   */
  getRateLimitInfo(): RateLimitInfo | undefined {
    return this.rateLimitInfo;
  }

  /**
   * Test API connection and get user info
   */
  async testConnection(): Promise<{ success: boolean; accounts?: UpBankAccount[]; error?: string }> {
    try {
      const accounts = await this.getAccounts();
      return {
        success: true,
        accounts: accounts.data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      };
    }
  }

  /**
   * Get all accounts
   */
  async getAccounts(): Promise<UpBankApiResponse<UpBankAccount[]>> {
    return this.makeRequest<UpBankAccount[]>('/accounts');
  }

  /**
   * Get account by ID
   */
  async getAccount(accountId: string): Promise<UpBankApiResponse<UpBankAccount>> {
    return this.makeRequest<UpBankAccount>(`/accounts/${accountId}`);
  }

  /**
   * Get transactions with pagination and filtering
   */
  async getTransactions(options: {
    accountId?: string;
    since?: Date;
    until?: Date;
    status?: 'HELD' | 'SETTLED';
    pageSize?: number;
    pageAfter?: string;
  } = {}): Promise<UpBankApiResponse<UpBankTransaction[]>> {
    const params = new URLSearchParams();

    if (options.accountId) {
      params.append('filter[account]', options.accountId);
    }
    if (options.since) {
      params.append('filter[since]', options.since.toISOString());
    }
    if (options.until) {
      params.append('filter[until]', options.until.toISOString());
    }
    if (options.status) {
      params.append('filter[status]', options.status);
    }
    if (options.pageSize) {
      params.append('page[size]', options.pageSize.toString());
    }
    if (options.pageAfter) {
      params.append('page[after]', options.pageAfter);
    }

    const queryString = params.toString();
    const endpoint = `/transactions${queryString ? `?${queryString}` : ''}`;

    return this.makeRequest<UpBankTransaction[]>(endpoint);
  }

  /**
   * Get a specific transaction by ID
   */
  async getTransaction(transactionId: string): Promise<UpBankApiResponse<UpBankTransaction>> {
    return this.makeRequest<UpBankTransaction>(`/transactions/${transactionId}`);
  }

  /**
   * Update transaction category
   */
  async updateTransactionCategory(
    transactionId: string,
    categoryId: string | null
  ): Promise<void> {
    const body = categoryId
      ? {
          data: {
            type: 'categories',
            id: categoryId
          }
        }
      : { data: null };

    await this.makeRequest(`/transactions/${transactionId}/relationships/category`, {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  }

  /**
   * Update transaction tags
   */
  async updateTransactionTags(
    transactionId: string,
    tagIds: string[]
  ): Promise<void> {
    const body = {
      data: tagIds.map(id => ({
        type: 'tags',
        id
      }))
    };

    await this.makeRequest(`/transactions/${transactionId}/relationships/tags`, {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<UpBankApiResponse<UpBankCategory[]>> {
    return this.makeRequest<UpBankCategory[]>('/categories');
  }

  /**
   * Get all tags
   */
  async getTags(): Promise<UpBankApiResponse<UpBankTag[]>> {
    return this.makeRequest<UpBankTag[]>('/tags');
  }

  /**
   * Create a new tag
   */
  async createTag(tagName: string): Promise<UpBankApiResponse<UpBankTag>> {
    const body = {
      data: {
        attributes: {
          label: tagName
        }
      }
    };

    return this.makeRequest<UpBankTag>('/tags', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  /**
   * Get all transactions across all accounts (with automatic pagination)
   */
  async getAllTransactions(since?: Date): Promise<UpBankTransaction[]> {
    const allTransactions: UpBankTransaction[] = [];
    let pageAfter: string | undefined;

    do {
      const response = await this.getTransactions({
        since,
        pageSize: 100,
        pageAfter
      });

      allTransactions.push(...response.data);

      // Extract next page cursor from links
      const nextLink = response.links?.next;
      if (nextLink) {
        const url = new URL(nextLink);
        pageAfter = url.searchParams.get('page[after]') || undefined;
      } else {
        pageAfter = undefined;
      }
    } while (pageAfter);

    return allTransactions;
  }

  /**
   * Convert UP Bank transaction to internal Transaction format
   */
  convertToInternalTransaction(
    upTransaction: UpBankTransaction,
    accountName: string
  ): Omit<Transaction, 'id' | 'uniqueId' | 'createdAt' | 'updatedAt'> {
    return {
      upTransactionId: upTransaction.id,
      accountId: upTransaction.account?.data.id,
      amount: upTransaction.amount.valueInBaseUnits / 100, // Convert cents to dollars
      date: new Date(upTransaction.settledAt || upTransaction.createdAt),
      description: upTransaction.description,
      category: '', // Will be populated by category mapping
      tags: '', // Will be populated by tag mapping
      type: this.inferTransactionType(upTransaction),
      status: upTransaction.status,
      account: accountName,
      source: 'up_bank',
      syncStatus: 'synced'
    };
  }

  /**
   * Infer transaction type from UP Bank data
   */
  private inferTransactionType(upTransaction: UpBankTransaction): string {
    const description = upTransaction.description.toLowerCase();
    const rawText = upTransaction.rawText?.toLowerCase() || '';

    // Pattern matching for transaction types
    if (description.includes('transfer') || rawText.includes('transfer')) {
      return 'Transfer';
    }
    if (description.includes('atm') || rawText.includes('atm')) {
      return 'ATM Withdrawal';
    }
    if (upTransaction.amount.valueInBaseUnits > 0) {
      return 'Credit';
    }

    return 'Purchase';
  }

  /**
   * Batch update multiple transactions (with rate limiting)
   */
  async batchUpdateTransactions(
    updates: Array<{
      transactionId: string;
      categoryId?: string | null;
      tagIds?: string[];
    }>
  ): Promise<{
    successful: number;
    failed: number;
    errors: Array<{ transactionId: string; error: string }>;
  }> {
    const results = {
      successful: 0,
      failed: 0,
      errors: [] as Array<{ transactionId: string; error: string }>
    };

    for (const update of updates) {
      try {
        // Update category if provided
        if (update.categoryId !== undefined) {
          await this.updateTransactionCategory(update.transactionId, update.categoryId);
        }

        // Update tags if provided
        if (update.tagIds !== undefined) {
          await this.updateTransactionTags(update.transactionId, update.tagIds);
        }

        results.successful++;

        // Small delay to avoid hitting rate limits
        await this.wait(100);

      } catch (error) {
        results.failed++;
        results.errors.push({
          transactionId: update.transactionId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }
}