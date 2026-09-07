import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/services/supabase';
import type { Cliente } from '@/types';
import '../admin-theme.css';

const EMPTY_FORM = {
  nome: '',
  email: '',
  telefone: '',
  instagram: '',
  data_nascimento: '',
  cpf: '',
  passaporte: '',
  contato_emergencia: '',
  observacoes: '',
  aceita_ofertas: false,
};

// Máscara e validação de Telefone (Fixo e Celular)
function formatarTelefone(v: string): string {
  const nums = v.replace(/\D/g, '').slice(0, 11);
  if (nums.length > 10) {
    return nums.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (nums.length > 6) {
    return nums.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  } else if (nums.length > 2) {
    return nums.replace(/(\d{2})(\d{0,5})/, '($1) $2');
  } else if (nums.length > 0) {
    return nums.replace(/(\d{0,2})/, '($1');
  }
  return nums;
}

// Máscara de CPF
function formatarCPF(v: string): string {
  const nums = v.replace(/\D/g, '').slice(0, 11);
  if (nums.length > 9) {
    return nums.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else if (nums.length > 6) {
    return nums.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
  } else if (nums.length > 3) {
    return nums.replace(/(\d{3})(\d{1,3})/, '$1.$2');
  }
  return nums;
}

// Validação matemática rigorosa de CPF
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

// Formatação do Instagram (garante o @)
function formatarInstagram(v: string): string {
  const limpo = v.trim().replace('@', '');
  return limpo ? `@${limpo}` : '';
}

export function ClienteForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id;

  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ nome?: boolean; telefone?: boolean; cpf?: boolean; data_nascimento?: boolean }>({});

  const dataHoje = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!isNew && id) fetchCliente(id);
  }, [id]);

  async function fetchCliente(clienteId: string) {
    setLoading(true);
    setError('');

    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', clienteId)
      .single();

    if (error || !data) {
      setError('Cliente não encontrado.');
    } else {
      const c = data as Cliente;
      setForm({
        nome: c.nome || '',
        email: c.email || '',
        telefone: c.telefone ? formatarTelefone(c.telefone) : '',
        instagram: c.instagram ? formatarInstagram(c.instagram) : '',
        data_nascimento: c.data_nascimento || '',
        cpf: c.cpf ? formatarCPF(c.cpf) : '',
        passaporte: c.passaporte || '',
        contato_emergencia: c.contato_emergencia || '',
        observacoes: c.observacoes || '',
        aceita_ofertas: c.aceita_ofertas ?? false,
      });
    }
    setLoading(false);
  }

  function updateField<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): boolean {
    const errs: typeof fieldErrors = {};
    let msg = '';

    if (!form.nome.trim()) {
      errs.nome = true;
      msg = 'O campo Nome Completo é obrigatório.';
    } else if (!form.telefone.trim() || form.telefone.replace(/\D/g, '').length < 10) {
      errs.telefone = true;
      msg = 'Informe um telefone ou WhatsApp válido.';
    } else if (form.cpf.trim() && !validarCPF(form.cpf)) {
      errs.cpf = true;
      msg = 'O CPF informado é inválido.';
    } else if (form.data_nascimento && form.data_nascimento > dataHoje) {
      errs.data_nascimento = true;
      msg = 'A data de nascimento não pode ser futura.';
    }

    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      setError(msg);
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
      nome: form.nome.trim(),
      email: form.email.trim() || null,
      telefone: form.telefone.trim(),
      instagram: form.instagram.trim() ? formatarInstagram(form.instagram) : null,
      data_nascimento: form.data_nascimento || null,
      cpf: form.cpf.trim() || null,
      passaporte: form.passaporte.trim() || null,
      contato_emergencia: form.contato_emergencia.trim() || null,
      observacoes: form.observacoes.trim() || null,
      aceita_ofertas: form.aceita_ofertas,
    };

    if (isNew) {
      const { data, error: insertError } = await supabase
        .from('clientes')
        .insert([payload])
        .select()
        .single();

      if (insertError) {
        setSaving(false);
        if (insertError.code === '23505') {
          setError('Já existe um cliente cadastrado com este CPF.');
        } else {
          setError('Erro ao cadastrar cliente. Verifique os dados.');
        }
        return;
      }
      setSuccess('Cliente cadastrado com sucesso!');
      navigate(`/admin/clientes/${data.id}`, { replace: true });
    } else {
      const { error: updateError } = await supabase
        .from('clientes')
        .update(payload)
        .eq('id', id);

      if (updateError) {
        setSaving(false);
        if (updateError.code === '23505') {
          setError('Já existe outro cliente cadastrado com este CPF.');
        } else {
          setError('Erro ao atualizar o cliente.');
        }
        return;
      }
      setSuccess('Alterações salvas com sucesso.');
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="ui-page">
        <div className="ui-state">Carregando dados do cliente...</div>
      </div>
    );
  }

  return (
    <div className="ui-page">
      <Link to="/admin/clientes" className="ui-back">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Voltar para Clientes
      </Link>

      <div className="ui-page-header">
        <div>
          <h1 className="ui-page-title">{isNew ? 'Novo Cliente' : form.nome || 'Editar Cliente'}</h1>
          <p className="ui-page-subtitle">
            {isNew ? 'Insira as informações de contato e documentos do viajante.' : 'Atualize as informações cadastrais.'}
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
        <div className="ui-form-row">
          <div className={`ui-field${fieldErrors.nome ? ' has-error' : ''}`} style={{ flex: 2 }}>
            <label htmlFor="nome">Nome Completo <span className="ui-required">*</span></label>
            <input
              id="nome"
              type="text"
              placeholder="Ex: Maria Clara Souza"
              value={form.nome}
              onChange={(e) => {
                updateField('nome', e.target.value);
                if (fieldErrors.nome) setFieldErrors((f) => ({ ...f, nome: false }));
              }}
            />
          </div>
          <div className={`ui-field${fieldErrors.telefone ? ' has-error' : ''}`} style={{ flex: 1 }}>
            <label htmlFor="telefone">Telefone / WhatsApp <span className="ui-required">*</span></label>
            <input
              id="telefone"
              type="text"
              placeholder="Ex: (99) 99999-9999"
              value={form.telefone}
              onChange={(e) => {
                const formatado = formatarTelefone(e.target.value);
                updateField('telefone', formatado);
                if (fieldErrors.telefone) setFieldErrors((f) => ({ ...f, telefone: false }));
              }}
            />
          </div>
        </div>

        <div className="ui-form-row">
          <div className="ui-field">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              placeholder="Ex: mariaclara@email.com"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
            />
          </div>
          <div className="ui-field">
            <label htmlFor="instagram">Instagram</label>
            <input
              id="instagram"
              type="text"
              placeholder="Ex: mariaclara"
              value={form.instagram}
              onChange={(e) => updateField('instagram', e.target.value)}
              onBlur={(e) => {
                if (e.target.value.trim()) {
                  updateField('instagram', formatarInstagram(e.target.value));
                }
              }}
            />
          </div>
        </div>

        <div className="ui-form-row">
          <div className={`ui-field${fieldErrors.cpf ? ' has-error' : ''}`}>
            <label htmlFor="cpf">CPF</label>
            <input
              id="cpf"
              type="text"
              placeholder="Ex: 000.000.000-00"
              value={form.cpf}
              onChange={(e) => {
                const formatado = formatarCPF(e.target.value);
                updateField('cpf', formatado);
                if (fieldErrors.cpf) setFieldErrors((f) => ({ ...f, cpf: false }));
              }}
            />
          </div>
          <div className="ui-field">
            <label htmlFor="passaporte">Passaporte</label>
            <input
              id="passaporte"
              type="text"
              placeholder="Ex: AB123456"
              value={form.passaporte}
              onChange={(e) => updateField('passaporte', e.target.value)}
            />
          </div>
          <div className={`ui-field${fieldErrors.data_nascimento ? ' has-error' : ''}`}>
            <label htmlFor="data_nascimento">Data de Nascimento</label>
            <input
              id="data_nascimento"
              type="date"
              max={dataHoje}
              value={form.data_nascimento}
              onChange={(e) => {
                updateField('data_nascimento', e.target.value);
                if (fieldErrors.data_nascimento) setFieldErrors((f) => ({ ...f, data_nascimento: false }));
              }}
            />
          </div>
        </div>

        <div className="ui-form-row">
          <div className="ui-field">
            <label htmlFor="contato_emergencia">Contato de Emergência (Nome e Telefone)</label>
            <input
              id="contato_emergencia"
              type="text"
              placeholder="Ex: João Souza (Pai) - (49) 98888-8888"
              value={form.contato_emergencia}
              onChange={(e) => updateField('contato_emergencia', e.target.value)}
            />
          </div>
        </div>

        <div className="ui-field">
          <label htmlFor="observacoes">Observações Médicas ou Restrições</label>
          <textarea
            id="observacoes"
            placeholder="Alergias, restrições alimentares, condições especiais..."
            value={form.observacoes}
            onChange={(e) => updateField('observacoes', e.target.value)}
          />
        </div>

        <div className="ui-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px', marginTop: '10px', marginBottom: '24px' }}>
          <input
            id="aceita_ofertas"
            type="checkbox"
            checked={form.aceita_ofertas}
            onChange={(e) => updateField('aceita_ofertas', e.target.checked)}
          />
          <label htmlFor="aceita_ofertas" style={{ fontWeight: 400, cursor: 'pointer', margin: 0 }}>
            Cliente aceita receber ofertas e novidades de novas expedições por e-mail/WhatsApp
          </label>
        </div>

        <div className="ui-step-actions">
          <span />
          <button type="submit" className="ui-btn-solid" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Cliente'}
          </button>
        </div>
      </form>
    </div>
  );
}