import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/services/supabase';
import type { Expedicao, Roteiro } from '@/types';
import './admin-theme.css';

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

export function ExpedicaoForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === 'nova';

  const [expedicaoId, setExpedicaoId] = useState<string | null>(isNew ? null : id!);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tab, setTab] = useState<Tab>('geral');

  useEffect(() => {
    if (!isNew && id) fetchExpedicao(id);
  }, [id]);

  async function fetchExpedicao(expId: string) {
    setLoading(true);
    setError('');

    const { data, error } = await supabase.from('expedicoes').select('*').eq('id', expId).single();

    if (error || !data) {
      setError('Não foi possível carregar essa expedição.');
    } else {
      const exp = data as Expedicao;
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
    }
    setLoading(false);
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.nome.trim()) {
      setError('Informe o nome da expedição.');
      setTab('geral');
      return;
    }
    if (!form.pais.trim()) {
      setError('Informe o país de destino.');
      setTab('geral');
      return;
    }

    setSaving(true);

    const payload = {
      nome: form.nome.trim(),
      pais: form.pais.trim(),
      tipo_destino: form.tipo_destino.trim(),
      descricao: form.descricao.trim(),
      categorias: form.categorias,
      fotos: form.fotos,
      incluso: form.incluso,
      nao_incluso: form.nao_incluso,
      observacoes: form.observacoes,
    };

    if (isNew && !expedicaoId) {
      const { data, error } = await supabase.from('expedicoes').insert(payload).select().single();
      setSaving(false);

      if (error || !data) {
        setError('Não foi possível criar a expedição. Tente novamente.');
        return;
      }

      setExpedicaoId(data.id);
      setSuccess('Expedição criada! Agora você já pode cadastrar o roteiro.');
      navigate(`/admin/expedicoes/${data.id}`, { replace: true });
      setTab('roteiro');
      return;
    }

    const { error } = await supabase.from('expedicoes').update(payload).eq('id', expedicaoId);
    setSaving(false);

    if (error) {
      setError('Não foi possível salvar as alterações.');
      return;
    }
    setSuccess('Alterações salvas.');
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'geral', label: 'Dados Gerais' },
    { key: 'fotos', label: 'Fotos' },
    { key: 'inclusoes', label: 'Inclusões & Observações' },
    { key: 'roteiro', label: 'Roteiro' },
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
            onClick={() => setTab(t.key)}
            disabled={t.key === 'roteiro' && !expedicaoId}
            title={t.key === 'roteiro' && !expedicaoId ? 'Salve a expedição primeiro' : undefined}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <div className="ui-form-error">{error}</div>}
      {success && <div className="ui-form-success">{success}</div>}

      {tab !== 'roteiro' && (
        <form onSubmit={handleSave}>
          {tab === 'geral' && (
            <>
              <div className="ui-form-row">
                <div className="ui-field">
                  <label htmlFor="nome">Nome da Expedição</label>
                  <input
                    id="nome"
                    type="text"
                    placeholder="Ex: Travessia Patagônia"
                    value={form.nome}
                    onChange={(e) => updateField('nome', e.target.value)}
                  />
                </div>
              </div>

              <div className="ui-form-row">
                <div className="ui-field">
                  <label htmlFor="pais">País</label>
                  <input
                    id="pais"
                    type="text"
                    placeholder="Ex: Argentina"
                    value={form.pais}
                    onChange={(e) => updateField('pais', e.target.value)}
                  />
                </div>
                <div className="ui-field">
                  <label htmlFor="tipo_destino">Tipo de Destino</label>
                  <input
                    id="tipo_destino"
                    type="text"
                    placeholder="Ex: Montanha, Praia, Cultural..."
                    value={form.tipo_destino}
                    onChange={(e) => updateField('tipo_destino', e.target.value)}
                  />
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
              <p className="ui-hint">Cole a URL de uma imagem já hospedada e pressione Enter para adicionar.</p>
              <UrlListEditor values={form.fotos} onChange={(v) => updateField('fotos', v)} placeholder="https://..." />
              {form.fotos.length > 0 && (
                <div className="ui-photo-grid">
                  {form.fotos.map((url, i) => (
                    <div className="ui-photo-thumb" key={`${url}-${i}`}>
                      <img src={url} alt={`Foto ${i + 1}`} />
                      <button
                        type="button"
                        className="ui-photo-remove"
                        onClick={() => updateField('fotos', form.fotos.filter((_, idx) => idx !== i))}
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

          <div className="ui-save-bar">
            <button type="submit" className="ui-btn-solid" disabled={saving}>
              {saving ? 'Salvando...' : isNew ? 'Criar Expedição' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      )}

      {tab === 'roteiro' && expedicaoId && <RoteiroSection expedicaoId={expedicaoId} />}
    </div>
  );
}

/* ============================================================
   Editor de lista de tags (chips) — categorias
   ============================================================ */
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

/* ============================================================
   Editor de lista simples em linhas (incluso, não incluso, observações)
   ============================================================ */
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

/* ============================================================
   Editor de lista de URLs (fotos) — adiciona via Enter
   ============================================================ */
function UrlListEditor({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState('');

  function addUrl() {
    const v = draft.trim();
    if (!v) return;
    onChange([...values, v]);
    setDraft('');
  }

  return (
    <div className="ui-tag-input-row">
      <input
        type="url"
        placeholder={placeholder}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            addUrl();
          }
        }}
      />
      <button type="button" className="ui-btn-ghost" onClick={addUrl}>
        Adicionar
      </button>
    </div>
  );
}

/* ============================================================
   Seção de Roteiro — embutida na aba, ligada à expedição atual
   ============================================================ */
function RoteiroSection({ expedicaoId }: { expedicaoId: string }) {
  const [roteiros, setRoteiros] = useState<Roteiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Roteiro | null>(null);
  const [form, setForm] = useState({ dia: '', titulo: '', descricao: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRoteiros();
  }, [expedicaoId]);

  async function fetchRoteiros() {
    setLoading(true);
    setListError('');

    const { data, error } = await supabase
      .from('roteiros')
      .select('*')
      .eq('expedicao_id', expedicaoId)
      .order('dia', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      setListError('Não foi possível carregar o roteiro.');
    } else {
      setRoteiros(data ?? []);
    }
    setLoading(false);
  }

  const dias = useMemo(() => {
    const grupos = new Map<number, Roteiro[]>();
    for (const item of roteiros) {
      const lista = grupos.get(item.dia) ?? [];
      lista.push(item);
      grupos.set(item.dia, lista);
    }
    return Array.from(grupos.entries())
      .sort(([a], [b]) => a - b)
      .map(([dia, itens]) => ({ dia, itens }));
  }, [roteiros]);

  function openCreateModal() {
    setEditing(null);
    setForm({ dia: '', titulo: '', descricao: '' });
    setFormError('');
    setModalOpen(true);
  }

  function openEditModal(roteiro: Roteiro) {
    setEditing(roteiro);
    setForm({ dia: String(roteiro.dia), titulo: roteiro.titulo, descricao: roteiro.descricao });
    setFormError('');
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    const dia = Number(form.dia);
    if (!dia || dia < 1) {
      setFormError('Informe um dia válido (1, 2, 3...).');
      return;
    }
    if (!form.titulo.trim()) {
      setFormError('Informe um título para a atividade.');
      return;
    }

    setSaving(true);

    const payload = {
      expedicao_id: expedicaoId,
      dia,
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim(),
    };

    const { error } = editing
      ? await supabase.from('roteiros').update(payload).eq('id', editing.id)
      : await supabase.from('roteiros').insert(payload);

    if (error) {
      setFormError('Não foi possível salvar. Tente novamente.');
      setSaving(false);
      return;
    }

    setSaving(false);
    setModalOpen(false);
    fetchRoteiros();
  }

  async function handleDelete(roteiro: Roteiro) {
    const confirmado = window.confirm(`Remover a atividade "${roteiro.titulo}" do Dia ${roteiro.dia}?`);
    if (!confirmado) return;

    setDeletingId(roteiro.id);
    const { error } = await supabase.from('roteiros').delete().eq('id', roteiro.id);
    setDeletingId(null);

    if (error) {
      window.alert('Não foi possível remover essa atividade.');
      return;
    }
    setRoteiros((prev) => prev.filter((r) => r.id !== roteiro.id));
  }

  return (
    <div>
      <div className="ui-page-header" style={{ marginBottom: 20 }}>
        <p className="ui-page-subtitle" style={{ margin: 0 }}>
          Atividades de cada dia, na ordem em que acontecem.
        </p>
        <button className="ui-btn-solid" onClick={openCreateModal}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Adicionar Atividade
        </button>
      </div>

      {loading && <div className="ui-state">Carregando roteiro...</div>}
      {!loading && listError && <div className="ui-state">{listError}</div>}

      {!loading && !listError && dias.length === 0 && (
        <div className="ui-empty">
          <p>Nenhuma atividade cadastrada ainda.</p>
          <button className="ui-btn-solid" onClick={openCreateModal}>
            Cadastrar primeira atividade
          </button>
        </div>
      )}

      {!loading &&
        !listError &&
        dias.map(({ dia, itens }, index) => (
          <div className="ui-day" key={dia}>
            <div className="ui-day-marker">
              <div className="ui-day-circle">{dia}</div>
              {index < dias.length - 1 && <div className="ui-day-line" />}
            </div>
            <div className="ui-day-content">
              <div className="ui-day-label">Dia {dia}</div>
              {itens.map((item) => (
                <div className="ui-activity-card" key={item.id}>
                  <div>
                    <p className="ui-activity-title">{item.titulo}</p>
                    {item.descricao && <p className="ui-activity-desc">{item.descricao}</p>}
                  </div>
                  <div className="ui-activity-actions">
                    <button className="ui-icon-btn" onClick={() => openEditModal(item)} title="Editar">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                      </svg>
                    </button>
                    <button
                      className="ui-icon-btn danger"
                      onClick={() => handleDelete(item)}
                      disabled={deletingId === item.id}
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
            </div>
          </div>
        ))}

      {modalOpen && (
        <div className="ui-modal-overlay" onClick={closeModal}>
          <div className="ui-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ui-modal-header">
              <h2 className="ui-modal-title">{editing ? 'Editar Atividade' : 'Nova Atividade'}</h2>
              <button className="ui-modal-close" onClick={closeModal}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {formError && <div className="ui-form-error">{formError}</div>}

              <div className="ui-form-row">
                <div className="ui-field" style={{ maxWidth: 110 }}>
                  <label htmlFor="dia">Dia</label>
                  <input
                    id="dia"
                    type="number"
                    min={1}
                    step={1}
                    value={form.dia}
                    onChange={(e) => setForm((f) => ({ ...f, dia: e.target.value }))}
                    required
                  />
                </div>
                <div className="ui-field">
                  <label htmlFor="titulo">Título</label>
                  <input
                    id="titulo"
                    type="text"
                    placeholder="Ex: Trilha até a cachoeira"
                    value={form.titulo}
                    onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="ui-field">
                <label htmlFor="descricao">Descrição</label>
                <textarea
                  id="descricao"
                  placeholder="Detalhes da atividade, horários, pontos de encontro..."
                  value={form.descricao}
                  onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                />
              </div>

              <div className="ui-modal-footer">
                <button type="button" className="ui-btn-ghost" onClick={closeModal} disabled={saving}>
                  Cancelar
                </button>
                <button type="submit" className="ui-btn-solid" disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}