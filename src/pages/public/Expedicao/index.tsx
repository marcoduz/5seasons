import { useEffect, useState, type CSSProperties } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/services/supabase';
import type { Expedicao, Roteiro } from '@/types';
import { formatarEstiloWhatsApp } from '@/pages/admin/Expedicoes/expedicaoForm';
import './expedicao.css';

interface Pacote {
  id: string;
  titulo: string;
  subtitulo: string;
  preco: string;
  data_inicio?: string; 
  data_fim?: string;    
  duracao: string;
  status: string;
}

export function ExpedicaoPublica() {
  const { id } = useParams<{ id: string }>();
  
  const [expedicao, setExpedicao] = useState<Expedicao | null>(null);
  const [roteiros, setRoteiros] = useState<Roteiro[]>([]);
  const [pacotes, setPacotes] = useState<Pacote[]>([]);
  const [pacoteSelecionado, setPacoteSelecionado] = useState<Pacote | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [diaAberto, setDiaAberto] = useState<number | null>(null);
  const [currentFotoIndex, setCurrentFotoIndex] = useState(0);
  const [currentRoteiroFotoIndex, setCurrentRoteiroFotoIndex] = useState(0);
  const [fotoModal, setFotoModal] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (id) carregarDadosCompletos(id);
  }, [id]);

  useEffect(() => {
    setCurrentRoteiroFotoIndex(0);
  }, [diaAberto]);

  async function carregarDadosCompletos(expId: string) {
    setLoading(true);
    const [expRes, rotRes, pacRes] = await Promise.all([
      supabase.from('expedicoes').select('*').eq('id', expId).single(),
      supabase.from('roteiros').select('*').eq('expedicao_id', expId).order('dia', { ascending: true }),
      supabase.from('pacotes').select('*').eq('expedicao_id', expId).order('created_at', { ascending: true })
    ]);

    if (expRes.data) setExpedicao(expRes.data as Expedicao);
    
    if (rotRes.data && rotRes.data.length > 0) {
      setRoteiros(rotRes.data as Roteiro[]);
      setDiaAberto(rotRes.data[0].dia);
    }
    
    if (pacRes.data && pacRes.data.length > 0) {
      setPacotes(pacRes.data as Pacote[]);
      const disponivel = pacRes.data.find((p: Pacote) => p.status !== 'Esgotado') || pacRes.data[0];
      setPacoteSelecionado(disponivel);
    }
    setLoading(false);
  }

  function formatarPeriodo(inicio?: string, fim?: string, duracao?: string) {
    if (!inicio) return duracao || 'Data a definir';
    
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const [anoI, mesI, diaI] = inicio.split('-');
    const strInicio = `${diaI} de ${meses[Number(mesI) - 1]}`;

    if (!fim) return `${strInicio}, ${anoI} ${duracao ? `(${duracao})` : ''}`;

    const [anoF, mesF, diaF] = fim.split('-');
    const strFim = `${diaF} de ${meses[Number(mesF) - 1]}`;

    if (anoI === anoF) {
      if (mesI === mesF) {
        return `${diaI} a ${strFim}, ${anoI}`;
      }
      return `${strInicio} a ${strFim}, ${anoI}`;
    }
    return `${strInicio}, ${anoI} a ${strFim}, ${anoF}`;
  }

  if (loading) {
    return (
      <div className="expedicao-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="serif-font" style={{ fontSize: 22, color: 'var(--home-green)' }}>Preparando a sua experiência...</p>
      </div>
    );
  }

  if (!expedicao) {
    return (
      <div className="expedicao-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <h2 className="serif-font">Expedição não encontrada</h2>
        <Link to="/destinos" className="btn-cta" style={{ width: 'auto' }}>Ver outros destinos</Link>
      </div>
    );
  }

  const imagemCapa = expedicao.fotos?.[0] || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80';
  const galeria = expedicao.fotos && expedicao.fotos.length > 1 ? expedicao.fotos.slice(1) : [];

  const msgWhats = `Olá! Tenho interesse na expedição *${expedicao.nome}* ${pacoteSelecionado ? `(Saída: ${formatarPeriodo(pacoteSelecionado.data_inicio, pacoteSelecionado.data_fim, pacoteSelecionado.duracao)})` : ''}. Poderia me passar mais informações?`;
  const linkWhats = `https://wa.me/5554996468737?text=${encodeURIComponent(msgWhats)}`;

  // Motor de Temas dinâmico
  const corPrimaria = expedicao.cor_primaria || '#2f4842';
  const corSecundaria = expedicao.cor_secundaria || '#fdb17f';
  const corFundo = expedicao.cor_fundo || '#fffaf8';
  const corTexto = expedicao.cor_texto || '#26332f';

  const themeStyles = {
    '--home-green': corPrimaria,
    '--laranja-suave': corSecundaria,
    '--theme-primary': corPrimaria,
    '--theme-secondary': corSecundaria,
    '--bege-fundo': corFundo,
    '--text-main': corTexto,
  } as CSSProperties;

  const roteiroSelecionado = roteiros.find(rot => rot.dia === diaAberto);
  const imagensRoteiro = roteiroSelecionado?.imagens || [];

  function nextFoto() {
    setCurrentFotoIndex((prev) => (prev === galeria.length - 1 ? 0 : prev + 1));
  }
  function prevFoto() {
    setCurrentFotoIndex((prev) => (prev === 0 ? galeria.length - 1 : prev - 1));
  }

  function nextRoteiroFoto() {
    setCurrentRoteiroFotoIndex((prev) => (prev === imagensRoteiro.length - 1 ? 0 : prev + 1));
  }
  function prevRoteiroFoto() {
    setCurrentRoteiroFotoIndex((prev) => (prev === 0 ? imagensRoteiro.length - 1 : prev - 1));
  }

  const blocosZigueZague = Array.isArray(expedicao.blocos_ziguezague) ? expedicao.blocos_ziguezague : [];
  const expContent = expedicao.conteudo_experiencia || {};
  const pilares = Array.isArray(expContent.pilares) ? expContent.pilares : [];
  const jornada = Array.isArray(expContent.jornada) ? expContent.jornada : [];
  const perfis = Array.isArray(expContent.perfis) ? expContent.perfis : [];

  return (
    <div className="expedicao-page" style={themeStyles}>
      
      {/* --- 1. HERO BANNER & CARD DE COMPRA --- */}
      <section className="hero-banner" style={{ backgroundImage: `url(${imagemCapa})` }}>
        <div className="hero-overlay" />
        <div className="container hero-grid">
          
          <div className="hero-content">
            <div className="hero-badges">
              <span className="badge-outline">{expedicao.tipo_destino}</span>
              {expedicao.categorias?.map((cat) => (
                <span key={cat} className="badge-outline">{cat}</span>
              ))}
            </div>
            <h1 className="hero-title">{expedicao.nome}</h1>
            <p className="hero-location">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {expedicao.pais}
            </p>
          </div>

          <div className="summary-card">
            {pacotes.length > 1 && (
              <div className="pacote-selector">
                <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: '#cbd5e1' }}>
                  Escolha a saída / pacote:
                </span>
                {pacotes.map((pac) => (
                  <button
                    key={pac.id}
                    type="button"
                    className={`pacote-btn ${pacoteSelecionado?.id === pac.id ? 'selected' : ''}`}
                    onClick={() => setPacoteSelecionado(pac)}
                  >
                    <span>{pac.titulo}</span>
                    <span style={{ fontSize: 12, opacity: 0.8 }}>
                      {formatarPeriodo(pac.data_inicio, pac.data_fim, pac.duracao)}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="summary-price-box">
              <span className="summary-price-label">
                {pacoteSelecionado ? pacoteSelecionado.titulo : 'Investimento por pessoa'}
              </span>
              <div className="summary-price-value">
                {pacoteSelecionado?.preco || 'Sob Consulta'}
              </div>
              {pacoteSelecionado && (
                <span style={{ fontSize: 13.5, color: 'var(--theme-secondary)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontWeight: 500 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  {formatarPeriodo(pacoteSelecionado.data_inicio, pacoteSelecionado.data_fim, pacoteSelecionado.duracao)}
                </span>
              )}
            </div>

            {expedicao.incluso && expedicao.incluso.length > 0 && (
              <ul className="summary-list">
                {expedicao.incluso.slice(0, 6).map((item, i) => (
                  <li key={i}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            )}

            <a href={linkWhats} target="_blank" rel="noreferrer" className="btn-cta">
              Quero me inscrever
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
              </svg>
            </a>
          </div>

        </div>
      </section>

      {/* --- 2. FORMAS DE PAGAMENTO --- */}
      <section className="payment-section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div className="section-subtitle">Investimento</div>
            <h2 className="section-title">Formas de Pagamento</h2>
            <p className="payment-chic-text">
              Para que você possa viver essa experiência da forma que fizer mais sentido para você.
            </p>
          </div>

          <div className="payment-grid">
            <div className="payment-item">
              <svg className="payment-icon" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="m15 9-6 6"></path><path d="M9 9h.01"></path><path d="M15 15h.01"></path></svg>
              <h4>5% de desconto no Pix</h4>
              <p>Economize pagando à vista diretamente pelo Pix.</p>
            </div>

            {expedicao.tipo_destino === 'Internacional' && (
              <div className="payment-item">
                <svg className="payment-icon" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path><path d="M2 12h20"></path></svg>
                <h4>7% de desconto no Wise</h4>
                <p>Condição exclusiva para pagamentos em euros no Wise.</p>
              </div>
            )}

            <div className="payment-item">
              <svg className="payment-icon" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
              <h4>Até 12x no cartão</h4>
              <p>
                Parcele sua experiência em até 12 vezes no cartão de crédito.
                <span style={{ display: 'block', fontSize: '12px', marginTop: '6px', opacity: 0.75 }}>
                  * Taxas de juros a consultar.
                </span>
              </p>
            </div>

            <div className="payment-item">
              <svg className="payment-icon" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <h4>Parcelamento no Pix</h4>
              <p>
                Consulte nossa equipe sobre a flexibilidade de parcelamento via Pix.
                <span style={{ display: 'block', fontSize: '12px', marginTop: '6px', opacity: 0.75 }}>
                  * Condições e juros sob consulta.
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- 3. SOBRE A EXPEDIÇÃO & FRASE DE DESTAQUE --- */}
      <section className="bg-beige">
        <div className="container" style={{ padding: '40px 0' }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <span className="section-subtitle" style={{ textAlign: 'center', display: 'block' }}>A Expedição</span>
            
            {expedicao.frase_destaque && (
              <div className="highlight-quote-box" style={{ marginTop: 20 }}>
                <p className="highlight-quote-text">“{expedicao.frase_destaque}”</p>
              </div>
            )}

            <div 
              className="about-text roteiro-formatted" 
              style={{ fontSize: '16.5px', lineHeight: '1.8', textAlign: 'center' }}
              dangerouslySetInnerHTML={formatarEstiloWhatsApp(expedicao.descricao || '')} 
            />
          </div>
        </div>
      </section>

     {/* --- 4. BLOCOS EM ZIGUE-ZAGUE --- */}
      {blocosZigueZague.length > 0 && (
        <section className="bg-white">
          <div className="container">
            <div className="zigzag-list">
              {blocosZigueZague.map((bloco, index) => (
                <div key={bloco.id || index} className={`zigzag-row ${index % 2 !== 0 ? 'reverse' : ''}`}>
                  <div className="zigzag-media">
                    <img src={bloco.imagem || imagemCapa} alt={bloco.titulo} onClick={() => setFotoModal(bloco.imagem || imagemCapa)} style={{ cursor: 'pointer' }} />
                  </div>
                  <div className="zigzag-content">
                    <span className="section-subtitle">Destaque da Experiência</span>
                    <h3>{bloco.titulo}</h3>
                    <div className="roteiro-formatted" dangerouslySetInnerHTML={formatarEstiloWhatsApp(bloco.texto)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* --- 5. GALERIA DE FOTOS --- */}
      <section className="bg-beige">
        <div className="container">
          <div className="section-subtitle" style={{ textAlign: 'center' }}>Galeria de Fotos</div>
          <h2 className="section-title" style={{ textAlign: 'center' }}>Registros Visuais</h2>
          
          {galeria.length > 0 ? (
            <div className="carousel-container" style={{ marginTop: '40px' }}>
              <img src={galeria[currentFotoIndex]} alt={`Galeria ${currentFotoIndex + 1}`} className="carousel-img" onClick={() => setFotoModal(galeria[currentFotoIndex])} />
              {galeria.length > 1 && (
                <>
                  <button className="carousel-btn prev" onClick={prevFoto}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  </button>
                  <button className="carousel-btn next" onClick={nextFoto}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                  </button>
                  <div className="carousel-counter">{currentFotoIndex + 1}/{galeria.length}</div>
                </>
              )}
            </div>
          ) : (
            <div style={{ marginTop: '32px', textAlign: 'center', opacity: 0.7 }}>Nenhuma foto adicional disponível.</div>
          )}
        </div>
      </section>

      {/* --- 6. CRONOGRAMA EM ABAS (MODELO ANTIGO COM IMAGEM AO LADO) --- */}
      <section className="bg-white">
        <div className="container" style={{ padding: '60px 0' }}>
          
          {(expedicao.motivo_epoca_titulo || expedicao.motivo_epoca_texto) && (
            <div className="why-season-box">
              <span className="why-season-badge">Escolha Estratégica</span>
              {expedicao.motivo_epoca_titulo && <h3>{expedicao.motivo_epoca_titulo}</h3>}
              {expedicao.motivo_epoca_texto && (
                <div className="roteiro-formatted" dangerouslySetInnerHTML={formatarEstiloWhatsApp(expedicao.motivo_epoca_texto)} />
              )}
            </div>
          )}

          <div className="cronograma-card">
            <div className="cronograma-header">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--theme-primary, #2f4842)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              Cronograma da Experiência
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
                      <div className="desc roteiro-formatted" dangerouslySetInnerHTML={formatarEstiloWhatsApp(roteiroSelecionado.descricao)} />
                    </div>
                    
                    {imagensRoteiro.length === 1 && (
                      <div className="cronograma-img-wrapper">
                        <img src={imagensRoteiro[0]} alt={`Atividade do Dia ${roteiroSelecionado.dia}`} onClick={() => setFotoModal(imagensRoteiro[0])} />
                      </div>
                    )}

                    {imagensRoteiro.length > 1 && (
                      <div className="cronograma-img-wrapper" style={{ position: 'relative' }}>
                        <img 
                          src={imagensRoteiro[currentRoteiroFotoIndex]} 
                          alt={`Atividade ${currentRoteiroFotoIndex + 1} do Dia ${roteiroSelecionado.dia}`} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                          onClick={() => setFotoModal(imagensRoteiro[currentRoteiroFotoIndex])}
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
              <div style={{ opacity: 0.7, textAlign: 'center' }}>Nenhum roteiro cadastrado para esta expedição.</div>
            )}
          </div>
        </div>
      </section>

      {/* --- 7. PILARES & JORNADA --- */}
      {(pilares.length > 0 || jornada.length > 0) && (
        <section className="bg-beige">
          <div className="container">
            {pilares.length > 0 && (
              <div>
                <div style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto' }}>
                  <span className="section-subtitle">Nossa Essência</span>
                  <h2 className="section-title">
                    {expContent.pilares_titulo || 'Uma viagem para viver, não para administrar'}
                  </h2>
                </div>
                <div className="pillars-grid">
                  {pilares.map((pilar, idx) => (
                    <div className="pillar-card" key={idx}>
                      <h4>{pilar.titulo}</h4>
                      <p>{pilar.descricao}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {jornada.length > 0 && (
              <div style={{ marginTop: pilares.length > 0 ? 72 : 0 }}>
                <div
                  style={{
                    background: 'var(--theme-primary, #2f4842)',
                    borderRadius: 20,
                    padding: '48px 36px',
                    color: '#ffffff',
                  }}
                >
                  <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto' }}>
                    <span className="section-subtitle">Do Início ao Fim</span>
                    <h2 className="section-title" style={{ color: '#ffffff', marginBottom: 8 }}>
                      {expContent.jornada_titulo || 'Tudo pensado para você aproveitar a viagem'}
                    </h2>
                  </div>
                  <div className="journey-grid">
                    {jornada.map((item, idx) => (
                      <div className="journey-step" key={idx}>
                        <span className="journey-step-number">{idx + 1}</span>
                        <h4>{item.etapa}</h4>
                        <p>{item.descricao}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* --- 8. INCLUSÕES E OBSERVAÇÕES --- */}
      <section className="bg-white">
        <div className="container">
          <div className="serv-grid">
            <div className="inc-card">
              <h3>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                O que está incluso
              </h3>
              <ul className="serv-list">
                {expedicao.incluso?.map((item: string, i: number) => <li key={i} dangerouslySetInnerHTML={formatarEstiloWhatsApp(item)} />)}
              </ul>
            </div>
            
            <div className="exc-card">
              <h3>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                O que não está incluso
              </h3>
              <ul className="serv-list">
                {expedicao.nao_incluso?.map((item: string, i: number) => <li key={i} dangerouslySetInnerHTML={formatarEstiloWhatsApp(item)} />)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* --- 9. ESSA VIAGEM É PRA MIM? --- */}
      {perfis.length > 0 && (
        <section className="bg-beige">
          <div className="container">
            <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto' }}>
              <span className="section-subtitle">Para Quem É</span>
              <h2 className="section-title">
                {expContent.perfil_titulo || 'Essa viagem é pra mim?'}
              </h2>
            </div>
            <div className="profile-grid">
              {perfis.map((perf, idx) => (
                <div className="profile-card" key={idx}>
                  <h4>{perf.titulo}</h4>
                  <p>{perf.descricao}</p>
                </div>
              ))}
            </div>
            {expContent.perfil_fechamento && (
              <p className="profile-closing">“{expContent.perfil_fechamento}”</p>
            )}
          </div>
        </section>
      )}

      {expedicao.observacoes?.length > 0 && (
        <section className="bg-white">
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

      {/* MODAL LIGHTBOX */}
      {fotoModal && (
        <div className="lightbox-overlay" onClick={() => setFotoModal(null)}>
          <button type="button" className="lightbox-close" onClick={() => setFotoModal(null)} title="Fechar">
            ✕
          </button>
          <img 
            src={fotoModal} 
            alt="Visualização ampliada" 
            className="lightbox-img" 
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}
    </div>
  );
}