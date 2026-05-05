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

export function useSupabaseRealtime({
  contactId,
  userId,
  onNewMessage,
  onStatusUpdate,
}: UseSupabaseRealtimeProps): void {

  const channelRef = useRef<RealtimeChannel | null>(null);

  // ✅ stable refs (IMPORTANT)
  const onNewMessageRef = useRef(onNewMessage);
  const onStatusUpdateRef = useRef(onStatusUpdate);

  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
  }, [onNewMessage]);

  useEffect(() => {
    onStatusUpdateRef.current = onStatusUpdate;
  }, [onStatusUpdate]);

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;
    if (!userId) return;

    console.log("🚀 Creating realtime subscription...");

    // cleanup previous
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel(`messages:user:${userId}`) // ✅ stable channel name
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log("🔥 INSERT EVENT:", payload);

          const message = payload.new as MessageApiResponse;
          onNewMessageRef.current?.(message);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log("🔄 UPDATE EVENT:", payload);

          const message = payload.new as MessageApiResponse;

          if (message.direction === 'outbound' && message.user_id === userId) {
            onStatusUpdateRef.current?.(message.id, message.status);
          }
        }
      )
      .subscribe((status) => {
        console.log("📡 STATUS:", status);
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        console.log("❌ Cleaning up realtime");
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };

  }, [userId]); // ✅ ONLY dependency
}