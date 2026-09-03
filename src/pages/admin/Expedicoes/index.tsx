import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/services/supabase';
import type { Expedicao } from '@/types/index';
import '../admin-theme.css';

export function ExpedicoesList() {
  const [expedicoes, setExpedicoes] = useState<Expedicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchExpedicoes();
  }, []);

  async function fetchExpedicoes() {
    setLoading(true);
    setError('');

    const { data, error } = await supabase
      .from('expedicoes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setError('Não foi possível carregar as expedições.');
    } else {
      setExpedicoes(data ?? []);
    }
    setLoading(false);
  }

  async function handleDelete(e: React.MouseEvent, expedicao: Expedicao) {
    e.preventDefault();
    e.stopPropagation();

    const confirmado = window.confirm(
      `Remover a expedição "${expedicao.nome}"? Isso também apaga o roteiro cadastrado.`
    );
    if (!confirmado) return;

    setDeletingId(expedicao.id);
    const { error } = await supabase.from('expedicoes').delete().eq('id', expedicao.id);
    setDeletingId(null);

    if (error) {
      window.alert('Não foi possível remover essa expedição.');
      return;
    }
    setExpedicoes((prev) => prev.filter((exp) => exp.id !== expedicao.id));
  }

  const filtradas = useMemo(() => {
    const termo = search.trim().toLowerCase();
    if (!termo) return expedicoes;
    return expedicoes.filter(
      (exp) =>
        exp.nome.toLowerCase().includes(termo) ||
        exp.pais.toLowerCase().includes(termo) ||
        exp.tipo_destino.toLowerCase().includes(termo)
    );
  }, [expedicoes, search]);

  return (
    <div className="ui-page">
      <div className="ui-page-header">
        <div>
          <h1 className="ui-page-title">Expedições</h1>
          <p className="ui-page-subtitle">Cadastre destinos, conteúdo e roteiro de cada expedição.</p>
        </div>
        <Link to="/admin/expedicoes/new" className="ui-btn-solid">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nova Expedição
        </Link>
      </div>

      {!loading && expedicoes.length > 0 && (
        <div className="ui-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nome, país ou tipo de destino..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {loading && <div className="ui-state">Carregando expedições...</div>}
      {!loading && error && <div className="ui-state">{error}</div>}

      {!loading && !error && expedicoes.length === 0 && (
        <div className="ui-empty">
          <p>Nenhuma expedição cadastrada ainda.</p>
          <Link to="/admin/expedicoes/new" className="ui-btn-solid">
            Cadastrar primeira expedição
          </Link>
        </div>
      )}

      {!loading && !error && expedicoes.length > 0 && filtradas.length === 0 && (
        <div className="ui-state">Nenhuma expedição encontrada para "{search}".</div>
      )}

      {!loading && !error && filtradas.length > 0 && (
        <div className="ui-card-grid">
          {filtradas.map((exp) => (
            <Link to={`/admin/expedicoes/${exp.id}`} className="ui-exp-card" key={exp.id}>
              <div className="ui-exp-card-photo">
                {exp.fotos?.[0] ? (
                  <img src={exp.fotos[0]} alt={exp.nome} />
                ) : (
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <circle cx="9" cy="10" r="1.5" />
                    <path d="m21 16-5-5-4 4-3-3-6 6" />
                  </svg>
                )}
              </div>
              <div className="ui-exp-card-body">
                <p className="ui-exp-card-title">{exp.nome}</p>
                <p className="ui-exp-card-meta">
                  {exp.pais}
                  {exp.tipo_destino ? ` · ${exp.tipo_destino}` : ''}
                </p>
                {exp.categorias?.length > 0 && (
                  <div className="ui-exp-card-chips">
                    {exp.categorias.slice(0, 3).map((cat) => (
                      <span className="ui-chip-sm" key={cat}>
                        {cat}
                      </span>
                    ))}
                    {exp.categorias.length > 3 && (
                      <span className="ui-chip-sm">+{exp.categorias.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
              <div className="ui-exp-card-actions">
                <button
                  className="ui-icon-btn danger"
                  onClick={(e) => handleDelete(e, exp)}
                  disabled={deletingId === exp.id}
                  title="Remover"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M3 6h18" />
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  </svg>
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}