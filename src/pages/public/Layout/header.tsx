import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { label: 'Destinos', to: '/', match: (path: string) => path === '/' || path.startsWith('/expedicao/') },
  { label: 'Sobre Nós', to: '/sobre', match: (path: string) => path === '/sobre' },
  { label: 'Depoimentos', to: '/depoimentos', match: (path: string) => path === '/depoimentos' },
  { label: 'Contato', to: '/contato', match: (path: string) => path === '/contato' },
];

export function Header() {
  const location = useLocation();
  const navRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [pill, setPill] = useState({ left: 0, width: 0, opacity: 0 });

  const activeIndex = NAV_ITEMS.findIndex((item) => item.match(location.pathname));

  function updatePill() {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  useEffect(() => {
    window.addEventListener('resize', updatePill);
    return () => window.removeEventListener('resize', updatePill);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  return (
    <header className="public-header">
      <div className="container public-header-inner">
        <Link to="/" className="public-brand">
          <img src="/5seasonsLogo_semEscrita.svg" alt="5 Seasons" className="public-brand-logo" />
          <span className="public-brand-name">5 Seasons</span>
        </Link>

        <nav className="public-nav" ref={navRef}>
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
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}