/**
 * Supabase Real-time Subscription Hook
 * 
 * This hook manages Supabase real-time subscriptions for messages.
 * It listens for:
 * - INSERT events: New messages received
 * - UPDATE events: Message status updates (sent → delivered → read)
 * 
 * @param contactId - The ID of the contact/conversation to listen to
 * @param userId - The ID of the current bot user
 * @param onNewMessage - Callback when a new message is received
 * @param onStatusUpdate - Callback when a message status is updated
 */

import { useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../config/supabase';
import type { MessageApiResponse } from '../types';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseSupabaseRealtimeProps {
  contactId: string | null;
  userId: string | null;
  onNewMessage?: (message: MessageApiResponse) => void;
  onStatusUpdate?: (messageId: string, status: string) => void;
}

/**
 * Hook to manage Supabase real-time subscriptions for messages
 * 
 * @param props - Configuration object with contactId, userId, and callbacks
 */
export function useSupabaseRealtime({
  contactId,
  userId,
  onNewMessage,
  onStatusUpdate,
}: UseSupabaseRealtimeProps): void {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    // Don't set up subscription if Supabase is not configured
    if (!isSupabaseConfigured() || !supabase) {
      console.warn('Supabase is not configured. Real-time updates will not work.');
      return;
    }

    // Don't set up subscription if contactId or userId is missing
    if (!contactId || !userId) {
      return;
    }

    // Clean up previous subscription if it exists
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Create a new channel for this contact
    const channelName = `messages:${contactId}`;
    const channel = supabase
      .channel(channelName, {
        config: {
          campaigns: { self: false },
          presence: { key: userId },
        },
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `contact_id=eq.${contactId}`,
        },
        (payload) => {
          console.log('New message received via real-time:', payload);
          if (onNewMessage && payload.new) {
            // Map the payload to MessageApiResponse format
            const message = payload.new as MessageApiResponse;
            onNewMessage(message);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `contact_id=eq.${contactId}`,
        },
        (payload) => {
          console.log('Message status updated via real-time:', payload);
          if (onStatusUpdate && payload.new) {
            const message = payload.new as MessageApiResponse;
            // Only process status updates for outbound messages (sent by the user)
            if (message.direction === 'outbound' && message.user_id === userId) {
              onStatusUpdate(message.id, message.status);
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to real-time updates for contact: ${contactId}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Error subscribing to real-time updates for contact: ${contactId}`);
        } else if (status === 'TIMED_OUT') {
          console.warn(`Real-time subscription timed out for contact: ${contactId}`);
        }
      });

    channelRef.current = channel;

    // Cleanup function: unsubscribe when component unmounts or dependencies change
    return () => {
      if (channelRef.current) {
        console.log(`Unsubscribing from real-time updates for contact: ${contactId}`);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [contactId, userId, onNewMessage, onStatusUpdate]);
}
