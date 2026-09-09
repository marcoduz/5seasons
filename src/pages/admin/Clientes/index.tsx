import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/services/supabase';
import type { Cliente } from '@/types';
import '../admin-theme.css';

export function ClientesList() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busca, setBusca] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchClientes();
  }, []);

  async function fetchClientes() {
    setLoading(true);
    setError('');

    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('nome', { ascending: true });

    if (error) {
      setError('Não foi possível carregar os clientes.');
    } else {
      setClientes(data ?? []);
    }
    setLoading(false);
  }

  async function handleDelete(e: React.MouseEvent, cliente: Cliente) {
    e.preventDefault();
    e.stopPropagation();

    const confirmado = window.confirm(
      `Remover o cliente "${cliente.nome}"?\nAtenção: A exclusão falhará se houver reservas ativas vinculadas a este cliente.`
    );
    if (!confirmado) return;

    setDeletingId(cliente.id);
    const { error } = await supabase.from('clientes').delete().eq('id', cliente.id);
    setDeletingId(null);

    if (error) {
      window.alert('Não é possível excluir este cliente pois existem reservas vinculadas a ele no histórico.');
      return;
    }

    setClientes((prev) => prev.filter((c) => c.id !== cliente.id));
  }

  const clientesFiltrados = useMemo(() => {
    const termo = busca.toLowerCase().trim();
    if (!termo) return clientes;
    return clientes.flatMap((c) => {
      const nomeMatch = c.nome.toLowerCase().includes(termo);
      const emailMatch = (c.email || '').toLowerCase().includes(termo);
      const cpfMatch = (c.cpf || '').includes(termo);
      const telMatch = (c.telefone || '').includes(termo);
      return nomeMatch || emailMatch || cpfMatch || telMatch ? [c] : [];
    });
  }, [clientes, busca]);

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

      {/* ÁREA SUPERIOR FIXA (Cabeçalho e Busca) */}
      <div style={{ flexShrink: 0 }}>
        <div className="ui-page-header">
          <div>
            <h1 className="ui-page-title">Clientes</h1>
            <p className="ui-page-subtitle">Gerencie o cadastro, documentos e histórico de contato dos viajantes.</p>
          </div>
          <Link to="/admin/clientes/new" className="ui-btn-solid">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
              <path d="M12 5v14M5 12h14" />
            </svg>
            Novo Cliente
          </Link>
        </div>

        {/* Barra de Busca */}
        <div className="ui-search" style={{ marginBottom: '24px', maxWidth: '400px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nome, e-mail, CPF ou telefone..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
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
        {loading && <div className="ui-state">Carregando clientes...</div>}
        {!loading && error && <div className="ui-state" style={{ color: 'var(--danger-text)' }}>{error}</div>}

        {!loading && !error && clientes.length === 0 && (
          <div className="ui-empty">
            <p>Nenhum cliente cadastrado ainda.</p>
            <Link to="/admin/clientes/new" className="ui-btn-solid">
              Cadastrar primeiro cliente
            </Link>
          </div>
        )}

        {!loading && !error && clientes.length > 0 && clientesFiltrados.length === 0 && (
          <div className="ui-state">Nenhum cliente encontrado para "{busca}".</div>
        )}

        {!loading && !error && clientesFiltrados.length > 0 && (
          /* Substituindo estilos inline pelas classes do admin-theme.css */
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nome / Contato</th>
                  <th>Documentos</th>
                  <th>Instagram</th>
                  <th style={{ width: 90 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {clientesFiltrados.map((cliente) => (
                  <tr key={cliente.id} style={{ transition: 'background-color 0.15s ease' }}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--forest-deep)', marginBottom: 2 }}>{cliente.nome}</div>
                      <div style={{ fontSize: 12.5, color: 'var(--ink)', opacity: 0.7 }}>
                        {cliente.email || 'Sem e-mail'} • {cliente.telefone}
                      </div>
                    </td>
                    <td style={{ color: 'var(--ink)' }}>
                      <div><strong>CPF:</strong> {cliente.cpf || 'Não informado'}</div>
                      <div style={{ opacity: 0.75 }}><strong>Passaporte:</strong> {cliente.passaporte || 'Não informado'}</div>
                    </td>
                    <td style={{ color: 'var(--ink)' }}>
                      {cliente.instagram ? (
                        <a href={`https://instagram.com/${cliente.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" style={{ color: 'var(--forest)', textDecoration: 'none', fontWeight: 500 }}>
                          {cliente.instagram}
                        </a>
                      ) : (
                        <span style={{ opacity: 0.5 }}>-</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Link to={`/admin/clientes/${cliente.id}`} className="ui-icon-btn" title="Editar">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                          </svg>
                        </Link>
                        <button
                          type="button"
                          className="ui-icon-btn danger"
                          onClick={(e) => handleDelete(e, cliente)}
                          disabled={deletingId === cliente.id}
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}