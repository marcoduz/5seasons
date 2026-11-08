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
  
  // Verifica se a rota atual é a página de detalhes de uma expedição
  const isExpedicaoPage = location.pathname.startsWith('/expedicao/');

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`public-header ${scrolled ? 'is-scrolled' : ''} ${isExpedicaoPage ? 'is-transparent-top' : ''}`}>
      <div className="container public-header-inner">
        <Link to="/" className="public-brand">
          <img src="/5seasonsLogo_semEscrita.svg" alt="5 Seasons" className="public-brand-logo" />
          <div className="public-brand-text">
            <span className="public-brand-name">5 Seasons</span>
            <span className="public-brand-tagline">EXPERIENCE</span>
          </div>
        </Link>

        {/* Navegação Central Minimalista */}
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

          {/* CTA visível apenas dentro da gaveta mobile */}
          <a
            href="https://wa.me/5554996468737"
            target="_blank"
            rel="noreferrer"
            className="header-cta-mobile"
          >
            Atendimento Exclusivo &rarr;
          </a>
        </nav>

        {/* Ação Direita (Desktop) e Botão Hamburger (Mobile) */}
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
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {isMobileMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <line x1="4" y1="12" x2="16" y2="12" />
                  <line x1="4" y1="17" x2="20" y2="17" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}