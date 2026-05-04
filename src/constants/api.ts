/**
 * API Constants File
 *
 * This file contains all API endpoint definitions with their URLs, methods, and response structures.
 * All API calls should reference constants from this file.
 *
 * Base URLs, webhook ID, and USE_MOCK_DATA come from the root config.ts (single source of truth).
 *
 * Rules:
 * - All API endpoints must be defined here
 * - No hardcoded API URLs anywhere else in the codebase
 * - Each API object contains: url, method, and response structure
 * - Set USE_MOCK_DATA in config.ts to false to use actual API calls
 */

import {
  CURRENT_ENVIRONMENT,
  API_BASE_URLS,
  WEBHOOK_ID,
  USE_MOCK_DATA,
  type Environment,
} from '../../config';

// Re-export for consumers that import from this file
export type { Environment };
export { CURRENT_ENVIRONMENT, USE_MOCK_DATA };

// ============================================================================
// Base Configuration (from config.ts)
// ============================================================================

/**
 * Base API URL for all endpoints.
 * Automatically selected based on CURRENT_ENVIRONMENT from config.ts.
 */
export const API_BASE_URL = API_BASE_URLS[CURRENT_ENVIRONMENT];

/**
 * Base URL for messages API (includes webhook ID in path).
 * Pattern: {base_url}/{webhook_id}/api/v1/
 */
const getMessagesApiBaseUrl = (): string => {
  const baseUrl = API_BASE_URLS[CURRENT_ENVIRONMENT];
  // Extract the base domain part and insert webhook_id
  // From: https://n8n.srv894857.hstgr.cloud/webhook-test/api/v1/
  // To: https://n8n.srv894857.hstgr.cloud/webhook-test/{webhook_id}/api/v1/
  // const baseDomain = baseUrl.replace('/api/v1/', '');
  return `${baseUrl}/${WEBHOOK_ID}/`;
};

// ============================================================================
// Chat APIs
// ============================================================================

/**
 * Contacts Listing API
 * 
 * Purpose: Fetches a paginated list of contacts/conversations for the sidebar
 * 
 * Endpoint: GET /contacts
 * 
 * Query Parameters:
 * - page: Page number for pagination (default: 1)
 * - limit: Number of items per page (default: 10)
 * - user_id: Bot user ID (retrieved from localStorage)
 * 
 * Response:
 * - status: 1 for success, 0 for error
 * - message: Response message
 * - data: Array of contact objects
 * - total: Total count for pagination
 * - next: Boolean indicating if there's a next page
 * - previous: Boolean indicating if there's a previous page
 * 
 * Contact Object:
 * - id: Contact ID
 * - phone_number: Contact phone number
 * - name: Contact name
 * - unread_count: Number of unread messages
 * - last_message_at: Timestamp of last message
 * - is_archived: Whether contact is archived
 * - first_message_at: Timestamp of first message
 * - last_message: Optional last message text (may not be present for all contacts)
 */
export const CONTACTS_API = {
  url: `${API_BASE_URL}contacts`,
  method: 'GET' as const,
  useMockData: USE_MOCK_DATA,
  mockResponse: {
    status: 1 as const,
    message: 'success',
    next: false as boolean,
    previous: false as boolean,
    total: 3,
    data: [
      {
        id: '93727ae5-34e7-470e-a01a-c1ae2f486f3a',
        phone_number: '914382442250',
        name: 'Lakshit Ukani',
        last_message: "You're almost there! 🚀",
        unread_count: 1,
        last_message_at: '2026-01-25T06:14:43.519Z',
        is_archived: false,
        first_message_at: '2026-01-25T06:14:43.519Z',
      },
      {
        id: 'a1b2c3d4-e5f6-470e-a01a-c1ae2f486f3b',
        phone_number: '919876543210',
        name: 'John Doe',
        unread_count: 0,
        last_message_at: '2026-01-24T10:30:00.000Z',
        is_archived: false,
        first_message_at: '2026-01-20T08:00:00.000Z',
      },
      {
        id: 'b2c3d4e5-f6a7-470e-a01a-c1ae2f486f3c',
        phone_number: '919765432109',
        name: 'Jane Smith',
        unread_count: 2,
        last_message_at: '2026-01-25T05:20:15.000Z',
        is_archived: false,
        first_message_at: '2026-01-22T14:15:00.000Z',
      },
    ],
  },
} as const;

/**
 * Messages API
 * 
 * Purpose: Fetches messages for a single conversation/contact
 * 
 * Endpoint: GET /{webhook_id}/api/v1/messages/:contactId
 * 
 * Path Parameters:
 * - contactId: The ID of the contact/conversation (string)
 * 
 * Query Parameters:
 * - page: Page number for pagination (default: 1)
 * - limit: Number of items per page (default: 20)
 * 
 * Response:
 * - status: 1 for success, 0 for error
 * - message: Response message
 * - data: Array of message objects
 * - total: Total count for pagination
 * - next: Boolean indicating if there's a next page
 * - previous: Boolean indicating if there's a previous page
 */
