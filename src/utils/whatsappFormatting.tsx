import React from 'react';

/**
 * Token types for WhatsApp message formatting.
 */
type TokenType = 'text' | 'bold' | 'italic' | 'strikethrough' | 'monospace' | 'newline';

/**
 * Regex to detect URLs in plain text (http, https).
 * Captures the full URL; trailing punctuation (e.g. . ) ) is trimmed when rendering.
 */
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

/**
 * Regex to detect email addresses (e.g. user@example.com).
 */
const EMAIL_REGEX = /\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/g;

/**
 * Regex to detect phone numbers: international (+91 98765 43210) or 10+ digits with optional separators.
 * Single capturing group for the full match.
 */
const PHONE_REGEX = /((?:\+\d{1,3}[-.\s]?)?\(?\d{2,5}\)?[-.\s]?\d{2,5}[-.\s]?\d{2,5}(?:[-.\s]?\d{2,5})?|\d{10})\b/g;

/**
 * Represents a parsed token in a WhatsApp message.
 */
interface Token {
  type: TokenType;
  content: string;
}

/**
 * Parses WhatsApp-style formatting from a text string.
 * Supports:
 * - *bold* for bold text
 * - _italic_ for italic text
 * - ~strikethrough~ for strikethrough text
 * - `monospace` for monospace/code text
 * - \n for line breaks
 * 
 * Handles edge cases similar to WhatsApp:
 * - Formatting markers must be at word boundaries
 * - Escaped markers (preceded by backslash) are treated as literal characters
 * - Nested formatting is supported
 * 
 * @param text - The raw text string to parse
 * @returns Array of tokens representing the formatted text
 */
export function parseWhatsAppFormatting(text: string): Token[] {
  if (!text) return [];

  const tokens: Token[] = [];
  let i = 0;
  let currentText = '';

  /**
   * Flushes accumulated plain text as a token.
   */
  const flushText = (): void => {
    if (currentText) {
      tokens.push({ type: 'text', content: currentText });
      currentText = '';
    }
  };

  /**
   * Checks if a position is at a word boundary for formatting markers.
   * WhatsApp allows formatting markers at:
   * - Start/end of string
   * - Adjacent to whitespace
   * - Adjacent to punctuation (non-alphanumeric)
   * 
   * @param pos - Position to check
   * @param isOpening - Whether this is an opening marker (true) or closing marker (false)
   * @returns True if position is at a valid word boundary
   */
  const isWordBoundary = (pos: number, isOpening: boolean): boolean => {
    if (pos < 0 || pos >= text.length) return true;
    
    if (isOpening) {
      // Opening marker: check if previous char is boundary (or start of string)
      if (pos === 0) return true;
      const prevChar = text[pos - 1];
      return /[\s\W]/.test(prevChar);
    } else {
      // Closing marker: check if next char is boundary (or end of string)
      if (pos === text.length - 1) return true;
      const nextChar = text[pos + 1];
      return /[\s\W]/.test(nextChar);
    }
  };

  /**
   * Checks if a character is escaped (preceded by backslash that's not itself escaped).
   */
  const isEscaped = (pos: number): boolean => {
    if (pos === 0) return false;
    // Count consecutive backslashes before this position
    let backslashCount = 0;
    let checkPos = pos - 1;
    while (checkPos >= 0 && text[checkPos] === '\\') {
      backslashCount++;
      checkPos--;
    }
    // Odd number of backslashes means escaped
    return backslashCount % 2 === 1;
  };

  /**
   * Finds the closing marker for a given opening marker.
   * Returns the position of the closing marker, or -1 if not found.
   */
  const findClosingMarker = (startPos: number, marker: string): number => {
    let pos = startPos + 1;

    while (pos < text.length) {
      if (text[pos] === marker && !isEscaped(pos)) {
        // Check if this is at a word boundary (closing marker)
        if (isWordBoundary(pos, false)) {
          return pos;
        }
      }
      pos++;
    }

    return -1;
  };

  while (i < text.length) {
    // Handle actual newline characters
    if (text[i] === '\n') {
      flushText();
      tokens.push({ type: 'newline', content: '\n' });
      i++;
      continue;
    }

    // Handle escaped characters (including escaped newlines)
    if (text[i] === '\\' && i + 1 < text.length) {
      if (text[i + 1] === 'n') {
        // Escaped newline sequence \n
        flushText();
        tokens.push({ type: 'newline', content: '\n' });
        i += 2;
        continue;
      } else if (text[i + 1] === '\\' || ['*', '_', '~', '`'].includes(text[i + 1])) {
        // Escaped backslash or formatting marker - treat as literal
        currentText += text[i + 1];
        i += 2;
        continue;
      }
    }

    // Check for formatting markers (only at word boundaries)
    const char = text[i];
    let marker: string | null = null;
    let tokenType: TokenType = 'text';

    if (!isEscaped(i)) {
      if (char === '*' && isWordBoundary(i, true)) {
        marker = '*';
        tokenType = 'bold';
      } else if (char === '_' && isWordBoundary(i, true)) {
        marker = '_';
        tokenType = 'italic';
      } else if (char === '~' && isWordBoundary(i, true)) {
        marker = '~';
        tokenType = 'strikethrough';
      } else if (char === '`' && isWordBoundary(i, true)) {
        marker = '`';
        tokenType = 'monospace';
      }
    }

    if (marker) {
      const closingPos = findClosingMarker(i, marker);
      if (closingPos !== -1) {
        // Found matching closing marker
        flushText();

        // Extract content between markers
        const content = text.substring(i + 1, closingPos);

        // Create token with the content (will be recursively parsed if needed)
        tokens.push({ type: tokenType, content: content });

        i = closingPos + 1;
        continue;
      }
    }

    // Regular character - accumulate in currentText
    currentText += text[i];
    i++;
  }

  // Flush any remaining text
  flushText();

  return tokens;
}

