// src/pages/admin/Depoimentos/index.tsx
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/services/supabase';

export interface DepoimentoAdmin {
  id: string;
  nome_cliente: string;
  expedicao_id: string | null;
  expedicoes?: { nome: string } | null;
  depoimento: string;
  foto_viagem_url: string | null;
  foto_perfil_url: string | null;
  ativo: boolean;
  ordem: number;
  created_at?: string;
}

interface ExpedicaoOpcao {
  id: string;
  nome: string;
}

type FiltroStatus = 'todos' | 'ativos' | 'pendentes';

export function DepoimentosList() {
  const [depoimentos, setDepoimentos] = useState<DepoimentoAdmin[]>([]);
  const [expedicoes, setExpedicoes] = useState<ExpedicaoOpcao[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('todos');
  const [filtroExpedicao, setFiltroExpedicao] = useState<string>('todas');
  const [processandoId, setProcessandoId] = useState<string | null>(null);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setLoading(true);
    const [depRes, expRes] = await Promise.all([
      supabase
        .from('depoimentos')
        .select('*, expedicoes(nome)')
        .order('ativo', { ascending: true })
        .order('ordem', { ascending: true })
        .order('created_at', { ascending: false }),
      supabase.from('expedicoes').select('id, nome').order('nome', { ascending: true }),
    ]);

    if (!depRes.error && depRes.data) {
      setDepoimentos(depRes.data as DepoimentoAdmin[]);
    }
    if (!expRes.error && expRes.data) {
      setExpedicoes(expRes.data as ExpedicaoOpcao[]);
    }
    setLoading(false);
  }

  async function alternarStatus(item: DepoimentoAdmin) {
    setProcessandoId(item.id);
    const novoStatus = !item.ativo;

    const { error } = await supabase
      .from('depoimentos')
      .update({ ativo: novoStatus })
      .eq('id', item.id);

    if (!error) {
      setDepoimentos((prev) =>
        prev.map((d) => (d.id === item.id ? { ...d, ativo: novoStatus } : d))
      );
    }
    setProcessandoId(null);
  }

  async function excluirDepoimento(item: DepoimentoAdmin) {
    const confirmar = window.confirm(
      `Tem certeza que deseja excluir o depoimento de "${item.nome_cliente}"? Esta ação não pode ser desfeita.`
    );
    if (!confirmar) return;

    setProcessandoId(item.id);
    const { error } = await supabase.from('depoimentos').delete().eq('id', item.id);

    if (!error) {
      setDepoimentos((prev) => prev.filter((d) => d.id !== item.id));
    }
    setProcessandoId(null);
  }

  const totalPendentes = useMemo(
    () => depoimentos.filter((d) => !d.ativo).length,
    [depoimentos]
  );

  const depoimentosFiltrados = useMemo(() => {
    return depoimentos.filter((item) => {
      if (filtroStatus === 'ativos' && !item.ativo) return false;
      if (filtroStatus === 'pendentes' && item.ativo) return false;

      if (filtroExpedicao === 'sem_vinculo' && item.expedicao_id !== null) return false;
      if (
        filtroExpedicao !== 'todas' &&
        filtroExpedicao !== 'sem_vinculo' &&
        item.expedicao_id !== filtroExpedicao
      ) {
        return false;
      }

      if (busca.trim()) {
        const termo = busca.toLowerCase();
        const matchNome = item.nome_cliente.toLowerCase().includes(termo);
        const matchTexto = item.depoimento.toLowerCase().includes(termo);
        const matchExp = item.expedicoes?.nome?.toLowerCase().includes(termo);
        return matchNome || matchTexto || Boolean(matchExp);
      }
      return true;
    });
  }, [depoimentos, filtroStatus, filtroExpedicao, busca]);

  return (
    <div style={{ padding: '24px 0' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 26, color: 'var(--verde-escuro, #2f4842)' }}>
            Depoimentos
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#64748b' }}>
            Gerencie e aprove os relatos de viajantes exibidos na página pública.
          </p>
        </div>

        <Link
          to="/admin/depoimentos/new"
          className="ui-btn-solid"
          style={{ textDecoration: 'none' }}
        >
          + Novo Depoimento
        </Link>
      </div>

      {/* Barra de Filtros e Busca */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 20,
          background: '#ffffff',
          padding: '14px 18px',
          borderRadius: 10,
          border: '1px solid rgba(47, 72, 66, 0.1)',
        }}
      >
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            className={filtroStatus === 'todos' ? 'ui-btn-solid' : 'ui-btn-ghost'}
            onClick={() => setFiltroStatus('todos')}
            style={{ padding: '7px 14px', fontSize: 13 }}
          >
            Todos ({depoimentos.length})
          </button>
          <button
            type="button"
            className={filtroStatus === 'ativos' ? 'ui-btn-solid' : 'ui-btn-ghost'}
            onClick={() => setFiltroStatus('ativos')}
            style={{ padding: '7px 14px', fontSize: 13 }}
          >
            Publicados ({depoimentos.length - totalPendentes})
          </button>
          <button
            type="button"
            className={filtroStatus === 'pendentes' ? 'ui-btn-solid' : 'ui-btn-ghost'}
            onClick={() => setFiltroStatus('pendentes')}
            style={{ padding: '7px 14px', fontSize: 13 }}
          >
            Pendentes ({totalPendentes})
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={filtroExpedicao}
            onChange={(e) => setFiltroExpedicao(e.target.value)}
            aria-label="Filtrar por expedição"
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: 13.5,
              backgroundColor: '#ffffff',
              color: '#1e293b',
              minWidth: 200,
              cursor: 'pointer',
            }}
          >
            <option value="todas">Todas as expedições</option>
            <option value="sem_vinculo">Sem expedição vinculada</option>
            {expedicoes.map((exp) => (
              <option key={exp.id} value={exp.id}>
                {exp.nome}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Buscar por cliente, expedição ou texto..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: 13.5,
              minWidth: 240,
            }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          Carregando depoimentos...
        </div>
      ) : depoimentosFiltrados.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '56px 24px',
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid rgba(47, 72, 66, 0.1)',
            color: '#64748b',
          }}
        >
          Nenhum depoimento encontrado para os filtros selecionados.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {depoimentosFiltrados.map((item) => {
            const ocupando = processandoId === item.id;

            return (
              <div
                key={item.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid rgba(47, 72, 66, 0.1)',
                  borderLeft: `4px solid ${item.ativo ? '#15803d' : '#d97706'}`,
                  borderRadius: 10,
                  padding: '18px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 20,
                  flexWrap: 'wrap',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flex: 1, minWidth: 260 }}>
                  {item.foto_viagem_url ? (
                    <img
                      src={item.foto_viagem_url}
                      alt={item.nome_cliente}
                      style={{
                        width: 76,
                        height: 60,
                        borderRadius: 8,
                        objectFit: 'cover',
                        flexShrink: 0,
                        border: '1px solid #e2e8f0',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 76,
                        height: 60,
                        borderRadius: 8,
                        background: '#f1f5f9',
                        color: '#94a3b8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        textAlign: 'center',
                        flexShrink: 0,
                        padding: 4,
                      }}
                    >
                      Sem foto
                    </div>
                  )}

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <strong style={{ fontSize: 15.5, color: '#1e293b' }}>{item.nome_cliente}</strong>

                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 999,
                          background: item.ativo ? '#dcfce7' : '#fef3c7',
                          color: item.ativo ? '#166534' : '#92400e',
                          textTransform: 'uppercase',
                        }}
                      >
                        {item.ativo ? 'Publicado' : 'Pendente'}
                      </span>

                      {item.expedicoes?.nome && (
                        <span
                          style={{
                            fontSize: 12,
                            color: '#475569',
                            background: '#f1f5f9',
                            padding: '2px 8px',
                            borderRadius: 6,
                          }}
                        >
                          {item.expedicoes.nome}
                        </span>
                      )}

                      <span style={{ fontSize: 12, color: '#94a3b8' }}>Ordem: {item.ordem}</span>
                    </div>

                    <p
                      style={{
                        margin: 0,
                        fontSize: 14,
                        color: '#475569',
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      “{item.depoimento}”
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <button
                    type="button"
                    className="ui-btn-ghost"
                    disabled={ocupando}
                    onClick={() => alternarStatus(item)}
                    style={{
                      padding: '7px 12px',
                      fontSize: 12.5,
                      color: item.ativo ? '#b45309' : '#15803d',
                      borderColor: item.ativo ? '#fde68a' : '#bbf7d0',
                    }}
                  >
                    {item.ativo ? 'Ocultar' : 'Aprovar e Publicar'}
                  </button>

                  <Link
                    to={`/admin/depoimentos/${item.id}`}
                    className="ui-btn-ghost"
                    style={{ padding: '7px 12px', fontSize: 12.5, textDecoration: 'none' }}
                  >
                    Editar
                  </Link>

                  <button
                    type="button"
                    className="ui-btn-ghost"
                    disabled={ocupando}
                    onClick={() => excluirDepoimento(item)}
                    style={{ padding: '7px 12px', fontSize: 12.5, color: '#be123c' }}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}