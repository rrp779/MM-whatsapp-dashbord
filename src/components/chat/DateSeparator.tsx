import { formatDateForSeparator } from '../../utils/date';

interface DateSeparatorProps {
  /** ISO 8601 timestamp string for the date to display */
  timestamp: string;
}

/**
 * Date separator component that displays a date divider between messages.
 * Shows "Today", "Yesterday", or a formatted date (e.g., "Jan 24, 2026").
 * Styled similar to WhatsApp's date separators.
 * 
 * @param props - DateSeparator component props
 * @returns DateSeparator component
 */
export default function DateSeparator({ timestamp }: DateSeparatorProps): React.ReactElement {
  const dateText = formatDateForSeparator(timestamp);

  return (
    <div className="flex items-center justify-center py-2">
      <div className="rounded-full bg-surface px-3 py-1">
        <span className="text-xs font-medium text-text-muted">{dateText}</span>
      </div>
    </div>
  );
}
