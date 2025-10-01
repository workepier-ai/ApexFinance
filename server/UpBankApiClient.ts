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

export class UpBankApiClient {
  private baseUrl = 'https://api.up.com.au/api/v1';
  private token: string;

  constructor(token: string) {
    this.token = token.trim();
  }

  /**
   * Make authenticated request
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<UpBankApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    console.log(`🔗 UP Bank API Request: ${options.method || 'GET'} ${url}`);

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

      console.log(`📡 UP Bank API Response: ${response.status} ${response.statusText}`);

      if (response.status === 401) {
        throw new Error('Authentication failed: Invalid or expired UP Bank token');
      }

      if (response.status === 403) {
        throw new Error('Authorization failed: Token does not have permission');
      }

      // Handle 204 No Content (successful response with no body)
      if (response.status === 204) {
        console.log(`✅ UP Bank API returned 204 No Content (success)`);
        return { data: null } as any;
      }

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

        try {
          const errorData: UpBankErrorResponse = await response.json();
          if (errorData.errors && errorData.errors.length > 0) {
            errorMessage = errorData.errors[0].detail || errorMessage;
          }
        } catch (jsonError) {
          // Use status text if JSON parsing fails
        }

        throw new Error(`UP Bank API Error: ${errorMessage}`);
      }

      const responseData = await response.json();
      return responseData;

    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unexpected error occurred');
    }
  }

  /**
   * Get transactions with pagination and filtering
   */
  async getTransactions(options: {
    accountId?: string;
    since?: string;
    until?: string;
    status?: 'HELD' | 'SETTLED';
    pageSize?: number;
    pageAfter?: string;
  } = {}): Promise<UpBankApiResponse<any[]>> {
    const params = new URLSearchParams();

    if (options.accountId) {
      params.append('filter[account]', options.accountId);
    }
    if (options.since) {
      params.append('filter[since]', options.since);
    }
    if (options.until) {
      params.append('filter[until]', options.until);
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

    return this.makeRequest<any[]>(endpoint);
  }

  /**
   * Get all accounts
   */
  async getAccounts(): Promise<UpBankApiResponse<any[]>> {
    return this.makeRequest<any[]>('/accounts');
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<UpBankApiResponse<any[]>> {
    return this.makeRequest<any[]>('/categories');
  }

  /**
   * Get all tags
   */
  async getTags(): Promise<UpBankApiResponse<any[]>> {
    return this.makeRequest<any[]>('/tags');
  }

  /**
   * Get single transaction by ID
   * @param transactionId - UP Bank transaction ID
   */
  async getTransaction(transactionId: string): Promise<UpBankApiResponse<any>> {
    return this.makeRequest<any>(`/transactions/${transactionId}`);
  }

  /**
   * List all webhooks
   */
  async listWebhooks(): Promise<UpBankApiResponse<any[]>> {
    return this.makeRequest<any[]>('/webhooks');
  }

  /**
   * Create a new webhook
   * @param url - The URL to receive webhook events
   * @param description - Optional description for the webhook
   */
  async createWebhook(url: string, description?: string): Promise<UpBankApiResponse<any>> {
    const body = {
      data: {
        attributes: {
          url: url,
          description: description || 'ApexFinance webhook for transaction updates'
        }
      }
    };

    return this.makeRequest<any>('/webhooks', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  /**
   * Delete a webhook
   * @param webhookId - The webhook ID to delete
   */
  async deleteWebhook(webhookId: string): Promise<void> {
    await this.makeRequest(`/webhooks/${webhookId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Ping a webhook to test it
   * @param webhookId - The webhook ID to ping
   */
  async pingWebhook(webhookId: string): Promise<UpBankApiResponse<any>> {
    return this.makeRequest<any>(`/webhooks/${webhookId}/ping`, {
      method: 'POST'
    });
  }

  /**
   * Get webhook delivery logs
   * @param webhookId - The webhook ID to get logs for
   * @param options - Optional pagination and filtering
   */
  async getWebhookLogs(webhookId: string, options: {
    pageSize?: number;
    since?: string;
  } = {}): Promise<UpBankApiResponse<any[]>> {
    const params = new URLSearchParams();

    if (options.pageSize) {
      params.append('page[size]', options.pageSize.toString());
    }

    const queryString = params.toString();
    const endpoint = `/webhooks/${webhookId}/logs${queryString ? `?${queryString}` : ''}`;

    return this.makeRequest<any[]>(endpoint);
  }

  /**
   * Update transaction category
   * @param transactionId - UP Bank transaction ID
   * @param categoryId - Category ID (e.g., "groceries", "takeaway")
   */
  async updateTransactionCategory(transactionId: string, categoryId: string): Promise<void> {
    const endpoint = `/transactions/${transactionId}/relationships/category`;
    const body = {
      data: {
        type: 'categories',
        id: categoryId
      }
    };

    try {
      await this.makeRequest(endpoint, {
        method: 'PATCH',
        body: JSON.stringify(body)
      });
      console.log(`✅ Updated category for transaction ${transactionId} to ${categoryId}`);
    } catch (error) {
      console.error(`❌ Failed to update category for transaction ${transactionId}:`, error);
      throw error;
    }
  }

  /**
   * Add tags to transaction
   * @param transactionId - UP Bank transaction ID
   * @param tagIds - Array of tag IDs to add
   */
  async addTransactionTags(transactionId: string, tagIds: string[]): Promise<void> {
    const endpoint = `/transactions/${transactionId}/relationships/tags`;

    try {
      for (const tagId of tagIds) {
        const body = {
          data: [{
            type: 'tags',
            id: tagId
          }]
        };

        await this.makeRequest(endpoint, {
          method: 'POST',
          body: JSON.stringify(body)
        });
        console.log(`✅ Added tag "${tagId}" to transaction ${transactionId}`);
      }

      if (tagIds.length > 0) {
        console.log(`✅ Successfully added ${tagIds.length} tag(s) to transaction ${transactionId}`);
      }
    } catch (error) {
      console.error(`❌ Failed to add tags to transaction ${transactionId}:`, error);
      throw error;
    }
  }

  /**
   * Remove tag from transaction
   * @param transactionId - UP Bank transaction ID
   * @param tagId - Tag ID to remove
   */
  async removeTransactionTag(transactionId: string, tagId: string): Promise<void> {
    const endpoint = `/transactions/${transactionId}/relationships/tags`;
    const body = {
      data: [{
        type: 'tags',
        id: tagId
      }]
    };

    try {
      await this.makeRequest(endpoint, {
        method: 'DELETE',
        body: JSON.stringify(body)
      });
      console.log(`✅ Removed tag "${tagId}" from transaction ${transactionId}`);
    } catch (error) {
      console.error(`❌ Failed to remove tag "${tagId}" from transaction ${transactionId}:`, error);
      throw error;
    }
  }

  /**
   * Update transaction tags (replaces all tags)
   * @param transactionId - UP Bank transaction ID
   * @param newTagIds - New tag IDs
   * @param oldTagIds - Previous tag IDs from local DB (may be stale)
   */
  async updateTransactionTags(transactionId: string, newTagIds: string[], oldTagIds: string[]): Promise<void> {
    try {
      // Fetch current tags from UP Bank to avoid duplication
      const txnResponse = await this.getTransaction(transactionId);
      const currentUpBankTags = txnResponse.data.relationships?.tags?.data?.map((t: any) => t.id) || [];

      console.log(`📋 Current UP Bank tags for ${transactionId}:`, currentUpBankTags);
      console.log(`📋 Desired new tags:`, newTagIds);

      // Remove tags that are no longer wanted (exist in UP Bank but not in newTagIds)
      const tagsToRemove = currentUpBankTags.filter((id: string) => !newTagIds.includes(id));
      for (const tagId of tagsToRemove) {
        await this.removeTransactionTag(transactionId, tagId);
      }

      // Add new tags (wanted in newTagIds but don't exist in UP Bank)
      const tagsToAdd = newTagIds.filter(id => !currentUpBankTags.includes(id));
      if (tagsToAdd.length > 0) {
        await this.addTransactionTags(transactionId, tagsToAdd);
      }

      console.log(`✅ Updated tags for transaction ${transactionId}`);
    } catch (error) {
      console.error(`❌ Failed to update tags for transaction ${transactionId}:`, error);
      throw error;
    }
  }
}