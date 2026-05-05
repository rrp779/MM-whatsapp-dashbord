import { Link } from 'react-router-dom';
import { ChevronRight, Menu, MessageCircle } from 'lucide-react';

/**
 * Sticky top bar with breadcrumb nav and sidebar toggle.
 * Each breadcrumb segment is a clickable link. Follows design-system.json layout.topBar.
 *
 * @param {{ label: string, path: string }[]} breadcrumbs - Ordered list of { label, path }; each is a Link.
 * @param {() => void} onToggleSidebar - Callback when the sidebar toggle button is clicked.
 */
function TopBar({ breadcrumbs, onToggleSidebar }) {
  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-surface px-4">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-button text-text-muted hover:bg-primary-muted/50 hover:text-text focus:outline-none"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" strokeWidth={1.5} />
        </button>
        <nav aria-label="Breadcrumb" className="flex min-w-0 flex-1 items-center gap-1.5">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.path} className="flex shrink-0 items-center gap-1.5">
            {i > 0 && (
              <ChevronRight
                className="h-4 w-4 shrink-0 text-text-muted"
                strokeWidth={2}
                aria-hidden
              />
            )}
            <Link
              to={crumb.path}
              className="truncate text-sm font-medium text-text hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-button px-1 py-0.5 -mx-1 -my-0.5"
            >
              {crumb.label}
            </Link>
          </span>
        ))}
        </nav>
        
      </div>
     {/*  <button
        type="button"
        data-tally-open="VLz62J"
        data-tally-width="600"
        data-tally-overlay="1"
        data-tally-emoji-text="👋"
        data-tally-emoji-animation="wave"
        data-tally-auto-close="1000"
        data-tally-form-events-forwarding="1"
        className="flex shrink-0 items-center gap-2 rounded-button px-3 py-2 text-sm font-medium text-text-muted hover:bg-primary-muted/50 hover:text-primary focus:outline-none"
        aria-label="Share feedback and suggestions"
      >
        <MessageCircle className="h-4 w-4" strokeWidth={1.5} aria-hidden />
        <span className="hidden sm:inline">Feedback</span>
      </button> */}
    </header>
  );
}

export default TopBar;
