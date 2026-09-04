import { useEffect, useState } from 'react';
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

export function HomePublica() {
  const [filtroAtivo, setFiltroAtivo] = useState('Todos');
  const [pacotes, setPacotes] = useState<any[]>([]);
  const [cotacaoDolar, setCotacaoDolar] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDadosIniciais();
  }, []);

  async function fetchDadosIniciais() {
    setLoading(true);

    // Executa em paralelo a busca dos pacotes no Supabase e a cotação atual do Dólar na Web
    const [pacotesRes, dolarRes] = await Promise.all([
      supabase
        .from('pacotes')
        .select(`
          id, 
          nome,
          data_inicio, 
          data_fim, 
          preco_duplo, 
          status, 
          expedicao_id,
          expedicoes (
            descricao, 
            tipo_destino, 
            fotos
          )
        `)
        .in('status', ['Ativo', 'Esgotado'])
        .order('data_inicio', { ascending: true }),
      
      fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL')
        .then(res => res.json())
        .catch(() => null)
    ]);

    if (!pacotesRes.error && pacotesRes.data) {
      setPacotes(pacotesRes.data);
    }

    if (dolarRes && dolarRes.USDBRL) {
      // Pega o valor de venda atual do dólar comercial
      setCotacaoDolar(Number(dolarRes.USDBRL.bid));
    }

    setLoading(false);
  }

  const pacotesFiltrados = pacotes.filter((pacote) => {
    const exp = pacote.expedicoes;
    if (!exp) return false;

    if (filtroAtivo === 'Todos') return true;
    if (filtroAtivo === 'Nacionais') return exp.tipo_destino === 'Nacional';
    if (filtroAtivo === 'Internacionais') return exp.tipo_destino === 'Internacional';
    if (filtroAtivo === '2026') return pacote.data_inicio.startsWith('2026');
    if (filtroAtivo === '2027') return pacote.data_inicio.startsWith('2027');
    
    return true;
  });

  return (
    <div className="container">
      <section className="hero-section">
        <div className="eyebrow">Saídas Programadas</div>
        <h1 className="hero-title">Escolha sua próxima aventura</h1>

        <div className="filter-bar">
          <button className={`filter-btn ${filtroAtivo === 'Todos' ? 'active' : ''}`} onClick={() => setFiltroAtivo('Todos')}>Todos</button>
          <button className={`filter-btn ${filtroAtivo === 'Nacionais' ? 'active' : ''}`} onClick={() => setFiltroAtivo('Nacionais')}>Nacionais</button>
          <button className={`filter-btn ${filtroAtivo === 'Internacionais' ? 'active' : ''}`} onClick={() => setFiltroAtivo('Internacionais')}>Internacionais</button>
          <div className="filter-divider"></div>
          <button className={`filter-btn ${filtroAtivo === '2026' ? 'active' : ''}`} onClick={() => setFiltroAtivo('2026')}>2026</button>
          <button className={`filter-btn ${filtroAtivo === '2027' ? 'active' : ''}`} onClick={() => setFiltroAtivo('2027')}>2027</button>
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
            const imagemCapa = exp.fotos && exp.fotos.length > 0 ? exp.fotos[0] : '';
            const statusLabel = pacote.status === 'Ativo' ? 'VAGAS ABERTAS' : 'ESGOTADO';
            const statusColor = pacote.status === 'Ativo' ? 'var(--brand-green)' : '#9a3b2f';

            // Calcula o valor em Dólar se a cotação foi obtida com sucesso
            const valorEmDolar = cotacaoDolar ? pacote.preco_duplo / cotacaoDolar : null;

            return (
              <Link to={`/expedicao/${pacote.expedicao_id}`} className="exp-card" key={pacote.id}>
                <div 
                  className="exp-card-bg" 
                  style={{ backgroundImage: `url(${imagemCapa})`, backgroundColor: '#e8dad1' }}
                ></div>
                <div className="exp-card-overlay"></div>
                
                <div className="exp-card-badges">
                  <span className="badge">{exp.tipo_destino.toUpperCase()}</span>
                  <span className="badge" style={{ backgroundColor: statusColor }}>
                    {statusLabel}
                  </span>
                </div>

                <div className="exp-card-content">
                  <div className="exp-card-date">{formatarDataCard(pacote.data_inicio, pacote.data_fim)}</div>
                  <h3 className="exp-card-title">{pacote.nome}</h3>
                  <p className="exp-card-desc">{exp.descricao}</p>
                  
                  <div className="exp-card-footer">
                    <div className="exp-card-price">
                      <small>VALOR</small>
                      <strong style={{ display: 'block' }}>{formatarMoedaBRL(pacote.preco_duplo)}</strong>
                      {valorEmDolar !== null && (
                        <span style={{ fontSize: '12px', opacity: 0.8, fontWeight: 500, color: 'var(--brand-orange)' }}>
                          ≈ {formatarMoedaUSD(valorEmDolar)}
                        </span>
                      )}
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', padding: '8px 16px', borderRadius: '99px', fontSize: '12px', fontWeight: 'bold' }}>
                      VER EXPEDIÇÃO &rarr;
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