import { Address } from "viem";

export interface UbountyBounty {
  id: string;
  title: string;
  description: string;
  reward: string;
  currency: string;
  status: "open" | "in_progress" | "completed" | "cancelled";
  creator: Address;
  assignee?: Address;
  deadline?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UbountyWebhookPayload {
  event: "bounty.created" | "bounty.updated" | "bounty.assigned" | "bounty.completed" | "bounty.cancelled";
  bounty: UbountyBounty;
  timestamp: string;
}

export function createUbountyUrl(bountyId: string, baseUrl: string = "https://ubounty.io"): string {
  return `${baseUrl}/bounty/${bountyId}`;
}

export function parseUbountyWebhook(payload: unknown): UbountyWebhookPayload | null {
  try {
    const data = payload as any;
    
    if (!data || typeof data !== "object") {
      return null;
    }

    const { event, bounty, timestamp } = data;

    if (!event || !bounty || !timestamp) {
      return null;
    }

    const validEvents = ["bounty.created", "bounty.updated", "bounty.assigned", "bounty.completed", "bounty.cancelled"];
    if (!validEvents.includes(event)) {
      return null;
    }

    // Validate bounty object structure
    if (!bounty.id || !bounty.title || !bounty.description || !bounty.reward || !bounty.currency || !bounty.status || !bounty.creator) {
      return null;
    }

    return {
      event,
      bounty: {
        id: bounty.id,
        title: bounty.title,
        description: bounty.description,
        reward: bounty.reward,
        currency: bounty.currency,
        status: bounty.status,
        creator: bounty.creator,
        assignee: bounty.assignee,
        deadline: bounty.deadline,
        tags: bounty.tags,
        createdAt: bounty.createdAt,
        updatedAt: bounty.updatedAt,
      },
      timestamp,
    };
  } catch (error) {
    return null;
  }
}

export function formatBountyReward(reward: string, currency: string): string {
  const numericReward = parseFloat(reward);
  if (isNaN(numericReward)) {
    return `${reward} ${currency}`;
  }
  
  return `${numericReward.toLocaleString()} ${currency}`;
}

export function getBountyStatusColor(status: UbountyBounty["status"]): string {
  switch (status) {
    case "open":
      return "green";
    case "in_progress":
      return "yellow";
    case "completed":
      return "blue";
    case "cancelled":
      return "red";
    default:
      return "gray";
  }
}