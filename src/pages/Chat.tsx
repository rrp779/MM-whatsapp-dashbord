import { useEffect, useState, useCallback, useRef } from 'react';
import { get, post, patch } from '../services/api_call';
import { CONTACTS_API, MESSAGES_API, SEND_MESSAGE_API, CONTACT_UPDATE_API } from '../constants/api';
import { getBotUserId } from '../utils/auth';
import { getCurrentISTTimestamp, convertUTCToISTFormat } from '../utils/date';
import { useToast } from '../contexts/ToastContext';
import type { Chat, Message, ContactApiResponse, MessageApiResponse } from '../types';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatThread from '../components/chat/ChatThread';
import { useSupabaseRealtime } from '../hooks/useSupabaseRealtime';
import { useSupabaseRealtimeContacts } from '../hooks/useSupabaseRealtimeContacts';
import {
  initNotificationSound,
  playSound,
  showNotification,
  requestNotificationPermission
} from '../utils/notificationManager';

console.log("✅ notificationManager loaded");
console.log(playSound);
/**
 * Chat page: left sidebar with conversation list and right-hand thread with messages.
 * Data is loaded from API (or mock when USE_MOCK_DATA is true).
 */
export default function Chat() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [failedMessage, setFailedMessage] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState<boolean>(false);
  const { showError } = useToast();
  const chatsRef = useRef<Chat[]>([]);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const userId = getBotUserId();

