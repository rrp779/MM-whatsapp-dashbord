/**
 * Chat and contact types.
 * Payloads align with backend (n8n) response structures.
 */

export interface Contact {
  id: string;
  name: string;
  avatar?: string;
  phone_number?: string;
}

export interface Chat {
  id: string;
  contact: Contact;
  lastMessage?: { text: string; timestamp: string };
  unreadCount?: number;
}

/**
 * Contact API response structure from /contacts endpoint.
 * This represents a contact/conversation in the contacts list.
 */
export interface ContactApiResponse {
  id: string;
  phone_number: string;
  name: string;
  unread_count: number;
  last_message_at: string;
  is_archived: boolean;
  first_message_at: string;
  /** Optional last message text. May not be present for all contacts. */
  last_message?: string;
}
