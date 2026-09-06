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
  lote_atual: 1,
  oculto: false,
};

function formatarParaMoeda(valor: number): string {
  if (!valor || isNaN(valor)) return '';
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

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
  
  const [lotes, setLotes] = useState([
    { lote_numero: 1, preco_duplo: 0, preco_single: 0, vagas_gatilho: 0 }
  ]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tab, setTab] = useState<Tab>('geral');
  const [fieldErrors, setFieldErrors] = useState<{ nome?: boolean; expedicao_id?: boolean; data_inicio?: boolean; data_fim?: boolean }>({});
  
  const dataHoje = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchInitialData();
  }, [id]);

  async function fetchInitialData() {
    setLoading(true);
    setError('');

    const { data: expData } = await supabase.from('expedicoes').select('id, nome').order('nome');
    if (expData) setExpedicoes(expData);

    if (!isNew && id) {
      const { data: pacoteData } = await supabase.from('pacotes').select('*').eq('id', id).single();
      
      if (pacoteData) {
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
          lote_atual: p.lote_atual || 1,
          oculto: p.oculto !== false, // Garante que seja true caso seja undefined no banco
        });
        setVagasOcupadas(p.vagas_ocupadas || 0);

        const { data: lotesData } = await supabase.from('pacote_lotes').select('*').eq('pacote_id', id).order('lote_numero');
        if (lotesData && lotesData.length > 0) {
          setLotes(lotesData);
        } else {
          setLotes([{ lote_numero: 1, preco_duplo: p.preco_duplo || 0, preco_single: p.preco_single || 0, vagas_gatilho: 0 }]);
        }
      } else {
        setError('Pacote não encontrado.');
      }
    }
    setLoading(false);
  }

  function updateField<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateLote(index: number, field: string, value: number) {
    const newLotes = [...lotes];
    newLotes[index] = { ...newLotes[index], [field]: value };
    setLotes(newLotes);
  }

  function adicionarLote() {
    const proxNum = lotes.length > 0 ? Math.max(...lotes.map(l => l.lote_numero)) + 1 : 1;
    setLotes([...lotes, { lote_numero: proxNum, preco_duplo: 0, preco_single: 0, vagas_gatilho: 0 }]);
  }

  function removerLote(index: number) {
    const newLotes = lotes.filter((_, i) => i !== index);
    const normalized = newLotes.map((l, i) => ({ ...l, lote_numero: i + 1 }));
    setLotes(normalized);
    if (form.lote_atual > normalized.length) updateField('lote_atual', normalized.length);
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
    let valid = true;
    lotes.forEach(l => { if (l.preco_duplo <= 0) valid = false; });
    if (!valid) setError('O Preço Duplo de todos os lotes deve ser maior que zero.');
    return valid;
  }

  async function handleSave() {
    setError('');
    setSuccess('');
    
    if (!validateGeral()) { setTab('geral'); return; }
    if (!validateValores()) { setTab('valores'); return; }
    
    setSaving(true);

    const loteAtivo = lotes.find(l => l.lote_numero === form.lote_atual) || lotes[0];

    const payload = {
      nome: form.nome.trim(),
      expedicao_id: form.expedicao_id,
      data_inicio: form.data_inicio,
      data_fim: form.data_fim,
      vagas: Number(form.vagas),
      status: form.status,
      desconto_percentual: form.desconto_percentual ? Number(form.desconto_percentual) : 0,
      promocao_inicio: form.promocao_inicio || null,
      promocao_fim: form.promocao_fim || null,
      lote_atual: form.lote_atual,
      preco_duplo: loteAtivo.preco_duplo,
      preco_single: loteAtivo.preco_single || null,
      oculto: form.oculto,
    };

    try {
      let pacoteId = id;

      if (isNew) {
        const { data, error: insertError } = await supabase.from('pacotes').insert([payload]).select().single();
        if (insertError) throw insertError;
        pacoteId = data.id;
      } else {
        const { error: updateError } = await supabase.from('pacotes').update(payload).eq('id', id);
        if (updateError) throw updateError;
      }

      await supabase.from('pacote_lotes').delete().eq('pacote_id', pacoteId);
      
      const lotesToInsert = lotes.map(l => ({
        pacote_id: pacoteId,
        lote_numero: l.lote_numero,
        preco_duplo: l.preco_duplo,
        preco_single: l.preco_single || null,
        vagas_gatilho: l.lote_numero === 1 ? 0 : (l.vagas_gatilho || 0)
      }));

      await supabase.from('pacote_lotes').insert(lotesToInsert);

      setSuccess('Pacote e Lotes salvos com sucesso!');
      if (isNew) navigate(`/admin/pacotes/${pacoteId}`, { replace: true });
      
    } catch (err) {
      setError('Erro ao salvar o pacote ou os lotes. Tente novamente.');
    }
    
    setSaving(false);
  }

  if (loading) return <div className="ui-page"><div className="ui-state">Carregando formulário...</div></div>;

  const loteAtivoInfo = lotes.find(l => l.lote_numero === form.lote_atual) || lotes[0];

  return (
    <div className="ui-page">
      <Link to="/admin/pacotes" className="ui-back">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
        Voltar para Pacotes
      </Link>
      
      <div className="ui-page-header">
        <div>
          <h1 className="ui-page-title">{isNew ? 'Novo Pacote' : form.nome || 'Editar Pacote'}</h1>
          <p className="ui-page-subtitle">Configure as datas, as vagas e os lotes desta saída.</p>
        </div>
      </div>

      <div className="ui-tabs">
        <button type="button" className={`ui-tab${tab === 'geral' ? ' active' : ''}`} onClick={() => { setError(''); setTab('geral'); }}>Dados Gerais</button>
        <button type="button" className={`ui-tab${tab === 'valores' ? ' active' : ''}`} onClick={() => { if (validateGeral()) { setError(''); setTab('valores'); } }}>Lotes e Valores</button>
      </div>

      {error && <div className="ui-form-error">{error}</div>}
      {success && <div className="ui-form-success">{success}</div>}

      <form onSubmit={(e) => e.preventDefault()}>
        {tab === 'geral' && (
          <>
            <div className="ui-form-row">
              <div className={`ui-field${fieldErrors.nome ? ' has-error' : ''}`}>
                <label>Nome Interno <span className="ui-required">*</span></label>
                <input type="text" value={form.nome} onChange={(e) => { updateField('nome', e.target.value); if (fieldErrors.nome) setFieldErrors(f => ({ ...f, nome: false })); }} />
              </div>
            </div>
            
            <div className="ui-form-row">
              <div className={`ui-field${fieldErrors.expedicao_id ? ' has-error' : ''}`} style={{ flex: 2 }}>
                <label>Expedição Base <span className="ui-required">*</span></label>
                <select value={form.expedicao_id} onChange={(e) => { updateField('expedicao_id', e.target.value); if (fieldErrors.expedicao_id) setFieldErrors(f => ({ ...f, expedicao_id: false })); }} disabled={!isNew}>
                  <option value="">Selecione...</option>
                  {expedicoes.map((exp) => <option key={exp.id} value={exp.id}>{exp.nome}</option>)}
                </select>
              </div>
              <div className="ui-field" style={{ flex: 1 }}>
                <label>Status</label>
                <select value={form.status} onChange={(e) => updateField('status', e.target.value)}>
                  <option value="Ativo">Ativo</option>
                  <option value="Em breve">Em breve</option>
                  <option value="Esgotado">Esgotado</option>
                  <option value="Encerrado">Encerrado</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </div>
            </div>
            
            <div className="ui-form-row">
              <div className={`ui-field${fieldErrors.data_inicio ? ' has-error' : ''}`}>
                <label>Data de Início <span className="ui-required">*</span></label>
                <input type="date" min={dataHoje} value={form.data_inicio} onChange={(e) => { updateField('data_inicio', e.target.value); if (fieldErrors.data_inicio) setFieldErrors(f => ({ ...f, data_inicio: false })); }} style={{ padding: '10px 12px', border: '1px solid var(--cream)', borderRadius: '5px' }} />
              </div>
              <div className={`ui-field${fieldErrors.data_fim ? ' has-error' : ''}`}>
                <label>Data de Fim <span className="ui-required">*</span></label>
                <input type="date" min={form.data_inicio || dataHoje} value={form.data_fim} onChange={(e) => { updateField('data_fim', e.target.value); if (fieldErrors.data_fim) setFieldErrors(f => ({ ...f, data_fim: false })); }} style={{ padding: '10px 12px', border: '1px solid var(--cream)', borderRadius: '5px' }} />
              </div>
            </div>
            
            <div className="ui-form-row">
              <div className="ui-field">
                <label>Vagas Totais</label>
                <input type="number" min="0" value={form.vagas} onChange={(e) => updateField('vagas', Number(e.target.value))} />
              </div>
              <div className="ui-field">
                <label>Vagas Ocupadas</label>
                <input type="number" value={vagasOcupadas} disabled style={{ backgroundColor: 'rgba(151, 183, 177, 0.15)', borderColor: 'transparent', fontWeight: '600' }} />
              </div>
            </div>

            <div style={{ marginTop: '24px', padding: '16px', border: '1px solid var(--cream)', borderRadius: '8px', background: 'var(--warm-white)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', margin: 0 }}>
                <input 
                  type="checkbox" 
                  checked={form.oculto} 
                  onChange={(e) => updateField('oculto', e.target.checked)} 
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontWeight: 600, color: 'var(--forest-deep)' }}>
                  Ocultar pacote do site
                </span>
              </label>
              <p style={{ margin: '4px 0 0 28px', fontSize: '12px', color: 'var(--text-muted)' }}>
                Marque para ocultar este pacote das páginas públicas sem precisar excluí-lo.
              </p>
            </div>
          </>
        )}

        {tab === 'valores' && (
          <>
            <div style={{ background: '#eef7db', border: '1px solid #c8e09f', borderRadius: '12px', padding: '20px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700', color: 'var(--forest-deep)', display: 'block', marginBottom: '4px' }}>
                  Status Atual do Lote em Vigor
                </span>
                <h4 style={{ margin: 0, fontFamily: 'var(--heading)', fontSize: '20px', color: 'var(--forest-deep)' }}>
                  Lote {form.lote_atual || 1}
                </h4>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                  Vagas ocupadas no momento: <strong>{vagasOcupadas}</strong>
                </p>
              </div>
              <div style={{ display: 'flex', gap: '24px', background: 'white', padding: '12px 20px', borderRadius: '8px', border: '1px solid #d5e8b4' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Preço Quarto Duplo</span>
                  <strong style={{ fontSize: '16px', color: 'var(--forest-deep)' }}>
                    {loteAtivoInfo ? formatarParaMoeda(loteAtivoInfo.preco_duplo) : '0,00'}
                  </strong>
                </div>
                {loteAtivoInfo?.preco_single ? (
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Preço Quarto Single</span>
                    <strong style={{ fontSize: '16px', color: 'var(--forest-deep)' }}>
                      {formatarParaMoeda(loteAtivoInfo.preco_single)}
                    </strong>
                  </div>
                ) : null}
              </div>
            </div>

            <h3 style={{ fontFamily: 'var(--heading)', fontSize: 16, color: 'var(--forest-deep)', margin: '0 0 16px' }}>Gerenciamento de Lotes</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
              {lotes.map((lote, index) => {
                const isCurrent = lote.lote_numero === form.lote_atual;
                return (
                  <div key={index} style={{ border: isCurrent ? '2px solid var(--forest-deep)' : '1px solid var(--cream)', padding: '16px', borderRadius: '8px', background: isCurrent ? 'rgba(38, 51, 47, 0.02)' : 'var(--warm-white)' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h4 style={{ margin: 0, color: 'var(--forest-deep)', fontSize: '15px' }}>
                          Lote {lote.lote_numero} {lote.lote_numero === 1 && '(Padrão / Inicial)'}
                        </h4>
                        {isCurrent && (
                          <span style={{ background: 'var(--forest-deep)', color: 'white', fontSize: '10px', padding: '2px 8px', borderRadius: '99px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                            Em Vigor
                          </span>
                        )}
                      </div>
                      {lote.lote_numero > 1 && (
                        <button type="button" onClick={() => removerLote(index)} style={{ color: 'var(--danger-text)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Remover Lote</button>
                      )}
                    </div>
                    
                    <div className="ui-form-row">
                      <div className="ui-field">
                        <label>Preço Quarto Duplo (R$) <span className="ui-required">*</span></label>
                        <input type="text" placeholder="0,00" value={lote.preco_duplo ? formatarParaMoeda(lote.preco_duplo) : ''} onChange={(e) => updateLote(index, 'preco_duplo', moedaParaNumero(e.target.value))} />
                      </div>
                      <div className="ui-field">
                        <label>Preço Quarto Single (R$)</label>
                        <input type="text" placeholder="0,00" value={lote.preco_single ? formatarParaMoeda(lote.preco_single) : ''} onChange={(e) => updateLote(index, 'preco_single', moedaParaNumero(e.target.value))} />
                      </div>
                    </div>

                    {lote.lote_numero > 1 && (
                      <div className="ui-form-row" style={{ marginTop: '8px' }}>
                        <div className="ui-field" style={{ flex: 1 }}>
                          <label>Mudar para este lote após X vagas ocupadas</label>
                          <input type="number" min="1" placeholder="Ex: Ao atingir 5 vagas, ativa o Lote 2" value={lote.vagas_gatilho} onChange={(e) => updateLote(index, 'vagas_gatilho', Number(e.target.value))} />
                        </div>
                        <div style={{ flex: 1 }}></div>
                      </div>
                    )}
                  </div>
                );
              })}
              
              <button type="button" className="ui-btn-ghost" onClick={adicionarLote} style={{ alignSelf: 'flex-start' }}>+ Adicionar Novo Lote</button>
            </div>

            <div className="ui-field" style={{ borderTop: '1px solid var(--cream)', paddingTop: '24px', maxWidth: '350px' }}>
              <label>Forçar Lote em Vigor (Manual)</label>
              <select value={form.lote_atual} onChange={(e) => updateField('lote_atual', Number(e.target.value))}>
                {lotes.map((l) => (
                  <option key={l.lote_numero} value={l.lote_numero}>
                    Lote {l.lote_numero} — R$ {formatarParaMoeda(l.preco_duplo)}
                  </option>
                ))}
              </select>
              <span className="ui-hint">O sistema avança automaticamente com as reservas, mas você pode sobrescrevê-lo manualmente aqui se necessário.</span>
            </div>
          </>
        )}

        <div className="ui-step-actions">
          {tab === 'valores' ? (
            <button type="button" className="ui-btn-ghost" onClick={() => setTab('geral')} disabled={saving}>Voltar</button>
          ) : (<span />)}
          
          {tab === 'valores' ? (
            <button type="button" className="ui-btn-solid" disabled={saving} onClick={handleSave}>
              {saving ? 'Salvando...' : 'Salvar Pacote'}
            </button>
          ) : (
            <button type="button" className="ui-btn-solid" onClick={() => { if (validateGeral()) setTab('valores'); }}>Próximo</button>
          )}
        </div>
      </form>
    </div>
  );
}