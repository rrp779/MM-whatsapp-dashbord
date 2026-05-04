/**
 * Message-related types.
 * Payloads align with backend (n8n) response structures.
 * Extend with template / interactive types when supported.
 */

/** Delivery/read status for outbound messages */
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read';

/** Sender of the message */
export type MessageSender = 'user' | 'contact';

/**
 * Message type. Extend with 'template' | 'interactive' when supported.
 */
export type MessageType = 'text';

/** Freeform text message. Additional types (template, interactive) will be added later. */
export interface TextMessage {
  id: string;
  messageType: 'text';
  text: string;
  sender: MessageSender;
  timestamp: string; // ISO 8601
  /** For sender=user: delivery/read status */
  status?: MessageStatus;
  /** For sender=contact: whether the user has read this message */
  readReceipt?: boolean;
}

/** Union of all message types. Extend when adding template/interactive. */
export type Message = TextMessage;

/**
 * Message API response structure from /messages endpoint.
 * This represents a message in the API response format.
 */
export interface MessageApiResponse {
  id: string;
  user_id: string;
  contact_id: string;
  message_id: string;
  direction: 'inbound' | 'outbound';
  message_type: 'text';
  content: string;
  media_url: string | null;
  status: string;
  timestamp: string;
  created_at: string;
}
