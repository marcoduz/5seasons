import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { label: 'Nossa História', to: '/nossa/historia', match: (path: string) => path === '/nossa/historia' },
  { label: 'Expedições', to: '/', match: (path: string) => path === '/' || path.startsWith('/expedicao/') },
  { label: 'Duvidas', to: '/duvidas', match: (path: string) => path === '/duvidas' },
];

export function Header() {
  const location = useLocation();
  const navRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  
  const [pill, setPill] = useState({ left: 0, width: 0, opacity: 0 });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Novo estado para o menu mobile

  const activeIndex = NAV_ITEMS.findIndex((item) => item.match(location.pathname));

  function updatePill() {
    // Evita calcular a pílula horizontal no layout de celular
    if (window.innerWidth <= 768) return; 

    const activeEl = itemRefs.current[activeIndex];
    const navEl = navRef.current;
    
    if (!activeEl || !navEl) {
      setPill((p) => ({ ...p, opacity: 0 }));
      return;
    }
    
    const navRect = navEl.getBoundingClientRect();
    const itemRect = activeEl.getBoundingClientRect();
    
    setPill({
      left: itemRect.left - navRect.left,
      width: itemRect.width,
      opacity: 1,
    });
  }

  useLayoutEffect(() => {
    updatePill();
    setIsMobileMenuOpen(false); // Fecha o menu ao mudar de página
  }, [activeIndex, location.pathname]);

  useEffect(() => {
    window.addEventListener('resize', updatePill);
    return () => window.removeEventListener('resize', updatePill);
  }, [activeIndex]);

  return (
    <header className="public-header">
      <div className="container public-header-inner">
        <Link to="/" className="public-brand">
          <img src="/5seasonsLogo_semEscrita.svg" alt="5 Seasons" className="public-brand-logo" />
          <span className="public-brand-name">5 Seasons</span>
        </Link>

        {/* Botão Hambúrguer (Visível apenas no mobile) */}
        <button
          className="mobile-menu-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Menu"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {isMobileMenuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </>
            ) : (
              <>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </>
            )}
          </svg>
        </button>

        {/* Navegação (Gaveta no mobile, barra no desktop) */}
        <nav className={`public-nav ${isMobileMenuOpen ? 'mobile-open' : ''}`} ref={navRef}>
          <div
            className="public-nav-pill"
            style={{ left: pill.left, width: pill.width, opacity: pill.opacity }}
          />
          {NAV_ITEMS.map((item, i) => (
            <Link
              key={item.to}
              to={item.to}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              className={`public-nav-link${i === activeIndex ? ' active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)} // Fecha o menu ao clicar
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}