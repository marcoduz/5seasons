import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { label: 'Nossa História', to: '/nossa/historia', match: (path: string) => path === '/nossa/historia' },
  { label: 'Expedições', to: '/', match: (path: string) => path === '/' || path.startsWith('/expedicao/') },
  // { label: 'Duvidas', to: '/depoimentos', match: (path: string) => path === '/depoimentos' },
  // { label: 'Fidelidade', to: '/contato', match: (path: string) => path === '/fidelidade' },
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
  }, [activeIndex]);

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