useEffect(() => {
  chatsRef.current = chats;
}, [chats]);

  /**
   * Maps a MessageApiResponse to a Message type
   * 
   * @param msg - Message API response object
   * @returns Message object in the format expected by the UI
   */
  const mapMessageApiResponseToMessage = useCallback((msg: MessageApiResponse): Message => {
    const baseMessage = {
      id: msg.id,
      messageType: 'text' as const,
      text: msg.content,
      timestamp: msg.timestamp,
    };

    if (msg.direction === 'outbound') {
      // Outbound message from user
      return {
        ...baseMessage,
        sender: 'user' as const,
        status: msg.status as 'sent' | 'delivered' | 'read',
      };
    } else {
      // Inbound message from contact
      return {
        ...baseMessage,
        sender: 'contact' as const,
        readReceipt: msg.status === 'read' || msg.status === 'delivered',
      };
    }
  }, []);

  /**
   * Handles new messages received via real-time subscription
   * 
   * @param messageApiResponse - New message from Supabase
   */
  const handleNewMessage = useCallback(
  (messageApiResponse: MessageApiResponse): void => {
   console.log("📩 handleNewMessage fired");
    const isInbound =
      messageApiResponse.direction === 'inbound' ||
      messageApiResponse.direction === 'incoming';

    const isDifferentChat = messageApiResponse.contact_id !== selectedChatId;
    const isTabInactive = document.hidden;

    // 🔔 ALWAYS trigger notification for inbound
  if (isInbound) {
  playSound(); // 🔥 ALWAYS play

  const chat = chatsRef.current.find(
    (c) => c.id === messageApiResponse.contact_id
  );

  showNotification(
    chat?.contact.name || "New Message",
    messageApiResponse.content,
    () => setSelectedChatId(messageApiResponse.contact_id)
  );
} 
    setChats((prevChats) => {
  const updatedChats = prevChats.map((chat) => {
    if (chat.id !== messageApiResponse.contact_id) return chat;

    return {
      ...chat,
      lastMessage: {
        text: messageApiResponse.content,
        timestamp: convertUTCToISTFormat(messageApiResponse.timestamp),
      },
      unreadCount:
        chat.id === selectedChatId
          ? 0
          : (chat.unreadCount || 0) + 1,
    };
  });

  // 🔥 Move chat to top (WhatsApp behavior)
  const sortedChats = [...updatedChats].sort((a, b) =>
    (b.lastMessage?.timestamp || '').localeCompare(a.lastMessage?.timestamp || '')
  );

  chatsRef.current = sortedChats;
  return sortedChats;
}); 

    // ❗ Only skip UI update (not notification)
    if (messageApiResponse.contact_id !== selectedChatId) {
      return;
    }

      // Check for duplicates - don't add if message already exists
      setMessages((prevMessages) => {
        const messageExists = prevMessages.some((msg) => msg.id === messageApiResponse.id);
        if (messageExists) {
          return prevMessages;
        }

        // Convert timestamp from UTC to IST format for real-time updates
        const messageWithISTTimestamp = {
          ...messageApiResponse,
          timestamp: convertUTCToISTFormat(messageApiResponse.timestamp),
        };

        // Map the message to the UI format
        const newMessage = mapMessageApiResponseToMessage(messageWithISTTimestamp);

        // For outbound messages, check if we have an optimistic message with the same content
        // and replace it instead of adding a duplicate (avoids double render when API + real-time both fire)
        if (newMessage.sender === 'user') {
          const optimisticMessageIndex = prevMessages.findIndex(
            (msg) => msg.id.startsWith('temp-') && msg.text === newMessage.text
          );

          if (optimisticMessageIndex !== -1) {
            // Replace optimistic message with real message
            const updatedMessages = [...prevMessages];
            updatedMessages[optimisticMessageIndex] = newMessage;
            return updatedMessages;
          }
        }

        // Add new message at the end, then dedupe by id so we never show the same message twice
        // (e.g. if API success already added it before this subscription handler ran)
        const withNew = [...prevMessages, newMessage];
        const seenIds = new Set<string>();
        return withNew.filter((msg) => {
          if (seenIds.has(msg.id)) return false;
          seenIds.add(msg.id);
          return true;
        });
      });
    },
    [ selectedChatId, mapMessageApiResponseToMessage, setSelectedChatId ]
  );





  /**
   * Handles message status updates received via real-time subscription
   * 
   * @param messageId - ID of the message whose status was updated
   * @param status - New status value
   */
  const handleStatusUpdate = useCallback(
    (messageId: string, status: string): void => {
      setMessages((prevMessages) => {
        const messageIndex = prevMessages.findIndex((msg) => msg.id === messageId);
        if (messageIndex === -1) {
          // Message not found - might be an optimistic message that hasn't been replaced yet
          return prevMessages;
        }

        // Update the message status
        const updatedMessages = [...prevMessages];
        const message = updatedMessages[messageIndex];

        if (message.sender === 'user' && 'status' in message) {
          updatedMessages[messageIndex] = {
            ...message,
            status: status as 'sent' | 'delivered' | 'read',
          };
        }

        return updatedMessages;
      });
    },
    []
  );

  /**
   * Maps a ContactApiResponse to a Chat type
   * 
   * @param contact - Contact API response object
   * @param isRealtimeUpdate - Whether this is from a real-time update (needs UTC to IST conversion)
   * @returns Chat object in the format expected by the UI
   */
  const mapContactApiResponseToChat = useCallback(
    (contact: ContactApiResponse, isRealtimeUpdate: boolean = false): Chat => {
      return {
        id: contact.id,
        contact: {
          id: contact.id,
          name: contact.name,
          avatar: undefined,
          phone_number: contact.phone_number,
        },
        lastMessage: contact.last_message_at
          ? {
              text: contact.last_message ?? '',
              timestamp: isRealtimeUpdate
                ? convertUTCToISTFormat(contact.last_message_at)
                : contact.last_message_at,
            }
          : undefined,
        unreadCount: contact.unread_count,
      };
    },
    []
  );

  /**
   * Handles new contacts received via real-time subscription
   * 
   * @param contactApiResponse - New contact from Supabase
   */
  const handleNewContact = useCallback(
    (contactApiResponse: ContactApiResponse): void => {
      // Check for duplicates - don't add if contact already exists
      setChats((prevChats) => {
        const contactExists = prevChats.some((chat) => chat.id === contactApiResponse.id);
        if (contactExists) {
          return prevChats;
        }

        // Map the contact to the UI format (convert timestamps from UTC to IST for real-time updates)
        const newChat = mapContactApiResponseToChat(contactApiResponse, true);

        // Add new contact at the beginning (newest at top)
        const updatedChats = [newChat, ...prevChats];
        chatsRef.current = updatedChats;
        return updatedChats;
      });
    },
    [mapContactApiResponseToChat]
  );

  /**
   * Handles contact updates received via real-time subscription
   * Updates only specific fields (unread_count, last_message_at, last_message, name)
   * 
   * @param contactApiResponse - Updated contact from Supabase
   */
  const handleContactUpdate = useCallback(
    (contactApiResponse: ContactApiResponse): void => {
      setChats((prevChats) => {
        const chatIndex = prevChats.findIndex((chat) => chat.id === contactApiResponse.id);
        if (chatIndex === -1) {
          // Contact not found - might be a new contact, add it
          const newChat = mapContactApiResponseToChat(contactApiResponse, true);
          const updatedChats = [newChat, ...prevChats];
          chatsRef.current = updatedChats;
          return updatedChats;
        }

        // Update only specific fields
        const updatedChats = [...prevChats];
        const existingChat = updatedChats[chatIndex];

        updatedChats[chatIndex] = {
          ...existingChat,
          contact: {
            ...existingChat.contact,
            name: contactApiResponse.name,
            phone_number: contactApiResponse.phone_number ?? existingChat.contact.phone_number,
          },
          unreadCount: contactApiResponse.unread_count,
          lastMessage: contactApiResponse.last_message_at
            ? {
                text: contactApiResponse.last_message ?? '',
                // Convert timestamp from UTC to IST format for real-time updates
                timestamp: convertUTCToISTFormat(contactApiResponse.last_message_at),
              }
            : existingChat.lastMessage,
        };

        chatsRef.current = updatedChats;
        return updatedChats;
      });
    },
    [mapContactApiResponseToChat]
  );

  // Set up real-time subscriptions for messages
  useSupabaseRealtime({
    contactId: null, 
    userId,
    onNewMessage: handleNewMessage,
    onStatusUpdate: handleStatusUpdate,
  });

  // Set up real-time subscriptions for contacts
  useSupabaseRealtimeContacts({
    userId,
    onNewContact: handleNewContact,
    onContactUpdate: handleContactUpdate,
  });

  useEffect(() => {
    let cancelled = false;
    setChatsLoading(true);

    // Get user_id from localStorage
    const currentUserId = getBotUserId();
    if (!currentUserId) {
      console.error('Bot user ID not found in localStorage');
      setChatsLoading(false);
      return;
    }

    // Fetch contacts with pagination
    const apiConfig = {
      ...CONTACTS_API,
      queryParams: {
        page: 1,
        limit: 10,
        user_id: currentUserId,
      },
    };

    get<ContactApiResponse[]>(apiConfig as any)
      .then((response) => {
        if (!cancelled) {
          if (response.status === 0) {
            console.error('Error fetching contacts:', response.message);
            return;
          }
          if (response.data) {
            // Map ContactApiResponse[] to Chat[]
            const mappedChats: Chat[] = response.data.map((contact) => ({
              id: contact.id,
              contact: {
                id: contact.id,
                name: contact.name,
                avatar: undefined,
                phone_number: contact.phone_number,
              },
              lastMessage: contact.last_message_at
                ? {
                    text: contact.last_message ?? '', // Use last_message if available, otherwise empty string
                    timestamp: contact.last_message_at,
                  }
                : undefined,
              unreadCount: contact.unread_count,
            }));
            setChats(mappedChats);
            chatsRef.current = mappedChats;
          }
        }
      })
      .finally(() => {
        if (!cancelled) setChatsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedChatId) {
      setMessages([]);
      setCurrentPage(1);
      setHasNextPage(false);
      return;
    }
    
    console.log('Contact selected:', selectedChatId);
    console.log('Available chats:', chats.map(c => ({ id: c.id, name: c.contact.name })));
    
    let cancelled = false;
    setMessagesLoading(true);
    setCurrentPage(1);
    setHasNextPage(false);

    // Fetch messages with pagination
    const messagesUrl = MESSAGES_API.url(selectedChatId);
    const apiConfig = {
      url: messagesUrl,
      method: MESSAGES_API.method,
      useMockData: MESSAGES_API.useMockData,
      queryParams: {
        page: 1,
        limit: MESSAGES_API.defaultLimit,
      },
      mockResponse: MESSAGES_API.mockResponse,
    };

    console.log('Fetching messages for contact:', selectedChatId, 'URL:', messagesUrl);

    get<MessageApiResponse[]>(apiConfig as any)
      .then((response) => {
        if (!cancelled) {
          if (response.status === 0) {
            console.error('Error fetching messages:', response.message);
            showError('Error', response.message || 'Failed to load messages. Please try again.');
            setMessages([]);
            return;
          }
          if (response.data) {
            // Map MessageApiResponse[] to Message[]
            const mappedMessages: Message[] = response.data.map((msg) =>
              mapMessageApiResponseToMessage(msg)
            );
            // Reverse messages so newest appears at bottom (bottom-to-top chat format)
            setMessages(mappedMessages.reverse());
            // Update pagination state
            setHasNextPage(response.next === true || response.next !== false);
          } else {
            // No data in response, set empty messages array
            setMessages([]);
          }
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error('Error fetching messages:', error);
          const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
          showError('Error', `Failed to load messages: ${errorMessage}`);
          setMessages([]);
        }
      })
      .finally(() => {
        if (!cancelled) setMessagesLoading(false);
      });

    // Update unread count when contact is selected (if unread_count > 0)
    const selectedChat = chatsRef.current.find((c) => c.id === selectedChatId);
    if (selectedChat && selectedChat.unreadCount != null && selectedChat.unreadCount > 0) {
      const updateApiConfig = {
        ...CONTACT_UPDATE_API,
        url: CONTACT_UPDATE_API.url(selectedChatId),
      };

      const requestBody = {
        unread_count: 0,
      };

      patch(updateApiConfig, requestBody)
        .then((response) => {
          if (!cancelled) {
            if (response.status === 1) {
              // Update local state to reflect unread_count = 0
              setChats((prevChats) => {
                const updatedChats = prevChats.map((chat) =>
                  chat.id === selectedChatId
                    ? { ...chat, unreadCount: 0 }
                    : chat
                );
                chatsRef.current = updatedChats;
                return updatedChats;
              });
            }
            // Fail silently if API call fails
          }
        })
        .catch(() => {
          // Fail silently on error
        });
    }

    return () => { cancelled = true; };
  }, [selectedChatId]);

  /**
   * Loads older messages when user scrolls to the top
   * Maintains scroll position after loading new messages
   */
  const loadOlderMessages = useCallback(async (): Promise<void> => {
    if (!selectedChatId || !hasNextPage || loadingOlderMessages) {
      return;
    }

    setLoadingOlderMessages(true);

    // Save current scroll position and height before loading
    const container = messagesContainerRef.current;
    const previousScrollHeight = container?.scrollHeight ?? 0;
    const previousScrollTop = container?.scrollTop ?? 0;

    try {
      const nextPage = currentPage + 1;
      const apiConfig = {
        ...MESSAGES_API,
        url: MESSAGES_API.url(selectedChatId),
        queryParams: {
          page: nextPage,
          limit: MESSAGES_API.defaultLimit,
        },
      };

      const response = await get<MessageApiResponse[]>(apiConfig as any);

      if (response.status === 0) {
        console.error('Error fetching older messages:', response.message);
        return;
      }

      if (response.data && response.data.length > 0) {
        // Map MessageApiResponse[] to Message[]
        const mappedMessages: Message[] = response.data.map((msg) =>
          mapMessageApiResponseToMessage(msg)
        );

        // Reverse older messages to maintain consistent ordering (newest at bottom)
        // Then prepend older messages to existing messages
        const reversedOlderMessages = mappedMessages.reverse();
        setMessages((prevMessages) => [...reversedOlderMessages, ...prevMessages]);
        setCurrentPage(nextPage);
        setHasNextPage(response.next === true || response.next !== false);

        // Restore scroll position after DOM update
        // Use multiple requestAnimationFrame calls to ensure DOM is fully updated
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (container) {
              const newScrollHeight = container.scrollHeight;
              const heightDifference = newScrollHeight - previousScrollHeight;
              // Restore scroll position to maintain user's view
              container.scrollTop = previousScrollTop + heightDifference;
            }
          });
        });
      } else {
        // No more messages
        setHasNextPage(false);
      }
    } catch (error) {
      console.error('Error loading older messages:', error);
    } finally {
      setLoadingOlderMessages(false);
    }
  }, [selectedChatId, hasNextPage, loadingOlderMessages, currentPage, mapMessageApiResponseToMessage]);

  /**
   * Handles sending a message to the selected contact
   * 
   * @param messageText - The message text to send
   */
  const handleSendMessage = useCallback(
    async (messageText: string): Promise<void> => {
      if (!selectedChatId) {
        return;
      }

      const currentUserId = getBotUserId();
      if (!currentUserId) {
        showError('Error', 'Bot user ID not found. Please refresh the page.');
        return;
      }

      setIsSending(true);
      setFailedMessage('');

      // Create optimistic message with pending status
      // Use IST timestamp to match API format (where UTC hours/minutes represent IST time)
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const optimisticMessage: Message = {
        id: tempId,
        messageType: 'text',
        text: messageText,
        sender: 'user',
        timestamp: getCurrentISTTimestamp(),
        status: 'pending',
      };

      // Add optimistic message to the list
      setMessages((prev) => [...prev, optimisticMessage]);

      try {
        // Prepare API config
        const apiConfig = {
          ...SEND_MESSAGE_API,
          url: SEND_MESSAGE_API.url(currentUserId),
        };

        // Prepare request body
        const requestBody = {
          contact_id: selectedChatId,
          message_type: 'text',
          content: messageText,
        };

        // Send message
        const response = await post<MessageApiResponse>(apiConfig, requestBody);

        if (response.status === 0 || !response.data) {
          // Error occurred - remove optimistic message and show error
          setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
          setFailedMessage(messageText);
          showError(
            'Failed to send message',
            response.message || 'An error occurred while sending the message. Please try again.'
          );
          setIsSending(false);
          return;
        }

        // Success - replace optimistic message with actual message from API
        // Note: The real-time subscription may also receive this message; we dedupe by id so
        // we never show the same message twice if both the API response and subscription update state.
        const sentMessage: Message = mapMessageApiResponseToMessage(response.data);
        sentMessage.timestamp = convertUTCToISTFormat(response.data.timestamp); // Convert UTC to IST format

        setMessages((prev) => {
          const withReplacement = prev.map((msg) =>
            msg.id === tempId ? sentMessage : msg
          );
          // Dedupe by id: keep first occurrence so we never show duplicate messages
          // (can happen when real-time delivers the same message before/after this update)
          const seenIds = new Set<string>();
          return withReplacement.filter((msg) => {
            if (seenIds.has(msg.id)) return false;
            seenIds.add(msg.id);
            return true;
          });
        });
      } catch (error) {
        // Network or other error - remove optimistic message and show error
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
        setFailedMessage(messageText);
        const errorMessage =
          error instanceof Error ? error.message : 'An unexpected error occurred';
        showError('Failed to send message', errorMessage);
      } finally {
        setIsSending(false);
      }
    },
    [selectedChatId, showError, mapMessageApiResponseToMessage]
  );

  const selectedChat = selectedChatId ? chats.find((c) => c.id === selectedChatId) : null;
  const contact = selectedChat?.contact ?? null;

  // Show loading state if chat is selected but not found in chats array yet
  const isChatNotFound = selectedChatId && !selectedChat && !chatsLoading;

  return (
    <div className="flex flex-1 min-h-0 h-full w-full gap-0 overflow-hidden bg-surface">
      {/* Sidebar: full-width on mobile/tablet when no chat selected, fixed w-80 on desktop (lg+) */}
      <div
        className={`${
          selectedChatId
            ? 'hidden lg:flex lg:w-80 lg:shrink-0'
            : 'flex w-full flex-1 min-w-0 lg:w-80 lg:flex-none lg:shrink-0'
        }`}
      >
        <ChatSidebar
          chats={chats}
          selectedChatId={selectedChatId}
          onSelectChat={setSelectedChatId}
        />

      </div>
      {/* Chat thread: full-width on mobile/tablet when chat selected, flex-1 on desktop (lg+) */}
      {chatsLoading ? (
        <div
          className={`flex min-h-0 flex-1 items-center justify-center ${
            selectedChatId ? 'flex' : 'hidden lg:flex'
          }`}
          aria-busy="true"
        >
          <p className="text-sm text-text-muted">Loading conversations…</p>
        </div>
      ) : isChatNotFound ? (
        <div
          className={`flex min-h-0 flex-1 items-center justify-center ${
            selectedChatId ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <div className="text-center">
            <p className="text-sm text-text-muted">Chat not found. Please select another conversation.</p>
            <button
              type="button"
              onClick={() => setSelectedChatId(null)}
              className="mt-2 text-sm text-primary hover:underline"
            >
              Go back
            </button>

          </div>
        </div>
      ) : (
        <div
          className={`flex flex-1 min-h-0 ${
            selectedChatId ? 'flex' : 'hidden lg:flex'
          }`}
        >

          <ChatThread
            contact={contact}
            messages={messagesLoading ? [] : messages}
            onSendMessage={handleSendMessage}
            isSending={isSending}
            failedMessage={failedMessage}
            onFailedMessageClear={() => setFailedMessage('')}
            onBack={() => setSelectedChatId(null)}
            onScrollToTop={loadOlderMessages}
            loadingOlderMessages={loadingOlderMessages}
            messagesContainerRef={messagesContainerRef}
          />
        </div>
      )}
    </div>
  );
}
