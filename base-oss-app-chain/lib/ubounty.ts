import { NextRequest } from 'next/server';

export interface UbountyConfig {
  baseUrl?: string;
  apiKey?: string;
  webhookSecret?: string;
}

export interface BountyUrlParams {
  title: string;
  description: string;
  amount: number;
  currency?: string;
  deadline?: Date;
  tags?: string[];
  requirements?: string[];
  githubRepo?: string;
  githubIssue?: string;
}

export interface WebhookPayload {
  event: string;
  bounty_id: string;
  bounty: {
    id: string;
    title: string;
    description: string;
    amount: number;
    currency: string;
    status: 'open' | 'in_progress' | 'completed' | 'cancelled';
    creator: {
      id: string;
      username: string;
      email: string;
    };
    hunter?: {
      id: string;
      username: string;
      email: string;
    };
    created_at: string;
    updated_at: string;
    deadline?: string;
    tags: string[];
    requirements: string[];
    github_repo?: string;
    github_issue?: string;
  };
  timestamp: string;
}

const DEFAULT_CONFIG: UbountyConfig = {
  baseUrl: process.env.UBOUNTY_BASE_URL || 'https://ubounty.xyz',
  apiKey: process.env.UBOUNTY_API_KEY,
  webhookSecret: process.env.UBOUNTY_WEBHOOK_SECRET,
};

export class Ubounty {
  private config: UbountyConfig;

  constructor(config: Partial<UbountyConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate a URL for creating a new bounty on Ubounty
   */
  generateBountyUrl(params: BountyUrlParams): string {
    const url = new URL('/create', this.config.baseUrl);
    
    // Add basic parameters
    url.searchParams.set('title', params.title);
    url.searchParams.set('description', params.description);
    url.searchParams.set('amount', params.amount.toString());
    
    if (params.currency) {
      url.searchParams.set('currency', params.currency);
    }
    
    if (params.deadline) {
      url.searchParams.set('deadline', params.deadline.toISOString());
    }
    
    if (params.tags && params.tags.length > 0) {
      url.searchParams.set('tags', params.tags.join(','));
    }
    
    if (params.requirements && params.requirements.length > 0) {
      url.searchParams.set('requirements', params.requirements.join('|'));
    }
    
    if (params.githubRepo) {
      url.searchParams.set('github_repo', params.githubRepo);
    }
    
    if (params.githubIssue) {
      url.searchParams.set('github_issue', params.githubIssue);
    }

    return url.toString();
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.config.webhookSecret) {
      throw new Error('Webhook secret not configured');
    }

    // Implementation would depend on Ubounty's signature method
    // This is a placeholder for HMAC-SHA256 verification
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', this.config.webhookSecret);
    hmac.update(payload);
    const expectedSignature = `sha256=${hmac.digest('hex')}`;
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Parse webhook payload from request
   */
  async parseWebhookPayload(request: NextRequest): Promise<WebhookPayload> {
    const payload = await request.text();
    const signature = request.headers.get('x-ubounty-signature');
    
    if (!signature) {
      throw new Error('Missing webhook signature');
    }

    if (!this.verifyWebhookSignature(payload, signature)) {
      throw new Error('Invalid webhook signature');
    }

    try {
      return JSON.parse(payload) as WebhookPayload;
    } catch (error) {
      throw new Error('Invalid webhook payload JSON');
    }
  }

  /**
   * Create a bounty via API (if supported)
   */
  async createBounty(params: BountyUrlParams): Promise<any> {
    if (!this.config.apiKey) {
      throw new Error('API key not configured');
    }

    const response = await fetch(`${this.config.baseUrl}/api/bounties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        title: params.title,
        description: params.description,
        amount: params.amount,
        currency: params.currency || 'USD',
        deadline: params.deadline?.toISOString(),
        tags: params.tags || [],
        requirements: params.requirements || [],
        github_repo: params.githubRepo,
        github_issue: params.githubIssue,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create bounty: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get bounty details via API
   */
  async getBounty(bountyId: string): Promise<any> {
    if (!this.config.apiKey) {
      throw new Error('API key not configured');
    }

    const response = await fetch(`${this.config.baseUrl}/api/bounties/${bountyId}`, {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get bounty: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Update bounty status via API
   */
  async updateBountyStatus(bountyId: string, status: 'open' | 'in_progress' | 'completed' | 'cancelled'): Promise<any> {
    if (!this.config.apiKey) {
      throw new Error('API key not configured');
    }

    const response = await fetch(`${this.config.baseUrl}/api/bounties/${bountyId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update bounty status: ${response.statusText}`);
    }

    return response.json();
  }
}

// Default instance
export const ubounty = new Ubounty();

// Convenience functions
export function generateBountyUrl(params: BountyUrlParams): string {
  return ubounty.generateBountyUrl(params);
}

export async function parseWebhookPayload(request: NextRequest): Promise<WebhookPayload> {
  return ubounty.parseWebhookPayload(request);
}

export function verifyWebhookSignature(payload: string, signature: string): boolean {
  return ubounty.verifyWebhookSignature(payload, signature);
}