/**
 * Trims trailing punctuation from a URL that was captured with [^\s]+.
 * Keeps the URL safe for use in href and avoids including sentence punctuation in the link.
 *
 * @param url - Raw captured URL string
 * @returns Trimmed URL and the trailing punctuation (if any) for display
 */
function trimTrailingPunctuationFromUrl(url: string): { href: string; trailing: string } {
  const match = url.match(/^(.*?)([.,;:!?)\]]+)$/);
  if (match) {
    return { href: match[1], trailing: match[2] };
  }
  return { href: url, trailing: '' };
}

/** Segment type for a highlighted span (link, email, phone). */
type HighlightType = 'url' | 'email' | 'phone';

/** A contiguous highlighted segment with start index, end index, type, and display/href value. */
interface HighlightSegment {
  start: number;
  end: number;
  type: HighlightType;
  value: string;
  trailing?: string;
}

/**
 * Collects all URL, email, and phone segments from text, then merges overlapping ranges
 * (keeps the segment that starts first). Returns sorted, non-overlapping segments.
 */
function collectHighlightSegments(text: string): HighlightSegment[] {
  const segments: HighlightSegment[] = [];

  // URLs
  const urlRe = new RegExp(URL_REGEX.source, 'g');
  let match: RegExpExecArray | null;
  while ((match = urlRe.exec(text)) !== null) {
    const raw = match[1];
    const { href, trailing } = trimTrailingPunctuationFromUrl(raw);
    segments.push({
      start: match.index,
      end: match.index + href.length,
      type: 'url',
      value: href,
      trailing,
    });
  }

  // Emails
  const emailRe = new RegExp(EMAIL_REGEX.source, 'g');
  while ((match = emailRe.exec(text)) !== null) {
    segments.push({
      start: match.index,
      end: match.index + match[1].length,
      type: 'email',
      value: match[1],
    });
  }

  // Phones
  const phoneRe = new RegExp(PHONE_REGEX.source, 'g');
  while ((match = phoneRe.exec(text)) !== null) {
    segments.push({
      start: match.index,
      end: match.index + match[1].length,
      type: 'phone',
      value: match[1],
    });
  }

  segments.sort((a, b) => a.start - b.start);

  // Merge overlapping: keep first segment, skip any that start before current effective end
  const effectiveEnd = (s: HighlightSegment): number =>
    s.end + (s.trailing?.length ?? 0);
  const merged: HighlightSegment[] = [];
  for (const seg of segments) {
    if (merged.length > 0 && seg.start < effectiveEnd(merged[merged.length - 1])) {
      continue;
    }
    merged.push(seg);
  }
  return merged;
}

