// src/pages/public/Depoimentos/index.tsx
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { supabase } from '@/services/supabase';
import './depoimentos.css';

const LIMITE_NOME_EXPEDICAO = 80;

interface Depoimento {
  id: string;
  nome_cliente: string;
  expedicao_id?: string | null;
  nome_expedicao?: string | null;
  expedicoes?: { nome: string } | null;
  depoimento: string;
  foto_viagem_url?: string | null;
  foto_perfil_url?: string | null;
  ativo: boolean;
}

const EXEMPLOS_FALLBACK: Depoimento[] = [
  {
    id: 'exemplo-1',
    nome_cliente: 'Grupo da 5 Seasons',
    nome_expedicao: 'Chapada das Mesas',
    depoimento: 'Uma expedição inesquecível! Cada parada foi especial e muito bem organizada.',
    foto_viagem_url: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=900&q=80',
    foto_perfil_url: null,
    ativo: true,
  },
];

async function converterParaWebP(file: File, maxWidth = 1200, quality = 0.84): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Falha ao processar imagem.'));

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Erro ao converter imagem para WebP.'));
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Não foi possível ler o arquivo de imagem.'));
    };

    img.src = url;
  });
}

async function uploadImagemPublica(file: File, pasta: string, maxWidth: number): Promise<string> {
  const webpBlob = await converterParaWebP(file, maxWidth);
  const nomeArquivo = `${pasta}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;

  let bucketUsado = 'depoimentos';
  let uploadRes = await supabase.storage
    .from(bucketUsado)
    .upload(nomeArquivo, webpBlob, { contentType: 'image/webp', upsert: false });

  if (uploadRes.error && uploadRes.error.message.toLowerCase().includes('bucket')) {
    bucketUsado = 'expedicoes';
    uploadRes = await supabase.storage
      .from(bucketUsado)
      .upload(nomeArquivo, webpBlob, { contentType: 'image/webp', upsert: false });
  }

  if (uploadRes.error) {
    throw new Error(uploadRes.error.message);
  }

  const { data } = supabase.storage.from(bucketUsado).getPublicUrl(nomeArquivo);
  return data.publicUrl;
}

export function Depoimentos() {
  const [depoimentos, setDepoimentos] = useState<Depoimento[]>([]);
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [loading, setLoading] = useState(true);

  const [modalAberto, setModalAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [enviadoSucesso, setEnviadoSucesso] = useState(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);

  const [formRelato, setFormRelato] = useState({
    nome_cliente: '',
    nome_expedicao: '',
    depoimento: '',
  });

  const [fotoPerfilPreview, setFotoPerfilPreview] = useState<string>('');
  const [fotoPerfilFile, setFotoPerfilFile] = useState<File | null>(null);

  const [fotoViagemPreview, setFotoViagemPreview] = useState<string>('');
  const [fotoViagemFile, setFotoViagemFile] = useState<File | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    carregarDados();
  }, []);

  async function carregarDados() {
    setLoading(true);
    const { data, error } = await supabase
      .from('depoimentos')
      .select('*, expedicoes(nome)')
      .eq('ativo', true)
      .order('ordem', { ascending: true })
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      setDepoimentos(data as Depoimento[]);
    } else {
      setDepoimentos(EXEMPLOS_FALLBACK);
    }

    setLoading(false);
  }

  function anterior() {
    setIndiceAtual((prev) => (prev === 0 ? depoimentos.length - 1 : prev - 1));
  }

  function proximo() {
    setIndiceAtual((prev) => (prev === depoimentos.length - 1 ? 0 : prev + 1));
  }

  function obterIniciais(nome: string) {
    return nome
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('');
  }

  function handleSelectFotoPerfil(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoPerfilFile(file);
    setFotoPerfilPreview(URL.createObjectURL(file));
  }

  function handleSelectFotoViagem(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoViagemFile(file);
    setFotoViagemPreview(URL.createObjectURL(file));
  }

  function resetarFormulario() {
    setFormRelato({ nome_cliente: '', nome_expedicao: '', depoimento: '' });
    setFotoPerfilPreview('');
    setFotoPerfilFile(null);
    setFotoViagemPreview('');
    setFotoViagemFile(null);
    setErroEnvio(null);
  }

  async function handleEnviarRelato(e: FormEvent) {
    e.preventDefault();
    setErroEnvio(null);

    if (!formRelato.nome_cliente.trim() || !formRelato.depoimento.trim()) return;

    try {
      setEnviando(true);

      let urlPerfilFinal: string | null = null;
      if (fotoPerfilFile) {
        urlPerfilFinal = await uploadImagemPublica(fotoPerfilFile, 'depoimentos-perfil', 400);
      }

      let urlViagemFinal: string | null = null;
      if (fotoViagemFile) {
        urlViagemFinal = await uploadImagemPublica(fotoViagemFile, 'depoimentos-viagem', 1200);
      }

      const nomeExpLimpo = formRelato.nome_expedicao.trim().slice(0, LIMITE_NOME_EXPEDICAO);

      const { error } = await supabase.from('depoimentos').insert([
        {
          nome_cliente: formRelato.nome_cliente.trim(),
          nome_expedicao: nomeExpLimpo || null,
          depoimento: formRelato.depoimento.trim(),
          foto_perfil_url: urlPerfilFinal,
          foto_viagem_url: urlViagemFinal,
          ativo: false,
        },
      ]);

      if (error) throw new Error(error.message);

      setEnviadoSucesso(true);
      resetarFormulario();
    } catch (err: any) {
      setErroEnvio(err?.message || 'Não foi possível enviar o seu relato. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  const itemAtual = depoimentos[indiceAtual] || depoimentos[0];
  const nomeExpedicaoAtual = itemAtual?.nome_expedicao || itemAtual?.expedicoes?.nome;

  return (
    <div className="depoimentos-page">
      <div className="container">
        <header className="depoimentos-header">
          <h1 className="depoimentos-title">Depoimentos</h1>
          <p className="depoimentos-subtitle">
            VIAJANTES REAIS, EXPERIÊNCIAS AUTÊNTICAS
          </p>
        </header>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--home-muted)' }}>
            Carregando histórias de viagem...
          </div>
        ) : (
          itemAtual && (
            <>
              <div className="depoimento-stage">
                <div className="polaroid-wrapper">
                  <div className="polaroid-frame">
                    <img
                      src={
                        itemAtual.foto_viagem_url ||
                        'https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=900&q=80'
                      }
                      alt={nomeExpedicaoAtual || itemAtual.nome_cliente}
                    />
                  </div>
                </div>

                <div className="depoimento-content-area">
                  <div className="quote-row">
                    {depoimentos.length > 1 && (
                      <button
                        type="button"
                        className="carousel-arrow-btn"
                        onClick={anterior}
                        aria-label="Depoimento anterior"
                      >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m15 18-6-6 6-6" />
                        </svg>
                      </button>
                    )}

                    <div className="quote-text-block">
                      <span className="quote-mark-icon" aria-hidden="true">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M10 7.5V14a3 3 0 0 1-3 3H5v-2h2a1 1 0 0 0 1-1v-2H5V7.5h5zm8 0V14a3 3 0 0 1-3 3h-2v-2h2a1 1 0 0 0 1-1v-2h-3V7.5h5z" />
                        </svg>
                      </span>
                      <p className="quote-body">“{itemAtual.depoimento}”</p>
                    </div>

                    {depoimentos.length > 1 && (
                      <button
                        type="button"
                        className="carousel-arrow-btn"
                        onClick={proximo}
                        aria-label="Próximo depoimento"
                      >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <div className="author-signature">
                    {itemAtual.foto_perfil_url ? (
                      <img
                        src={itemAtual.foto_perfil_url}
                        alt={itemAtual.nome_cliente}
                        className="author-avatar"
                      />
                    ) : (
                      <div className="author-avatar-fallback">
                        {obterIniciais(itemAtual.nome_cliente)}
                      </div>
                    )}

                    <div>
                      <strong className="author-name">{itemAtual.nome_cliente}</strong>
                      {nomeExpedicaoAtual && (
                        <span className="author-location">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z" />
                          </svg>
                          {nomeExpedicaoAtual}
                        </span>
                      )}
                    </div>
                  </div>

                  {depoimentos.length > 1 && (
                    <div className="carousel-dots">
                      {depoimentos.map((dep, idx) => (
                        <button
                          key={dep.id}
                          type="button"
                          className={`carousel-dot ${idx === indiceAtual ? 'active' : ''}`}
                          onClick={() => setIndiceAtual(idx)}
                          aria-label={`Ver depoimento ${idx + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="depoimentos-cta-wrapper">
                <button
                  type="button"
                  className="btn-deixar-relato"
                  onClick={() => {
                    setEnviadoSucesso(false);
                    resetarFormulario();
                    setModalAberto(true);
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                  Deixe o seu relato
                </button>
              </div>
            </>
          )
        )}
      </div>

      {modalAberto && (
        <div className="relato-modal-backdrop" onClick={() => setModalAberto(false)}>
          <div className="relato-modal-card" onClick={(e) => e.stopPropagation()}>
            {enviadoSucesso ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <h3>Obrigado pelo seu relato!</h3>
                <p style={{ color: 'var(--home-muted)', lineHeight: 1.6, marginBottom: 24 }}>
                  Recebemos a sua história com carinho. Assim que nossa equipe revisar, ela aparecerá aqui na galeria de viajantes.
                </p>
                <button
                  type="button"
                  className="btn-deixar-relato"
                  onClick={() => setModalAberto(false)}
                >
                  Fechar
                </button>
              </div>
            ) : (
              <form onSubmit={handleEnviarRelato}>
                <h3>Deixe o seu relato</h3>
                <p style={{ fontSize: 14, color: 'var(--home-muted)', marginTop: 0, marginBottom: 20 }}>
                  Conte como foi a sua experiência viajando com a 5 Seasons.
                </p>

                {erroEnvio && (
                  <div
                    style={{
                      backgroundColor: '#fef2f2',
                      color: '#b91c1c',
                      border: '1px solid #fecaca',
                      borderRadius: 10,
                      padding: '10px 14px',
                      fontSize: 13.5,
                      marginBottom: 16,
                    }}
                  >
                    {erroEnvio}
                  </div>
                )}

                <div className="relato-field">
                  <label htmlFor="relatoNome">Seu nome</label>
                  <input
                    id="relatoNome"
                    type="text"
                    required
                    placeholder="Ex: Mariana Silva"
                    value={formRelato.nome_cliente}
                    onChange={(e) => setFormRelato((f) => ({ ...f, nome_cliente: e.target.value }))}
                  />
                </div>

                <div className="relato-field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label htmlFor="relatoDestino">Qual expedição você fez? (opcional)</label>
                    <span style={{ fontSize: 11.5, color: 'var(--home-muted)' }}>
                      {formRelato.nome_expedicao.length}/{LIMITE_NOME_EXPEDICAO}
                    </span>
                  </div>
                  <input
                    id="relatoDestino"
                    type="text"
                    maxLength={LIMITE_NOME_EXPEDICAO}
                    placeholder="Ex: Chapada das Mesas, Jalapão, Croácia..."
                    value={formRelato.nome_expedicao}
                    onChange={(e) =>
                      setFormRelato((f) => ({ ...f, nome_expedicao: e.target.value }))
                    }
                  />
                </div>

                <div className="relato-field">
                  <label htmlFor="relatoTexto">Seu depoimento</label>
                  <textarea
                    id="relatoTexto"
                    rows={4}
                    required
                    placeholder="Compartilhe os momentos mais marcantes da viagem..."
                    value={formRelato.depoimento}
                    onChange={(e) => setFormRelato((f) => ({ ...f, depoimento: e.target.value }))}
                  />
                </div>

                <div className="relato-uploads-grid">
                  <div className="relato-field" style={{ marginBottom: 0 }}>
                    <label>Sua foto de perfil (opcional)</label>
                    <label className="relato-upload-btn">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <span>{fotoPerfilPreview ? 'Trocar foto' : 'Escolher foto'}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleSelectFotoPerfil}
                        hidden
                      />
                    </label>

                    {fotoPerfilPreview && (
                      <div className="relato-preview-box">
                        <img
                          src={fotoPerfilPreview}
                          alt="Preview perfil"
                          style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <button
                          type="button"
                          className="relato-remove-btn"
                          onClick={() => {
                            setFotoPerfilPreview('');
                            setFotoPerfilFile(null);
                          }}
                        >
                          Remover
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="relato-field" style={{ marginBottom: 0 }}>
                    <label>Foto da viagem (opcional)</label>
                    <label className="relato-upload-btn">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <span>{fotoViagemPreview ? 'Trocar foto' : 'Escolher foto'}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleSelectFotoViagem}
                        hidden
                      />
                    </label>

                    {fotoViagemPreview && (
                      <div className="relato-preview-box">
                        <img
                          src={fotoViagemPreview}
                          alt="Preview viagem"
                          style={{ width: 76, height: 52, borderRadius: 8, objectFit: 'cover' }}
                        />
                        <button
                          type="button"
                          className="relato-remove-btn"
                          onClick={() => {
                            setFotoViagemPreview('');
                            setFotoViagemFile(null);
                          }}
                        >
                          Remover
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                  <button
                    type="button"
                    onClick={() => setModalAberto(false)}
                    disabled={enviando}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--home-muted)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: '10px 16px',
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={enviando}
                    style={{
                      backgroundColor: 'var(--home-green-deep, #2f4842)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 999,
                      padding: '12px 24px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {enviando ? 'Enviando...' : 'Enviar Relato'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}