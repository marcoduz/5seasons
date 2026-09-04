import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/services/supabase';

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

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/admin/login');
  }

  function isActive(to: string, exact: boolean) {
    return exact ? location.pathname === to : location.pathname.startsWith(to);
  }

  return (
    <div className="admin-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;1,500&family=Inter:wght@400;500;600&display=swap');

        :root {
          --forest: #3c5a53;
          --forest-deep: #2f4842;
          --sage: #97b7b1;
          --nude: #d1b39d;
          --cream: #e8dad1;
          --warm-white: #fffaf8;
          --ink: #26332f;
        }

        .admin-shell {
          display: flex;
          min-height: 100vh;
          background-color: var(--warm-white);
          font-family: 'Inter', -apple-system, sans-serif;
          color: var(--ink);
        }

        .admin-sidebar {
          width: 264px;
          flex-shrink: 0;
          background-color: var(--forest);
          color: var(--warm-white);
          padding: 36px 24px 28px;
          display: flex;
          flex-direction: column;
        }

        .admin-brand {
          text-align: center;
          margin-bottom: 44px;
        }

        .admin-brand-name {
          font-family: 'Playfair Display', serif;
          font-size: 26px;
          font-weight: 600;
          letter-spacing: 0.01em;
          color: var(--warm-white);
        }

        .admin-brand-rule {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 10px;
        }

        .admin-brand-rule span:first-child,
        .admin-brand-rule span:last-child {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(255, 250, 248, 0.28);
        }

        .admin-brand-rule-line {
          flex: 1;
          height: 1px;
          background: rgba(255, 250, 248, 0.28);
        }

        .admin-brand-label {
          font-size: 11px;
          letter-spacing: 0.16em;
          color: var(--nude);
          white-space: nowrap;
        }

        .admin-nav {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }

        .admin-nav-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 14px;
          border-radius: 8px;
          color: rgba(255, 250, 248, 0.78);
          text-decoration: none;
          font-size: 14.5px;
          font-weight: 500;
          transition: background-color 0.15s ease, color 0.15s ease;
        }

        .admin-nav-link:hover {
          background-color: rgba(255, 250, 248, 0.08);
          color: var(--warm-white);
        }

        .admin-nav-link.active {
          background-color: var(--sage);
          color: var(--forest-deep);
        }

        .admin-nav-link svg {
          flex-shrink: 0;
          opacity: 0.9;
        }

        .admin-logout {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 11px;
          background: transparent;
          color: var(--cream);
          border: 1px solid rgba(255, 250, 248, 0.28);
          border-radius: 8px;
          font-family: inherit;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.15s ease, border-color 0.15s ease;
        }

        .admin-logout:hover {
          background-color: rgba(255, 250, 248, 0.08);
          border-color: rgba(255, 250, 248, 0.45);
        }

        .admin-main {
          flex: 1;
          padding: 40px 44px;
          overflow-y: auto;
        }
      `}</style>

      <aside className="admin-sidebar">
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

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}