const HIGHLIGHT_LINK_CLASS =
  'text-primary underline break-all hover:opacity-90';

/**
 * Parses plain text for URLs, email addresses, and phone numbers and returns React nodes:
 * spans for plain text, anchor tags for links (url → href, email → mailto:, phone → tel:).
 * All are styled as highlighted/underlined.
 *
 * @param text - Plain text that may contain URLs, emails, or phones
 * @param keyPrefix - Base value for React keys to avoid collisions
 * @returns Array of React nodes (spans and links)
 */
function parseLinksInText(text: string, keyPrefix: number): React.ReactNode[] {
  const segments = collectHighlightSegments(text);
  if (segments.length === 0) {
    return [<span key={`${keyPrefix}-0`}>{text}</span>];
  }

  const parts: React.ReactNode[] = [];
  let key = 0;
  let lastIndex = 0;

  for (const seg of segments) {
    if (seg.start > lastIndex) {
      parts.push(
        <span key={`${keyPrefix}-${key++}`}>{text.slice(lastIndex, seg.start)}</span>
      );
    }
    const href =
      seg.type === 'url'
        ? seg.value
        : seg.type === 'email'
          ? `mailto:${seg.value}`
          : `tel:${seg.value.replace(/\s/g, '')}`;
    parts.push(
      <a
        key={`${keyPrefix}-${key++}`}
        href={href}
        target={seg.type === 'url' ? '_blank' : undefined}
        rel={seg.type === 'url' ? 'noopener noreferrer' : undefined}
        className={HIGHLIGHT_LINK_CLASS}
      >
        {seg.value}
      </a>
    );
    if (seg.trailing) {
      parts.push(<span key={`${keyPrefix}-${key++}`}>{seg.trailing}</span>);
    }
    lastIndex = seg.end + (seg.trailing?.length ?? 0);
  }
  if (lastIndex < text.length) {
    parts.push(<span key={`${keyPrefix}-${key++}`}>{text.slice(lastIndex)}</span>);
  }
  return parts;
}

/**
 * Recursively renders a token and its content with nested formatting support.
 * Plain text tokens are scanned for URLs, which are rendered as highlighted links.
 *
 * @param token - The token to render
 * @param key - React key for the element
 * @returns React node representing the token
 */
function renderToken(token: Token, key: number): React.ReactNode {
  switch (token.type) {
    case 'text':
      return (
        <span key={key} style={{ whiteSpace: 'pre-wrap' }}>
          {parseLinksInText(token.content, key)}
        </span>
      );
    case 'bold':
      // Recursively parse nested formatting in bold text
      const boldTokens = parseWhatsAppFormatting(token.content);
      return (
        <strong key={key} className="font-semibold">
          {boldTokens.map((t, idx) => renderToken(t, idx))}
        </strong>
      );
    case 'italic':
      const italicTokens = parseWhatsAppFormatting(token.content);
      return (
        <em key={key} className="italic">
          {italicTokens.map((t, idx) => renderToken(t, idx))}
        </em>
      );
    case 'strikethrough':
      const strikeTokens = parseWhatsAppFormatting(token.content);
      return (
        <span key={key} className="line-through">
          {strikeTokens.map((t, idx) => renderToken(t, idx))}
        </span>
      );
    case 'monospace':
      const monoTokens = parseWhatsAppFormatting(token.content);
      return (
        <code key={key} className="font-mono text-xs bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded">
          {monoTokens.map((t, idx) => renderToken(t, idx))}
        </code>
      );
    case 'newline':
      return <br key={key} />;
    default:
      return <span key={key}>{token.content}</span>;
  }
}

/**
 * Renders WhatsApp-formatted text as React elements.
 * Converts tokens into appropriate JSX elements with styling.
 * Supports nested formatting (e.g., bold within italic).
 * 
 * @param text - The raw text string to format
 * @param className - Optional CSS class to apply to the root element
 * @returns React element tree representing the formatted text
 */
export function renderWhatsAppText(text: string, className?: string): React.ReactElement {
  const tokens = parseWhatsAppFormatting(text);

  return (
    <span className={className} style={{ whiteSpace: 'pre-wrap' }}>
      {tokens.map((token, idx) => renderToken(token, idx))}
    </span>
  );
}
