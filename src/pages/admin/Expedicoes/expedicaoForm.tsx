import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/services/supabase';
import type { Expedicao, Roteiro } from '@/types';
import '../admin-theme.css';

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

    const roteiros = (roteiroResult.data ?? []) as Roteiro[];
    setRoteiroItems(
      roteiros.map((r) => ({ localId: r.id, id: r.id, dia: r.dia, titulo: r.titulo, descricao: r.descricao }))
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

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setPhotoError('');

    const novas: { file: File; previewUrl: string }[] = [];
    for (const file of Array.from(files)) {
      if (!['image/png', 'image/jpeg'].includes(file.type)) {
        setPhotoError('Envie apenas imagens PNG ou JPG.');
        continue;
      }
      novas.push({ file, previewUrl: URL.createObjectURL(file) });
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
    const roteiros = (data ?? []) as Roteiro[];
    setRoteiroItems(
      roteiros.map((r) => ({ localId: r.id, id: r.id, dia: r.dia, titulo: r.titulo, descricao: r.descricao }))
    );
  }

  // A função agora aceita um evento opcional e cancela qualquer envio acidental
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

    const paraAtualizar = roteiroItems.filter((item) => item.id);
    for (const item of paraAtualizar) {
      const { error: updError } = await supabase
        .from('roteiros')
        .update({ dia: item.dia, titulo: item.titulo, descricao: item.descricao })
        .eq('id', item.id);
      if (updError) {
        setSaving(false);
        setError('Os dados foram salvos, mas houve um problema ao atualizar o roteiro.');
        return;
      }
    }

    const paraInserir = roteiroItems.filter((item) => !item.id);
    if (paraInserir.length > 0) {
      const { error: insError } = await supabase.from('roteiros').insert(
        paraInserir.map((item) => ({
          expedicao_id: currentId,
          dia: item.dia,
          titulo: item.titulo,
          descricao: item.descricao,
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
        <div className="ui-state">Carregando expedição...</div>
      </div>
    );
  }

  return (
    <div className="ui-page">
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
              ? 'Preencha os dados e salve para liberar o cadastro do roteiro.'
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

      {/* A tag <form> agora bloqueia 100% de qualquer disparo automático */}
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
                  placeholder="Ex: Travessia Patagônia"
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
              Envie imagens do computador (PNG ou JPG). Elas são enviadas de fato quando você clicar em Salvar.
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
              label="O que está incluso"
              placeholder="Ex: Café da manhã, transporte..."
              values={form.incluso}
              onChange={(v) => updateField('incluso', v)}
            />
            <ListEditor
              label="O que não está incluso"
              placeholder="Ex: Passagens aéreas, seguro viagem..."
              values={form.nao_incluso}
              onChange={(v) => updateField('nao_incluso', v)}
            />
            <ListEditor
              label="Observações"
              placeholder="Ex: Necessário preparo físico intermediário..."
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
              {saving ? 'Salvando...' : 'Salvar'}
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
  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [dayNumber, setDayNumber] = useState('');
  const [dayItemRows, setDayItemRows] = useState<{ titulo: string; descricao: string }[]>([
    { titulo: '', descricao: '' },
  ]);
  const [dayError, setDayError] = useState('');

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingLocalId, setEditingLocalId] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState({ dia: '', titulo: '', descricao: '' });
  const [itemError, setItemError] = useState('');

  const dias = useMemo(() => {
    const grupos = new Map<number, RoteiroDraftItem[]>();
    for (const item of items) {
      const lista = grupos.get(item.dia) ?? [];
      lista.push(item);
      grupos.set(item.dia, lista);
    }
    return Array.from(grupos.entries())
      .sort(([a], [b]) => a - b)
      .map(([dia, itens]) => ({ dia, itens }));
  }, [items]);

  function toggleDia(dia: number) {
    setExpandedDias((prev) => {
      const next = new Set(prev);
      if (next.has(dia)) next.delete(dia);
      else next.add(dia);
      return next;
    });
  }

  function openDayModal() {
    const proximoDia = dias.length > 0 ? Math.max(...dias.map((d) => d.dia)) + 1 : 1;
    setDayNumber(String(proximoDia));
    setDayItemRows([{ titulo: '', descricao: '' }]);
    setDayError('');
    setDayModalOpen(true);
  }
  
  function closeDayModal() {
    setDayModalOpen(false);
  }
  
  function addDayItemRow() {
    setDayItemRows((prev) => [...prev, { titulo: '', descricao: '' }]);
  }
  
  function removeDayItemRow(index: number) {
    setDayItemRows((prev) => prev.filter((_, i) => i !== index));
  }
  
  function updateDayItemRow(index: number, field: 'titulo' | 'descricao', value: string) {
    setDayItemRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  function submitDayModal(e: React.MouseEvent | React.FormEvent) {
    e.preventDefault();
    setDayError('');
    const dia = Number(dayNumber);
    if (!dia || dia < 1) {
      setDayError('Informe um dia válido (1, 2, 3...).');
      return;
    }
    const validRows = dayItemRows.filter((row) => row.titulo.trim());
    if (validRows.length === 0) {
      setDayError('Adicione pelo menos uma atividade com título.');
      return;
    }

    const novosItens: RoteiroDraftItem[] = validRows.map((row) => ({
      localId: uid(),
      dia,
      titulo: row.titulo.trim(),
      descricao: row.descricao.trim(),
    }));

    setItems((prev) => [...prev, ...novosItens]);
    setExpandedDias((prev) => new Set(prev).add(dia));
    setDayModalOpen(false);
  }

  function openAddItemModal(dia: number) {
    setEditingLocalId(null);
    setItemForm({ dia: String(dia), titulo: '', descricao: '' });
    setItemError('');
    setItemModalOpen(true);
  }

  function openEditItemModal(item: RoteiroDraftItem) {
    setEditingLocalId(item.localId);
    setItemForm({ dia: String(item.dia), titulo: item.titulo, descricao: item.descricao });
    setItemError('');
    setItemModalOpen(true);
  }

  function closeItemModal() {
    setItemModalOpen(false);
  }

  function submitItemModal(e: React.MouseEvent | React.FormEvent) {
    e.preventDefault();
    setItemError('');
    const dia = Number(itemForm.dia);
    if (!dia || dia < 1) {
      setItemError('Informe um dia válido.');
      return;
    }
    if (!itemForm.titulo.trim()) {
      setItemError('Informe um título para a atividade.');
      return;
    }

    if (editingLocalId) {
      setItems((prev) =>
        prev.map((item) =>
          item.localId === editingLocalId
            ? { ...item, dia, titulo: itemForm.titulo.trim(), descricao: itemForm.descricao.trim() }
            : item
        )
      );
    } else {
      setItems((prev) => [
        ...prev,
        { localId: uid(), dia, titulo: itemForm.titulo.trim(), descricao: itemForm.descricao.trim() },
      ]);
    }
    setItemModalOpen(false);
  }

  function handleDeleteItem(item: RoteiroDraftItem) {
    const confirmado = window.confirm(`Remover a atividade "${item.titulo}" do Dia ${item.dia}?`);
    if (!confirmado) return;
    if (item.id) onMarkDeleted([item.id]);
    setItems((prev) => prev.filter((i) => i.localId !== item.localId));
  }

  function handleDeleteDay(dia: number) {
    const confirmado = window.confirm(`Remover o Dia ${dia} e todas as suas atividades?`);
    if (!confirmado) return;

    const idsExistentes = items.filter((i) => i.dia === dia && i.id).map((i) => i.id!);
    if (idsExistentes.length > 0) onMarkDeleted(idsExistentes);

    setItems((prev) => prev.filter((i) => i.dia !== dia));
  }

  return (
    <div>
      <div className="ui-page-header" style={{ marginBottom: 8 }}>
        <p className="ui-page-subtitle" style={{ margin: 0 }}>
          Organize as atividades de cada dia da expedição.
        </p>
        <button type="button" className="ui-btn-solid" onClick={openDayModal}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Adicionar Dia
        </button>
      </div>

      <p className="ui-hint" style={{ marginBottom: 20 }}>
        As atividades ficam pendentes até você clicar em Salvar, no final do formulário.
      </p>

      {dias.length === 0 && (
        <div className="ui-empty">
          <p>Nenhum dia adicionado ainda.</p>
          <button type="button" className="ui-btn-solid" onClick={openDayModal}>
            Adicionar primeiro dia
          </button>
        </div>
      )}

      {dias.map(({ dia, itens }) => {
        const isOpen = expandedDias.has(dia);
        return (
          <div className="ui-accordion" key={dia}>
            <div className="ui-accordion-header" onClick={() => toggleDia(dia)}>
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
                <p className="ui-accordion-title">Dia {dia}</p>
                <span className="ui-accordion-count">
                  {itens.length} {itens.length === 1 ? 'atividade' : 'atividades'}
                </span>
              </div>
              <button
                type="button"
                className="ui-icon-btn danger"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteDay(dia);
                }}
                title="Remover dia"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M3 6h18" />
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                </svg>
              </button>
            </div>
            {isOpen && (
              <div className="ui-accordion-body">
                {itens.map((item) => (
                  <div className="ui-activity-card" key={item.localId}>
                    <div>
                      <p className="ui-activity-title">{item.titulo}</p>
                      {item.descricao && <p className="ui-activity-desc">{item.descricao}</p>}
                    </div>
                    <div className="ui-activity-actions">
                      <button
                        type="button"
                        className="ui-icon-btn"
                        onClick={() => openEditItemModal(item)}
                        title="Editar"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="ui-icon-btn danger"
                        onClick={() => handleDeleteItem(item)}
                        title="Remover"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M3 6h18" />
                          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
                <button type="button" className="ui-btn-ghost" onClick={() => openAddItemModal(dia)}>
                  + Adicionar item
                </button>
              </div>
            )}
          </div>
        );
      })}

      {dayModalOpen && (
        <div className="ui-modal-overlay" onClick={closeDayModal}>
          <div className="ui-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="ui-modal-header">
              <h2 className="ui-modal-title">Adicionar Dia</h2>
              <button type="button" className="ui-modal-close" onClick={closeDayModal}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
            
            <div>
              {dayError && <div className="ui-form-error">{dayError}</div>}
              <div className="ui-field" style={{ maxWidth: 110 }}>
                <label htmlFor="dayNumber">Dia</label>
                <input
                  id="dayNumber"
                  type="number"
                  min={1}
                  step={1}
                  value={dayNumber}
                  onChange={(e) => setDayNumber(e.target.value)}
                  required
                />
              </div>

              <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--forest-deep)' }}>
                Atividades do dia
              </label>
              
              {dayItemRows.map((row, i) => (
                <div className="ui-day-item-row" key={i}>
                  <div className="ui-day-item-fields">
                    <div className="ui-field" style={{ marginBottom: 0 }}>
                      <input
                        type="text"
                        placeholder="Título da atividade"
                        value={row.titulo}
                        onChange={(e) => updateDayItemRow(i, 'titulo', e.target.value)}
                      />
                    </div>
                    <div className="ui-field" style={{ marginBottom: 0 }}>
                      <textarea
                        placeholder="Descrição (opcional)"
                        value={row.descricao}
                        onChange={(e) => updateDayItemRow(i, 'descricao', e.target.value)}
                        style={{ minHeight: 60 }}
                      />
                    </div>
                  </div>
                  {dayItemRows.length > 1 && (
                    <button
                      type="button"
                      className="ui-icon-btn danger"
                      onClick={() => removeDayItemRow(i)}
                      title="Remover atividade"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M3 6h18" />
                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              
              <button type="button" className="ui-btn-ghost" onClick={addDayItemRow} style={{ marginBottom: 20 }}>
                + Adicionar outra atividade
              </button>

              <div className="ui-modal-footer">
                <button type="button" className="ui-btn-ghost" onClick={closeDayModal}>
                  Cancelar
                </button>
                <button type="button" className="ui-btn-solid" onClick={submitDayModal}>
                  Adicionar Dia
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {itemModalOpen && (
        <div className="ui-modal-overlay" onClick={closeItemModal}>
          <div className="ui-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ui-modal-header">
              <h2 className="ui-modal-title">{editingLocalId ? 'Editar Atividade' : 'Nova Atividade'}</h2>
              <button type="button" className="ui-modal-close" onClick={closeItemModal}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
            
            <div>
              {itemError && <div className="ui-form-error">{itemError}</div>}
              <div className="ui-form-row">
                <div className="ui-field" style={{ maxWidth: 110 }}>
                  <label htmlFor="itemDia">Dia</label>
                  <input
                    id="itemDia"
                    type="number"
                    min={1}
                    step={1}
                    value={itemForm.dia}
                    onChange={(e) => setItemForm((f) => ({ ...f, dia: e.target.value }))}
                    required
                  />
                </div>
                <div className="ui-field">
                  <label htmlFor="itemTitulo">Título</label>
                  <input
                    id="itemTitulo"
                    type="text"
                    placeholder="Ex: Trilha até a cachoeira"
                    value={itemForm.titulo}
                    onChange={(e) => setItemForm((f) => ({ ...f, titulo: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="ui-field">
                <label htmlFor="itemDescricao">Descrição</label>
                <textarea
                  id="itemDescricao"
                  placeholder="Detalhes da atividade, horários, pontos de encontro..."
                  value={itemForm.descricao}
                  onChange={(e) => setItemForm((f) => ({ ...f, descricao: e.target.value }))}
                />
              </div>

              <div className="ui-modal-footer">
                <button type="button" className="ui-btn-ghost" onClick={closeItemModal}>
                  Cancelar
                </button>
                <button type="button" className="ui-btn-solid" onClick={submitItemModal}>
                  {editingLocalId ? 'Atualizar' : 'Adicionar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}