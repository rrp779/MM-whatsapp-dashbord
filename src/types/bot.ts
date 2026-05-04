/**
 * Bot user-related types.
 * Payloads align with backend (n8n) response structures.
 */

/**
 * Bot user information.
 */
export interface BotUser {
  id: string;
  name: string;
  phone_number: string;
}
