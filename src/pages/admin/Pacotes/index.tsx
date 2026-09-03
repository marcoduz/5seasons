import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/services/supabase';
import type { Pacote } from '@/types';
import '../admin-theme.css';

interface PacoteComExpedicao extends Pacote {
  expedicoes?: { nome: string };
}

export function PacotesList() {
  const [pacotes, setPacotes] = useState<PacoteComExpedicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Estados dos filtros
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('');
  const [dataFiltro, setDataFiltro] = useState('');
  const [vagasFiltro, setVagasFiltro] = useState(''); // 'com_vagas' ou 'esgotado'

  useEffect(() => {
    fetchPacotes();
  }, []);

  async function fetchPacotes() {
    setLoading(true);
    setError('');
    
    const { data, error } = await supabase
      .from('pacotes')
      .select('*, expedicoes(nome)')
      .order('data_inicio', { ascending: true });

    if (error) {
      setError('Não foi possível carregar os pacotes.');
    } else {
      setPacotes(data ?? []);
    }
    setLoading(false);
  }

  async function handleDelete(e: React.MouseEvent, pacote: Pacote) {
    e.preventDefault();
    e.stopPropagation();

    const confirmado = window.confirm(
      `Remover o pacote "${pacote.nome}"?\nAtenção: Você não poderá excluir se houver reservas vinculadas a ele.`
    );
    if (!confirmado) return;

    setDeletingId(pacote.id);
    const { error } = await supabase.from('pacotes').delete().eq('id', pacote.id);
    setDeletingId(null);

    if (error) {
      window.alert('Erro ao excluir. Verifique se existem reservas ativas neste pacote.');
      return;
    }

    setPacotes((prev) => prev.filter((p) => p.id !== pacote.id));
  }

  function formatarData(dataString: string) {
    if (!dataString) return '-';
    const [ano, mes, dia] = dataString.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  function formatarMoeda(valor: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  }

  // Lógica de filtragem avançada
  const pacotesFiltrados = useMemo(() => {
    return pacotes.filter((pacote) => {
      // 1. Filtro por texto (Nome do pacote ou nome da expedição)
      const termo = busca.toLowerCase().trim();
      const nomePacote = (pacote.nome || '').toLowerCase();
      const nomeExpedicao = (pacote.expedicoes?.nome || '').toLowerCase();
      const matchBusca = !termo || nomePacote.includes(termo) || nomeExpedicao.includes(termo);

      // 2. Filtro por Status
      const matchStatus = !statusFiltro || pacote.status === statusFiltro;

      // 3. Filtro por Data (se a viagem acontece ou engloba a data escolhida)
      const matchData = !dataFiltro || (pacote.data_inicio <= dataFiltro && pacote.data_fim >= dataFiltro);

      // 4. Filtro por Vagas
      const temVagas = (pacote.vagas_ocupadas || 0) < pacote.vagas;
      let matchVagas = true;
      if (vagasFiltro === 'com_vagas') {
        matchVagas = temVagas && pacote.status === 'Ativo';
      } else if (vagasFiltro === 'esgotado') {
        matchVagas = !temVagas || pacote.status === 'Esgotado';
      }

      return matchBusca && matchStatus && matchData && matchVagas;
    });
  }, [pacotes, busca, statusFiltro, dataFiltro, vagasFiltro]);

  return (
    <div className="ui-page">
      <div className="ui-page-header">
        <div>
          <h1 className="ui-page-title">Pacotes (Datas e Valores)</h1>
          <p className="ui-page-subtitle">Gerencie as datas de saída, preços e vagas das suas expedições.</p>
        </div>
        <Link to="/admin/pacotes/new" className="ui-btn-solid">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
            <path d="M12 5v14M5 12h14" />
          </svg>
          Novo Pacote
        </Link>
      </div>

      {/* Barra de Filtros */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px', alignItems: 'center' }}>
        {/* Busca por texto */}
        <div className="ui-search" style={{ margin: 0, flex: '1 1 240px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por pacote ou expedição..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        {/* Filtro por Status */}
        <select
          value={statusFiltro}
          onChange={(e) => setStatusFiltro(e.target.value)}
          style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--cream)', background: 'var(--warm-white)', color: 'var(--ink)', fontSize: '14px', fontFamily: 'inherit' }}
        >
          <option value="">Todos os Status</option>
          <option value="Ativo">Ativo</option>
          <option value="Esgotado">Esgotado</option>
          <option value="Encerrado">Encerrado</option>
          <option value="Cancelado">Cancelado</option>
        </select>

        {/* Filtro por Data */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--warm-white)', border: '1px solid var(--cream)', borderRadius: '6px', padding: '4px 10px' }}>
          <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--forest-deep)' }}>Data:</span>
          <input
            type="date"
            value={dataFiltro}
            onChange={(e) => setDataFiltro(e.target.value)}
            style={{ border: 'none', background: 'transparent', fontSize: '14px', fontFamily: 'inherit', color: 'var(--ink)', outline: 'none' }}
          />
          {dataFiltro && (
            <button 
              type="button" 
              onClick={() => setDataFiltro('')} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: 'var(--danger-text)', padding: '0 4px' }}
              title="Limpar data"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filtro por Vagas */}
        <select
          value={vagasFiltro}
          onChange={(e) => setVagasFiltro(e.target.value)}
          style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--cream)', background: 'var(--warm-white)', color: 'var(--ink)', fontSize: '14px', fontFamily: 'inherit' }}
        >
          <option value="">Todas as Situações de Vagas</option>
          <option value="com_vagas">Com Vagas Disponíveis</option>
          <option value="esgotado">Esgotados</option>
        </select>
      </div>

      {loading && <div className="ui-state">Carregando pacotes...</div>}
      {!loading && error && <div className="ui-state" style={{ color: 'var(--danger-text)' }}>{error}</div>}

      {!loading && !error && pacotes.length === 0 && (
        <div className="ui-empty">
          <p>Nenhum pacote de viagem cadastrado ainda.</p>
          <Link to="/admin/pacotes/new" className="ui-btn-solid">
            Cadastrar primeiro pacote
          </Link>
        </div>
      )}

      {!loading && !error && pacotes.length > 0 && pacotesFiltrados.length === 0 && (
        <div className="ui-empty">
          <p>Nenhum pacote encontrado com os filtros selecionados.</p>
          <button 
            type="button" 
            className="ui-btn-ghost" 
            onClick={() => { setBusca(''); setStatusFiltro(''); setDataFiltro(''); setVagasFiltro(''); }}
          >
            Limpar filtros
          </button>
        </div>
      )}

      {!loading && !error && pacotesFiltrados.length > 0 && (
        <div style={{ backgroundColor: 'var(--warm-white)', border: '1px solid var(--cream)', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--cream)', backgroundColor: 'rgba(151, 183, 177, 0.08)', color: 'var(--forest-deep)' }}>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>Nome / Expedição</th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>Período</th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>Vagas</th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>Valor (Duplo)</th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '14px 16px', fontWeight: 600, width: 90 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {pacotesFiltrados.map((pacote) => {
                const esgotado = (pacote.vagas_ocupadas || 0) >= pacote.vagas;
                const badgeStyle = esgotado || pacote.status !== 'Ativo' 
                  ? { background: 'var(--danger-bg)', color: 'var(--danger-text)' }
                  : { background: 'rgba(151, 183, 177, 0.2)', color: 'var(--forest-deep)' };

                return (
                  <tr key={pacote.id} style={{ borderBottom: '1px solid var(--cream)', transition: 'background-color 0.15s ease' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--forest-deep)', marginBottom: 2 }}>{pacote.nome}</div>
                      <div style={{ fontSize: 12.5, color: 'var(--ink)', opacity: 0.65 }}>{pacote.expedicoes?.nome || 'Expedição não encontrada'}</div>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--ink)' }}>
                      {formatarData(pacote.data_inicio)} <br/>
                      <span style={{ fontSize: 12, opacity: 0.6 }}>até {formatarData(pacote.data_fim)}</span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontWeight: esgotado ? 600 : 400, color: esgotado ? 'var(--danger-text)' : 'inherit' }}>
                        {pacote.vagas_ocupadas || 0} / {pacote.vagas}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--forest-deep)', fontWeight: 500 }}>
                      {formatarMoeda(pacote.preco_duplo)}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ padding: '4px 8px', borderRadius: 999, fontSize: 11.5, fontWeight: 600, letterSpacing: '0.02em', ...badgeStyle }}>
                        {esgotado ? 'Esgotado' : pacote.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Link to={`/admin/pacotes/${pacote.id}`} className="ui-icon-btn" title="Editar">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                          </svg>
                        </Link>
                        <button
                          type="button"
                          className="ui-icon-btn danger"
                          onClick={(e) => handleDelete(e, pacote)}
                          disabled={deletingId === pacote.id}
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
  );
}