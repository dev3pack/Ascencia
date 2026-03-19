import { WebhookPayload } from '../types/ubounty';

export class UbountyHelper {
  private static readonly BASE_URL = 'https://ubounty.io';
  
  static generateBountyUrl(bountyId: string): string {
    return `${this.BASE_URL}/bounty/${bountyId}`;
  }
  
  static generateCreateBountyUrl(params?: {
    title?: string;
    description?: string;
    amount?: number;
    currency?: string;
    tags?: string[];
  }): string {
    const url = new URL(`${this.BASE_URL}/create`);
    
    if (params) {
      if (params.title) url.searchParams.set('title', params.title);
      if (params.description) url.searchParams.set('description', params.description);
      if (params.amount) url.searchParams.set('amount', params.amount.toString());
      if (params.currency) url.searchParams.set('currency', params.currency);
      if (params.tags) url.searchParams.set('tags', params.tags.join(','));
    }
    
    return url.toString();
  }
  
  static generateUserProfileUrl(username: string): string {
    return `${this.BASE_URL}/user/${username}`;
  }
  
  static generateBountiesListUrl(filters?: {
    status?: 'open' | 'in_progress' | 'completed' | 'cancelled';
    category?: string;
    minAmount?: number;
    maxAmount?: number;
    currency?: string;
    tags?: string[];
  }): string {
    const url = new URL(`${this.BASE_URL}/bounties`);
    
    if (filters) {
      if (filters.status) url.searchParams.set('status', filters.status);
      if (filters.category) url.searchParams.set('category', filters.category);
      if (filters.minAmount) url.searchParams.set('min_amount', filters.minAmount.toString());
      if (filters.maxAmount) url.searchParams.set('max_amount', filters.maxAmount.toString());
      if (filters.currency) url.searchParams.set('currency', filters.currency);
      if (filters.tags) url.searchParams.set('tags', filters.tags.join(','));
    }
    
    return url.toString();
  }
  
  static validateWebhookPayload(payload: any): WebhookPayload | null {
    try {
      const requiredFields = ['event', 'bountyId', 'timestamp'];
      
      if (!payload || typeof payload !== 'object') {
        return null;
      }
      
      for (const field of requiredFields) {
        if (!(field in payload)) {
          return null;
        }
      }
      
      const validEvents = [
        'bounty.created',
        'bounty.updated',
        'bounty.completed',
        'bounty.cancelled',
        'submission.created',
        'submission.accepted',
        'submission.rejected',
        'payment.sent',
        'payment.received'
      ];
      
      if (!validEvents.includes(payload.event)) {
        return null;
      }
      
      return payload as WebhookPayload;
    } catch (error) {
      return null;
    }
  }
  
  static processWebhookPayload(payload: WebhookPayload): {
    success: boolean;
    message: string;
    data?: any;
  } {
    try {
      switch (payload.event) {
        case 'bounty.created':
          return {
            success: true,
            message: 'Bounty created successfully',
            data: { bountyId: payload.bountyId, status: 'open' }
          };
          
        case 'bounty.completed':
          return {
            success: true,
            message: 'Bounty completed successfully',
            data: { bountyId: payload.bountyId, status: 'completed' }
          };
          
        case 'submission.created':
          return {
            success: true,
            message: 'New submission received',
            data: { bountyId: payload.bountyId, submissionId: payload.data?.submissionId }
          };
          
        case 'submission.accepted':
          return {
            success: true,
            message: 'Submission accepted',
            data: { bountyId: payload.bountyId, submissionId: payload.data?.submissionId }
          };
          
        case 'payment.sent':
          return {
            success: true,
            message: 'Payment sent successfully',
            data: { bountyId: payload.bountyId, amount: payload.data?.amount, currency: payload.data?.currency }
          };
          
        default:
          return {
            success: true,
            message: 'Webhook processed',
            data: { event: payload.event, bountyId: payload.bountyId }
          };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to process webhook payload',
        data: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }
  
  static formatBountyAmount(amount: number, currency: string): string {
    const formatters: Record<string, Intl.NumberFormat> = {
      USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
      EUR: new Intl.NumberFormat('en-EU', { style: 'currency', currency: 'EUR' }),
      GBP: new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }),
    };
    
    const formatter = formatters[currency.toUpperCase()];
    if (formatter) {
      return formatter.format(amount);
    }
    
    // Fallback for crypto or unknown currencies
    return `${amount} ${currency.toUpperCase()}`;
  }
  
  static extractBountyIdFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      
      if (pathParts.length >= 3 && pathParts[1] === 'bounty') {
        return pathParts[2];
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }
}