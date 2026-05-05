import { Link, useLocation } from 'react-router-dom';
import branding from '../../../branding';
import Logo from '../Logo';
import {
  LayoutDashboard,
  MessageSquare,
  Radio,
  Users,
  Bot,
  ExternalLink,
} from 'lucide-react';

/** WhatsApp community invite link — join for updates, support, and discussions. */
const WHATSAPP_COMMUNITY_LINK = 'https://chat.whatsapp.com/KxHIVtIYcKU5iHVcZMfe8p';

/** WhatsApp logo icon (brand mark: phone in chat bubble). Uses currentColor for fill. */
function WhatsAppIcon({ className = 'h-5 w-5', ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
      {...props}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

/**
 * App sidebar with collapsible nav. All main items link to their routes.
 * Follows design-system.json layout.sidebar.
 * On mobile, sidebar is hidden by default and shown as overlay when mobileOpen is true.
 *
 * @param {boolean} collapsed - Whether the sidebar is collapsed to icon-only width (desktop only).
 * @param {boolean} mobileOpen - Whether the sidebar is open on mobile (overlay mode).
 * @param {() => void} onToggle - Callback when the sidebar toggle button is clicked.
 * @param {() => void} onMobileClose - Callback to close the mobile sidebar.
 */
function Sidebar({ collapsed, mobileOpen, onToggle, onMobileClose }) {
  const { pathname } = useLocation();

  const nav = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/', comingSoon: false },
    { icon: MessageSquare, label: 'Chat', path: '/chat', comingSoon: false },
    //{ icon: Radio, label: 'Campaigns', path: '/campaigns', comingSoon: true },
   // { icon: Users, label: 'Contacts', path: '/contacts', comingSoon: true },
   // { icon: Bot, label: 'AI Agent', path: '/ai-agent', comingSoon: true },
  ];

  // On mobile, always show full sidebar when open
  // On desktop, respect the collapsed state
  const showFullSidebar = mobileOpen || !collapsed;
  
  return (
    <aside
      className={`flex flex-col border-r border-border bg-surface text-text shrink-0 z-40 min-h-screen
        fixed md:static top-0 left-0
        transform transition-transform md:transition-[width]
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
        w-60 ${collapsed ? 'md:w-16' : 'md:w-60'}
      `}
    >
      <div className={`flex h-14 items-center gap-2 border-b border-border shrink-0 ${
        showFullSidebar ? 'px-2 sm:px-3' : 'justify-center px-2'
      }`}>
        <Logo className={showFullSidebar ? 'h-8 w-8' : 'h-5 w-5'} />
        {showFullSidebar && (
          <span className="font-heading font-semibold text-text truncate flex-1 min-w-0">{branding.brandName}</span>
        )}
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-2">
        {nav.map(({ icon: NavIcon, label, path, comingSoon }) => {
          const isActive = pathname === path;
          const baseClassName = `flex min-h-[44px] items-center rounded-button text-sm font-medium transition-colors focus:outline-none relative ${
            showFullSidebar ? 'gap-3 px-3' : 'justify-center px-2'
          }`;
          
          const className = comingSoon
            ? `${baseClassName} text-text-muted/50 cursor-not-allowed`
            : `${baseClassName} ${
                isActive ? 'bg-primary-muted text-primary' : 'text-text-muted hover:bg-primary-muted/50 hover:text-text'
              }`;

          if (comingSoon) {
            return (
              <div
                key={label}
                className={className}
                aria-label={`${label} - Coming Soon`}
                aria-disabled="true"
                tabIndex={-1}
              >
                <NavIcon className="h-5 w-5 shrink-0 opacity-60" strokeWidth={1.5} />
                {showFullSidebar && (
                  <>
                    <span className="truncate flex-1">{label}</span>
                    <span className="text-[10px] text-text-muted/50 font-normal shrink-0 ml-1">
                      Coming Soon
                    </span>
                  </>
                )}
              </div>
            );
          }

          return (
            <Link
              key={label}
              to={path}
              className={className}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => {
                // Close mobile sidebar when navigating
                if (mobileOpen) {
                  onMobileClose();
                }
              }}
            >
              <NavIcon className="h-5 w-5 shrink-0" strokeWidth={1.5} />
              {showFullSidebar && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* WhatsApp Community — card with strong contrast and clear CTA */}
      <div className={`border-t border-border p-2 shrink-0 ${showFullSidebar ? '' : 'flex justify-center'}`}>
        <a
          href={WHATSAPP_COMMUNITY_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className={`
            flex items-center gap-3 rounded-card text-left transition-all duration-200 focus:outline-none
            focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2
            bg-surface border border-border shadow-sm
            hover:border-[#25D366]/50 hover:shadow-md
            ${showFullSidebar ? 'p-3 pl-3 border-l-4 border-l-[#25D366]' : 'justify-center p-2 min-h-[44px] border-l-4 border-l-[#25D366]'}
          `}
          aria-label="Join our WhatsApp Community"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#25D366]/12 text-[#128C7E] dark:bg-[#25D366]/20 dark:text-[#25D366]">
            <WhatsAppIcon className="h-5 w-5" />
          </span>
          {showFullSidebar ? (
            <span className="flex-1 min-w-0">
              <span className="font-semibold block text-sm text-text">Join the community</span>
              <span className="text-xs text-text-muted mt-0.5 block leading-snug">
                Feature updates, support &amp; discussions. Limited spots.
              </span>
              <span className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium text-[#128C7E] dark:text-[#25D366]">
                Join now
                <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
              </span>
            </span>
          ) : null}
        </a>
      </div>
    </aside>
  );
}

export default Sidebar;
