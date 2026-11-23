// src/pages/admin/Depoimentos/depoimentosForm.tsx
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/services/supabase';

interface ExpedicaoOpcao {
  id: string;
  nome: string;
}

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

async function uploadImagemStorage(file: File, pasta: string, maxWidth: number): Promise<string> {
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

export function DepoimentosForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [expedicoes, setExpedicoes] = useState<ExpedicaoOpcao[]>([]);
  const [carregandoDados, setCarregandoDados] = useState<boolean>(isEditing);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [nomeCliente, setNomeCliente] = useState('');
  const [expedicaoId, setExpedicaoId] = useState('');
  const [depoimentoTexto, setDepoimentoTexto] = useState('');
  const [ordem, setOrdem] = useState<number>(0);
  const [ativo, setAtivo] = useState<boolean>(true);

  const [fotoViagemUrl, setFotoViagemUrl] = useState('');
  const [fotoViagemFile, setFotoViagemFile] = useState<File | null>(null);

  const [fotoPerfilUrl, setFotoPerfilUrl] = useState('');
  const [fotoPerfilFile, setFotoPerfilFile] = useState<File | null>(null);

  useEffect(() => {
    carregarIniciais();
  }, [id]);

  async function carregarIniciais() {
    setErro(null);

    const expPromise = supabase
      .from('expedicoes')
      .select('id, nome')
      .order('nome', { ascending: true });

    if (id) {
      setCarregandoDados(true);
      const [expRes, depRes] = await Promise.all([
        expPromise,
        supabase.from('depoimentos').select('*').eq('id', id).single(),
      ]);

      if (expRes.data) setExpedicoes(expRes.data as ExpedicaoOpcao[]);

      if (depRes.error || !depRes.data) {
        setErro('Depoimento não encontrado.');
      } else {
        const d = depRes.data;
        setNomeCliente(d.nome_cliente || '');
        setExpedicaoId(d.expedicao_id || '');
        setDepoimentoTexto(d.depoimento || '');
        setOrdem(d.ordem ?? 0);
        setAtivo(Boolean(d.ativo));
        setFotoViagemUrl(d.foto_viagem_url || '');
        setFotoPerfilUrl(d.foto_perfil_url || '');
      }
      setCarregandoDados(false);
    } else {
      const expRes = await expPromise;
      if (expRes.data) setExpedicoes(expRes.data as ExpedicaoOpcao[]);
    }
  }

  function handleSelectFotoViagem(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoViagemFile(file);
    setFotoViagemUrl(URL.createObjectURL(file));
  }

  function handleSelectFotoPerfil(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoPerfilFile(file);
    setFotoPerfilUrl(URL.createObjectURL(file));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!nomeCliente.trim() || !depoimentoTexto.trim()) {
      setErro('Preencha o nome do cliente e o texto do depoimento.');
      return;
    }

    try {
      setSalvando(true);

      let urlViagemFinal = fotoViagemUrl || null;
      if (fotoViagemFile) {
        urlViagemFinal = await uploadImagemStorage(fotoViagemFile, 'depoimentos-viagem', 1200);
      }

      let urlPerfilFinal = fotoPerfilUrl || null;
      if (fotoPerfilFile) {
        urlPerfilFinal = await uploadImagemStorage(fotoPerfilFile, 'depoimentos-perfil', 400);
      }

      const payload = {
        nome_cliente: nomeCliente.trim(),
        expedicao_id: expedicaoId || null,
        depoimento: depoimentoTexto.trim(),
        foto_viagem_url: urlViagemFinal,
        foto_perfil_url: urlPerfilFinal,
        ordem: Number(ordem) || 0,
        ativo,
      };

      if (id) {
        const { error } = await supabase
          .from('depoimentos')
          .update(payload)
          .eq('id', id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from('depoimentos').insert([payload]);
        if (error) throw new Error(error.message);
      }

      navigate('/admin/depoimentos');
    } catch (err: any) {
      setErro(err?.message || 'Erro ao salvar depoimento.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div style={{ padding: '24px 0', maxWidth: 760 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <Link
            to="/admin/depoimentos"
            style={{
              fontSize: 13,
              color: '#64748b',
              textDecoration: 'none',
              display: 'inline-block',
              marginBottom: 6,
            }}
          >
            &larr; Voltar para Depoimentos
          </Link>
          <h1 style={{ margin: 0, fontSize: 26, color: 'var(--verde-escuro, #2f4842)' }}>
            {isEditing ? 'Editar Depoimento' : 'Novo Depoimento'}
          </h1>
        </div>
      </div>

      {carregandoDados ? (
        <div style={{ padding: '48px 0', color: '#64748b' }}>Carregando dados do depoimento...</div>
      ) : (
        <form
          onSubmit={handleSubmit}
          style={{
            background: '#ffffff',
            padding: '28px 28px 24px',
            borderRadius: 12,
            border: '1px solid rgba(47, 72, 66, 0.1)',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.03)',
          }}
        >
          {erro && <div className="ui-form-error">{erro}</div>}

          <div className="ui-form-row">
            <div className="ui-field" style={{ flex: 1 }}>
              <label htmlFor="depNome">Nome do Cliente / Grupo *</label>
              <input
                id="depNome"
                type="text"
                placeholder="Ex: Grupo da 5 Seasons"
                value={nomeCliente}
                onChange={(e) => setNomeCliente(e.target.value)}
                required
              />
            </div>

            <div className="ui-field" style={{ maxWidth: 110 }}>
              <label htmlFor="depOrdem">Ordem</label>
              <input
                id="depOrdem"
                type="number"
                step={1}
                value={ordem}
                onChange={(e) => setOrdem(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="ui-field">
            <label htmlFor="depExpedicao">Expedição de Origem</label>
            <select
              id="depExpedicao"
              value={expedicaoId}
              onChange={(e) => setExpedicaoId(e.target.value)}
            >
              <option value="">Sem vínculo específico</option>
              {expedicoes.map((exp) => (
                <option key={exp.id} value={exp.id}>
                  {exp.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="ui-field">
            <label htmlFor="depTexto">Depoimento *</label>
            <textarea
              id="depTexto"
              rows={5}
              placeholder="Escreva o relato do viajante..."
              value={depoimentoTexto}
              onChange={(e) => setDepoimentoTexto(e.target.value)}
              required
              style={{ lineHeight: 1.5 }}
            />
          </div>

          <div className="ui-form-row" style={{ alignItems: 'flex-start', marginTop: 12 }}>
            <div className="ui-field" style={{ flex: 1 }}>
              <label>Foto da Viagem (Moldura Polaroid)</label>
              <label className="ui-file-upload" style={{ marginTop: 6 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 16V4" />
                  <path d="m7 9 5-5 5 5" />
                  <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
                </svg>
                Selecionar Foto
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleSelectFotoViagem}
                />
              </label>

              {fotoViagemUrl && (
                <div style={{ marginTop: 10 }}>
                  <img
                    src={fotoViagemUrl}
                    alt="Preview Viagem"
                    style={{
                      width: '100%',
                      maxWidth: 220,
                      height: 130,
                      objectFit: 'cover',
                      borderRadius: 8,
                      display: 'block',
                      border: '1px solid #cbd5e1',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFotoViagemUrl('');
                      setFotoViagemFile(null);
                    }}
                    style={{
                      marginTop: 6,
                      color: '#be123c',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 12.5,
                      fontWeight: 600,
                      padding: 0,
                    }}
                  >
                    Remover foto
                  </button>
                </div>
              )}
            </div>

            <div className="ui-field" style={{ flex: 1 }}>
              <label>Foto de Perfil / Avatar (Opcional)</label>
              <label className="ui-file-upload" style={{ marginTop: 6 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 16V4" />
                  <path d="m7 9 5-5 5 5" />
                  <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
                </svg>
                Selecionar Avatar
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleSelectFotoPerfil}
                />
              </label>

              {fotoPerfilUrl && (
                <div style={{ marginTop: 10 }}>
                  <img
                    src={fotoPerfilUrl}
                    alt="Preview Avatar"
                    style={{
                      width: 68,
                      height: 68,
                      objectFit: 'cover',
                      borderRadius: '50%',
                      display: 'block',
                      border: '1px solid #cbd5e1',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFotoPerfilUrl('');
                      setFotoPerfilFile(null);
                    }}
                    style={{
                      marginTop: 6,
                      color: '#be123c',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 12.5,
                      fontWeight: 600,
                      padding: 0,
                    }}
                  >
                    Remover avatar
                  </button>
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--verde-escuro, #2f4842)',
              }}
            >
              <input
                type="checkbox"
                checked={ativo}
                onChange={(e) => setAtivo(e.target.checked)}
              />
              Publicado na página pública (visível para visitantes)
            </label>
          </div>

          <div className="ui-modal-footer" style={{ marginTop: 28 }}>
            <Link
              to="/admin/depoimentos"
              className="ui-btn-ghost"
              style={{ textDecoration: 'none' }}
            >
              Cancelar
            </Link>
            <button type="submit" className="ui-btn-solid" disabled={salvando}>
              {salvando ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Cadastrar Depoimento'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}