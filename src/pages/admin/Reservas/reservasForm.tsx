import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/services/supabase';
import type { Reserva } from '@/types';
import '../admin-theme.css';

const EMPTY_FORM = {
  cliente_id: '',
  pacote_id: '',
  valor_pago: 0,
  forma_pagamento: '',
  status: 'Pendente',
  observacoes: '',
};

const EMPTY_CLIENT = {
  nome: '',
  telefone: '',
  email: '',
  cpf: '',
};

// --- Funções Auxiliares ---
function formatarParaMoeda(valor: number): string {
  if (!valor || isNaN(valor)) return '';
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function moedaParaNumero(valorStr: string): number {
  const apenasNumeros = valorStr.replace(/\D/g, '');
  if (!apenasNumeros) return 0;
  return Number(apenasNumeros) / 100;
}

function formatarTelefone(v: string): string {
  const nums = v.replace(/\D/g, '').slice(0, 11);
  if (nums.length > 10) return nums.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  if (nums.length > 6) return nums.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  if (nums.length > 2) return nums.replace(/(\d{2})(\d{0,5})/, '($1) $2');
  if (nums.length > 0) return nums.replace(/(\d{0,2})/, '($1');
  return nums;
}

function formatarCPF(v: string): string {
  const nums = v.replace(/\D/g, '').slice(0, 11);
  if (nums.length > 9) return nums.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  if (nums.length > 6) return nums.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
  if (nums.length > 3) return nums.replace(/(\d{3})(\d{1,3})/, '$1.$2');
  return nums;
}

function validarCPF(cpf: string): boolean {
  const limpo = cpf.replace(/\D/g, '');
  if (limpo.length !== 11 || /^(\d)\1{10}$/.test(limpo)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(limpo.charAt(i)) * (10 - i);
  let resto = 11 - (soma % 11);
  let digito1 = resto === 10 || resto === 11 ? 0 : resto;
  if (digito1 !== parseInt(limpo.charAt(9))) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(limpo.charAt(i)) * (11 - i);
  resto = 11 - (soma % 11);
  let digito2 = resto === 10 || resto === 11 ? 0 : resto;
  return digito2 === parseInt(limpo.charAt(10));
}

// Remove acentos e normaliza para busca funcionar perfeitamente
function textoParaBusca(str: string): string {
  return (str || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// --- Componente Principal ---
export function ReservaForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id;

  // Estados
  const [form, setForm] = useState(EMPTY_FORM);
  const [pacotes, setPacotes] = useState<{ id: string; nome: string; status: string }[]>([]);
  const [clientes, setClientes] = useState<{ id: string; nome: string; cpf: string | null }[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ cliente_id?: boolean; pacote_id?: boolean }>({});

  // Dropdown Cliente
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const clientDropdownRef = useRef<HTMLDivElement>(null);

  // Dropdown Pacote
  const [pacoteSearchTerm, setPacoteSearchTerm] = useState('');
  const [isPacoteDropdownOpen, setIsPacoteDropdownOpen] = useState(false);
  const pacoteDropdownRef = useRef<HTMLDivElement>(null);

  // Modal Cliente
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientForm, setClientForm] = useState(EMPTY_CLIENT);
  const [savingClient, setSavingClient] = useState(false);
  const [clientError, setClientError] = useState('');
  const [clientFieldErrors, setClientFieldErrors] = useState<{ nome?: boolean; telefone?: boolean; cpf?: boolean }>({});

  // Fecha os dropdowns ao clicar fora e restaura os valores
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(event.target as Node)) {
        setIsClientDropdownOpen(false);
        const c = clientes.find(x => x.id === form.cliente_id);
        setClientSearchTerm(c ? `${c.nome} ${c.cpf ? `(CPF: ${c.cpf})` : ''}` : '');
      }
      if (pacoteDropdownRef.current && !pacoteDropdownRef.current.contains(event.target as Node)) {
        setIsPacoteDropdownOpen(false);
        const p = pacotes.find(x => x.id === form.pacote_id);
        setPacoteSearchTerm(p ? p.nome : '');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [form.cliente_id, form.pacote_id, clientes, pacotes]);

  useEffect(() => {
    fetchInitialData();
  }, [id]);

  async function fetchInitialData() {
    setLoading(true);
    setError('');

    const [pctResult, cliResult] = await Promise.all([
      supabase.from('pacotes').select('id, nome, status').order('data_inicio', { ascending: true }),
      supabase.from('clientes').select('id, nome, cpf').order('nome', { ascending: true })
    ]);

    const fetchedPacotes = pctResult.data ?? [];
    const fetchedClientes = cliResult.data ?? [];
    
    setPacotes(fetchedPacotes);
    setClientes(fetchedClientes);

    if (!isNew && id) {
      const { data: reservaData, error: reservaError } = await supabase
        .from('reservas')
        .select('*')
        .eq('id', id)
        .single();

      if (reservaError || !reservaData) {
        setError('Reserva não encontrada.');
      } else {
        const r = reservaData as Reserva;
        setForm({
          cliente_id: r.cliente_id || '',
          pacote_id: r.pacote_id || '',
          valor_pago: r.valor_pago || 0,
          forma_pagamento: r.forma_pagamento || '',
          status: r.status || 'Pendente',
          observacoes: r.observacoes || '',
        });

        const clienteVinculado = fetchedClientes.find(c => c.id === r.cliente_id);
        if (clienteVinculado) {
          setClientSearchTerm(`${clienteVinculado.nome} ${clienteVinculado.cpf ? `(CPF: ${clienteVinculado.cpf})` : ''}`);
        }

        const pacoteVinculado = fetchedPacotes.find(p => p.id === r.pacote_id);
        if (pacoteVinculado) {
          setPacoteSearchTerm(pacoteVinculado.nome);
        }
      }
    }
    setLoading(false);
  }

  function updateField<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSelectCliente(cliente: { id: string; nome: string; cpf: string | null }) {
    updateField('cliente_id', cliente.id);
    setClientSearchTerm(`${cliente.nome} ${cliente.cpf ? `(CPF: ${cliente.cpf})` : ''}`);
    setIsClientDropdownOpen(false);
    if (fieldErrors.cliente_id) setFieldErrors((f) => ({ ...f, cliente_id: false }));
  }

  function handleSelectPacote(pacote: { id: string; nome: string }) {
    updateField('pacote_id', pacote.id);
    setPacoteSearchTerm(pacote.nome);
    setIsPacoteDropdownOpen(false);
    if (fieldErrors.pacote_id) setFieldErrors((f) => ({ ...f, pacote_id: false }));
  }

  function validate(): boolean {
    const errs: typeof fieldErrors = {};
    if (!form.cliente_id) errs.cliente_id = true;
    if (!form.pacote_id) errs.pacote_id = true;
    
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      setError('Por favor, selecione o cliente e o pacote vinculados à reserva.');
      return false;
    }
    return true;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validate()) return;

    setSaving(true);

    const payload = {
      cliente_id: form.cliente_id,
      pacote_id: form.pacote_id,
      valor_pago: Number(form.valor_pago),
      forma_pagamento: form.forma_pagamento || null,
      status: form.status,
      observacoes: form.observacoes || null,
    };

    if (isNew) {
      const { data, error: insertError } = await supabase
        .from('reservas')
        .insert([payload])
        .select()
        .single();

      if (insertError) {
        setSaving(false);
        setError('Erro ao criar a reserva. Verifique os dados.');
        return;
      }
      setSuccess('Reserva criada com sucesso!');
      navigate(`/admin/reservas/${data.id}`, { replace: true });
    } else {
      const { error: updateError } = await supabase
        .from('reservas')
        .update(payload)
        .eq('id', id);

      if (updateError) {
        setSaving(false);
        setError('Erro ao atualizar a reserva.');
        return;
      }
      setSuccess('Alterações salvas com sucesso.');
    }
    setSaving(false);
  }

  // --- Lógica Modal Novo Cliente ---
  async function handleSaveNewClient(e: React.FormEvent) {
    e.preventDefault();
    setClientError('');
    
    const errs: typeof clientFieldErrors = {};
    let msg = '';

    if (!clientForm.nome.trim()) {
      errs.nome = true;
      msg = 'O campo Nome Completo é obrigatório.';
    } else if (!clientForm.telefone.trim() || clientForm.telefone.replace(/\D/g, '').length < 10) {
      errs.telefone = true;
      msg = 'Informe um telefone ou WhatsApp válido.';
    } else if (clientForm.cpf.trim() && !validarCPF(clientForm.cpf)) {
      errs.cpf = true;
      msg = 'O CPF informado é inválido.';
    }

    setClientFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      setClientError(msg);
      return;
    }

    setSavingClient(true);

    const payload = {
      nome: clientForm.nome.trim(),
      email: clientForm.email.trim() || null,
      telefone: clientForm.telefone.trim(),
      cpf: clientForm.cpf.trim() || null,
      aceita_ofertas: false,
    };

    const { data, error } = await supabase
      .from('clientes')
      .insert([payload])
      .select('id, nome, cpf')
      .single();

    setSavingClient(false);

    if (error || !data) {
      if (error?.code === '23505') setClientError('Já existe um cliente cadastrado com este CPF.');
      else setClientError('Erro ao cadastrar cliente.');
      return;
    }

    const novaLista = [...clientes, data].sort((a, b) => a.nome.localeCompare(b.nome));
    setClientes(novaLista);
    handleSelectCliente(data);
    fecharModalClient();
  }

  function fecharModalClient() {
    setIsModalOpen(false);
    setClientForm(EMPTY_CLIENT);
    setClientError('');
    setClientFieldErrors({});
  }

  // --- Filtros ---
  const termoCliente = textoParaBusca(clientSearchTerm);
  const termoClienteNumeros = clientSearchTerm.replace(/\D/g, ''); 

  const clientesFiltrados = clientes.filter(c => {
    const matchNome = textoParaBusca(c.nome).includes(termoCliente);
    const matchCpf = termoClienteNumeros !== '' && c.cpf && c.cpf.replace(/\D/g, '').includes(termoClienteNumeros);
    return matchNome || matchCpf;
  });

  const termoPacote = textoParaBusca(pacoteSearchTerm);
  const pacotesFiltrados = pacotes.filter(p => 
    p.status === 'Ativo' && textoParaBusca(p.nome).includes(termoPacote)
  );

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
        .ui-field select:disabled, .ui-field input:disabled {
          background-color: rgba(151, 183, 177, 0.15);
          border-color: transparent;
          color: var(--forest-deep);
          font-weight: 500;
          cursor: not-allowed;
          opacity: 0.8;
        }

        .custom-dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: var(--warm-white);
          border: 1px solid var(--verde-claro);
          border-radius: 6px;
          margin-top: 4px;
          max-height: 220px;
          overflow-y: auto;
          z-index: 50;
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
        }

        .custom-dropdown-item {
          padding: 10px 14px;
          cursor: pointer;
          border-bottom: 1px solid var(--beje-claro);
          transition: background-color 0.1s ease;
        }

        .custom-dropdown-item:last-child {
          border-bottom: none;
        }

        .custom-dropdown-item:hover {
          background-color: rgba(151, 183, 177, 0.15);
        }

        .custom-dropdown-item-title {
          font-weight: 600;
          color: var(--forest-deep);
          font-size: 13.5px;
        }

        .custom-dropdown-item-cpf {
          font-size: 12px;
          color: var(--ink);
          opacity: 0.7;
        }
      `}</style>

      <Link to="/admin/reservas" className="ui-back">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Voltar para Reservas
      </Link>

      <div className="ui-page-header">
        <div>
          <h1 className="ui-page-title">{isNew ? 'Nova Reserva' : 'Editar Reserva'}</h1>
          <p className="ui-page-subtitle">
            {isNew ? 'Vincule um cliente a um pacote de viagem.' : 'Atualize os dados e o status do pagamento.'}
          </p>
        </div>
      </div>

      {error && <div className="ui-form-error">{error}</div>}
      {success && <div className="ui-form-success">{success}</div>}

      <form 
        onSubmit={handleSave}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
            e.preventDefault();
          }
        }}
      >
        {/* --- Busca de Cliente --- */}
        <div className="ui-form-row">
          <div className={`ui-field${fieldErrors.cliente_id ? ' has-error' : ''}`} style={{ flex: 1, position: 'relative' }} ref={clientDropdownRef}>
            <label htmlFor="cliente_id">Cliente <span className="ui-required">*</span></label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type="text"
                  placeholder="Busque por nome ou CPF..."
                  value={clientSearchTerm}
                  onChange={(e) => {
                    setClientSearchTerm(e.target.value);
                    setIsClientDropdownOpen(true);
                    if (form.cliente_id) updateField('cliente_id', '');
                  }}
                  onFocus={() => isNew && setIsClientDropdownOpen(true)}
                  disabled={!isNew}
                  autoComplete="off"
                  style={{ width: '100%', paddingRight: '30px' }}
                />
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position: 'absolute', right: '12px', top: '12px', color: 'var(--ink)', opacity: 0.4, pointerEvents: 'none' }}>
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>

                {isClientDropdownOpen && isNew && (
                  <div className="custom-dropdown-menu">
                    {clientesFiltrados.length > 0 ? (
                      clientesFiltrados.map((c) => (
                        <div key={c.id} className="custom-dropdown-item" onClick={() => handleSelectCliente(c)}>
                          <div className="custom-dropdown-item-title">{c.nome}</div>
                          {c.cpf && <div className="custom-dropdown-item-cpf">CPF: {c.cpf}</div>}
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--ink)', opacity: 0.6 }}>
                        Nenhum cliente encontrado.
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {isNew && (
                <button 
                  type="button" 
                  className="ui-btn-ghost" 
                  onClick={() => setIsModalOpen(true)}
                  title="Cadastrar novo cliente rapidamente"
                >
                  + Novo
                </button>
              )}
            </div>
          </div>
        </div>

        {/* --- Busca de Pacote --- */}
        <div className="ui-form-row">
          <div className={`ui-field${fieldErrors.pacote_id ? ' has-error' : ''}`} style={{ flex: 2, position: 'relative' }} ref={pacoteDropdownRef}>
            <label htmlFor="pacote_id">Pacote Vinculado <span className="ui-required">*</span></label>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                placeholder="Busque pelo nome do pacote..."
                value={pacoteSearchTerm}
                onChange={(e) => {
                  setPacoteSearchTerm(e.target.value);
                  setIsPacoteDropdownOpen(true);
                  if (form.pacote_id) updateField('pacote_id', '');
                }}
                onFocus={() => isNew && setIsPacoteDropdownOpen(true)}
                disabled={!isNew}
                autoComplete="off"
                style={{ width: '100%', paddingRight: '30px' }}
              />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position: 'absolute', right: '12px', top: '12px', color: 'var(--ink)', opacity: 0.4, pointerEvents: 'none' }}>
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>

              {isPacoteDropdownOpen && isNew && (
                <div className="custom-dropdown-menu">
                  {pacotesFiltrados.length > 0 ? (
                    pacotesFiltrados.map((p) => (
                      <div key={p.id} className="custom-dropdown-item" onClick={() => handleSelectPacote(p)}>
                        <div className="custom-dropdown-item-title">{p.nome}</div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--ink)', opacity: 0.6 }}>
                      Nenhum pacote ativo encontrado com este nome.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="ui-field" style={{ flex: 1 }}>
            <label htmlFor="status">Status da Reserva</label>
            <select
              id="status"
              value={form.status}
              onChange={(e) => updateField('status', e.target.value)}
            >
              <option value="Pendente">Pendente (Aguardando Pagamento)</option>
              <option value="Confirmada">Confirmada</option>
              <option value="Cancelada">Cancelada</option>
            </select>
          </div>
        </div>

        <div className="ui-form-row">
          <div className="ui-field">
            <label htmlFor="valor_pago">Valor Pago (R$)</label>
            <input
              id="valor_pago"
              type="text"
              placeholder="0,00"
              value={form.valor_pago ? formatarParaMoeda(form.valor_pago) : ''}
              onChange={(e) => updateField('valor_pago', moedaParaNumero(e.target.value))}
            />
          </div>
          <div className="ui-field">
            <label htmlFor="forma_pagamento">Forma de Pagamento</label>
            <select
              id="forma_pagamento"
              value={form.forma_pagamento}
              onChange={(e) => updateField('forma_pagamento', e.target.value)}
            >
              <option value="">Selecione...</option>
              <option value="Pix">Pix</option>
              <option value="Cartão de Crédito">Cartão de Crédito</option>
              <option value="Boleto">Boleto</option>
              <option value="Transferência Bancária">Transferência Bancária</option>
            </select>
          </div>
        </div>

        <div className="ui-field">
          <label htmlFor="observacoes">Observações Gerais</label>
          <textarea
            id="observacoes"
            placeholder="Detalhes sobre voos, quarto single/duplo, necessidades especiais..."
            value={form.observacoes}
            onChange={(e) => updateField('observacoes', e.target.value)}
          />
        </div>

        <div className="ui-step-actions">
          <span />
          <button type="submit" className="ui-btn-solid" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Reserva'}
          </button>
        </div>
      </form>

      {/* --- Modal Cadastro Rápido de Cliente --- */}
      {isModalOpen && (
        <div className="ui-modal-overlay" onClick={fecharModalClient}>
          <div className="ui-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="ui-modal-header">
              <h2 className="ui-modal-title">Cadastro Rápido</h2>
              <button className="ui-modal-close" onClick={fecharModalClient}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {clientError && <div className="ui-form-error">{clientError}</div>}

            <form onSubmit={handleSaveNewClient}>
              <div className={`ui-field${clientFieldErrors.nome ? ' has-error' : ''}`}>
                <label>Nome Completo <span className="ui-required">*</span></label>
                <input
                  type="text"
                  placeholder="Ex: Maria Clara Souza"
                  value={clientForm.nome}
                  onChange={(e) => {
                    setClientForm(f => ({ ...f, nome: e.target.value }));
                    if (clientFieldErrors.nome) setClientFieldErrors(f => ({ ...f, nome: false }));
                  }}
                  autoFocus
                />
              </div>

              <div className="ui-form-row">
                <div className={`ui-field${clientFieldErrors.telefone ? ' has-error' : ''}`} style={{ flex: 1 }}>
                  <label>Telefone / WhatsApp <span className="ui-required">*</span></label>
                  <input
                    type="text"
                    placeholder="(49) 99999-9999"
                    value={clientForm.telefone}
                    onChange={(e) => {
                      setClientForm(f => ({ ...f, telefone: formatarTelefone(e.target.value) }));
                      if (clientFieldErrors.telefone) setClientFieldErrors(f => ({ ...f, telefone: false }));
                    }}
                  />
                </div>
                <div className={`ui-field${clientFieldErrors.cpf ? ' has-error' : ''}`} style={{ flex: 1 }}>
                  <label>CPF</label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={clientForm.cpf}
                    onChange={(e) => {
                      setClientForm(f => ({ ...f, cpf: formatarCPF(e.target.value) }));
                      if (clientFieldErrors.cpf) setClientFieldErrors(f => ({ ...f, cpf: false }));
                    }}
                  />
                </div>
              </div>

              <div className="ui-field">
                <label>E-mail</label>
                <input
                  type="email"
                  placeholder="Ex: mariaclara@email.com"
                  value={clientForm.email}
                  onChange={(e) => setClientForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>

              <div className="ui-modal-footer" style={{ marginTop: '24px' }}>
                <button type="button" className="ui-btn-ghost" onClick={fecharModalClient} disabled={savingClient}>
                  Cancelar
                </button>
                <button type="submit" className="ui-btn-solid" disabled={savingClient}>
                  {savingClient ? 'Salvando...' : 'Salvar e Selecionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}