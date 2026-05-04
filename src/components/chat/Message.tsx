import { Check, CheckCheck, Clock } from 'lucide-react';
import type { Message as MessageType, MessageStatus, TextMessage } from '../../types';
import { renderWhatsAppText } from '../../utils/whatsappFormatting';

/**
 * Formats an ISO timestamp to a short time string (e.g. "17:32").
 * The timestamp from the API is already in IST timezone, so we display it as-is
 * without any timezone conversion. Uses UTC methods to extract the time values
 * directly from the timestamp string.
 * 
 * @param iso - ISO 8601 timestamp string (e.g., "2026-01-25T17:32:06.000Z")
 * @returns Formatted time string in 24-hour format (e.g., "17:32") - displayed as-is from API
 */
function formatTime(iso: string): string {
  if (!iso) return '';
  
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '';
  
  // Use UTC methods to get the hours and minutes as they appear in the timestamp
  // This avoids timezone conversion since the API timestamps are already in IST
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Renders the status icon for an outbound message.
 * pending: clock icon; sent: single check (dark gray); delivered: double check (dark gray); read: double check (blue).
 */
function StatusIcon({ status }: { status?: MessageStatus }) {
  if (!status) return null;
  if (status === 'pending') {
    return <Clock className="h-3.5 w-3.5 shrink-0 text-gray-600/70" strokeWidth={2} aria-hidden />;
  }
  if (status === 'sent') {
    return <Check className="h-3.5 w-3.5 shrink-0 text-gray-700" strokeWidth={2.5} aria-hidden />;
  }
  if (status === 'delivered') {
    return (
      <CheckCheck
        className="h-3.5 w-3.5 shrink-0 text-gray-700"
        strokeWidth={2.5}
        aria-hidden
      />
    );
  }
  // read status - use blue color for maximum visibility on green background
  return (
    <CheckCheck
      className="h-3.5 w-3.5 shrink-0 text-blue-500"
      strokeWidth={2.5}
      aria-hidden
    />
  );
}

/**
 * Renders the read-receipt icon for an inbound message when the user has read it.
 */
function ReadReceiptIcon({ read }: { read?: boolean }) {
  if (!read) return null;
  return (
    <CheckCheck
      className="h-3.5 w-3.5 shrink-0 text-primary"
      strokeWidth={2}
      aria-label="Read"
    />
  );
}

/**
 * Renders a freeform text message bubble (inbound or outbound) with timestamp,
 * status (outbound), and read receipt (inbound). Follows design-system chatBubble.
 */
function MessageText({ message }: { message: TextMessage }) {
  const isOutbound = message.sender === 'user';
  const time = formatTime(message.timestamp);

  if (isOutbound) {
    // Pending messages have a muted/different color
    const isPending = message.status === 'pending';
    return (
      <div className="flex justify-end">
        <div
          className={`max-w-[75%] rounded-[12px_12px_4px_12px] px-3.5 py-2.5 ${
            isPending
              ? 'bg-primary-muted text-text'
              : ''
          }`}
          style={!isPending ? { 
            backgroundColor: '#dcf8c6', 
            color: '#111b21',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
          } : undefined}
        >
          <div className="text-sm">{renderWhatsAppText(message.text)}</div>
          <div className="mt-1 flex items-center justify-end gap-1">
            <span className={`text-xs ${isPending ? 'opacity-70' : 'opacity-80'}`}>{time}</span>
            <StatusIcon status={message.status} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div 
        className="max-w-[75%] rounded-[12px_12px_12px_4px] px-3.5 py-2.5"
        style={{ 
          backgroundColor: '#ffffff', 
          color: '#111b21',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div className="text-sm">{renderWhatsAppText(message.text)}</div>
        <div className="mt-1 flex items-center justify-end gap-1">
          <span className="text-xs opacity-70">{time}</span>
          <ReadReceiptIcon read={message.readReceipt} />
        </div>
      </div>
    </div>
  );
}

/**
 * Message component. Dispatches to the appropriate renderer based on messageType.
 * Extend the switch when adding 'template' or 'interactive' types.
 *
 * @param message - The message payload (from API / n8n)
 */
export default function Message({ message }: { message: MessageType }) {
  switch (message.messageType) {
    case 'text':
      return <MessageText message={message} />;
    // case 'template':
    //   return <MessageTemplate message={message} />;
    // case 'interactive':
    //   return <MessageInteractive message={message} />;
    default:
      return null;
  }
}
