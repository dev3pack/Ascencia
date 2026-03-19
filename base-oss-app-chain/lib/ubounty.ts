export interface UbountyBountyData {
  title: string;
  description: string;
  reward?: string;
  deadline?: string;
  skills?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  repository?: string;
}

export interface UbountyWebhookPayload {
  event: string;
  bounty: {
    id: string;
    title: string;
    description: string;
    reward: string;
    status: 'open' | 'in_progress' | 'completed' | 'cancelled';
    creator: {
      id: string;
      username: string;
      email: string;
    };
    assignee?: {
      id: string;
      username: string;
      email: string;
    };
    deadline?: string;
    skills: string[];
    difficulty: string;
    repository?: string;
    created_at: string;
    updated_at: string;
  };
}

export function createUbountyUrl(data: UbountyBountyData): string {
  const baseUrl = 'https://ubounty.io/create';
  const params = new URLSearchParams();

  params.append('title', data.title);
  params.append('description', data.description);

  if (data.reward) {
    params.append('reward', data.reward);
  }

  if (data.deadline) {
    params.append('deadline', data.deadline);
  }

  if (data.skills && data.skills.length > 0) {
    params.append('skills', data.skills.join(','));
  }

  if (data.difficulty) {
    params.append('difficulty', data.difficulty);
  }

  if (data.repository) {
    params.append('repository', data.repository);
  }

  return `${baseUrl}?${params.toString()}`;
}

export function parseUbountyWebhook(payload: any): UbountyWebhookPayload | null {
  try {
    // Validate required fields
    if (!payload.event || !payload.bounty) {
      return null;
    }

    const bounty = payload.bounty;
    if (!bounty.id || !bounty.title || !bounty.status || !bounty.creator) {
      return null;
    }

    return {
      event: payload.event,
      bounty: {
        id: bounty.id,
        title: bounty.title,
        description: bounty.description || '',
        reward: bounty.reward || '0',
        status: bounty.status,
        creator: {
          id: bounty.creator.id,
          username: bounty.creator.username || '',
          email: bounty.creator.email || ''
        },
        assignee: bounty.assignee ? {
          id: bounty.assignee.id,
          username: bounty.assignee.username || '',
          email: bounty.assignee.email || ''
        } : undefined,
        deadline: bounty.deadline,
        skills: bounty.skills || [],
        difficulty: bounty.difficulty || 'intermediate',
        repository: bounty.repository,
        created_at: bounty.created_at || new Date().toISOString(),
        updated_at: bounty.updated_at || new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error parsing Ubounty webhook:', error);
    return null;
  }
}

export function validateUbountyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!signature || !secret) {
    return false;
  }

  try {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    const providedSignature = signature.replace('sha256=', '');
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(providedSignature, 'hex')
    );
  } catch (error) {
    console.error('Error validating webhook signature:', error);
    return false;
  }
}