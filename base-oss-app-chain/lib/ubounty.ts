import { createHmac } from 'crypto';

export interface UbountyBounty {
  id: string;
  title: string;
  description: string;
  reward: number;
  currency: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  creator: string;
  assignee?: string;
  created_at: string;
  updated_at: string;
  deadline?: string;
  skills: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface UbountyWebhookPayload {
  event: string;
  bounty: UbountyBounty;
  timestamp: string;
}

export class UbountyHelper {
  private baseUrl: string;
  private webhookSecret?: string;

  constructor(baseUrl: string = 'https://ubounty.org', webhookSecret?: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.webhookSecret = webhookSecret;
  }

  /**
   * Generate URL for a specific bounty
   */
  getBountyUrl(bountyId: string): string {
    return `${this.baseUrl}/bounty/${bountyId}`;
  }

  /**
   * Generate URL for user profile
   */
  getUserProfileUrl(username: string): string {
    return `${this.baseUrl}/profile/${username}`;
  }

  /**
   * Generate URL for bounty creation
   */
  getCreateBountyUrl(): string {
    return `${this.baseUrl}/create`;
  }

  /**
   * Generate URL for bounty listing with filters
   */
  getBountiesUrl(filters?: {
    status?: string;
    difficulty?: string;
    skills?: string[];
    minReward?: number;
    maxReward?: number;
  }): string {
    const url = new URL(`${this.baseUrl}/bounties`);
    
    if (filters) {
      if (filters.status) url.searchParams.set('status', filters.status);
      if (filters.difficulty) url.searchParams.set('difficulty', filters.difficulty);
      if (filters.skills?.length) url.searchParams.set('skills', filters.skills.join(','));
      if (filters.minReward) url.searchParams.set('min_reward', filters.minReward.toString());
      if (filters.maxReward) url.searchParams.set('max_reward', filters.maxReward.toString());
    }
    
    return url.toString();
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.webhookSecret) {
      throw new Error('Webhook secret not configured');
    }

    const expectedSignature = createHmac('sha256', this.webhookSecret)
      .update(payload, 'utf8')
      .digest('hex');

    const expectedHeader = `sha256=${expectedSignature}`;
    
    return signature === expectedHeader;
  }

  /**
   * Parse webhook payload
   */
  parseWebhookPayload(payload: string): UbountyWebhookPayload {
    try {
      return JSON.parse(payload) as UbountyWebhookPayload;
    } catch (error) {
      throw new Error('Invalid webhook payload format');
    }
  }

  /**
   * Format bounty reward for display
   */
  formatReward(bounty: UbountyBounty): string {
    const currencySymbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      BTC: '₿',
      ETH: 'Ξ'
    };

    const symbol = currencySymbols[bounty.currency] || bounty.currency;
    return `${symbol}${bounty.reward.toLocaleString()}`;
  }

  /**
   * Get bounty status badge color
   */
  getStatusBadgeColor(status: UbountyBounty['status']): string {
    const colors: Record<UbountyBounty['status'], string> = {
      open: 'green',
      in_progress: 'blue',
      completed: 'purple',
      cancelled: 'red'
    };

    return colors[status] || 'gray';
  }

  /**
   * Get difficulty badge color
   */
  getDifficultyBadgeColor(difficulty: UbountyBounty['difficulty']): string {
    const colors: Record<UbountyBounty['difficulty'], string> = {
      beginner: 'green',
      intermediate: 'yellow',
      advanced: 'red'
    };

    return colors[difficulty] || 'gray';
  }

  /**
   * Check if bounty deadline is approaching (within 7 days)
   */
  isDeadlineApproaching(bounty: UbountyBounty): boolean {
    if (!bounty.deadline) return false;
    
    const deadline = new Date(bounty.deadline);
    const now = new Date();
    const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysUntilDeadline <= 7 && daysUntilDeadline > 0;
  }

  /**
   * Check if bounty deadline has passed
   */
  isDeadlinePassed(bounty: UbountyBounty): boolean {
    if (!bounty.deadline) return false;
    
    const deadline = new Date(bounty.deadline);
    const now = new Date();
    
    return now > deadline;
  }

  /**
   * Generate embed data for Discord/Slack
   */
  generateBountyEmbed(bounty: UbountyBounty) {
    return {
      title: bounty.title,
      description: bounty.description.length > 200 
        ? `${bounty.description.substring(0, 200)}...` 
        : bounty.description,
      url: this.getBountyUrl(bounty.id),
      color: this.getStatusBadgeColor(bounty.status),
      fields: [
        {
          name: 'Reward',
          value: this.formatReward(bounty),
          inline: true
        },
        {
          name: 'Status',
          value: bounty.status.replace('_', ' ').toUpperCase(),
          inline: true
        },
        {
          name: 'Difficulty',
          value: bounty.difficulty.charAt(0).toUpperCase() + bounty.difficulty.slice(1),
          inline: true
        },
        {
          name: 'Skills',
          value: bounty.skills.join(', ') || 'None specified',
          inline: false
        }
      ],
      footer: {
        text: `Created by ${bounty.creator}`,
        icon_url: this.getUserProfileUrl(bounty.creator)
      },
      timestamp: bounty.created_at
    };
  }
}

export default UbountyHelper;