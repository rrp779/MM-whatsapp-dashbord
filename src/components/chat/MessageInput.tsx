import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, X } from 'lucide-react';
import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react';

interface MessageInputProps {
  /** Callback when message is sent */
  onSend: (message: string) => void;
  /** Whether the input is disabled (e.g., while sending) */
  disabled?: boolean;
  /** Initial message value (for error retry) */
  initialValue?: string;
  /** Callback when input value changes */
  onValueChange?: (value: string) => void;
}

/**
 * Message Input Component
 * 
 * Provides a text input with emoji picker and send button.
 * Supports Enter key to send and disabled state while sending.
 * 
 * @param props - MessageInput component props
 * @returns MessageInput component
 */
export default function MessageInput({
  onSend,
  disabled = false,
  initialValue = '',
  onValueChange,
}: MessageInputProps): React.JSX.Element {
  const [message, setMessage] = useState<string>(initialValue);
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Update message when initialValue changes (for error retry)
  useEffect(() => {
    if (initialValue) {
      setMessage(initialValue);
    }
  }, [initialValue]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest('[data-emoji-button]')
      ) {
        setShowEmojiPicker(false);
      }
    }

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showEmojiPicker]);

  /**
   * Handles input value change
   */
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    const value = e.target.value;
    setMessage(value);
    onValueChange?.(value);
  };

  /**
   * Handles Enter key press (Shift+Enter for new line)
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /**
   * Handles sending the message
   */
  const handleSend = (): void => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled) {
      onSend(trimmedMessage);
      setMessage('');
      onValueChange?.('');
      setShowEmojiPicker(false);
    }
  };

  /**
   * Handles emoji selection from the emoji picker library
   * 
   * @param emojiData - Emoji data object from emoji-picker-react
   */
  const handleEmojiSelect = (emojiData: EmojiClickData): void => {
    const textarea = inputRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const emoji = emojiData.emoji;
      const newMessage = message.slice(0, start) + emoji + message.slice(end);
      setMessage(newMessage);
      onValueChange?.(newMessage);
      
      // Set cursor position after emoji
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    }
    setShowEmojiPicker(false);
  };

  /**
   * Toggles emoji picker visibility
   */
  const toggleEmojiPicker = (): void => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  return (
    <div className="relative shrink-0 border-t border-border bg-surface px-4 py-3">
      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="absolute bottom-full left-4 mb-2 rounded-card border border-border bg-surface-elevated shadow-lg"
        >
          <div className="flex items-center justify-between border-b border-border p-2">
            <span className="text-sm font-medium text-text">Select Emoji</span>
            <button
              type="button"
              onClick={() => setShowEmojiPicker(false)}
              className="flex h-6 w-6 items-center justify-center rounded-button text-text-muted hover:bg-primary-muted/50"
              aria-label="Close emoji picker"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="[&_.epr-emoji-category-label]:!bg-surface-elevated [&_.epr-emoji-category-label]:!text-text [&_.epr-header]:!bg-surface-elevated [&_.epr-header]:!border-border [&_.epr-search-container]:!bg-surface-elevated [&_.epr-search-container_input]:!bg-surface [&_.epr-search-container_input]:!text-text [&_.epr-search-container_input]:!border-border [&_.epr-emoji-category]:!bg-surface-elevated [&_.epr-body]:!bg-surface-elevated">
            <EmojiPicker
              onEmojiClick={handleEmojiSelect}
              width={350}
              height={400}
              previewConfig={{
                showPreview: false,
              }}
              searchDisabled={false}
              skinTonesDisabled={false}
            />
          </div>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Emoji Button */}
        <button
          type="button"
          onClick={toggleEmojiPicker}
          disabled={disabled}
          data-emoji-button
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-button text-text-muted hover:bg-primary-muted/50 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Open emoji picker"
        >
          <Smile className="h-5 w-5" strokeWidth={1.5} />
        </button>

        {/* Text Input */}
        <textarea
          ref={inputRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 resize-none rounded-input border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            minHeight: '40px',
            maxHeight: '120px',
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
          }}
        />

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-button bg-primary text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Send message"
        >
          <Send className="h-5 w-5" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
