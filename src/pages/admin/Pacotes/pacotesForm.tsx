import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/services/supabase';
import type { Pacote } from '@/types';
import '../admin-theme.css';

type Tab = 'geral' | 'valores';

const EMPTY_FORM = {
  nome: '',
  expedicao_id: '',
  data_inicio: '',
  data_fim: '',
  vagas: 0,
  preco_duplo: 0,
  preco_single: 0,
  status: 'Ativo',
  desconto_percentual: 0,
  promocao_inicio: '',
  promocao_fim: '',
};

// Função para formatar número em moeda BRL (ex: 5990 -> "5.990,00")
function formatarParaMoeda(valor: number): string {
  if (!valor || isNaN(valor)) return '';
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Função para converter string formatada de volta para número puro (ex: "5.990,50" -> 5990.5)
function moedaParaNumero(valorStr: string): number {
  const apenasNumeros = valorStr.replace(/\D/g, '');
  if (!apenasNumeros) return 0;
  return Number(apenasNumeros) / 100;
}

export function PacoteForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id;

  const [form, setForm] = useState(EMPTY_FORM);
  const [expedicoes, setExpedicoes] = useState<{ id: string; nome: string }[]>([]);
  const [vagasOcupadas, setVagasOcupadas] = useState(0); 
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tab, setTab] = useState<Tab>('geral');
  const [fieldErrors, setFieldErrors] = useState<{ nome?: boolean; expedicao_id?: boolean; data_inicio?: boolean; data_fim?: boolean; preco_duplo?: boolean }>({});

  const dataHoje = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchInitialData();
  }, [id]);

  async function fetchInitialData() {
    setLoading(true);
    setError('');

    const { data: expData, error: expError } = await supabase
      .from('expedicoes')
      .select('id, nome')
      .order('nome');

    if (expError) {
      setError('Erro ao carregar lista de expedições.');
      setLoading(false);
      return;
    }
    setExpedicoes(expData ?? []);

    if (!isNew && id) {
      const { data: pacoteData, error: pacoteError } = await supabase
        .from('pacotes')
        .select('*')
        .eq('id', id)
        .single();

      if (pacoteError || !pacoteData) {
        setError('Pacote não encontrado.');
      } else {
        const p = pacoteData as Pacote;
        setForm({
          nome: p.nome || '',
          expedicao_id: p.expedicao_id || '',
          data_inicio: p.data_inicio || '',
          data_fim: p.data_fim || '',
          vagas: p.vagas || 0,
          preco_duplo: p.preco_duplo || 0,
          preco_single: p.preco_single || 0,
          status: p.status || 'Ativo',
          desconto_percentual: p.desconto_percentual || 0,
          promocao_inicio: p.promocao_inicio || '',
          promocao_fim: p.promocao_fim || '',
        });
        setVagasOcupadas(p.vagas_ocupadas || 0);
      }
    }
    
    setLoading(false);
  }

  function updateField<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validateGeral(): boolean {
    const errs: typeof fieldErrors = {};
    let msgErro = 'Preencha os campos obrigatórios na aba Geral.';

    if (!form.nome.trim()) errs.nome = true;
    if (!form.expedicao_id) errs.expedicao_id = true;
    if (!form.data_inicio) errs.data_inicio = true;
    if (!form.data_fim) errs.data_fim = true;

    if (form.data_inicio && form.data_inicio < dataHoje) {
      errs.data_inicio = true;
      msgErro = 'A data de início não pode ser anterior a hoje.';
    } else if (form.data_inicio && form.data_fim && form.data_fim <= form.data_inicio) {
      errs.data_fim = true;
      msgErro = 'A data de fim deve ser posterior à data de início.';
    }

    setFieldErrors(errs);
    
    if (Object.keys(errs).length > 0) {
      setError(msgErro);
      return false;
    }
    return true;
  }

  function validateValores(): boolean {
    const errs: typeof fieldErrors = {};
    if (form.preco_duplo <= 0) errs.preco_duplo = true;
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave(e?: React.FormEvent | React.MouseEvent) {
    if (e) e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateGeral()) {
      setTab('geral');
      return;
    }
    if (!validateValores()) {
      setTab('valores');
      setError('O Preço Duplo é obrigatório e deve ser maior que zero.');
      return;
    }

    setSaving(true);

    const payload = {
      nome: form.nome.trim(),
      expedicao_id: form.expedicao_id,
      data_inicio: form.data_inicio,
      data_fim: form.data_fim,
      vagas: Number(form.vagas),
      preco_duplo: Number(form.preco_duplo),
      preco_single: form.preco_single ? Number(form.preco_single) : null,
      status: form.status,
      desconto_percentual: form.desconto_percentual ? Number(form.desconto_percentual) : 0,
      promocao_inicio: form.promocao_inicio || null,
      promocao_fim: form.promocao_fim || null,
    };

    if (isNew) {
      const { data, error: insertError } = await supabase
        .from('pacotes')
        .insert([payload])
        .select()
        .single();

      if (insertError || !data) {
        setSaving(false);
        setError('Erro ao criar o pacote. Verifique os dados.');
        return;
      }
      setSuccess('Pacote criado com sucesso!');
      navigate(`/admin/pacotes/${data.id}`, { replace: true });
    } else {
      const { error: updateError } = await supabase
        .from('pacotes')
        .update(payload)
        .eq('id', id);

      if (updateError) {
        setSaving(false);
        setError('Erro ao atualizar o pacote.');
        return;
      }
      setSuccess('Alterações salvas com sucesso.');
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="ui-page">
        <div className="ui-state">Carregando formulário...</div>
      </div>
    );
  }

  return (
    <div className="ui-page">
      <style>{`
        .ui-field input[type='date'] {
          padding: 10px 12px;
          border-radius: 5px;
          border: 1px solid var(--cream);
          background: var(--warm-white);
          font-family: inherit;
          font-size: 14px;
          color: var(--ink);
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
          width: 100%;
          box-sizing: border-box;
          color-scheme: light;
        }
        .ui-field input[type='date']:focus {
          outline: none;
          border-color: var(--sage);
          box-shadow: 0 0 0 3px rgba(151, 183, 177, 0.28);
        }
        .ui-field input[type='date']::-webkit-calendar-picker-indicator {
          cursor: pointer;
          opacity: 0.6;
          transition: opacity 0.15s ease;
        }
        .ui-field input[type='date']::-webkit-calendar-picker-indicator:hover {
          opacity: 1;
        }
      `}</style>

      <Link to="/admin/pacotes" className="ui-back">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Voltar para Pacotes
      </Link>

      <div className="ui-page-header">
        <div>
          <h1 className="ui-page-title">{isNew ? 'Novo Pacote' : form.nome || 'Editar Pacote'}</h1>
          <p className="ui-page-subtitle">
            {isNew ? 'Defina as datas e os valores para uma expedição.' : 'Atualize as vagas e os valores do pacote.'}
          </p>
        </div>
      </div>

      <div className="ui-tabs">
        <button
          type="button"
          className={`ui-tab${tab === 'geral' ? ' active' : ''}`}
          onClick={() => { setError(''); setTab('geral'); }}
        >
          Dados Gerais
        </button>
        <button
          type="button"
          className={`ui-tab${tab === 'valores' ? ' active' : ''}`}
          onClick={() => {
            if (validateGeral()) {
              setError('');
              setTab('valores');
            }
          }}
        >
          Valores e Promoções
        </button>
      </div>

      {error && <div className="ui-form-error">{error}</div>}
      {success && <div className="ui-form-success">{success}</div>}

      <form 
        onSubmit={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.preventDefault();
        }}
      >
        {tab === 'geral' && (
          <>
            <div className="ui-form-row">
              <div className={`ui-field${fieldErrors.nome ? ' has-error' : ''}`}>
                <label htmlFor="nome">Nome Interno <span className="ui-required">*</span></label>
                <input
                  id="nome"
                  type="text"
                  placeholder="Ex: Turquia Clássica - Réveillon 2027"
                  value={form.nome}
                  onChange={(e) => {
                    updateField('nome', e.target.value);
                    if (fieldErrors.nome) setFieldErrors((f) => ({ ...f, nome: false }));
                  }}
                />
              </div>
            </div>

            <div className="ui-form-row">
              <div className={`ui-field${fieldErrors.expedicao_id ? ' has-error' : ''}`} style={{ flex: 2 }}>
                <label htmlFor="expedicao_id">Expedição Base (Destino/Roteiro) <span className="ui-required">*</span></label>
                <select
                  id="expedicao_id"
                  value={form.expedicao_id}
                  onChange={(e) => {
                    updateField('expedicao_id', e.target.value);
                    if (fieldErrors.expedicao_id) setFieldErrors((f) => ({ ...f, expedicao_id: false }));
                  }}
                  disabled={!isNew}
                >
                  <option value="">Selecione a expedição...</option>
                  {expedicoes.map((exp) => (
                    <option key={exp.id} value={exp.id}>{exp.nome}</option>
                  ))}
                </select>
              </div>
              <div className="ui-field" style={{ flex: 1 }}>
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  value={form.status}
                  onChange={(e) => updateField('status', e.target.value)}
                >
                  <option value="Ativo">Ativo (Aberto para vendas)</option>
                  <option value="Esgotado">Esgotado</option>
                  <option value="Encerrado">Encerrado (Viagem concluída)</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </div>
            </div>

            <div className="ui-form-row">
              <div className={`ui-field${fieldErrors.data_inicio ? ' has-error' : ''}`}>
                <label htmlFor="data_inicio">Data de Início <span className="ui-required">*</span></label>
                <input
                  id="data_inicio"
                  type="date"
                  min={dataHoje}
                  value={form.data_inicio}
                  onChange={(e) => {
                    updateField('data_inicio', e.target.value);
                    if (fieldErrors.data_inicio) setFieldErrors((f) => ({ ...f, data_inicio: false }));
                  }}
                />
              </div>
              <div className={`ui-field${fieldErrors.data_fim ? ' has-error' : ''}`}>
                <label htmlFor="data_fim">Data de Fim <span className="ui-required">*</span></label>
                <input
                  id="data_fim"
                  type="date"
                  min={form.data_inicio || dataHoje}
                  value={form.data_fim}
                  onChange={(e) => {
                    updateField('data_fim', e.target.value);
                    if (fieldErrors.data_fim) setFieldErrors((f) => ({ ...f, data_fim: false }));
                  }}
                />
              </div>
            </div>

            <div className="ui-form-row">
              <div className="ui-field">
                <label htmlFor="vagas">Vagas Totais</label>
                <input
                  id="vagas"
                  type="number"
                  min="0"
                  value={form.vagas}
                  onChange={(e) => updateField('vagas', Number(e.target.value))}
                />
              </div>
              <div className="ui-field">
                <label htmlFor="vagas_ocupadas">Vagas Ocupadas</label>
                <input
                  id="vagas_ocupadas"
                  type="number"
                  value={vagasOcupadas}
                  disabled
                  title="Atualizado automaticamente ao confirmar reservas"
                  style={{ 
                    backgroundColor: 'rgba(151, 183, 177, 0.15)', 
                    borderColor: 'transparent',
                    color: 'var(--forest-deep)',
                    fontWeight: '600',
                    cursor: 'not-allowed'
                  }}
                />
                <span className="ui-hint">Contabilizado automaticamente pelo sistema de Reservas.</span>
              </div>
            </div>
          </>
        )}

        {tab === 'valores' && (
          <>
            <div className="ui-form-row">
              <div className={`ui-field${fieldErrors.preco_duplo ? ' has-error' : ''}`}>
                <label htmlFor="preco_duplo">Preço Quarto Duplo (R$) <span className="ui-required">*</span></label>
                <input
                  id="preco_duplo"
                  type="text"
                  placeholder="0,00"
                  value={form.preco_duplo ? formatarParaMoeda(form.preco_duplo) : ''}
                  onChange={(e) => {
                    const numero = moedaParaNumero(e.target.value);
                    updateField('preco_duplo', numero);
                    if (fieldErrors.preco_duplo) setFieldErrors((f) => ({ ...f, preco_duplo: false }));
                  }}
                />
              </div>
              <div className="ui-field">
                <label htmlFor="preco_single">Preço Quarto Single (R$)</label>
                <input
                  id="preco_single"
                  type="text"
                  placeholder="0,00"
                  value={form.preco_single ? formatarParaMoeda(form.preco_single) : ''}
                  onChange={(e) => {
                    const numero = moedaParaNumero(e.target.value);
                    updateField('preco_single', numero);
                  }}
                />
              </div>
            </div>

            <h3 style={{ fontFamily: 'var(--heading)', fontSize: 16, color: 'var(--forest-deep)', margin: '10px 0 16px', borderTop: '1px solid var(--cream)', paddingTop: 16 }}>
              Regras de Promoção (Opcional)
            </h3>
            
            <div className="ui-form-row">
              <div className="ui-field" style={{ flex: 1 }}>
                <label htmlFor="desconto_percentual">Desconto (%)</label>
                <input
                  id="desconto_percentual"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="Ex: 10"
                  value={form.desconto_percentual || ''}
                  onChange={(e) => updateField('desconto_percentual', Number(e.target.value))}
                />
              </div>
              <div className="ui-field" style={{ flex: 2 }}>
                <label htmlFor="promocao_inicio">Válido De</label>
                <input
                  id="promocao_inicio"
                  type="date"
                  value={form.promocao_inicio}
                  onChange={(e) => updateField('promocao_inicio', e.target.value)}
                />
              </div>
              <div className="ui-field" style={{ flex: 2 }}>
                <label htmlFor="promocao_fim">Válido Até</label>
                <input
                  id="promocao_fim"
                  type="date"
                  value={form.promocao_fim}
                  onChange={(e) => updateField('promocao_fim', e.target.value)}
                />
              </div>
            </div>
          </>
        )}

        <div className="ui-step-actions">
          {tab === 'valores' ? (
            <button type="button" className="ui-btn-ghost" onClick={() => setTab('geral')} disabled={saving}>
              Voltar
            </button>
          ) : (
            <span />
          )}

          {tab === 'valores' ? (
            <button type="button" className="ui-btn-solid" disabled={saving} onClick={handleSave}>
              {saving ? 'Salvando...' : 'Salvar Pacote'}
            </button>
          ) : (
            <button type="button" className="ui-btn-solid" onClick={() => {
              if (validateGeral()) setTab('valores');
            }}>
              Próximo
            </button>
          )}
        </div>
      </form>
    </div>
  );
}