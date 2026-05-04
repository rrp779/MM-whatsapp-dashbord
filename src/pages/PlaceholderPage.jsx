import content from '../constants/pages.json';
import { MessageSquare, Radio, Users, Bot } from 'lucide-react';

const PAGE_ICONS = {
  chat: MessageSquare,
  campaigns: Radio,
  contacts: Users,
  aiAgent: Bot,
};

/**
 * Placeholder page for Chat, Campaigns, Contacts, AI Agent. Renders an
 * emptyState-style block with copy from constants. Page key must match
 * the keys in pages.json (chat, campaigns, contacts, aiAgent).
 *
 * @param {{ pageKey: 'chat' | 'campaigns' | 'contacts' | 'aiAgent' }} props
 */
function PlaceholderPage({ pageKey }) {
  const data = content[pageKey];
  const Icon = PAGE_ICONS[pageKey] ?? MessageSquare;

  if (!data) return null;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-border bg-surface py-12 text-center">
        <Icon className="h-12 w-12 text-text-muted" strokeWidth={1.5} aria-hidden />
        <h1 className="font-heading mt-3 text-lg font-semibold text-text">{data.pageTitle}</h1>
        <p className="mt-1 max-w-xs text-sm text-text-muted">{data.description}</p>
      </div>
    </div>
  );
}

export default PlaceholderPage;
