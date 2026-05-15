import { useState, useMemo, type ReactElement } from 'react';
import { Search } from 'lucide-react';
import type { Chat } from '../../types';

/**
 * Formats an ISO timestamp to a short label (e.g. "10:05 AM" or "Yesterday").
 */
function formatLastMessageTime(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    }
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

interface ChatSidebarProps {
  chats: Chat[];
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
}

/**
 * Left sidebar listing all conversations (chats).
 * Each row shows contact avatar, name, last message preview, time, and unread badge.
 * Follows design-system layout (navItem-like rows) and coreFlows.chat.
 * Includes a search bar to filter contacts on the front-end.
 */
export default function ChatSidebar({ chats, selectedChatId, onSelectChat }: ChatSidebarProps): ReactElement {
  const [searchQuery, setSearchQuery] = useState<string>('');

  /**
   * Filters chats based on the search query.
   * Matches against contact name (case-insensitive).
   * 
   * @returns Filtered array of chats
   */
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) {
      return chats;
    }

    const query = searchQuery.toLowerCase().trim();
    return chats.filter((chat) => {
      const contactName = chat.contact?.name?.toLowerCase() ?? '';
      return contactName.includes(query);
    });
  }, [chats, searchQuery]);

  return (
    <aside className="flex w-full min-w-0 shrink-0 flex-col border-r border-border bg-surface h-full  ">
      <div className="flex h-12 shrink-0 items-center border-b border-border px-3">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Search contacts"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-button bg-background border border-border text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50 transition-colors"
            aria-label="Search contacts"
          />
        </div>
      </div>
      
      {/* Chat list section */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden min-h-0" aria-label="Conversation list">
        <aside className="flex h-full min-h-0 w-full min-w-0 shrink-0 flex-col border-r border-border bg-surface  ">
        {filteredChats.map((chat) => {
          const isSelected = selectedChatId === chat.id;
          const preview = chat.lastMessage?.text ?? '';
          const time = chat.lastMessage?.timestamp ? formatLastMessageTime(chat.lastMessage.timestamp) : '';

          return (
            <button
              key={chat.id}
              type="button"
              onClick={() => onSelectChat(chat.id)}
              className={`py-2.5 grid min-h-[44px] w-full grid-cols-[auto_1fr_auto] items-center gap-2 px-3 md:gap-3 text-left transition-colors focus:outline-none relative ${
                isSelected 
                  ? 'bg-gray-50/60 dark:bg-gray-600/10 border-r-[3px] border-r-primary-600' 
                  : 'text-text hover:bg-primary-muted/50'
              }`}
              aria-label={`Chat with ${chat.contact?.name ?? 'Unknown'}`}
              aria-current={isSelected ? 'true' : undefined}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-muted text-sm font-medium text-primary">
                {chat.contact?.name?.charAt(0)?.toUpperCase() ?? '?'}
              </span>
              <div className="min-w-0 overflow-hidden">
                <span className="truncate block text-sm font-medium">{chat.contact?.name ?? 'Unknown'}</span>
                {preview && (
                  <p className="truncate text-xs text-text-muted">{preview}</p>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                {time && <span className="text-xs text-text-muted whitespace-nowrap">{time}</span>}
                {chat.unreadCount != null && chat.unreadCount > 0 && (
                  <span
                    className="flex h-5 min-w-[20px] items-center justify-center rounded-badge bg-primary px-1.5 md:px-2 text-xs font-medium text-white"
                    aria-label={`${chat.unreadCount} unread`}
                  >
                    {chat.unreadCount}
                  </span>
                )}
              </div>
            </button>
          );
        })}
        </aside>
      </nav>
    </aside>
  );
}