export const MESSAGES_API = {
  url: (contactId: string) => `${getMessagesApiBaseUrl()}${contactId}`,
  method: 'GET' as const,
  /** Default limit for messages per page */
  defaultLimit: 20,
  useMockData: USE_MOCK_DATA,
  mockResponse: {
    status: 1 as const,
    message: 'success',
    next: false as boolean,
    previous: false as boolean,
    total: 7,
    /* API returns newest-first; Chat.tsx reverses so display is oldest-at-top, newest-at-bottom */
    data: [
      {
        id: '7hj3g01e-l7e7-04ki-h58e-e8d0g87g4g8d',
        user_id: '34b7ff9d-d5b1-4fd8-8b32-0c67e401016e',
        contact_id: '93727ae5-34e7-470e-a01a-c1ae2f486f3a',
        message_id: 'wamid.HBgMOTE5OTg3NzQ5OTUwFQIAEhgUM0E4NUI0NkFGMjM2QkJFMzhEMDcG',
        direction: 'outbound' as const,
        message_type: 'text' as const,
        content: "You've got this! Once config and Supabase are set, turn off mock data and you'll see real conversations. 🚀",
        media_url: null,
        status: 'read',
        timestamp: '2026-01-25T12:26:15.000Z',
        created_at: '2026-01-25T06:56:15.000Z',
      },
      {
        id: '6gi2f90d-k6d6-93jh-g47d-d7c9f76f3f7c',
        user_id: '34b7ff9d-d5b1-4fd8-8b32-0c67e401016e',
        contact_id: '93727ae5-34e7-470e-a01a-c1ae2f486f3a',
        message_id: 'wamid.HBgMOTE5OTg3NzQ5OTUwFQIAEhgUM0E4NUI0NkFGMjM2QkJFMzhEMDcF',
        direction: 'outbound' as const,
        message_type: 'text' as const,
        content: "Step 3 — Connect your n8n workflow (or backend) to the same API and Supabase so messages and contacts sync here in real time.",
        media_url: null,
        status: 'delivered',
        timestamp: '2026-01-25T12:26:00.000Z',
        created_at: '2026-01-25T06:56:00.000Z',
      },
      {
        id: '5fh1e89c-j5c5-82ig-f36c-c6b8e65e2e6b',
        user_id: '34b7ff9d-d5b1-4fd8-8b32-0c67e401016e',
        contact_id: '93727ae5-34e7-470e-a01a-c1ae2f486f3a',
        message_id: 'wamid.HBgMOTE5OTg3NzQ5OTUwFQIAEhgUM0E4NUI0NkFGMjM2QkJFMzhEMDcE',
        direction: 'outbound' as const,
        message_type: 'text' as const,
        content: "Step 2 — Supabase: Create a project, get your project URL and anon key, add them to config.ts, and enable Realtime for your messages and contacts tables.",
        media_url: null,
        status: 'delivered',
        timestamp: '2026-01-25T12:25:45.000Z',
        created_at: '2026-01-25T06:55:45.000Z',
      },
      {
        id: '4eg0d78b-i4b4-71hf-e25b-b5a7d54d1d5a',
        user_id: '34b7ff9d-d5b1-4fd8-8b32-0c67e401016e',
        contact_id: '93727ae5-34e7-470e-a01a-c1ae2f486f3a',
        message_id: 'wamid.HBgMOTE5OTg3NzQ5OTUwFQIAEhgUM0E4NUI0NkFGMjM2QkJFMzhEMDcD',
        direction: 'outbound' as const,
        message_type: 'text' as const,
        content: "Step 1 — config.ts: Set USE_MOCK_DATA = false and add your API_BASE_URL and WEBHOOK_ID so the app talks to your real backend.",
        media_url: null,
        status: 'delivered',
        timestamp: '2026-01-25T12:25:30.000Z',
        created_at: '2026-01-25T06:55:30.000Z',
      },
      {
        id: '3df9c67a-h3a3-60ge-d14a-a496c43c0c49',
        user_id: '34b7ff9d-d5b1-4fd8-8b32-0c67e401016e',
        contact_id: '93727ae5-34e7-470e-a01a-c1ae2f486f3a',
        message_id: 'wamid.HBgMOTE5OTg3NzQ5OTUwFQIAEhgUM0E4NUI0NkFGMjM2QkJFMzhEMDcC',
        direction: 'inbound' as const,
        message_type: 'text' as const,
        content: "What do I do next?",
        media_url: null,
        status: 'sent',
        timestamp: '2026-01-25T12:25:15.000Z',
        created_at: '2026-01-25T06:55:15.000Z',
      },
      {
        id: '2cf8b56f-g292-59fd-c039-9385b32b9b38',
        user_id: '34b7ff9d-d5b1-4fd8-8b32-0c67e401016e',
        contact_id: '93727ae5-34e7-470e-a01a-c1ae2f486f3a',
        message_id: 'wamid.HBgMOTE5OTg3NzQ5OTUwFQIAEhgUM0E4NUI0NkFGMjM2QkJFMzhEMDcB',
        direction: 'outbound' as const,
        message_type: 'text' as const,
        content: "Nice work! You're seeing this because mock data is on — your install is successful and the app is working.",
        media_url: null,
        status: 'delivered',
        timestamp: '2026-01-25T12:25:00.000Z',
        created_at: '2026-01-25T06:55:00.000Z',
      },
      {
        id: '1bf7a45e-f181-48ec-b928-8274a21a8a27',
        user_id: '34b7ff9d-d5b1-4fd8-8b32-0c67e401016e',
        contact_id: '93727ae5-34e7-470e-a01a-c1ae2f486f3a',
        message_id: 'wamid.HBgMOTE5OTg3NzQ5OTUwFQIAEhgUM0E4NUI0NkFGMjM2QkJFMzhEMDcA',
        direction: 'inbound' as const,
        message_type: 'text' as const,
        content: "I just got the frontend running! 🎉",
        media_url: null,
        status: 'sent',
        timestamp: '2026-01-25T12:24:45.000Z',
        created_at: '2026-01-25T06:54:47.429Z',
      },
    ],
  },
} as const;

