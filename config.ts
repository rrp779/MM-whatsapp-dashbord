
/**
 * Project configuration — single source of truth for API URLs, Supabase, and feature flags.
 *
 * When handing this project to someone else, update only this file so their endpoints,
 * keys, and environment are used everywhere. Branding (logo, colors, app name) lives
 * in branding.ts.
 */

/**
 * Setup Checklist
 * Chat
 * Live chat
 * Mobile Friendly
 * Badge
 */

/** Environment for API: production (live) or uat (User Acceptance Testing). */
export type Environment = 'production' | 'uat';

/** Current active environment. Change this to switch the API base URL for all endpoints. */
export const CURRENT_ENVIRONMENT: Environment = 'production';

// /** API base URLs per environment. Used by all API calls. */
export const API_BASE_URLS: Record<Environment, string> = {
  production: 'https://n8n.srv1151302.hstgr.cloud/webhook/',
  uat: 'https://n8n.srv1151302.hstgr.cloud/webhook-test/',
};
// // export const API_BASE_URLS: Record<Environment, string> = {
// //   production: 'https://your-production-url-here/',
// //   uat: 'https://your-uat-url-here/',
// };

/** Use mock data instead of real API calls when true. Set to false for real backend. */
export const USE_MOCK_DATA = false;

/** Supabase project URL (e.g. https://your-project.supabase.co). */
export const SUPABASE_URL = 'https://hwydzukapdyetawseobk.supabase.co';
// export const SUPABASE_URL = 'https://your-supabase-url.supabase.co';

/** Supabase publishable (anon) key. Safe to expose in the frontend; use RLS in Supabase for access control. */
export const SUPABASE_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3eWR6dWthcGR5ZXRhd3Nlb2JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NzY1NzIsImV4cCI6MjA5MzA1MjU3Mn0.njNbuTTFFmjsVTPm_S1dlDPuzQQyF7BaD8rWdH7m6aA';
// export const SUPABASE_PUBLISHABLE_KEY = 'your-supabase-publishable-key';


/** Webhook ID used in the messages/contact-update API path. */
export const WEBHOOK_ID = '6bed4c3b-0d58-47fe-802f-e263f7ec59a9';

