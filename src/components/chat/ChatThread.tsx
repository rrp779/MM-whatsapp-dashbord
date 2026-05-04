import { useEffect, useRef, useCallback, useMemo } from 'react';
import { MessageSquare, ArrowLeft, Loader2, Phone } from 'lucide-react';
import Message from './Message';
import MessageInput from './MessageInput';
import DateSeparator from './DateSeparator';
import { getDateKey } from '../../utils/date';
import type { Contact, Message as MessageType } from '../../types';

interface ChatThreadProps {
  contact: Contact | null;
  messages: MessageType[];
  /** Callback when a message is sent */
  onSendMessage?: (message: string) => void;
  /** Whether a message is currently being sent */
  isSending?: boolean;
  /** Failed message text to restore in input (for retry) */
  failedMessage?: string;
  /** Callback to clear the failed message */
  onFailedMessageClear?: () => void;
  /** Callback to go back to conversation list (mobile only) */
  onBack?: () => void;
  /** Callback when user scrolls to the top (for pagination) */
  onScrollToTop?: () => void;
  /** Whether older messages are currently being loaded */
  loadingOlderMessages?: boolean;
  /** Ref to the messages container element (for scroll position maintenance) */
  messagesContainerRef?: React.RefObject<HTMLDivElement | null>;
}

/**
 * Right-hand thread: header (contact name), message list, and message input.
 * Shows an empty state when no conversation is selected.
 * Follows design-system chatBubble list and emptyState.
 * 
 * @param props - ChatThread component props
 * @returns ChatThread component
 */
