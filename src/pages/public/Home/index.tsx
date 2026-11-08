import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/services/supabase';

function formatarDataCard(inicio: string, fim: string) {
  if (!inicio || !fim) return '';
  const dInicio = new Date(inicio + 'T00:00:00');
  const dFim = new Date(fim + 'T00:00:00');

  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const diaI = String(dInicio.getDate()).padStart(2, '0');
  const mesI = meses[dInicio.getMonth()];
  const anoI = dInicio.getFullYear();

  const diaF = String(dFim.getDate()).padStart(2, '0');
  const mesF = meses[dFim.getMonth()];
  const anoF = dFim.getFullYear();

  if (anoI === anoF) {
    return `${diaI} ${mesI} — ${diaF} ${mesF}, ${anoI}`;
  }
  return `${diaI} ${mesI} ${anoI} — ${diaF} ${mesF} ${anoF}`;
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

const FILTROS = [
  { id: 'Todos', label: 'Todos os Roteiros' },
  { id: 'Nacional', label: 'Destinos Nacionais' },
  { id: 'Internacional', label: 'Destinos Internacionais' },
  { id: '2027', label: 'Temporada 2027' },
];

export function HomePublica() {
  const [filtroAtivo, setFiltroAtivo] = useState('Todos');
  const [pacotes, setPacotes] = useState<any[]>([]);
  const [cotacaoDolar, setCotacaoDolar] = useState<number | null>(null);
  const [cotacaoEuro, setCotacaoEuro] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDadosIniciais();
  }, []);

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
            pais,
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
    if (filtroAtivo === 'Nacional') return exp.tipo_destino === 'Nacional';
    if (filtroAtivo === 'Internacional') return exp.tipo_destino === 'Internacional';
    if (filtroAtivo === '2026') return pacote.data_inicio?.startsWith('2026');
    if (filtroAtivo === '2027') return pacote.data_inicio?.startsWith('2027');
    
    return true;
  });

  return (
    <div className="container">
      {/* Cabeçalho Editorial da Home */}
      <section className="hero-section">
        <div className="hero-header-split">
          <div>
            <span className="eyebrow">Curadoria 5 Seasons</span>
            <h1 className="hero-title">Expedições com alma e propósito.</h1>
          </div>
          <p className="hero-subtitle">
            Roteiros autorais em grupos reduzidos, planejados nos mínimos detalhes para você viver o destino sem preocupações.
          </p>
        </div>

        {/* Barra de Filtros Minimalista */}
        <div className="filter-tabs" role="tablist">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`filter-tab-item ${filtroAtivo === f.id ? 'active' : ''}`}
              onClick={() => setFiltroAtivo(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
          Preparando nosso catálogo de destinos...
        </div>
      ) : pacotesFiltrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
          Nenhum roteiro programado para esta categoria no momento.
        </div>
      ) : (
        <section className="cards-grid">
          {pacotesFiltrados.map((pacote) => {
            const exp = pacote.expedicoes;
            const imagemCapa = exp?.fotos && exp.fotos.length > 0 ? exp.fotos[0] : '';
            
            let statusLabel = 'Lista de Espera';
            let statusClass = 'status-esgotado';

            if (pacote.status === 'Ativo') {
              statusLabel = 'Inscrições Abertas';
              statusClass = 'status-ativo';
            } else if (pacote.status === 'Em breve') {
              statusLabel = 'Pré-Lançamento';
              statusClass = 'status-breve';
            }

            const loteAtualInfo = pacote.pacote_lotes?.find((l: any) => l.lote_numero === pacote.lote_atual) || pacote.pacote_lotes?.[0];
            const precoFinal = loteAtualInfo ? loteAtualInfo.preco_duplo : pacote.preco_duplo;
            const valorEmDolar = cotacaoDolar ? precoFinal / cotacaoDolar : null;
            const valorEmEuro = cotacaoEuro ? precoFinal / cotacaoEuro : null;

            return (
              <Link to={`/expedicao/${pacote.expedicao_id}`} className="exp-card" key={pacote.id}>
                {/* Metade Superior: Mídia Limpa */}
                <div className="exp-card-media">
                  <div 
                    className="exp-card-img" 
                    style={{ backgroundImage: imagemCapa ? `url(${imagemCapa})` : 'none' }}
                  />
                  <div className="exp-card-badges">
                    <span className="badge-tag">{exp?.pais || exp?.tipo_destino}</span>
                    <span className={`badge-status ${statusClass}`}>{statusLabel}</span>
                  </div>
                </div>

                {/* Metade Inferior: Corpo Editorial Claro */}
                <div className="exp-card-body">
                  <div className="exp-card-date">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    {formatarDataCard(pacote.data_inicio, pacote.data_fim)}
                  </div>

                  <h3 className="exp-card-title">{pacote.nome}</h3>
                  <p className="exp-card-desc">{exp?.descricao}</p>
                  
                  <div className="exp-card-footer">
                    <div className="exp-card-price">
                      {precoFinal ? (
                        <>
                          <small>{pacote.lote_atual ? `${pacote.lote_atual}º Lote` : 'Investimento'}</small>
                          <strong>{formatarMoedaBRL(precoFinal)}</strong>
                          <div className="moedas-estrangeiras">
                            {valorEmEuro !== null && <span>≈ {formatarMoedaEUR(valorEmEuro)}</span>}
                            {valorEmEuro !== null && valorEmDolar !== null && <span>•</span>}
                            {valorEmDolar !== null && <span>≈ {formatarMoedaUSD(valorEmDolar)}</span>}
                          </div>
                        </>
                      ) : (
                        <strong style={{ fontSize: 15 }}>Sob Consulta</strong>
                      )}
                    </div>

                    <span className="btn-ver-expedicao">
                      Explorar
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </span>
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