import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/services/supabase';
import type { Expedicao } from '@/types';
import '../admin-theme.css';

import imageCompression from 'browser-image-compression';

type Tab = 'geral' | 'fotos' | 'inclusoes' | 'roteiro';

type FormState = {
  nome: string;
  pais: string;
  tipo_destino: string;
  descricao: string;
  categorias: string[];
  fotos: string[];
  incluso: string[];
  nao_incluso: string[];
  observacoes: string[];
};

type RoteiroDraftItem = {
  localId: string;
  id?: string;
  dia: number;
  titulo: string;
  descricao: string;
  imagens?: string[];
  pendingImageFile?: File | null;
};

const EMPTY_FORM: FormState = {
  nome: '',
  pais: '',
  tipo_destino: '',
  descricao: '',
  categorias: [],
  fotos: [],
  incluso: [],
  nao_incluso: [],
  observacoes: [],
};

function uid() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function formatarEstiloWhatsApp(texto: string) {
  if (!texto) return { __html: '' };
  
  const htmlFormatado = texto
    .replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
    .replace(/_([^_]+)_/g, '<i>$1</i>')
    .replace(/~([^~]+)~/g, '<del>$1</del>')
    .replace(/\n/g, '<br />');

  return { __html: htmlFormatado };
}

export function ExpedicaoForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id;

  const [expedicaoId, setExpedicaoId] = useState<string | null>(isNew ? null : id!);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tab, setTab] = useState<Tab>('geral');
  const [fieldErrors, setFieldErrors] = useState<{ nome?: boolean; pais?: boolean; tipo_destino?: boolean }>({});
  
  const [pendingFiles, setPendingFiles] = useState<{ file: File; previewUrl: string }[]>([]);
  const [photoError, setPhotoError] = useState('');
  const [deletedFotos, setDeletedFotos] = useState<string[]>([]);

  const [roteiroItems, setRoteiroItems] = useState<RoteiroDraftItem[]>([]);
  const [deletedRoteiroIds, setDeletedRoteiroIds] = useState<string[]>([]);

  const AVAILABLE_TABS: Tab[] = isNew
    ? ['geral', 'fotos', 'inclusoes']
    : ['geral', 'fotos', 'inclusoes', 'roteiro'];

  useEffect(() => {
    if (!isNew && id) fetchExpedicao(id);
  }, [id]);

  async function fetchExpedicao(expId: string) {
    setLoading(true);
    setError('');

    const [expResult, roteiroResult] = await Promise.all([
      supabase.from('expedicoes').select('*').eq('id', expId).single(),
      supabase
        .from('roteiros')
        .select('*')
        .eq('expedicao_id', expId)
        .order('dia', { ascending: true })
        .order('created_at', { ascending: true }),
    ]);

    if (expResult.error || !expResult.data) {
      setError('Não foi possível carregar essa expedição.');
      setLoading(false);
      return;
    }

    const exp = expResult.data as Expedicao;
    setForm({
      nome: exp.nome,
      pais: exp.pais,
      tipo_destino: exp.tipo_destino,
      descricao: exp.descricao,
      categorias: exp.categorias ?? [],
      fotos: exp.fotos ?? [],
      incluso: exp.incluso ?? [],
      nao_incluso: exp.nao_incluso ?? [],
      observacoes: exp.observacoes ?? [],
    });

    const roteiros = (roteiroResult.data ?? []) as any[];
    setRoteiroItems(
      roteiros.map((r) => ({ 
        localId: r.id, 
        id: r.id, 
        dia: r.dia, 
        titulo: r.titulo, 
        descricao: r.descricao, 
        imagens: r.imagens || [],
        pendingImageFile: null 
      }))
    );
    setDeletedRoteiroIds([]);
    setLoading(false);
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const dataTabIndex = AVAILABLE_TABS.indexOf(tab);
  const isFirstDataTab = dataTabIndex === 0;
  const isLastDataTab = dataTabIndex === AVAILABLE_TABS.length - 1;

  function goToPrevTab() {
    setError('');
    const prev = AVAILABLE_TABS[dataTabIndex - 1];
    if (prev) setTab(prev);
  }

  function validateGeral(): boolean {
    const errs: typeof fieldErrors = {};
    if (!form.nome.trim()) errs.nome = true;
    if (!form.pais.trim()) errs.pais = true;
    if (!form.tipo_destino) errs.tipo_destino = true;
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function goToNextTab() {
    if (tab === 'geral' && !validateGeral()) {
      return;
    }
    setError('');
    setFieldErrors({});
    const next = AVAILABLE_TABS[dataTabIndex + 1];
    if (next) setTab(next);
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setPhotoError('');

    const novas: { file: File; previewUrl: string }[] = [];
    
    // Configuração da compressão (Transforma em WebP e limita a ~300kb)
    const options = {
      maxSizeMB: 0.3,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: "image/webp"
    };

    for (const originalFile of Array.from(files)) {
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(originalFile.type)) {
        setPhotoError('Envie apenas imagens PNG, JPG ou WEBP.');
        continue;
      }
      
      try {
        const compressedBlob = await imageCompression(originalFile, options);
        
        // Renomeia o arquivo para forçar a extensão .webp
        const nomeSemExtensao = originalFile.name.replace(/\.[^/.]+$/, "");
        const webpFile = new File([compressedBlob], `${nomeSemExtensao}.webp`, {
          type: "image/webp",
        });
        
        novas.push({ file: webpFile, previewUrl: URL.createObjectURL(webpFile) });
      } catch (err) {
        console.error("Erro na compressão", err);
        setPhotoError('Erro ao processar uma das imagens.');
      }
    }
    
    setPendingFiles((prev) => [...prev, ...novas]);
    e.target.value = '';
  }

  function removePendingFile(index: number) {
    setPendingFiles((prev) => {
      const alvo = prev[index];
      if (alvo) URL.revokeObjectURL(alvo.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  function handleRemoveExistingPhoto(index: number) {
    const urlRemovida = form.fotos[index];
    setDeletedFotos((prev) => [...prev, urlRemovida]);
    updateField('fotos', form.fotos.filter((_, idx) => idx !== index));
  }

  async function uploadPendingPhotos(currentId: string): Promise<string[]> {
    if (pendingFiles.length === 0) return [];
    const uploadedUrls: string[] = [];

    for (const { file } of pendingFiles) {
      const ext = file.name.split('.').pop();
      const path = `${currentId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('expedicoes').upload(path, file);
      if (error) {
        setPhotoError('Não foi possível enviar uma ou mais imagens.');
        continue;
      }
      const { data } = supabase.storage.from('expedicoes').getPublicUrl(path);
      uploadedUrls.push(data.publicUrl);
    }
    return uploadedUrls;
  }

  async function refetchRoteiro(currentId: string) {
    const { data } = await supabase
      .from('roteiros')
      .select('*')
      .eq('expedicao_id', currentId)
      .order('dia', { ascending: true })
      .order('created_at', { ascending: true });
      
    const roteiros = (data ?? []) as any[];
    setRoteiroItems(
      roteiros.map((r) => ({ 
        localId: r.id, 
        id: r.id, 
        dia: r.dia, 
        titulo: r.titulo, 
        descricao: r.descricao, 
        imagens: r.imagens || [],
        pendingImageFile: null 
      }))
    );
  }

  async function handleSave(e?: React.FormEvent | React.MouseEvent) {
    if (e) e.preventDefault();
    setError('');
    setSuccess('');
    setPhotoError('');

    if (!validateGeral()) {
      setTab('geral');
      return;
    }

    setSaving(true);
    let currentId = expedicaoId;

    if (isNew && !currentId) {
      const { data, error } = await supabase
        .from('expedicoes')
        .insert({
          nome: form.nome.trim(),
          pais: form.pais.trim(),
          tipo_destino: form.tipo_destino,
          descricao: form.descricao.trim(),
          categorias: form.categorias,
          fotos: form.fotos,
          incluso: form.incluso,
          nao_incluso: form.nao_incluso,
          observacoes: form.observacoes,
        })
        .select()
        .single();

      if (error || !data) {
        setSaving(false);
        setError('Não foi possível criar a expedição. Tente novamente.');
        return;
      }
      currentId = data.id;
      setExpedicaoId(currentId);
    }

    const novasUrls = await uploadPendingPhotos(currentId!);
    const fotosFinal = [...form.fotos, ...novasUrls];

    const { error: updateError } = await supabase
      .from('expedicoes')
      .update({
        nome: form.nome.trim(),
        pais: form.pais.trim(),
        tipo_destino: form.tipo_destino,
        descricao: form.descricao.trim(),
        categorias: form.categorias,
        fotos: fotosFinal,
        incluso: form.incluso,
        nao_incluso: form.nao_incluso,
        observacoes: form.observacoes,
      })
      .eq('id', currentId);

    if (updateError) {
      setSaving(false);
      setError('Não foi possível salvar as alterações.');
      return;
    }

    if (deletedRoteiroIds.length > 0) {
      const { error: delError } = await supabase.from('roteiros').delete().in('id', deletedRoteiroIds);
      if (delError) {
        setSaving(false);
        setError('Os dados foram salvos, mas houve um problema ao remover itens do roteiro.');
        return;
      }
    }

    const roteirosProcessados = await Promise.all(roteiroItems.map(async (item) => {
      if (item.pendingImageFile) {
        const ext = item.pendingImageFile.name.split('.').pop();
        const path = `${currentId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from('roteiros').upload(path, item.pendingImageFile);
        
        if (!error) {
          const { data } = supabase.storage.from('roteiros').getPublicUrl(path);
          return { ...item, imagens: [data.publicUrl], pendingImageFile: null };
        }
      }
      return item;
    }));

    const paraAtualizar = roteirosProcessados.filter((item) => item.id);
    for (const item of paraAtualizar) {
      const { error: updError } = await supabase
        .from('roteiros')
        .update({ 
          dia: item.dia, 
          titulo: item.titulo, 
          descricao: item.descricao, 
          imagens: item.imagens || [] 
        })
        .eq('id', item.id);
      if (updError) {
        setSaving(false);
        setError('Os dados foram salvos, mas houve um problema ao atualizar o roteiro.');
        return;
      }
    }

    const paraInserir = roteirosProcessados.filter((item) => !item.id);
    if (paraInserir.length > 0) {
      const { error: insError } = await supabase.from('roteiros').insert(
        paraInserir.map((item) => ({
          expedicao_id: currentId,
          dia: item.dia,
          titulo: item.titulo,
          descricao: item.descricao,
          imagens: item.imagens || [] 
        }))
      );
      if (insError) {
        setSaving(false);
        setError('Os dados foram salvos, mas houve um problema ao adicionar itens ao roteiro.');
        return;
      }
    }

    pendingFiles.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setPendingFiles([]);
    setDeletedRoteiroIds([]);

    if (deletedFotos.length > 0) {
      const pathsToRemove = deletedFotos.map((url) => {
        const parts = url.split('public/expedicoes/');
        return parts.length > 1 ? parts[1] : null;
      }).filter(Boolean) as string[];

      if (pathsToRemove.length > 0) {
        await supabase.storage.from('expedicoes').remove(pathsToRemove);
      }
    }
    setDeletedFotos([]);

    updateField('fotos', fotosFinal);
    await refetchRoteiro(currentId!);

    setSaving(false);
    if (isNew) {
      setSuccess('Expedição criada com sucesso!');
      navigate(`/admin/expedicoes/${currentId}`, { replace: true });
      return;
    }
    setSuccess('Alterações salvas.');
  }

  const tabs: { key: Tab; label: string; disabled?: boolean; hint?: string }[] = [
    { key: 'geral', label: 'Dados Gerais' },
    { key: 'fotos', label: 'Fotos' },
    { key: 'inclusoes', label: 'Inclusões & Observações' },
    { key: 'roteiro', label: 'Roteiro', disabled: isNew, hint: isNew ? 'Salve a expedição para liberar o roteiro' : '' },
  ];

  if (loading) {
    return (
      <div className="ui-page">
        <div className="ui-state">A carregar expedição...</div>
      </div>
    );
  }

  return (
    <div className="ui-page">
      <style>{`
        .ui-formatted-text strong {
          font-weight: 700 !important;
          color: var(--forest-deep);
        }
        
        .ui-formatted-text em, .ui-formatted-text i {
          font-style: italic !important;
        }
        
        .ui-formatted-text del {
          text-decoration: line-through !important;
          opacity: 0.7;
        }
      `}</style>
      
      <Link to="/admin/expedicoes" className="ui-back">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Voltar para Expedições
      </Link>

      <div className="ui-page-header">
        <div>
          <h1 className="ui-page-title">{isNew ? 'Nova Expedição' : form.nome || 'Editar Expedição'}</h1>
          <p className="ui-page-subtitle">
            {isNew
              ? 'Preencha os dados e guarde para libertar o registo do roteiro.'
              : 'Atualize as informações da expedição.'}
          </p>
        </div>
      </div>

      <div className="ui-tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`ui-tab${tab === t.key ? ' active' : ''}`}
            disabled={t.disabled}
            onClick={() => setTab(t.key)}
            title={t.hint}
          >
            {t.label}
            {t.disabled && (
              <svg style={{ marginLeft: 6, opacity: 0.5 }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            )}
          </button>
        ))}
      </div>

      {error && <div className="ui-form-error">{error}</div>}
      {success && <div className="ui-form-success">{success}</div>}

      <form 
        onSubmit={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
            e.preventDefault();
          }
        }}
      >
        {tab === 'geral' && (
          <>
            <div className="ui-form-row">
              <div className={`ui-field${fieldErrors.nome ? ' has-error' : ''}`}>
                <label htmlFor="nome">
                  Nome da Expedição <span className="ui-required">*</span>
                </label>
                <input
                  id="nome"
                  type="text"
                  placeholder="Ex: Travessia Patagónia"
                  value={form.nome}
                  onChange={(e) => {
                    updateField('nome', e.target.value);
                    if (fieldErrors.nome) setFieldErrors((f) => ({ ...f, nome: false }));
                  }}
                />
              </div>
            </div>
            <div className="ui-form-row">
              <div className={`ui-field${fieldErrors.pais ? ' has-error' : ''}`}>
                <label htmlFor="pais">
                  País <span className="ui-required">*</span>
                </label>
                <input
                  id="pais"
                  type="text"
                  placeholder="Ex: Argentina"
                  value={form.pais}
                  onChange={(e) => {
                    updateField('pais', e.target.value);
                    if (fieldErrors.pais) setFieldErrors((f) => ({ ...f, pais: false }));
                  }}
                />
              </div>
              <div className={`ui-field${fieldErrors.tipo_destino ? ' has-error' : ''}`}>
                <label htmlFor="tipo_destino">
                  Tipo de Destino <span className="ui-required">*</span>
                </label>
                <select
                  id="tipo_destino"
                  value={form.tipo_destino}
                  onChange={(e) => {
                    updateField('tipo_destino', e.target.value);
                    if (fieldErrors.tipo_destino) setFieldErrors((f) => ({ ...f, tipo_destino: false }));
                  }}
                >
                  <option value="">Selecione...</option>
                  <option value="Nacional">Nacional</option>
                  <option value="Internacional">Internacional</option>
                </select>
              </div>
            </div>

            <TagListEditor
              label="Categorias"
              placeholder="Ex: Trekking, Aventura... (Enter para adicionar)"
              values={form.categorias}
              onChange={(v) => updateField('categorias', v)}
            />

            <div className="ui-field">
              <label htmlFor="descricao">Descrição</label>
              <textarea
                id="descricao"
                placeholder="Conte a experiência que essa expedição oferece..."
                value={form.descricao}
                onChange={(e) => updateField('descricao', e.target.value)}
                style={{ minHeight: 140 }}
              />
            </div>
          </>
        )}

        {tab === 'fotos' && (
          <div className="ui-field">
            <label>Fotos</label>
            <p className="ui-hint">
              Envie imagens do computador (PNG ou JPG). Elas são enviadas de facto quando clicar em Salvar.
            </p>
            {photoError && <div className="ui-form-error">{photoError}</div>}
            <label className={`ui-file-upload${saving ? ' disabled' : ''}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 16V4" />
                <path d="m7 9 5-5 5 5" />
                <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
              </svg>
              Selecionar fotos
              <input
                type="file"
                accept="image/png,image/jpeg"
                multiple
                disabled={saving}
                onChange={handleFileSelect}
              />
            </label>

            {(form.fotos.length > 0 || pendingFiles.length > 0) && (
              <div className="ui-photo-grid">
                {form.fotos.map((url, i) => (
                  <div className="ui-photo-thumb" key={`existing-${url}-${i}`}>
                    <img src={url} alt={`Foto ${i + 1}`} />
                    <button
                      type="button"
                      className="ui-photo-remove"
                      onClick={() => handleRemoveExistingPhoto(i)}
                      title="Remover"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                {pendingFiles.map((p, i) => (
                  <div className="ui-photo-thumb" key={`pending-${i}`}>
                    <img src={p.previewUrl} alt={`Nova foto ${i + 1}`} />
                    <span className="ui-photo-pending-badge">Nova</span>
                    <button
                      type="button"
                      className="ui-photo-remove"
                      onClick={() => removePendingFile(i)}
                      title="Remover"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'inclusoes' && (
          <>
            <ListEditor
              label="O que está incluído"
              placeholder="Ex: Pequeno-almoço, transporte..."
              values={form.incluso}
              onChange={(v) => updateField('incluso', v)}
            />
            <ListEditor
              label="O que não está incluído"
              placeholder="Ex: Voos, seguro de viagem..."
              values={form.nao_incluso}
              onChange={(v) => updateField('nao_incluso', v)}
            />
            <ListEditor
              label="Observações"
              placeholder="Ex: Necessário preparo físico intermédio..."
              values={form.observacoes}
              onChange={(v) => updateField('observacoes', v)}
            />
          </>
        )}

        {tab === 'roteiro' && !isNew && (
          <RoteiroEditor
            items={roteiroItems}
            setItems={setRoteiroItems}
            onMarkDeleted={(ids) => setDeletedRoteiroIds((prev) => [...prev, ...ids])}
          />
        )}

        <div className="ui-step-actions">
          {!isFirstDataTab ? (
            <button type="button" className="ui-btn-ghost" onClick={goToPrevTab} disabled={saving}>
              Voltar
            </button>
          ) : (
            <span />
          )}

          {isLastDataTab ? (
            <button type="button" className="ui-btn-solid" disabled={saving} onClick={handleSave}>
              {saving ? 'A salvar...' : 'Salvar Expedição'}
            </button>
          ) : (
            <button type="button" className="ui-btn-solid" onClick={goToNextTab}>
              Próximo
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function TagListEditor({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState('');

  function addTag() {
    const v = draft.trim();
    if (!v || values.includes(v)) {
      setDraft('');
      return;
    }
    onChange([...values, v]);
    setDraft('');
  }

  return (
    <div className="ui-field">
      <label>{label}</label>
      <div className="ui-tag-input-row">
        <input
          type="text"
          placeholder={placeholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTag();
            }
          }}
        />
        <button type="button" className="ui-btn-ghost" onClick={addTag}>
          Adicionar
        </button>
      </div>
      {values.length > 0 && (
        <div className="ui-tag-list">
          {values.map((v) => (
            <span className="ui-tag" key={v}>
              {v}
              <button type="button" onClick={() => onChange(values.filter((item) => item !== v))}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ListEditor({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}) {
  function updateAt(i: number, value: string) {
    const next = [...values];
    next[i] = value;
    onChange(next);
  }

  function removeAt(i: number) {
    onChange(values.filter((_, idx) => idx !== i));
  }

  return (
    <div className="ui-field">
      <label>{label}</label>
      {values.map((v, i) => (
        <div className="ui-list-editor-row" key={i}>
          <input type="text" value={v} placeholder={placeholder} onChange={(e) => updateAt(i, e.target.value)} />
          <button type="button" className="ui-icon-btn danger" onClick={() => removeAt(i)} title="Remover">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 6h18" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            </svg>
          </button>
        </div>
      ))}
      <button type="button" className="ui-btn-ghost" onClick={() => onChange([...values, ''])}>
        + Adicionar item
      </button>
    </div>
  );
}

function RoteiroEditor({
  items,
  setItems,
  onMarkDeleted,
}: {
  items: RoteiroDraftItem[];
  setItems: React.Dispatch<React.SetStateAction<RoteiroDraftItem[]>>;
  onMarkDeleted: (ids: string[]) => void;
}) {
  const [expandedDias, setExpandedDias] = useState<Set<number>>(new Set());
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [dayForm, setDayForm] = useState<{dia: string, titulo: string, descricao: string, imagens: string[], pendingImageFile: File | null}>({ 
    dia: '', titulo: '', descricao: '', imagens: [], pendingImageFile: null 
  });
  
  const [modalError, setModalError] = useState('');

  const diasOrdenados = useMemo(() => {
    return [...items].sort((a, b) => a.dia - b.dia);
  }, [items]);

  function toggleDia(dia: number) {
    setExpandedDias((prev) => {
      const next = new Set(prev);
      if (next.has(dia)) next.delete(dia);
      else next.add(dia);
      return next;
    });
  }

  function openAddModal() {
    const proximoDia = diasOrdenados.length > 0 ? Math.max(...diasOrdenados.map((d) => d.dia)) + 1 : 1;
    setEditingId(null);
    setDayForm({ dia: String(proximoDia), titulo: '', descricao: '', imagens: [], pendingImageFile: null });
    setModalError('');
    setModalOpen(true);
  }

  function openEditModal(item: RoteiroDraftItem) {
    setEditingId(item.localId);
    setDayForm({ 
      dia: String(item.dia), 
      titulo: item.titulo, 
      descricao: item.descricao, 
      imagens: item.imagens || [], 
      pendingImageFile: item.pendingImageFile || null 
    });
    setModalError('');
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
  }

  async function handleImageSelection(e: React.ChangeEvent<HTMLInputElement>) {
    const originalFile = e.target.files?.[0];
    if (!originalFile) return;
    setModalError('');

    const options = {
      maxSizeMB: 0.3,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: "image/webp"
    };

    try {
      const compressedBlob = await imageCompression(originalFile, options);
      const nomeSemExtensao = originalFile.name.replace(/\.[^/.]+$/, "");
      const webpFile = new File([compressedBlob], `${nomeSemExtensao}.webp`, {
        type: "image/webp",
      });

      const previewUrl = URL.createObjectURL(webpFile);
      
      setDayForm(prev => ({ 
        ...prev, 
        imagens: [previewUrl],
        pendingImageFile: webpFile
      }));
    } catch (err) {
      console.error("Erro na compressão", err);
      setModalError('Erro ao comprimir imagem do roteiro.');
    }
  }

  function submitModal(e: React.MouseEvent | React.FormEvent) {
    e.preventDefault();
    setModalError('');
    
    const diaNum = Number(dayForm.dia);
    if (!diaNum || diaNum < 1) {
      setModalError('Informe um dia válido (1, 2, 3...).');
      return;
    }
    if (!dayForm.titulo.trim()) {
      setModalError('O título do dia é obrigatório.');
      return;
    }

    if (editingId) {
      setItems((prev) =>
        prev.map((i) =>
          i.localId === editingId
            ? { ...i, dia: diaNum, titulo: dayForm.titulo.trim(), descricao: dayForm.descricao.trim(), imagens: dayForm.imagens, pendingImageFile: dayForm.pendingImageFile }
            : i
        )
      );
    } else {
      setItems((prev) => [
        ...prev,
        { localId: uid(), dia: diaNum, titulo: dayForm.titulo.trim(), descricao: dayForm.descricao.trim(), imagens: dayForm.imagens, pendingImageFile: dayForm.pendingImageFile },
      ]);
      setExpandedDias((prev) => new Set(prev).add(diaNum));
    }
    closeModal();
  }

  function handleDelete(item: RoteiroDraftItem) {
    const confirmado = window.confirm(`Remover o Dia ${item.dia} do roteiro?`);
    if (!confirmado) return;

    if (item.id) onMarkDeleted([item.id]);
    setItems((prev) => prev.filter((i) => i.localId !== item.localId));
  }

  return (
    <div>
      <div className="ui-page-header" style={{ marginBottom: 8 }}>
        <p className="ui-page-subtitle" style={{ margin: 0 }}>
          Cadastre o cronograma e os acontecimentos de cada dia da expedição.
        </p>
        <button type="button" className="ui-btn-solid" onClick={openAddModal}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Adicionar Dia
        </button>
      </div>

      <p className="ui-hint" style={{ marginBottom: 20 }}>
        Os dias adicionados ficam pendentes até clicar em Salvar Expedição, no final do formulário.
      </p>

      {diasOrdenados.length === 0 && (
        <div className="ui-empty">
          <p>Nenhum dia de roteiro registado ainda.</p>
          <button type="button" className="ui-btn-solid" onClick={openAddModal}>
            Adicionar primeiro dia
          </button>
        </div>
      )}

      {diasOrdenados.map((item) => {
        const isOpen = expandedDias.has(item.dia);
        return (
          <div className="ui-accordion" key={item.localId}>
            <div className="ui-accordion-header" onClick={() => toggleDia(item.dia)}>
              <div className="ui-accordion-header-left">
                <svg
                  className={`ui-accordion-chevron${isOpen ? ' open' : ''}`}
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="m9 6 6 6-6 6" />
                </svg>
                <p className="ui-accordion-title">Dia {item.dia} - {item.titulo}</p>
              </div>
              
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  className="ui-icon-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditModal(item);
                  }}
                  title="Editar Dia"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="ui-icon-btn danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item);
                  }}
                  title="Remover Dia"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18" />
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  </svg>
                </button>
              </div>
            </div>

            {isOpen && (
              <div className="ui-accordion-body" style={{ lineHeight: '1.6', fontSize: '14.5px', color: 'var(--ink)' }}>
                {item.descricao ? (
                   <div 
                     className="ui-formatted-text" 
                     dangerouslySetInnerHTML={formatarEstiloWhatsApp(item.descricao)} 
                   />
                ) : (
                  <em style={{ opacity: 0.5 }}>Nenhuma descrição informada.</em>
                )}
                
                {/* Exibição simples da foto no resumo do accordion caso ela exista */}
                {item.imagens && item.imagens.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <img 
                      src={item.imagens[0]} 
                      alt={`Imagem do dia ${item.dia}`} 
                      style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--beje-claro)' }} 
                    />
                    {item.pendingImageFile && (
                      <span className="ui-photo-pending-badge" style={{ position: 'relative', display: 'inline-block', top: '-10px', left: '10px' }}>Pendente</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {modalOpen && (
        <div className="ui-modal-overlay" onClick={closeModal}>
          <div className="ui-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="ui-modal-header">
              <h2 className="ui-modal-title">{editingId ? 'Editar Dia' : 'Adicionar Dia'}</h2>
              <button type="button" className="ui-modal-close" onClick={closeModal}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
            
            <div>
              {modalError && <div className="ui-form-error">{modalError}</div>}
              
              <div className="ui-form-row">
                <div className="ui-field" style={{ maxWidth: 110 }}>
                  <label htmlFor="dayNumber">Dia</label>
                  <input
                    id="dayNumber"
                    type="number"
                    min={1}
                    step={1}
                    value={dayForm.dia}
                    onChange={(e) => setDayForm(f => ({...f, dia: e.target.value}))}
                    required
                  />
                </div>
                <div className="ui-field" style={{ flex: 1 }}>
                  <label htmlFor="dayTitle">Título do Dia</label>
                  <input
                    id="dayTitle"
                    type="text"
                    placeholder="Ex: Chegada em San Pedro de Atacama"
                    value={dayForm.titulo}
                    onChange={(e) => setDayForm(f => ({...f, titulo: e.target.value}))}
                    required
                  />
                </div>
              </div>

              <div className="ui-field">
                <label htmlFor="dayDesc">Descrição Completa</label>
                <textarea
                  id="dayDesc"
                  placeholder="Descreva o que vai acontecer neste dia...&#10;Use *texto* para negrito, _texto_ para itálico e ~texto~ para riscado."
                  value={dayForm.descricao}
                  onChange={(e) => setDayForm(f => ({...f, descricao: e.target.value}))}
                  style={{ minHeight: 180, lineHeight: 1.5 }}
                />
                <span className="ui-hint" style={{ marginTop: '4px' }}>
                  <strong>Dica de formatação:</strong> Igual ao WhatsApp! Envolva a palavra em <strong>*asterisco*</strong> para negrito, <i>_underline_</i> para itálico ou <del>~til~</del> para riscado.
                </span>
              </div>

              <div className="ui-field" style={{ marginTop: '16px' }}>
                <label>Imagem do Dia (Opcional)</label>
                <label className="ui-file-upload" style={{ marginTop: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 16V4" />
                    <path d="m7 9 5-5 5 5" />
                    <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
                  </svg>
                  Selecionar Foto
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImageSelection}
                  />
                </label>

                {dayForm.imagens && dayForm.imagens.length > 0 && (
                  <div style={{ marginTop: '12px', padding: '12px', border: '1px solid var(--beje-claro)', borderRadius: '8px', display: 'inline-block' }}>
                    <img 
                      src={dayForm.imagens[0]} 
                      alt="Preview" 
                      style={{ width: '200px', height: '120px', objectFit: 'cover', borderRadius: '4px', display: 'block' }} 
                    />
                    <button 
                      type="button"
                      onClick={() => setDayForm(prev => ({ ...prev, imagens: [], pendingImageFile: null }))}
                      style={{ marginTop: '12px', color: '#be123c', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
                    >
                      Remover Imagem
                    </button>
                  </div>
                )}
              </div>

              <div className="ui-modal-footer" style={{ marginTop: '24px' }}>
                <button type="button" className="ui-btn-ghost" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="button" className="ui-btn-solid" onClick={submitModal}>
                  {editingId ? 'Concluir' : 'Adicionar Dia'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}