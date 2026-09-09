import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/services/supabase';
import '../admin-theme.css';

const NAV_ITEMS = [
  {
    to: '/admin',
    label: 'Dashboard',
    exact: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.5" />
        <rect x="13" y="3.5" width="7.5" height="4.5" rx="1.5" />
        <rect x="13" y="10.5" width="7.5" height="10" rx="1.5" />
        <rect x="3.5" y="13.5" width="7.5" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    to: '/admin/pacotes',
    label: 'Pacotes',
    exact: false,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 3.5 4 7.5v9L12 20.5l8-4v-9L12 3.5Z" />
        <path d="M4 7.5 12 11.5l8-4" />
        <path d="M12 11.5v9" />
      </svg>
    ),
  },
  {
    to: '/admin/expedicoes',
    label: 'Expedições',
    exact: false,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="12" cy="12" r="8.5" />
        <path d="m14.8 9.2-2 5.6-5.6 2 2-5.6 5.6-2Z" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    to: '/admin/clientes',
    label: 'Clientes',
    exact: false,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    to: '/admin/reservas',
    label: 'Reservas',
    exact: false,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/admin/login');
  }

  function isActive(to: string, exact: boolean) {
    return exact ? location.pathname === to : location.pathname.startsWith(to);
  }

  return (
    <div className="admin-shell">
      <div 
        className={`admin-overlay ${isSidebarOpen ? 'is-open' : ''}`} 
        onClick={() => setIsSidebarOpen(false)}
      />

      <aside className={`admin-sidebar ${isSidebarOpen ? 'is-open' : ''}`}>
        <div className="admin-brand">
          <div className="admin-brand-name">5Seasons</div>
          <div className="admin-brand-rule">
            <span className="admin-brand-rule-line" />
            <span className="admin-brand-label">ADMIN</span>
            <span className="admin-brand-rule-line" />
          </div>
        </div>

        <nav className="admin-nav">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`admin-nav-link${isActive(item.to, item.exact) ? ' active' : ''}`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <button onClick={handleLogout} className="admin-logout">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="m16 17 5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
          Sair
        </button>
      </aside>

      <div className="admin-main-wrapper">
        <header className="admin-mobile-topbar">
          <div className="brand">5Seasons Admin</div>
          <button 
            className="admin-menu-toggle" 
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Abrir Menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </header>

        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}