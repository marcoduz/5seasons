import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/services/supabase';
import type { Reserva } from '@/types';
import '../admin-theme.css';

interface ReservaComRelacoes extends Reserva {
  pacotes?: { nome: string };
  clientes?: { nome: string; cpf: string | null; telefone: string };
}

export function ReservasList() {
  const [reservas, setReservas] = useState<ReservaComRelacoes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchReservas();
  }, []);

  async function fetchReservas() {
    setLoading(true);
    setError('');

    // Busca as reservas já trazendo os nomes do pacote e do cliente via Foreign Key
    const { data, error } = await supabase
      .from('reservas')
      .select('*, pacotes(nome), clientes(nome, cpf, telefone)')
      .order('created_at', { ascending: false });

    if (error) {
      setError('Não foi possível carregar as reservas.');
    } else {
      setReservas(data ?? []);
    }
    setLoading(false);
  }

  async function handleDelete(e: React.MouseEvent, reserva: ReservaComRelacoes) {
    e.preventDefault();
    e.stopPropagation();

    const confirmado = window.confirm(
      `Remover a reserva de "${reserva.clientes?.nome}"? Essa ação não pode ser desfeita.`
    );
    if (!confirmado) return;

    setDeletingId(reserva.id);
    const { error } = await supabase.from('reservas').delete().eq('id', reserva.id);
    setDeletingId(null);

    if (error) {
      window.alert('Erro ao excluir a reserva.');
      return;
    }

    setReservas((prev) => prev.filter((r) => r.id !== reserva.id));
  }

  function formatarMoeda(valor: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  }

  const reservasFiltradas = useMemo(() => {
    return reservas.filter((reserva) => {
      const termo = busca.toLowerCase().trim();
      const nomeCliente = (reserva.clientes?.nome || '').toLowerCase();
      const cpf = (reserva.clientes?.cpf || '');
      const pacote = (reserva.pacotes?.nome || '').toLowerCase();
      
      const matchBusca = !termo || nomeCliente.includes(termo) || cpf.includes(termo) || pacote.includes(termo);
      const matchStatus = !statusFiltro || reserva.status === statusFiltro;

      return matchBusca && matchStatus;
    });
  }, [reservas, busca, statusFiltro]);

  return (
    <div 
      className="ui-page"
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        paddingBottom: 0,
      }}
    >
      <style>{`
        /* Remove a rolagem da página inteira para garantir o efeito fixo */
        body { overflow: hidden !important; }
        
        /* Estilização da barra de rolagem exclusiva da listagem */
        .scroll-area::-webkit-scrollbar { width: 8px; }
        .scroll-area::-webkit-scrollbar-track { background: transparent; }
        .scroll-area::-webkit-scrollbar-thumb { background: rgba(38, 51, 47, 0.15); border-radius: 10px; }
        .scroll-area::-webkit-scrollbar-thumb:hover { background: rgba(38, 51, 47, 0.3); }
      `}</style>

      {/* ÁREA SUPERIOR FIXA (Cabeçalho e Filtros) */}
      <div style={{ flexShrink: 0 }}>
        <div className="ui-page-header">
          <div>
            <h1 className="ui-page-title">Reservas</h1>
            <p className="ui-page-subtitle">Acompanhe as vendas, pagamentos e ocupação dos pacotes.</p>
          </div>
          <Link to="/admin/reservas/new" className="ui-btn-solid">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nova Reserva
          </Link>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px', alignItems: 'center' }}>
          <div className="ui-search" style={{ margin: 0, flex: '1 1 240px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por cliente, CPF ou pacote..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          <select
            value={statusFiltro}
            onChange={(e) => setStatusFiltro(e.target.value)}
            style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--beje-claro)', background: 'var(--warm-white)', color: 'var(--ink)', fontSize: '14px', fontFamily: 'inherit' }}
          >
            <option value="">Todos os Status</option>
            <option value="Confirmada">Confirmada</option>
            <option value="Pendente">Pendente</option>
            <option value="Cancelada">Cancelada</option>
          </select>
        </div>
      </div>

      {/* ÁREA DE ROLAGEM EXCLUSIVA DA LISTAGEM */}
      <div
        className="scroll-area"
        style={{
          flex: 1,
          overflowY: "auto",
          paddingRight: "12px",
          paddingBottom: "120px", /* MARGEM AUMENTADA PARA NÃO CORTAR NO CELULAR */
        }}
      >
        {loading && <div className="ui-state">Carregando reservas...</div>}
        {!loading && error && <div className="ui-state" style={{ color: 'var(--danger-text)' }}>{error}</div>}

        {!loading && !error && reservas.length === 0 && (
          <div className="ui-empty">
            <p>Nenhuma reserva registrada ainda.</p>
            <Link to="/admin/reservas/new" className="ui-btn-solid">
              Criar primeira reserva
            </Link>
          </div>
        )}

        {!loading && !error && reservas.length > 0 && reservasFiltradas.length === 0 && (
          <div className="ui-empty">
            <p>Nenhuma reserva encontrada com os filtros selecionados.</p>
            <button type="button" className="ui-btn-ghost" onClick={() => { setBusca(''); setStatusFiltro(''); }}>
              Limpar filtros
            </button>
          </div>
        )}

        {!loading && !error && reservasFiltradas.length > 0 && (
          /* Tabela atualizada com as classes responsivas do tema */
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Pacote</th>
                  <th>Valor Pago</th>
                  <th>Status</th>
                  <th style={{ width: 90 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {reservasFiltradas.map((reserva) => {
                  let badgeStyle = {};
                  if (reserva.status === 'Confirmada') badgeStyle = { background: 'rgba(151, 183, 177, 0.2)', color: 'var(--forest-deep)' };
                  else if (reserva.status === 'Cancelada') badgeStyle = { background: 'var(--danger-bg)', color: 'var(--danger-text)' };
                  else badgeStyle = { background: '#fef3c7', color: '#92400e' };

                  return (
                    <tr key={reserva.id} style={{ transition: 'background-color 0.15s ease' }}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--forest-deep)', marginBottom: 2 }}>{reserva.clientes?.nome || 'Cliente não encontrado'}</div>
                        <div style={{ fontSize: 12.5, color: 'var(--ink)', opacity: 0.7 }}>
                          {reserva.clientes?.cpf || 'Sem CPF'} • {reserva.clientes?.telefone}
                        </div>
                      </td>
                      <td style={{ color: 'var(--ink)', fontWeight: 500 }}>
                        {reserva.pacotes?.nome || 'Pacote não encontrado'}
                      </td>
                      <td style={{ color: 'var(--forest-deep)', fontWeight: 500 }}>
                        {formatarMoeda(reserva.valor_pago)}
                        <div style={{ fontSize: 11.5, opacity: 0.6, fontWeight: 400, marginTop: 2 }}>{reserva.forma_pagamento || '-'}</div>
                      </td>
                      <td>
                        <span style={{ padding: '4px 8px', borderRadius: 999, fontSize: 11.5, fontWeight: 600, letterSpacing: '0.02em', ...badgeStyle }}>
                          {reserva.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Link to={`/admin/reservas/${reserva.id}`} className="ui-icon-btn" title="Editar">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                            </svg>
                          </Link>
                          <button
                            type="button"
                            className="ui-icon-btn danger"
                            onClick={(e) => handleDelete(e, reserva)}
                            disabled={deletingId === reserva.id}
                            title="Remover"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                              <path d="M3 6h18" />
                              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}