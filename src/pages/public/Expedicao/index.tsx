import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/services/supabase';
import './expedicao.css'; // <-- Importando o nosso novo arquivo limpo

function formatarEstiloWhatsApp(texto: string) {
  if (!texto) return { __html: '' };
  const htmlFormatado = texto
    .replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
    .replace(/_([^_]+)_/g, '<i>$1</i>')
    .replace(/~([^~]+)~/g, '<del>$1</del>')
    .replace(/\n/g, '<br />');
  return { __html: htmlFormatado };
}

function formatarDataCard(inicio: string, fim: string) {
  if (!inicio || !fim) return '';
  const dInicio = new Date(inicio + 'T00:00:00');
  const dFim = new Date(fim + 'T00:00:00');
  const diaI = String(dInicio.getDate()).padStart(2, '0');
  const mesI = String(dInicio.getMonth() + 1).padStart(2, '0');
  const diaF = String(dFim.getDate()).padStart(2, '0');
  const mesF = String(dFim.getMonth() + 1).padStart(2, '0');
  const anoF = dFim.getFullYear();
  return `${diaI}/${mesI} a ${diaF}/${mesF} de ${anoF}`;
}

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(valor);
}

export function ExpedicaoPublica() {
  const { id } = useParams<{ id: string }>();
  const [expedicao, setExpedicao] = useState<any>(null);
  const [roteiros, setRoteiros] = useState<any[]>([]);
  const [pacotes, setPacotes] = useState<any[]>([]);
  const [selectedPacoteId, setSelectedPacoteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [diaAberto, setDiaAberto] = useState<number | null>(null);
  const [currentFotoIndex, setCurrentFotoIndex] = useState(0);
  
  const [currentRoteiroFotoIndex, setCurrentRoteiroFotoIndex] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchExpedicaoCompleta();
  }, [id]);

  useEffect(() => {
    setCurrentRoteiroFotoIndex(0);
  }, [diaAberto]);

  useEffect(() => {
    const totalGaleria = expedicao?.fotos?.length > 1 ? expedicao.fotos.length - 1 : 0;
    if (totalGaleria <= 1) return;

    const timer = setInterval(() => {
      setCurrentFotoIndex((prev) => (prev === totalGaleria - 1 ? 0 : prev + 1));
    }, 4000);

    return () => clearInterval(timer);
  }, [expedicao]);

  async function fetchExpedicaoCompleta() {
    setLoading(true);
    const [expRes, rotRes, pacRes] = await Promise.all([
      supabase.from('expedicoes').select('*').eq('id', id).single(),
      supabase.from('roteiros').select('*').eq('expedicao_id', id).order('dia', { ascending: true }),
      supabase.from('pacotes').select('*, pacote_lotes(*)').eq('expedicao_id', id).in('status', ['Ativo', 'Esgotado', 'Em breve']).order('data_inicio', { ascending: true })
    ]);

    if (expRes.data) setExpedicao(expRes.data);
    
    if (rotRes.data && rotRes.data.length > 0) {
      setRoteiros(rotRes.data);
      setDiaAberto(rotRes.data[0].dia);
    }

    if (pacRes.data && pacRes.data.length > 0) {
      setPacotes(pacRes.data);
      const ativos = pacRes.data.filter((p: any) => p.status === 'Ativo');
      setSelectedPacoteId(ativos.length > 0 ? ativos[0].id : pacRes.data[0].id);
    }
    setLoading(false);
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '120px 0', color: 'var(--text-muted)' }}>Carregando detalhes...</div>;
  if (!expedicao) return <div style={{ textAlign: 'center', padding: '120px 0', color: 'var(--text-muted)' }}>Expedição não encontrada.</div>;

  const imagemCapa = expedicao.fotos && expedicao.fotos.length > 0 ? expedicao.fotos[0] : '';
  const galeria = expedicao.fotos && expedicao.fotos.length > 1 ? expedicao.fotos.slice(1) : [];
  
  const pacotePrincipal = pacotes.find(p => p.id === selectedPacoteId) || pacotes[0];
  const loteAtivoPacote = pacotePrincipal?.pacote_lotes?.find((l: any) => l.lote_numero === pacotePrincipal.lote_atual) || pacotePrincipal?.pacote_lotes?.[0];
  
  const precoExibido = loteAtivoPacote ? loteAtivoPacote.preco_duplo : (pacotePrincipal?.preco_duplo || 0);
  const outrosPacotes = pacotes.filter(p => p.id !== pacotePrincipal?.id);

  const nomeCompletoWhatsapp = pacotePrincipal ? `${expedicao.nome} - ${pacotePrincipal.nome}` : expedicao.nome;
  let textoWhatsApp = `Olá! Gostaria de me inscrever na expedição ${nomeCompletoWhatsapp}.`; 
  if (pacotePrincipal?.status === 'Em breve') {
    textoWhatsApp = `Olá! Tenho interesse na expedição ${nomeCompletoWhatsapp}. Podem me avisar quando as vagas estiverem disponíveis?`;
  } else if (pacotePrincipal?.status === 'Esgotado') {
    textoWhatsApp = `Olá! Vi que a expedição ${nomeCompletoWhatsapp} está esgotada. Gostaria de entrar na lista de espera, por favor.`;
  }
  const linkWhatsApp = `https://wa.me/5554996468737?text=${encodeURIComponent(textoWhatsApp)}`;

  function nextFoto() {
    setCurrentFotoIndex((prev) => (prev === galeria.length - 1 ? 0 : prev + 1));
  }

  function prevFoto() {
    setCurrentFotoIndex((prev) => (prev === 0 ? galeria.length - 1 : prev - 1));
  }

  const roteiroSelecionado = roteiros.find(rot => rot.dia === diaAberto);
  const imagensRoteiro = roteiroSelecionado?.imagens || [];

  function nextRoteiroFoto() {
    setCurrentRoteiroFotoIndex((prev) => (prev === imagensRoteiro.length - 1 ? 0 : prev + 1));
  }

  function prevRoteiroFoto() {
    setCurrentRoteiroFotoIndex((prev) => (prev === 0 ? imagensRoteiro.length - 1 : prev - 1));
  }

  return (
    <div>
      <section className="hero-banner" style={{ backgroundImage: `url(${imagemCapa})` }}>
        <div className="hero-overlay"></div>
        <div className="container hero-grid">
          
          <div className="hero-card">
            <div className="hero-price-title"> 
              {pacotePrincipal?.status === 'Em breve' ? 'Faça seu pré-registro' : 
               pacotePrincipal?.status === 'Esgotado' ? 'Entre na lista de espera' : 
               'Valor do Investimento'}
            </div>
            
            <div className="hero-price" style={{ color: 'var(--verde-vivo)'}}>
              {precoExibido && precoExibido > 0 ? formatarMoeda(precoExibido) : ''}
            </div>
            
            <ul className="hero-features">
              {expedicao.incluso?.slice(0, 6).map((item: string, i: number) => (
                <li key={i}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span dangerouslySetInnerHTML={formatarEstiloWhatsApp(item)} />
                </li>
              ))}
            </ul>
            
            <a href={linkWhatsApp} target="_blank" rel="noreferrer" className="btn-orange">
              {pacotePrincipal?.status === 'Ativo' ? 'QUERO ME INSCREVER →' : 
               pacotePrincipal?.status === 'Em breve' ? 'PRÉ REGISTRO →' : 'LISTA DE ESPERA →'}
            </a>
          </div>

          <div className="hero-text-area">
            <span className="hero-tag">Expedição {expedicao.tipo_destino}</span>
            <h1 className="hero-title">{expedicao.nome}</h1>
            <p className="hero-desc" dangerouslySetInnerHTML={formatarEstiloWhatsApp(expedicao.descricao?.split('\n')[0] || '')} />
            
            <div className="hero-pills">
              {pacotePrincipal && (
                <span className="hero-pill">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  {formatarDataCard(pacotePrincipal.data_inicio, pacotePrincipal.data_fim)}
                </span>
              )}
              <span className="hero-pill">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                Grupo Exclusivo
              </span>
            </div>

            {outrosPacotes.length > 0 && (
              <div style={{ marginTop: '28px' }}>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
                  Outras datas para esta expedição:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                  {outrosPacotes.map(p => (
                    <button 
                      key={p.id} 
                      className="outra-data-btn"
                      onClick={() => setSelectedPacoteId(p.id)}
                      title="Ver detalhes desta data"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.7 }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                      <strong>{p.nome}</strong> &mdash; {formatarDataCard(p.data_inicio, p.data_fim)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-beige">
        <div className="section-padding container" style={{ paddingBottom: '40px' }}>
          <div className="section-subtitle" style={{ textAlign: 'center' }}>A Expedição</div>
          <div className="desc-centered" dangerouslySetInnerHTML={formatarEstiloWhatsApp(expedicao.descricao || '')} />
        </div>
      </section>

      <section className="bg-white">
        <div className="section-padding container">
          <div className="section-subtitle" style={{ textAlign: 'center' }}>Galeria de Fotos</div>
          <h2 className="section-title" style={{ textAlign: 'center' }}>Registros Visuais</h2>
          
          {galeria.length > 0 ? (
            <div className="carousel-container" style={{ marginTop: '40px' }}>
              <img 
                src={galeria[currentFotoIndex]} 
                alt={`Galeria ${currentFotoIndex + 1}`} 
                className="carousel-img" 
              />
              
              {galeria.length > 1 && (
                <>
                  <button className="carousel-btn prev" onClick={prevFoto}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  </button>
                  <button className="carousel-btn next" onClick={nextFoto}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                  </button>
                  
                  <div className="carousel-counter">
                    {currentFotoIndex + 1}/{galeria.length}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div style={{ marginTop: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhuma foto adicional disponível.</div>
          )}
        </div>
      </section>

      <section className="bg-beige">
        <div className="section-padding container">
          <div className="cronograma-card">
            
            <div className="cronograma-header">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--verde-vivo)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              Cronograma
            </div>

            {roteiros.length > 0 ? (
              <>
                <div className="cronograma-tabs">
                  {roteiros.map((rot) => (
                    <button
                      key={rot.id}
                      className={`cronograma-tab ${diaAberto === rot.dia ? 'active' : ''}`}
                      onClick={() => setDiaAberto(rot.dia)}
                    >
                      Dia {rot.dia}
                    </button>
                  ))}
                </div>

                {roteiroSelecionado && (
                  <div className={`cronograma-content ${imagensRoteiro.length > 0 ? 'has-image' : ''}`}>
                    <div className="cronograma-text">
                      <h3>Dia {roteiroSelecionado.dia}</h3>
                      <div className="subtitle">{roteiroSelecionado.titulo}</div>
                      <div className="desc" dangerouslySetInnerHTML={formatarEstiloWhatsApp(roteiroSelecionado.descricao)} />
                    </div>
                    
                    {imagensRoteiro.length === 1 && (
                      <div className="cronograma-img-wrapper">
                        <img src={imagensRoteiro[0]} alt={`Atividade do Dia ${roteiroSelecionado.dia}`} />
                      </div>
                    )}

                    {imagensRoteiro.length > 1 && (
                      <div className="cronograma-img-wrapper" style={{ position: 'relative' }}>
                        <img 
                          src={imagensRoteiro[currentRoteiroFotoIndex]} 
                          alt={`Atividade ${currentRoteiroFotoIndex + 1} do Dia ${roteiroSelecionado.dia}`} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <button className="carousel-btn prev" onClick={prevRoteiroFoto} style={{ width: '36px', height: '36px' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                        </button>
                        <button className="carousel-btn next" onClick={nextRoteiroFoto} style={{ width: '36px', height: '36px' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                        </button>
                        <div className="carousel-counter" style={{ padding: '4px 10px', fontSize: '11px' }}>
                          {currentRoteiroFotoIndex + 1}/{imagensRoteiro.length}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div style={{ color: 'var(--text-muted)' }}>Nenhum roteiro cadastrado para esta expedição.</div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="section-padding container">
          <div className="serv-grid">
            <div className="inc-card">
              <h3>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                O que está incluso
              </h3>
              <ul className="serv-list">
                {expedicao.incluso?.map((item: string, i: number) => <li key={i} dangerouslySetInnerHTML={formatarEstiloWhatsApp(item)} />)}
              </ul>
            </div>
            
            <div className="exc-card">
              <h3>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                O que não está incluso
              </h3>
              <ul className="serv-list">
                {expedicao.nao_incluso?.map((item: string, i: number) => <li key={i} dangerouslySetInnerHTML={formatarEstiloWhatsApp(item)} />)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {expedicao.observacoes?.length > 0 && (
        <section className="bg-beige">
          <div className="section-padding container">
            <div className="obs-box">
              <h3>Observações Importantes</h3>
              <ul className="serv-list" style={{ gap: '12px' }}>
                {expedicao.observacoes.map((item: string, i: number) => <li key={i} dangerouslySetInnerHTML={formatarEstiloWhatsApp(item)} />)}
              </ul>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}