export default function ChatThread({
  contact,
  messages,
  onSendMessage,
  isSending = false,
  failedMessage = '',
  onFailedMessageClear,
  onBack,
  onScrollToTop,
  loadingOlderMessages = false,
  messagesContainerRef: externalMessagesContainerRef,
}: ChatThreadProps) {
  const internalMessagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = (externalMessagesContainerRef || internalMessagesContainerRef) as React.RefObject<HTMLDivElement | null>;
  const previousMessageCountRef = useRef<number>(0);
  const previousLastMessageIdRef = useRef<string | null>(null);
  const shouldAutoScrollRef = useRef<boolean>(false);

  /**
   * Scrolls to the bottom of the messages container with smooth scrolling
   */
  const scrollToBottom = useCallback((smooth: boolean = true): void => {
    if (messagesContainerRef.current) {
      if (smooth) {
        // Use smooth scrolling like WhatsApp
        messagesContainerRef.current.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: 'smooth',
        });
      } else {
        // Instant scroll for initial load
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }
  }, [messagesContainerRef]);

  /**
   * Threshold distance from top (in pixels) to trigger loading older messages.
   * This allows loading to start before the user reaches the very top for smoother UX.
   */
  const SCROLL_LOAD_THRESHOLD = 100;

  /**
   * Handles scroll events to detect when user scrolls near the top.
   * Triggers loading older messages when within the threshold distance from the top.
   */
  const handleScroll = useCallback((): void => {
    if (!messagesContainerRef.current || !onScrollToTop || loadingOlderMessages) {
      return;
    }

    const container = messagesContainerRef.current;
    // Check if scrolled within threshold distance from the top
    // This provides smoother loading experience compared to waiting for scrollTop === 0
    if (container.scrollTop <= SCROLL_LOAD_THRESHOLD) {
      onScrollToTop();
    }
  }, [onScrollToTop, loadingOlderMessages, messagesContainerRef]);

  // Reset refs when contact changes
  useEffect(() => {
    previousMessageCountRef.current = 0;
    previousLastMessageIdRef.current = null;
    shouldAutoScrollRef.current = false;
  }, [contact]);

  // Auto-scroll to bottom when new messages are added (not when loading older messages)
  useEffect(() => {
    if (messages.length === 0) {
      previousMessageCountRef.current = 0;
      previousLastMessageIdRef.current = null;
      return;
    }

    const currentMessageCount = messages.length;
    const lastMessage = messages[messages.length - 1];
    const lastMessageId = lastMessage?.id ?? null;

    // Detect if new messages were added at the bottom:
    // - If last message ID changed, it means a new message was added at the end
    // - If count increased but last message ID is same, it means older messages were prepended (don't scroll)
    const isLastMessageNew = lastMessageId !== previousLastMessageIdRef.current;
    const isInitialLoad = previousLastMessageIdRef.current === null;

    // Auto-scroll if:
    // 1. We're not loading older messages
    // 2. Either it's the initial load OR the last message ID changed (new message at bottom)
    if (!loadingOlderMessages && (isInitialLoad || isLastMessageNew)) {
      shouldAutoScrollRef.current = true;
      // Use requestAnimationFrame to ensure DOM is updated before scrolling
      requestAnimationFrame(() => {
        if (shouldAutoScrollRef.current) {
          // Use smooth scrolling for new messages, instant for initial load
          scrollToBottom(!isInitialLoad);
          shouldAutoScrollRef.current = false;
        }
      });
    }

    // Update refs for next comparison
    previousMessageCountRef.current = currentMessageCount;
    previousLastMessageIdRef.current = lastMessageId;
  }, [messages, loadingOlderMessages, scrollToBottom]);

  /**
   * Groups messages with date separators.
   * Inserts a DateSeparator before each message when the date changes,
   * and always shows a separator above the first message.
   * 
   * @returns Array of React elements (messages and date separators)
   * 
   * Note: This hook must be called before any early returns to comply with Rules of Hooks.
   */
  const messagesWithSeparators = useMemo(() => {
    if (messages.length === 0) {
      return [];
    }

    const elements: React.ReactElement[] = [];
    let previousDateKey: string | null = null;

    messages.forEach((message, index) => {
      const currentDateKey = getDateKey(message.timestamp);

      // Insert date separator if date changed or this is the first message
      if (currentDateKey !== previousDateKey || index === 0) {
        elements.push(
          <DateSeparator key={`date-${message.id}-${currentDateKey}`} timestamp={message.timestamp} />
        );
        previousDateKey = currentDateKey;
      }

      // Add the message
      elements.push(<Message key={message.id} message={message} />);
    });

    return elements;
  }, [messages]);

  /**
   * Handles sending a message
   */
  const handleSend = (message: string): void => {
    if (onSendMessage) {
      onSendMessage(message);
      // Clear failed message when sending
      onFailedMessageClear?.();
    }
  };

  if (!contact) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-card border border-dashed border-border bg-surface py-12 text-center">
        <MessageSquare className="h-12 w-12 text-text-muted" strokeWidth={1.5} aria-hidden />
        <h3 className="font-heading mt-3 text-lg font-semibold text-text">Select a conversation</h3>
        <p className="mt-1 max-w-xs text-sm text-text-muted">
          Choose a chat from the list to view and send messages.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col min-h-0 bg-background">
      {/* Thread header */}
      <header className="flex h-12 shrink-0 items-center gap-2 md:gap-3 border-b border-border bg-surface px-2 md:px-3">
        {/* Back button for mobile/tablet (hidden on desktop lg+) */}
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="lg:hidden flex h-8 w-8 shrink-0 items-center justify-center rounded-button text-text hover:bg-primary-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Back to conversations"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
          </button>
        )}
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-muted text-sm font-medium text-primary">
          {contact.name.charAt(0).toUpperCase()}
        </span>
        <div className="flex-1 min-w-0 overflow-hidden">
          <span className="truncate block text-sm font-medium text-text">{contact.name}</span>
          {contact.phone_number && (
            <div className="flex items-center gap-1.5">
              <Phone className="h-3 w-3 text-text-muted shrink-0" strokeWidth={2} aria-hidden />
              <span className="truncate text-xs text-text-muted">{contact.phone_number}</span>
            </div>
          )}
        </div>
      </header>

      {/* Message list */}
      <div
        ref={messagesContainerRef}
        className="flex-1 min-h-0 overflow-y-auto p-4 relative"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='1.5' stroke-opacity='0.55'%3E%3Cpath d='M15 20 L18 25 L15 30 L12 25 Z'/%3E%3Cpath d='M25 15 L27 20 L25 25 L23 20 Z'/%3E%3Ccircle cx='35' cy='25' r='4'/%3E%3Cpath d='M45 15 L50 20 L45 25 L40 20 Z'/%3E%3Cpath d='M55 30 L60 35 L55 40 L50 35 Z'/%3E%3Cpath d='M70 20 L75 25 L70 30 L65 25 Z'/%3E%3Cpath d='M85 15 L88 20 L85 25 L82 20 Z'/%3E%3Cpath d='M95 30 L98 35 L95 40 L92 35 Z'/%3E%3Cpath d='M105 20 L108 25 L105 30 L102 25 Z'/%3E%3Cpath d='M10 50 L15 55 L10 60 L5 55 Z'/%3E%3Cpath d='M25 45 L30 50 L25 55 L20 50 Z'/%3E%3Ccircle cx='40' cy='55' r='3.5'/%3E%3Cpath d='M50 45 L55 50 L50 55 L45 50 Z'/%3E%3Cpath d='M65 50 L68 55 L65 60 L62 55 Z'/%3E%3Cpath d='M75 45 L80 50 L75 55 L70 50 Z'/%3E%3Cpath d='M90 50 L93 55 L90 60 L87 55 Z'/%3E%3Cpath d='M100 45 L105 50 L100 55 L95 50 Z'/%3E%3Cpath d='M110 50 L113 55 L110 60 L107 55 Z'/%3E%3Cpath d='M15 80 L20 85 L15 90 L10 85 Z'/%3E%3Cpath d='M30 75 L35 80 L30 85 L25 80 Z'/%3E%3Ccircle cx='45' cy='85' r='4'/%3E%3Cpath d='M55 75 L60 80 L55 85 L50 80 Z'/%3E%3Cpath d='M70 80 L73 85 L70 90 L67 85 Z'/%3E%3Cpath d='M85 75 L90 80 L85 85 L80 80 Z'/%3E%3Cpath d='M95 80 L98 85 L95 90 L92 85 Z'/%3E%3Cpath d='M105 75 L110 80 L105 85 L100 80 Z'/%3E%3Cpath d='M20 105 L25 110 L20 115 L15 110 Z'/%3E%3Cpath d='M35 100 L40 105 L35 110 L30 105 Z'/%3E%3Ccircle cx='50' cy='110' r='3.5'/%3E%3Cpath d='M60 100 L65 105 L60 110 L55 105 Z'/%3E%3Cpath d='M75 105 L78 110 L75 115 L72 110 Z'/%3E%3Cpath d='M90 100 L95 105 L90 110 L85 105 Z'/%3E%3Cpath d='M100 105 L103 110 L100 115 L97 110 Z'/%3E%3Cpath d='M110 100 L115 105 L110 110 L105 105 Z'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundColor: '#f0f2f5',
          backgroundRepeat: 'repeat',
        }}
        onScroll={handleScroll}
      >
        <div className="w-full space-y-2">
          {/* Loading indicator for older messages */}
          {loadingOlderMessages && (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="h-4 w-4 animate-spin text-text-muted" strokeWidth={1.5} />
              <span className="ml-2 text-sm text-text-muted">Loading older messages...</span>
            </div>
          )}
          {messagesWithSeparators}
        </div>
      </div>

      {/* Message input */}
      <MessageInput
        onSend={handleSend}
        disabled={isSending}
        initialValue={failedMessage}
        onValueChange={() => {
          // Clear failed message when user starts typing
          if (failedMessage) {
            onFailedMessageClear?.();
          }
        }}
      />
    </div>
  );
}
