import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { label: 'Expedições', to: '/', match: (path: string) => path === '/' || path.startsWith('/expedicao/') },
  { label: 'Nossa História', to: '/nossa/historia', match: (path: string) => path === '/nossa/historia' },
  { label: 'Dúvidas Frequentes', to: '/duvidas', match: (path: string) => path === '/duvidas' },
];

export function Header() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const activeIndex = NAV_ITEMS.findIndex((item) => item.match(location.pathname));
  const isExpedicaoPage = location.pathname.startsWith('/expedicao/');

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Fecha o menu sempre que a rota muda
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Deteta quando a página rola
  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const appliedScrolled = scrolled && !isMobileMenuOpen;

  return (
    <header 
      id="main-header" 
      className={`public-header ${appliedScrolled ? 'is-scrolled' : ''} ${isExpedicaoPage ? 'is-transparent-top' : ''} ${isMobileMenuOpen ? 'menu-open' : ''}`}
    >
      <div className="container public-header-inner">
        <Link to="/" className="public-brand" onClick={() => setIsMobileMenuOpen(false)}>
          <img src="/5seasonsLogo_semEscrita.svg" alt="5 Seasons" className="public-brand-logo" />
          <div className="public-brand-text">
            <span className="public-brand-name">5 Seasons</span>
            <span className="public-brand-tagline">EXPERIENCE</span>
          </div>
        </Link>

        {/* Navegação Central */}
        <nav className={`public-nav ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          {NAV_ITEMS.map((item, i) => (
            <Link
              key={item.to}
              to={item.to}
              className={`public-nav-link${i === activeIndex ? ' active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}

          <a
            href="https://wa.me/5554996468737"
            target="_blank"
            rel="noreferrer"
            className="header-cta-mobile"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Atendimento Exclusivo &rarr;
          </a>
        </nav>

        <div className="public-header-actions">
          <a
            href="https://wa.me/5554996468737?text=Ol%C3%A1!%20Gostaria%20de%20conhecer%20as%20pr%C3%B3ximas%20expedi%C3%A7%C3%B5es%20da%205%20Seasons."
            target="_blank"
            rel="noreferrer"
            className="header-cta-btn"
          >
            <span>Consultoria</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 17L17 7M17 7H7M17 7V17" />
            </svg>
          </a>

          <button
            className="mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Menu"
          >
            {isMobileMenuOpen ? (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="16" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}