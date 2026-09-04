import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/services/supabase';

// Formatação do WhatsApp (Negrito, Itálico, Riscado)
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
  return `${diaI}/${mesI} a ${diaF}/${mesF}/${anoF}`;
}

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

export function ExpedicaoPublica() {
  const { id } = useParams<{ id: string }>();
  const [expedicao, setExpedicao] = useState<any>(null);
  const [roteiros, setRoteiros] = useState<any[]>([]);
  const [pacotes, setPacotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [diaAberto, setDiaAberto] = useState<number | null>(1);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchExpedicaoCompleta();
  }, [id]);

  async function fetchExpedicaoCompleta() {
    setLoading(true);
    
    const [expRes, rotRes, pacRes] = await Promise.all([
      supabase.from('expedicoes').select('*').eq('id', id).single(),
      supabase.from('roteiros').select('*').eq('expedicao_id', id).order('dia', { ascending: true }),
      supabase.from('pacotes').select('*').eq('expedicao_id', id).in('status', ['Ativo', 'Esgotado']).order('data_inicio', { ascending: true })
    ]);

    if (expRes.data) setExpedicao(expRes.data);
    if (rotRes.data) setRoteiros(rotRes.data);
    if (pacRes.data) setPacotes(pacRes.data);
    
    setLoading(false);
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '120px 0', color: 'var(--text-muted)' }}>Carregando os detalhes da expedição...</div>;
  }

  if (!expedicao) {
    return <div style={{ textAlign: 'center', padding: '120px 0', color: 'var(--text-muted)' }}>Expedição não encontrada.</div>;
  }

  const imagemCapa = expedicao.fotos && expedicao.fotos.length > 0 ? expedicao.fotos[0] : '';
  const galeria = expedicao.fotos && expedicao.fotos.length > 1 ? expedicao.fotos.slice(1) : [];

  return (
    <div>
      <style>{`
        .exp-hero {
          position: relative;
          height: 60vh;
          min-height: 400px;
          display: flex;
          align-items: flex-end;
          padding-bottom: 60px;
          background-size: cover;
          background-position: center;
        }
        .exp-hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(38, 51, 47, 0.95) 0%, rgba(38, 51, 47, 0.3) 60%, transparent 100%);
        }
        .exp-hero-content {
          position: relative;
          z-index: 2;
          color: var(--branco-gelo);
        }
        .exp-title {
          font-family: 'Playfair Display', serif;
          font-size: 48px;
          font-weight: 600;
          margin: 0 0 12px;
          line-height: 1.1;
        }
        .exp-layout {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 60px;
          padding: 60px 24px 100px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .exp-section-title {
          font-family: 'Playfair Display', serif;
          font-size: 28px;
          color: var(--verde-escuro);
          margin: 0 0 24px;
          border-bottom: 1px solid var(--beje-claro);
          padding-bottom: 12px;
        }
        .exp-text-body {
          font-size: 16px;
          line-height: 1.8;
          color: var(--text-main);
          opacity: 0.9;
          white-space: pre-wrap;
        }
        .rot-accordion {
          border: 1px solid var(--beje-claro);
          border-radius: 8px;
          margin-bottom: 16px;
          overflow: hidden;
          background: #fff;
        }
        .rot-header {
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          cursor: pointer;
          background: var(--branco-gelo);
          font-weight: 600;
          color: var(--verde-escuro);
          transition: background 0.2s;
        }
        .rot-header:hover { background: var(--beje-claro); }
        .rot-body {
          padding: 20px;
          border-top: 1px solid var(--beje-claro);
          font-size: 15px;
          line-height: 1.6;
          color: var(--text-main);
        }
        .rot-body strong { color: var(--verde-escuro); font-weight: 700; }
        .rot-body i { font-style: italic; }
        .rot-body del { opacity: 0.6; }
        
        .sticky-card {
          position: sticky;
          top: 100px;
          background: #fff;
          border: 1px solid var(--beje-claro);
          border-radius: 12px;
          padding: 32px;
          box-shadow: 0 12px 32px rgba(47, 72, 66, 0.08);
        }
        .pct-item {
          padding: 16px 0;
          border-bottom: 1px dashed var(--beje-claro);
        }
        .pct-item:last-child { border-bottom: none; }
        
        .btn-whatsapp {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          background: #25d366;
          color: white;
          padding: 14px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          font-size: 16px;
          margin-top: 24px;
          transition: transform 0.2s;
        }
        .btn-whatsapp:hover { transform: translateY(-2px); }

        @media (max-width: 900px) {
          .exp-layout { grid-template-columns: 1fr; gap: 40px; }
          .exp-title { font-size: 36px; }
        }
      `}</style>

      {/* Header com a Foto de Capa */}
      <div className="exp-hero" style={{ backgroundImage: `url(${imagemCapa})`, backgroundColor: 'var(--beje-claro)' }}>
        <div className="exp-hero-overlay"></div>
        <div className="container exp-hero-content">
          <span style={{ display: 'inline-block', background: 'var(--beje-escuro)', color: 'var(--verde-escuro)', padding: '6px 14px', borderRadius: '99px', fontSize: '12px', fontWeight: 700, letterSpacing: '1px', marginBottom: '16px', textTransform: 'uppercase' }}>
            {expedicao.tipo_destino} • {expedicao.pais}
          </span>
          <h1 className="exp-title">{expedicao.nome}</h1>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {expedicao.categorias?.map((cat: string) => (
              <span key={cat} style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', padding: '6px 12px', borderRadius: '99px', fontSize: '13px' }}>
                {cat}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="exp-layout">
        {/* Coluna Esquerda: Conteúdo */}
        <div>
          <section style={{ marginBottom: '60px' }}>
            <h2 className="exp-section-title">Sobre a Experiência</h2>
            <div className="exp-text-body">{expedicao.descricao}</div>
          </section>

          {roteiros.length > 0 && (
            <section style={{ marginBottom: '60px' }}>
              <h2 className="exp-section-title">Roteiro Dia a Dia</h2>
              <div>
                {roteiros.map((rot) => {
                  const isOpen = diaAberto === rot.dia;
                  return (
                    <div className="rot-accordion" key={rot.id}>
                      <div className="rot-header" onClick={() => setDiaAberto(isOpen ? null : rot.dia)}>
                        <svg style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: '0.2s' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="m9 18 6-6-6-6"/>
                        </svg>
                        Dia {rot.dia} — {rot.titulo}
                      </div>
                      {isOpen && (
                        <div 
                          className="rot-body" 
                          dangerouslySetInnerHTML={formatarEstiloWhatsApp(rot.descricao)} 
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px', marginBottom: '60px' }}>
            {expedicao.incluso?.length > 0 && (
              <div>
                <h3 style={{ fontSize: '18px', color: 'var(--verde-escuro)', marginBottom: '16px' }}>O que está incluso</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {expedicao.incluso.map((item: string, i: number) => (
                    <li key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px', color: 'var(--text-main)', fontSize: '15px' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#25d366" strokeWidth="2" style={{ flexShrink: 0 }}><polyline points="20 6 9 17 4 12"></polyline></svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {expedicao.nao_incluso?.length > 0 && (
              <div>
                <h3 style={{ fontSize: '18px', color: 'var(--verde-escuro)', marginBottom: '16px' }}>O que NÃO está incluso</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {expedicao.nao_incluso.map((item: string, i: number) => (
                    <li key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px', color: 'var(--text-main)', fontSize: '15px', opacity: 0.8 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="2" style={{ flexShrink: 0 }}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {galeria.length > 0 && (
            <section>
              <h2 className="exp-section-title">Galeria</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                {galeria.map((foto: string, idx: number) => (
                  <img key={idx} src={foto} alt="Galeria" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px' }} />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Coluna Direita: Sticky Card (Preços e Saídas) */}
        <div>
          <div className="sticky-card">
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', color: 'var(--verde-escuro)', margin: '0 0 24px' }}>
              Saídas Disponíveis
            </h3>

            {pacotes.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>Nenhuma data programada no momento. Fale conosco para lista de espera.</p>
            ) : (
              pacotes.map(pacote => (
                <div key={pacote.id} className="pct-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <strong style={{ fontSize: '15px', color: 'var(--text-main)' }}>{pacote.nome}</strong>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: pacote.status === 'Ativo' ? 'var(--verde-escuro)' : '#e74c3c' }}>
                      {pacote.status === 'Ativo' ? 'VAGAS ABERTAS' : 'ESGOTADO'}
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    📅 {formatarDataCard(pacote.data_inicio, pacote.data_fim)}
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--verde-escuro)' }}>
                    {formatarMoeda(pacote.preco_duplo)} <span style={{ fontSize: '13px', fontWeight: 400, opacity: 0.7 }}>/ pessoa</span>
                  </div>
                </div>
              ))
            )}

            <a 
              href={`https://wa.me/5549999999999?text=Ol%C3%A1%21%20Gostaria%20de%20saber%20mais%20sobre%20a%20expedi%C3%A7%C3%A3o%20${encodeURIComponent(expedicao.nome)}`} 
              target="_blank" 
              rel="noreferrer" 
              className="btn-whatsapp"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.015c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
              </svg>
              Garantir minha vaga
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}