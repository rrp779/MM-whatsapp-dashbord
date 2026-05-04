/**
 * useSetupStatus
 *
 * Hook that computes setup progress for the dashboard: API URLs + STATUS_API
 * reachability, bot user from auth, and Supabase configuration. Used by the
 * Welcome page to show a checklist and optional bot profile card.
 *
 * Status is fetched here; bot data comes from AuthContext so BOT_USER_API
 * is only called once by the auth layer.
 */

import { useState, useEffect, useMemo } from 'react';
import { API_BASE_URLS } from '../../config';
import { isSupabaseConfigured } from '../config/supabase';
import { get } from '../services/api_call';
import { STATUS_API } from '../constants/api';
import { useAuth } from '../contexts/AuthContext';

/** Bot user payload for the dashboard bot card. */
export interface BotUserProfile {
  name: string;
  phone_number: string;
}

/** Single setup step for the checklist. */
export interface SetupStep {
  id: string;
  label: string;
  done: boolean;
}

/** Result of the setup status hook. */
export interface SetupStatus {
  steps: SetupStep[];
  bot: BotUserProfile | null;
  /** True while STATUS_API is in flight. */
  loading: boolean;
  /** True while auth (BOT_USER_API) is in flight. */
  loadingBot: boolean;
}

/**
 * Computes whether API base URLs are configured (non-empty).
 *
 * @returns True if both production and uat URLs are non-empty.
 */
function isApiBaseUrlsConfigured(): boolean {
  const prod = API_BASE_URLS.production?.trim();
  const uat = API_BASE_URLS.uat?.trim();
  return Boolean(prod && uat);
}

/** Status API may return status as number 1 or string "1". */
function isStatusSuccess(res: { status?: unknown }): boolean {
  return res.status === 1 || String(res.status) === '1';
}

/**
 * Fetches setup status: three steps (API URLs + reachable, bot user, Supabase).
 * Step 1 uses STATUS_API only; step 2 uses bot user from AuthContext (no extra
 * BOT_USER_API call). Updates step 1 as soon as status returns (independent of step 2).
 *
 * - Step 1: API base URLs non-empty AND GET /status returns success.
 * - Step 2: AuthContext has bot user (name + phone_number).
 * - Step 3: Supabase configured via isSupabaseConfigured().
 *
 * @returns { steps, bot, loading, loadingBot }
 */
export function useSetupStatus(): SetupStatus {
  const { botUser, isLoading: loadingBot } = useAuth();
  const [apiResponding, setApiResponding] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const apiUrlsDone = useMemo(isApiBaseUrlsConfigured, []);
  const supabaseDone = useMemo(isSupabaseConfigured, []);

  /** Combined: URLs configured and /status returns success. */
  const apiStepDone = apiUrlsDone && apiResponding;

  /** Step 2 done when auth has bot user with name and phone. */
  const botConfigured =
    botUser != null &&
    typeof botUser.name === 'string' &&
    typeof botUser.phone_number === 'string';

  /** Bot profile for the card; from auth, so BOT_USER_API is only called by AuthContext. */
  const bot: BotUserProfile | null =
    botConfigured && botUser
      ? { name: botUser.name, phone_number: botUser.phone_number }
      : null;

  useEffect(() => {
    if (!apiUrlsDone) {
      setApiResponding(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    get<unknown>(STATUS_API)
      .then((res) => {
        if (cancelled) return;
        setApiResponding(isStatusSuccess(res as { status?: unknown }));
      })
      .catch(() => {
        if (!cancelled) setApiResponding(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [apiUrlsDone]);

  const steps: SetupStep[] = useMemo(
    () => [
      {
        id: 'api-urls',
        label: 'API base URLs and reachable',
        done: apiStepDone,
      },
      {
        id: 'bot-user',
        label: 'Connect your WhatsApp bot',
        done: botConfigured,
      },
      { id: 'supabase', label: 'Configure Supabase', done: supabaseDone },
    ],
    [apiStepDone, botConfigured, supabaseDone]
  );

  return { steps, bot, loading, loadingBot };
}
