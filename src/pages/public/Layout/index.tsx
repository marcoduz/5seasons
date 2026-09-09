import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './header';
import { Footer } from './footer';
import { useEffect } from 'react';
import '../public-theme.css';

export function PublicLayout() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.documentElement.style.overflow = 'auto';
    document.body.style.overflow = 'auto';
    
    // Garante que a div principal do React também não esteja travada
    const rootEl = document.getElementById('root');
    if (rootEl) {
      rootEl.style.overflow = 'auto';
      rootEl.style.height = 'auto';
    }
  }, [pathname]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}