/**
 * Authentication Utilities
 *
 * This module provides utilities for managing bot user authentication and state.
 * Bot user data is stored in localStorage for persistence across browser sessions.
 *
 * The bot user API serves as the authentication check:
 * - If we get data from BOT_USER_API, the user is authenticated
 * - If not, there is an authentication error
 *
 * Storage Keys:
 * - n8n_bot_user_id: Bot user ID
 * - n8n_bot_user_name: Bot user name
 * - n8n_bot_user_phone_number: Bot user phone number
 * - n8n_bot_user_authenticated: Flag indicating authentication status
 */

import type { BotUser } from '../types/bot';

// ============================================================================
// Storage Keys
// ============================================================================

/** Key for storing bot user ID in localStorage */
const BOT_USER_ID_KEY = 'n8n_bot_user_id';

/** Key for storing bot user name in localStorage */
const BOT_USER_NAME_KEY = 'n8n_bot_user_name';

/** Key for storing bot user phone number in localStorage */
const BOT_USER_PHONE_NUMBER_KEY = 'n8n_bot_user_phone_number';

/** Key for storing authentication status in localStorage */
const BOT_USER_AUTHENTICATED_KEY = 'n8n_bot_user_authenticated';

// ============================================================================
// Bot User Data Management
// ============================================================================

/**
 * Stores bot user data in localStorage
 * This indicates successful authentication
 *
 * @param botUser - Bot user data to store
 */
export const setBotUser = (botUser: BotUser): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(BOT_USER_ID_KEY, botUser.id);
    localStorage.setItem(BOT_USER_NAME_KEY, botUser.name);
    localStorage.setItem(BOT_USER_PHONE_NUMBER_KEY, botUser.phone_number);
    localStorage.setItem(BOT_USER_AUTHENTICATED_KEY, 'true');
    
    console.log('Bot user data stored in localStorage:', {
      id: botUser.id,
      name: botUser.name,
      phone_number: botUser.phone_number,
    });
  } catch (error) {
    console.error('Error storing bot user data in localStorage:', error);
    throw error;
  }
};

/**
 * Retrieves bot user data from localStorage
 *
 * @returns Bot user data object or null if not found
 */
export const getBotUser = (): BotUser | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const id = localStorage.getItem(BOT_USER_ID_KEY);
  const name = localStorage.getItem(BOT_USER_NAME_KEY);
  const phoneNumber = localStorage.getItem(BOT_USER_PHONE_NUMBER_KEY);

  if (!id || !name || !phoneNumber) {
    return null;
  }

  return {
    id,
    name,
    phone_number: phoneNumber,
  };
};

/**
 * Retrieves bot user ID from localStorage
 *
 * @returns Bot user ID or null if not found
 */
export const getBotUserId = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(BOT_USER_ID_KEY);
};

/**
 * Retrieves bot user name from localStorage
 *
 * @returns Bot user name or null if not found
 */
export const getBotUserName = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(BOT_USER_NAME_KEY);
};

/**
 * Retrieves bot user phone number from localStorage
 *
 * @returns Bot user phone number or null if not found
 */
export const getBotUserPhoneNumber = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(BOT_USER_PHONE_NUMBER_KEY);
};

/**
 * Checks if bot user is authenticated
 *
 * @returns true if authenticated, false otherwise
 */
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  const authenticated = localStorage.getItem(BOT_USER_AUTHENTICATED_KEY);
  const botUser = getBotUser();

  // Check both the flag and that we have valid bot user data
  return authenticated === 'true' && botUser !== null;
};

/**
 * Clears all bot user authentication data from localStorage
 */
export const clearBotUser = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(BOT_USER_ID_KEY);
  localStorage.removeItem(BOT_USER_NAME_KEY);
  localStorage.removeItem(BOT_USER_PHONE_NUMBER_KEY);
  localStorage.removeItem(BOT_USER_AUTHENTICATED_KEY);
};

/**
 * Authenticates by calling the bot user API
 * If successful, stores the bot user data
 * If failed, clears any existing auth data
 *
 * @returns Promise resolving to bot user data if authenticated, null if not
 */
export const authenticate = async (): Promise<BotUser | null> => {
  try {
    const { get } = await import('../services/api_call');
    const { BOT_USER_API } = await import('../constants/api');

    const response = await get<typeof BOT_USER_API.mockResponse.data>(BOT_USER_API);

    // If we get data from the API, authentication is successful
    if (response.status === 1 && response.data) {
      setBotUser(response.data);
      console.log('Bot user authenticated and stored:', response.data);
      return response.data;
    }

    // If no data or error status, authentication failed
    const errorMessage = response.message || 'Unable to fetch bot user data';
    console.error('Authentication failed:', errorMessage, response);
    clearBotUser();
    throw new Error(errorMessage);
  } catch (error) {
    // On any error, clear auth data and re-throw with proper message
    clearBotUser();
    const errorMessage = error instanceof Error ? error.message : 'Authentication error occurred';
    console.error('Authentication error:', errorMessage, error);
    throw new Error(errorMessage);
  }
};

/**
 * Helper function to add bot user data to a request body
 * Useful when other APIs need bot user information
 *
 * @param body - Request body object
 * @returns Request body with bot user data added
 */
export const addBotUserToBody = <T extends Record<string, unknown>>(body: T): T & { bot_user_id?: string; bot_user_name?: string; bot_user_phone_number?: string } => {
  const botUser = getBotUser();
  if (!botUser) {
    return body;
  }

  return {
    ...body,
    bot_user_id: botUser.id,
    bot_user_name: botUser.name,
    bot_user_phone_number: botUser.phone_number,
  };
};
