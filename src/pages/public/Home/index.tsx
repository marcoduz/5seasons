import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/services/supabase';

function formatarDataCard(inicio: string, fim: string) {
  if (!inicio || !fim) return '';
  const dInicio = new Date(inicio + 'T00:00:00');
  const dFim = new Date(fim + 'T00:00:00');

  const diaI = String(dInicio.getDate()).padStart(2, '0');
  const mesI = String(dInicio.getMonth() + 1).padStart(2, '0');
  const anoI = dInicio.getFullYear();

  const diaF = String(dFim.getDate()).padStart(2, '0');
  const mesF = String(dFim.getMonth() + 1).padStart(2, '0');
  const anoF = dFim.getFullYear();

  if (anoI === anoF) {
    return `${diaI}/${mesI} A ${diaF}/${mesF} (${anoI})`;
  } else {
    return `${diaI}/${mesI}/${anoI} A ${diaF}/${mesF}/${anoF}`;
  }
}

function formatarMoedaBRL(valor: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

function formatarMoedaUSD(valor: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(valor);
}

function formatarMoedaEUR(valor: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(valor);
}

const FILTROS = ['Todos', 'Descubra o Brasil', 'Explore o Mundo', '2026', '2027'];

export function HomePublica() {
  const [filtroAtivo, setFiltroAtivo] = useState('Todos');
  const [pacotes, setPacotes] = useState<any[]>([]);
  const [cotacaoDolar, setCotacaoDolar] = useState<number | null>(null);
  const [cotacaoEuro, setCotacaoEuro] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const filterBarRef = useRef<HTMLDivElement>(null);
  const filterBtnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [filterPill, setFilterPill] = useState({ left: 0, width: 0, opacity: 0 });

  useEffect(() => {
    fetchDadosIniciais();
  }, []);

  function updateFilterPill() {
    if (window.innerWidth <= 768) {
      setFilterPill((p) => ({ ...p, opacity: 0 }));
      return;
    }

    const activeIndex = FILTROS.indexOf(filtroAtivo);
    const activeEl = filterBtnRefs.current[activeIndex];
    const barEl = filterBarRef.current;

    if (!activeEl || !barEl) {
      setFilterPill((p) => ({ ...p, opacity: 0 }));
      return;
    }

    const barRect = barEl.getBoundingClientRect();
    const btnRect = activeEl.getBoundingClientRect();
    setFilterPill({
      left: btnRect.left - barRect.left,
      width: btnRect.width,
      opacity: 1,
    });
  }

  useLayoutEffect(() => {
    updateFilterPill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroAtivo]);

  useEffect(() => {
    window.addEventListener('resize', updateFilterPill);
    return () => window.removeEventListener('resize', updateFilterPill);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroAtivo]);

  async function fetchDadosIniciais() {
    setLoading(true);

    const [pacotesRes, dolarRes] = await Promise.all([
      supabase
        .from('pacotes')
        .select(`
          id, 
          nome,
          data_inicio, 
          data_fim, 
          preco_single,
          preco_duplo, 
          status, 
          expedicao_id,
          lote_atual,
          expedicoes (
            descricao, 
            tipo_destino, 
            fotos
          ),
          pacote_lotes (
            lote_numero,
            preco_duplo,
            preco_single
          )
        `)
        .eq('oculto', false)
        .in('status', ['Ativo', 'Esgotado', 'Em breve'])
        .order('status', { ascending: true })
        .order('data_inicio', { ascending: true }),
      
      fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL')
        .then(res => res.json())
        .catch(() => null)
    ]);

    if (!pacotesRes.error && pacotesRes.data) {
      setPacotes(pacotesRes.data);
    }

    if (dolarRes && dolarRes.USDBRL) {
      setCotacaoDolar(Number(dolarRes.USDBRL.bid));
    }
    if (dolarRes && dolarRes.EURBRL) {
      setCotacaoEuro(Number(dolarRes.EURBRL.bid));
    }

    setLoading(false);
  }

  const pacotesFiltrados = pacotes.filter((pacote) => {
    const exp = pacote.expedicoes;
    if (!exp) return false;

    if (filtroAtivo === 'Todos') return true;
    if (filtroAtivo === 'Descubra o Brasil') return exp.tipo_destino === 'Nacional';
    if (filtroAtivo === 'Explore o Mundo') return exp.tipo_destino === 'Internacional';
    if (filtroAtivo === '2026') return pacote.data_inicio.startsWith('2026');
    if (filtroAtivo === '2027') return pacote.data_inicio.startsWith('2027');
    
    return true;
  });

  return (
    <div className="container">
      <section className="hero-section">
        <div className="eyebrow">Próximas Expedições</div>
        <h1 className="hero-title">Qual será sua próxima experiência?</h1>

        <div className="filter-bar" ref={filterBarRef}>
          <div
            className="filter-pill"
            style={{ left: filterPill.left, width: filterPill.width, opacity: filterPill.opacity }}
          />

          {FILTROS.slice(0, 3).map((filtro, i) => (
            <button
              key={filtro}
              ref={(el) => {
                filterBtnRefs.current[i] = el;
              }}
              className={`filter-btn ${filtroAtivo === filtro ? 'active' : ''}`}
              onClick={() => setFiltroAtivo(filtro)}
            >
              {filtro}
            </button>
          ))}

          <div className="filter-divider"></div>

          {FILTROS.slice(3).map((filtro, i) => (
            <button
              key={filtro}
              ref={(el) => {
                filterBtnRefs.current[i + 3] = el;
              }}
              className={`filter-btn ${filtroAtivo === filtro ? 'active' : ''}`}
              onClick={() => setFiltroAtivo(filtro)}
            >
              {filtro}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
          Carregando expedições...
        </div>
      ) : pacotesFiltrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
          Nenhuma expedição encontrada para este filtro.
        </div>
      ) : (
        <section className="cards-grid">
          {pacotesFiltrados.map((pacote) => {
            const exp = pacote.expedicoes;
            const imagemCapa = exp?.fotos && exp.fotos.length > 0 ? exp.fotos[0] : '';
            
            let statusLabel = 'ESGOTADO';
            let statusColor = '#9a3b2f';

            if (pacote.status === 'Ativo') {
              statusLabel = 'VAGAS ABERTAS';
              statusColor = 'var(--verde-escuro)';
            } else if (pacote.status === 'Em breve') {
              statusLabel = 'EM BREVE';
              statusColor = '#d97706';
            }

            const loteAtualInfo = pacote.pacote_lotes?.find((l: any) => l.lote_numero === pacote.lote_atual) || pacote.pacote_lotes?.[0];
            const precoFinal = loteAtualInfo ? loteAtualInfo.preco_duplo : pacote.preco_duplo;
            const valorEmDolar = cotacaoDolar ? precoFinal / cotacaoDolar : null;
            const valorEmEuro = cotacaoEuro ? precoFinal / cotacaoEuro : null;

            return (
              <Link to={`/expedicao/${pacote.expedicao_id}`} className="exp-card" key={pacote.id}>
                <div 
                  className="exp-card-bg" 
                  style={{ backgroundImage: imagemCapa ? `url(${imagemCapa})` : 'none', backgroundColor: '#e8dad1' }}
                ></div>
                <div className="exp-card-overlay"></div>
                
                <div className="exp-card-badges">
                  <span className="badge">{exp?.tipo_destino?.toUpperCase()}</span>
                  <span className="badge" style={{ backgroundColor: statusColor }}>{statusLabel}</span>
                </div>

                <div className="exp-card-content">
                  <div className="exp-card-date">{formatarDataCard(pacote.data_inicio, pacote.data_fim)}</div>
                  <h3 className="exp-card-title">{pacote.nome}</h3>
                  <p className="exp-card-desc">{exp?.descricao}</p>
                  
                  <div className="exp-card-footer">
                    <div className="exp-card-price">
                      {precoFinal ? (
                       <>
                        <small>LOTE {pacote.lote_atual || 1}</small>
                        <strong style={{ display: 'block' }}>{formatarMoedaBRL(precoFinal)}</strong>
                        
                        {/* Container para manter as moedas na mesma linha */}
                       <div className="moedas-estrangeiras" style={{ display: 'flex', gap: '8px', alignItems: 'center', opacity: 0.8, fontWeight: 500, color: 'var(--beje-escuro)' }}>
                          {valorEmEuro !== null && (
                            <span>≈ {formatarMoedaEUR(valorEmEuro)}</span>
                          )}

                          {/* Mostra o separador apenas se ambas as cotações existirem */}
                          {valorEmEuro !== null && valorEmDolar !== null && (
                            <span style={{ opacity: 0.5 }}>|</span>
                          )}

                          {valorEmDolar !== null && (
                            <span>≈ {formatarMoedaUSD(valorEmDolar)}</span>
                          )}
                        </div>
                      </>
                      ) : (
                        <strong></strong>
                      )}
                    </div>
                    <div className="btn-ver-expedicao" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', fontWeight: 'bold' }}>
                      VER EXPEDIÇÃO <br /> &rarr;
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </section>
      )}
    </div>
  );
}