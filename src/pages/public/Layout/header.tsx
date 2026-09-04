import { Link } from 'react-router-dom';

export function Header() {
  return (
    <header className="public-header">
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        
        {/* Logo + Texto 5 Seasons ao lado */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '14px', textDecoration: 'none' }}>
          <img src="/5seasonsLogo_semEscrita.svg" alt="5 Seasons" style={{ height: '42px', objectFit: 'contain' }} />
          <span style={{ 
            fontFamily: "'Playfair Display', serif", 
            fontSize: '24px', 
            fontWeight: 600, 
            letterSpacing: '0.5px',
            color: 'var(--beje-escuro)' 
          }}>
            5 Seasons
          </span>
        </Link>
        
        <nav className="public-nav">
          <Link to="/">Início</Link>
          <Link to="/sobre">Sobre Nós</Link>
          <Link to="/" style={{ color: 'var(--brand-orange)' }}>Destinos</Link>
          <Link to="/depoimentos">Depoimentos</Link>
          <Link to="/contato">Contato</Link>
        </nav>
      </div>
    </header>
  );
}