/**
 * Send Message API
 * 
 * Purpose: Sends a message to a contact
 * 
 * Endpoint: POST /message/
 * 
 * Query Parameters:
 * - user_id: Bot user ID (retrieved from localStorage)
 * 
 * Request Body:
 * - contact_id: The ID of the contact to send the message to (string)
 * - message_type: Type of message, e.g., "text" (string)
 * - content: The message content (string)
 * 
 * Response:
 * - status: 1 for success, 0 for error
 * - message: Response message
 * - data: Message object with details including message_id, status, timestamp, etc.
 */
export const SEND_MESSAGE_API = {
  url: (userId: string) => `${API_BASE_URL}message/?user_id=${userId}`,
  method: 'POST' as const,
  useMockData: USE_MOCK_DATA,
  mockResponse: {
    status: 1 as const,
    message: 'success',
    data: {
      id: 'f7e9f205-f09b-4a79-8aa2-4d4b7fc0c654',
      user_id: '34b7ff9d-d5b1-4fd8-8b32-0c67e401016e',
      contact_id: '93727ae5-34e7-470e-a01a-c1ae2f486f3a',
      message_id: 'wamid.HBgMOTE5OTg3NzQ5OTUwFQIAERgSRDBCNzA5MzM3MzUwNjI1NjBDAA==',
      direction: 'outbound' as const,
      message_type: 'text' as const,
      content: "Thank you for your order! We'll deliver it tomorrow.",
      media_url: null,
      status: 'sent',
      timestamp: '2026-01-25T11:18:08.736',
      created_at: '2026-01-25T11:18:08.993047',
    },
  },
} as const;

/**
 * Contact Update API
 * 
 * Purpose: Updates contact information (unread_count, name, archive status, etc.)
 * 
 * Endpoint: PATCH /{webhook_id}/api/v1/contacts/:contactId
 * 
 * Path Parameters:
 * - contactId: The ID of the contact to update (string)
 * 
 * Request Body:
 * - unread_count: Number of unread messages (number, typically 0 to mark as read)
 * - name: Contact name (string, optional)
 * - is_archived: Whether contact is archived (boolean, optional)
 * - Other contact fields as needed
 * 
 * Response:
 * - status: 1 for success, 0 for error
 * - message: Response message
 */
export const CONTACT_UPDATE_API = {
  url: (contactId: string) => `${getMessagesApiBaseUrl()}contacts/${contactId}`,
  method: 'PATCH' as const,
  useMockData: USE_MOCK_DATA,
  mockResponse: {
    status: 1 as const,
    message: 'success',
  },
} as const;

// ============================================================================
// Status API
// ============================================================================

/**
 * Status API
 *
 * Purpose: Check if the API base URL is reachable. Used by the dashboard
 * setup checklist to determine if step 2 (API is reachable) is complete.
 *
 * Endpoint: GET /status
 *
 * Response:
 * - status: "1" for success (string)
 * - message: "success"
 */
export const STATUS_API = {
  url: `${API_BASE_URL}status`,
  method: 'GET' as const,
  useMockData: USE_MOCK_DATA,
  /** Real API returns status as string "1"; we use number for type compatibility. */
  mockResponse: {
    status: 1 as const,
    message: 'success',
  },
} as const;

// ============================================================================
// Bot User APIs
// ============================================================================

/**
 * Bot User API
 * 
 * Purpose: Fetches bot user information
 * 
 * Endpoint: GET /user
 * 
 * Response:
 * - status: 1 for success, 0 for error (or true/false in some cases)
 * - message: Response message
 * - data: Bot user information
 */
export const BOT_USER_API = {
  url: `${API_BASE_URL}user`,
  method: 'GET' as const,
  useMockData: USE_MOCK_DATA,
  mockResponse: {
    status: 1 as const,
    message: 'success',
    data: {
      id: '34b7ff9d-d5b1-4fd8-8b32-0c67e401016e',
      name: 'Lakshit Bot Number',
      phone_number: '918169228947',
    },
  },
} as const;
