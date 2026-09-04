import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/services/supabase';

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
  const [selectedPacoteId, setSelectedPacoteId] = useState<string | null>(null); // Novo estado para o pacote selecionado
  const [loading, setLoading] = useState(true);
  const [diaAberto, setDiaAberto] = useState<number | null>(1);
  const [currentFotoIndex, setCurrentFotoIndex] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchExpedicaoCompleta();
  }, [id]);

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
      supabase.from('pacotes').select('*').eq('expedicao_id', id).in('status', ['Ativo', 'Esgotado']).order('data_inicio', { ascending: true })
    ]);

    if (expRes.data) setExpedicao(expRes.data);
    if (rotRes.data) setRoteiros(rotRes.data);
    if (pacRes.data && pacRes.data.length > 0) {
      setPacotes(pacRes.data);
      // Seleciona o primeiro pacote ativo por padrão, ou o primeiro esgotado se não houver ativos
      const ativos = pacRes.data.filter((p: any) => p.status === 'Ativo');
      setSelectedPacoteId(ativos.length > 0 ? ativos[0].id : pacRes.data[0].id);
    }
    setLoading(false);
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '120px 0', color: 'var(--text-muted)' }}>Carregando detalhes...</div>;
  if (!expedicao) return <div style={{ textAlign: 'center', padding: '120px 0', color: 'var(--text-muted)' }}>Expedição não encontrada.</div>;

  const imagemCapa = expedicao.fotos && expedicao.fotos.length > 0 ? expedicao.fotos[0] : '';
  const galeria = expedicao.fotos && expedicao.fotos.length > 1 ? expedicao.fotos.slice(1) : [];
  
  // Lógica de Pacote Selecionado
  const pacotePrincipal = pacotes.find(p => p.id === selectedPacoteId) || pacotes[0];
  const outrosPacotes = pacotes.filter(p => p.id !== pacotePrincipal?.id);
  const precoExibido = pacotePrincipal?.preco_duplo || 0;
  
  // Link dinâmico com o nome do pacote atual selecionado
  const nomeCompletoWhatsapp = pacotePrincipal ? `${expedicao.nome} - ${pacotePrincipal.nome}` : expedicao.nome;
  const linkWhatsApp = `https://wa.me/5549999999999?text=Ol%C3%A1%21%20Gostaria%20de%20me%20inscrever%20na%20expedi%C3%A7%C3%A3o%20${encodeURIComponent(nomeCompletoWhatsapp)}`;

  function nextFoto() {
    setCurrentFotoIndex((prev) => (prev === galeria.length - 1 ? 0 : prev + 1));
  }

  function prevFoto() {
    setCurrentFotoIndex((prev) => (prev === 0 ? galeria.length - 1 : prev - 1));
  }

  return (
    <div>
      <style>{`
        .bg-beige { background-color: var(--branco-gelo); } 
        .bg-white { background-color: #ffffff; }

        .hero-banner {
          position: relative;
          min-height: 80vh;
          display: flex;
          align-items: center;
          background-size: cover;
          background-position: center;
          padding: 80px 0;
        }
        .hero-overlay {
          position: absolute;
          inset: 0;
          background: rgba(17, 26, 23, 0.65);
        }
        .hero-grid {
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-columns: 380px 1fr;
          gap: 60px;
          align-items: center;
        }
        
        .hero-card {
          background: #151e1b;
          border-radius: 16px;
          padding: 40px 32px;
          color: white;
          box-shadow: 0 24px 48px rgba(0,0,0,0.3);
        }
        .hero-price-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #a1a1aa; margin-bottom: 8px; }
        .hero-price { font-size: 36px; font-weight: 700; color: #34d399; margin: 0 0 24px; line-height: 1; transition: color 0.3s; }
        .hero-features { list-style: none; padding: 0; margin: 0 0 32px; }
        .hero-features li { display: flex; align-items: flex-start; gap: 10px; font-size: 14px; margin-bottom: 12px; color: #e4e4e7; }
        .hero-features svg { flex-shrink: 0; color: #34d399; margin-top: 2px; }
        .btn-orange { display: block; text-align: center; background: #fdb17f; color: #151e1b; padding: 16px; border-radius: 8px; font-weight: 700; text-decoration: none; transition: transform 0.2s; }
        .btn-orange:hover { transform: translateY(-2px); }

        .hero-text-area { color: white; }
        .hero-tag { font-size: 12px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: #fdb17f; margin-bottom: 16px; display: block; }
        .hero-title { font-family: 'Playfair Display', serif; font-size: 56px; font-weight: 600; line-height: 1.1; margin: 0 0 24px; }
        .hero-desc { font-size: 16px; line-height: 1.6; opacity: 0.9; margin-bottom: 32px; max-width: 600px; }
        .hero-pills { display: flex; gap: 12px; flex-wrap: wrap; }
        .hero-pill { background: rgba(255,255,255,0.15); backdrop-filter: blur(4px); padding: 10px 20px; border-radius: 99px; font-size: 15px; font-weight: 500; display: flex; align-items: center; gap: 8px; }

        /* Estilo do Botão Clicável das Outras Datas */
        .outra-data-btn {
          background: transparent;
          border: none;
          padding: 6px 0;
          text-align: left;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.85);
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-family: inherit;
          transition: color 0.2s ease;
        }
        .outra-data-btn strong {
          color: white;
          transition: color 0.2s ease;
        }
        .outra-data-btn:hover {
          color: var(--brand-orange);
        }
        .outra-data-btn:hover strong {
          color: var(--brand-orange);
        }

        .section-padding { padding: 80px 0; }
        .section-title { font-family: 'Playfair Display', serif; font-size: 32px; color: var(--verde-escuro); margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1px; }
        .section-subtitle { font-size: 14px; color: var(--brand-orange); text-transform: uppercase; letter-spacing: 2px; margin-bottom: 32px; font-weight: 600; }
        
        .desc-centered { max-width: 800px; margin: 0 auto; text-align: center; font-size: 18px; line-height: 1.8; color: var(--text-main); font-weight: 300; font-style: italic; }
        
        .rot-gal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
        .accordion-item { border: 1px solid var(--cream); border-radius: 8px; margin-bottom: 12px; background: white; overflow: hidden; }
        .accordion-header { padding: 16px; display: flex; align-items: center; gap: 12px; cursor: pointer; color: var(--verde-escuro); font-weight: 600; font-size: 15px; }
        .accordion-body { padding: 0 16px 16px 44px; font-size: 14.5px; line-height: 1.6; color: var(--text-main); }
        .accordion-body strong { color: var(--verde-escuro); }
        
        .carousel-container { position: relative; width: 100%; border-radius: 16px; overflow: hidden; aspect-ratio: 4/3; }
        .carousel-img { width: 100%; height: 100%; object-fit: cover; display: block; transition: opacity 0.3s ease-in-out; }
        .carousel-btn { position: absolute; top: 50%; transform: translateY(-50%); width: 44px; height: 44px; border-radius: 50%; background: rgba(38, 51, 47, 0.5); color: white; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; backdrop-filter: blur(4px); transition: background 0.2s; }
        .carousel-btn:hover { background: rgba(38, 51, 47, 0.8); }
        .carousel-btn.prev { left: 16px; }
        .carousel-btn.next { right: 16px; }
        .carousel-counter { position: absolute; bottom: 16px; right: 16px; background: rgba(38, 51, 47, 0.7); color: white; padding: 6px 16px; border-radius: 99px; font-size: 13px; font-weight: 600; letter-spacing: 1px; backdrop-filter: blur(4px); }

        .serv-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
        .inc-card { background: #edfaee; border: 1px solid #c6f0ce; border-radius: 16px; padding: 40px; height: 100%; }
        .inc-card h3 { color: #2e7d32; display: flex; align-items: center; gap: 10px; margin: 0 0 24px; font-size: 20px; }
        .exc-card { background: #fff0f0; border: 1px solid #fecdd3; border-radius: 16px; padding: 40px; height: 100%; }
        .exc-card h3 { color: #be123c; display: flex; align-items: center; gap: 10px; margin: 0 0 24px; font-size: 20px; }
        .serv-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 16px; }
        .serv-list li { position: relative; padding-left: 20px; font-size: 15px; color: var(--text-main); line-height: 1.5; }
        .inc-card .serv-list li::before { content: '•'; position: absolute; left: 0; color: #2e7d32; font-weight: bold; }
        .exc-card .serv-list li::before { content: '•'; position: absolute; left: 0; color: #be123c; font-weight: bold; }

        .obs-box { background: #eef7db; border-radius: 16px; padding: 40px; max-width: 800px; margin: 0 auto; }
        .obs-box h3 { text-align: center; color: var(--verde-escuro); font-family: 'Playfair Display', serif; font-size: 24px; margin: 0 0 24px; }

        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr; gap: 40px; }
          .hero-title { font-size: 40px; }
          .rot-gal-grid, .serv-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <section className="hero-banner" style={{ backgroundImage: `url(${imagemCapa})` }}>
        <div className="hero-overlay"></div>
        <div className="container hero-grid">
          
          <div className="hero-card">
            <div className="hero-price-title">Valor do Investimento</div>
            <div className="hero-price" style={{ color: pacotePrincipal?.status === 'Ativo' ? '#34d399' : '#f87171' }}>
              {precoExibido > 0 ? formatarMoeda(precoExibido) : 'Sob Consulta'}
            </div>
            
            <ul className="hero-features">
              {expedicao.incluso?.slice(0, 6).map((item: string, i: number) => (
                <li key={i}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  {item}
                </li>
              ))}
            </ul>
            
            <a href={linkWhatsApp} target="_blank" rel="noreferrer" className="btn-orange">
              {pacotePrincipal?.status === 'Ativo' ? 'QUERO ME INSCREVER →' : 'CONSULTAR VAGAS →'}
            </a>
          </div>

          <div className="hero-text-area">
            <span className="hero-tag">Expedição {expedicao.tipo_destino}</span>
            <h1 className="hero-title">{expedicao.nome}</h1>
            <p className="hero-desc">{expedicao.descricao.split('\n')[0]}</p>
            
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

            {/* Outras Datas (Agora Botões Clicáveis) */}
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
        <div className="section-padding container" style={{ paddingBottom: '60px' }}>
          <div className="section-subtitle" style={{ textAlign: 'center' }}>A Expedição</div>
          <div className="desc-centered">
            "{expedicao.descricao}"
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="section-padding container">
          <div className="rot-gal-grid">
            <div>
              <div className="section-subtitle">Dia a dia</div>
              <h2 className="section-title">Roteiro da Expedição</h2>
              <div style={{ marginTop: '32px' }}>
                {roteiros.map((rot) => {
                  const isOpen = diaAberto === rot.dia;
                  return (
                    <div className="accordion-item" key={rot.id}>
                      <div className="accordion-header" onClick={() => setDiaAberto(isOpen ? null : rot.dia)}>
                        <svg style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: '0.2s', color: 'var(--brand-orange)' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
                        Dia {rot.dia} - {rot.titulo.toUpperCase()}
                      </div>
                      {isOpen && (
                        <div className="accordion-body" dangerouslySetInnerHTML={formatarEstiloWhatsApp(rot.descricao)} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="section-subtitle">Galeria de Fotos</div>
              <h2 className="section-title">Registros Visuais</h2>
              
              {galeria.length > 0 ? (
                <div className="carousel-container" style={{ marginTop: '32px' }}>
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
                <div style={{ marginTop: '32px', color: 'var(--text-muted)' }}>Nenhuma foto adicional disponível.</div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-beige">
        <div className="section-padding container">
          <div className="serv-grid">
            <div className="inc-card">
              <h3>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                O que está incluso
              </h3>
              <ul className="serv-list">
                {expedicao.incluso?.map((item: string, i: number) => <li key={i}>{item}</li>)}
              </ul>
            </div>
            
            <div className="exc-card">
              <h3>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                O que não está incluso
              </h3>
              <ul className="serv-list">
                {expedicao.nao_incluso?.map((item: string, i: number) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {expedicao.observacoes?.length > 0 && (
        <section className="bg-white">
          <div className="section-padding container">
            <div className="obs-box">
              <h3>Observações Importantes</h3>
              <ul className="serv-list" style={{ gap: '12px' }}>
                {expedicao.observacoes.map((item: string, i: number) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}