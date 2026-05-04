/**
 * Supabase Real-time Subscription Hook for Contacts
 * 
 * This hook manages Supabase real-time subscriptions for contacts.
 * It listens for:
 * - INSERT events: New contacts created
 * - UPDATE events: Contact updates (unread_count, last_message_at, last_message, name, etc.)
 * 
 * @param userId - The ID of the current bot user
 * @param onNewContact - Callback when a new contact is created
 * @param onContactUpdate - Callback when a contact is updated
 */

import { useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../config/supabase';
import type { ContactApiResponse } from '../types';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseSupabaseRealtimeContactsProps {
  userId: string | null;
  onNewContact?: (contact: ContactApiResponse) => void;
  onContactUpdate?: (contact: ContactApiResponse) => void;
}

/**
 * Hook to manage Supabase real-time subscriptions for contacts
 * 
 * @param props - Configuration object with userId and callbacks
 */
export function useSupabaseRealtimeContacts({
  userId,
  onNewContact,
  onContactUpdate,
}: UseSupabaseRealtimeContactsProps): void {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    // Don't set up subscription if Supabase is not configured
    if (!isSupabaseConfigured() || !supabase) {
      console.warn('Supabase is not configured. Real-time updates will not work.');
      return;
    }

    // Store supabase in a const to avoid null checks
    const supabaseClient = supabase;

    // Don't set up subscription if userId is missing
    if (!userId) {
      return;
    }

    // Clean up previous subscription if it exists
    if (channelRef.current) {
      supabaseClient.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Create a new channel for contacts
    const channelName = `contacts:${userId}`;
    
    // Helper function to check if contact belongs to current user
    const belongsToUser = (contact: any): boolean => {
      return (
        contact.user_id === userId ||
        contact.bot_user_id === userId ||
        contact.userId === userId
      );
    };
    
    const channel = supabaseClient
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
          table: 'contacts',
        },
        (payload) => {
          if (payload.new && belongsToUser(payload.new) && onNewContact) {
            const contact = payload.new as ContactApiResponse;
            onNewContact(contact);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'contacts',
        },
        (payload) => {
          if (payload.new && belongsToUser(payload.new) && onContactUpdate) {
            const contact = payload.new as ContactApiResponse;
            onContactUpdate(contact);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to real-time updates for contacts: ${userId}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Error subscribing to real-time updates for contacts: ${userId}`);
        } else if (status === 'TIMED_OUT') {
          console.warn(`Real-time subscription timed out for contacts: ${userId}`);
        }
      });

    channelRef.current = channel;

    // Cleanup function: unsubscribe when component unmounts or dependencies change
    return () => {
      if (channelRef.current) {
        supabaseClient.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, onNewContact, onContactUpdate]);
}
