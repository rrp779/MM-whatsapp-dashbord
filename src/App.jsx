import { useState, useEffect } from 'react';
import { Routes, Route, Outlet, useLocation } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar.jsx';
import TopBar from './components/layout/TopBar.jsx';
import Welcome from './pages/Welcome.jsx';
import PlaceholderPage from './pages/PlaceholderPage.jsx';
import Chat from './pages/Chat';
import content from './constants/pages.json';

const DEFAULT_BREADCRUMBS = [{ label: 'Dashboard', path: '/' }];

/**
 * App shell: Sidebar, TopBar (with breadcrumb), and main area with routed content.
 * Breadcrumbs are taken from constants/pages.json by pathname.
 */
export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const breadcrumbs = content.breadcrumbs?.[pathname] ?? DEFAULT_BREADCRUMBS;

  // Close mobile sidebar when route changes
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  /**
   * Handles sidebar toggle - different behavior for mobile vs desktop.
   * On mobile: toggles overlay visibility.
   * On desktop: toggles collapsed state.
   */
  const handleSidebarToggle = () => {
    // Check if we're on mobile (viewport width < 768px)
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setMobileSidebarOpen((prev) => !prev);
    } else {
      setSidebarCollapsed((prev) => !prev);
    }
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="flex h-screen bg-background overflow-hidden">
            {/* Backdrop overlay for mobile sidebar */}
            {mobileSidebarOpen && (
              <div
                className="fixed inset-0 z-30 bg-black/50 md:hidden"
                onClick={() => setMobileSidebarOpen(false)}
                aria-hidden="true"
              />
            )}
            <Sidebar
              collapsed={sidebarCollapsed}
              mobileOpen={mobileSidebarOpen}
              onToggle={handleSidebarToggle}
              onMobileClose={() => setMobileSidebarOpen(false)}
            />
            <div className="flex flex-1 flex-col min-w-0 min-h-0 overflow-hidden">
              <TopBar breadcrumbs={breadcrumbs} onToggleSidebar={handleSidebarToggle} />
              <main className={`flex flex-col flex-1 min-h-0 ${pathname === '/chat' ? 'overflow-hidden p-0' : 'overflow-y-auto p-4 sm:p-6'}`}>
                <Outlet />
              </main>
            </div>
          </div>
        }
      >
        <Route index element={<Welcome />} />
        <Route path="chat" element={<Chat />} />
        <Route path="campaigns" element={<PlaceholderPage pageKey="campaigns" />} />
        <Route path="contacts" element={<PlaceholderPage pageKey="contacts" />} />
        <Route path="ai-agent" element={<PlaceholderPage pageKey="aiAgent" />} />
      </Route>
    </Routes>
  );
}
