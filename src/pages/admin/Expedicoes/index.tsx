import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/services/supabase";
import "../admin-theme.css";

export function ExpedicoesList() {
  const [expedicoes, setExpedicoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busca, setBusca] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchExpedicoes();
  }, []);

  async function fetchExpedicoes() {
    setLoading(true);
    setError("");

    // OTIMIZAÇÃO: Busca apenas as colunas usadas no card (ignora descrições gigantes)
    const { data, error } = await supabase
      .from("expedicoes")
      .select("id, nome, pais, tipo_destino, categorias, fotos")
      .order("nome", { ascending: true });

    if (error) {
      setError("Não foi possível carregar as expedições.");
    } else {
      setExpedicoes(data ?? []);
    }
    setLoading(false);
  }

  async function handleDelete(e: React.MouseEvent, expedicao: any) {
    e.preventDefault();
    e.stopPropagation();

    const confirmado = window.confirm(
      `Remover a expedição "${expedicao.nome}"?\nIsso não poderá ser desfeito se não houver pacotes atrelados.`,
    );
    if (!confirmado) return;

    setDeletingId(expedicao.id);
    const { error } = await supabase
      .from("expedicoes")
      .delete()
      .eq("id", expedicao.id);
    setDeletingId(null);

    if (error) {
      window.alert(
        "Erro ao excluir. Verifique se existem pacotes vinculados a esta expedição.",
      );
      return;
    }

    setExpedicoes((prev) => prev.filter((p) => p.id !== expedicao.id));
  }

  const expedicoesFiltradas = useMemo(() => {
    const termo = busca.toLowerCase().trim();
    if (!termo) return expedicoes;
    return expedicoes.filter(
      (exp) =>
        (exp.nome && exp.nome.toLowerCase().includes(termo)) ||
        (exp.tipo_destino && exp.tipo_destino.toLowerCase().includes(termo)) ||
        (exp.pais && exp.pais.toLowerCase().includes(termo)),
    );
  }, [expedicoes, busca]);

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
        
        /* Estilização elegante para a barra de rolagem exclusiva da listagem */
        .scroll-area::-webkit-scrollbar { width: 8px; }
        .scroll-area::-webkit-scrollbar-track { background: transparent; }
        .scroll-area::-webkit-scrollbar-thumb { background: rgba(38, 51, 47, 0.15); border-radius: 10px; }
        .scroll-area::-webkit-scrollbar-thumb:hover { background: rgba(38, 51, 47, 0.3); }

        .exp-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 24px;
        }
        
        .exp-card {
          background: white;
          border: 1px solid var(--cream);
          border-radius: 12px;
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
          display: flex;
          flex-direction: column;
          text-decoration: none;
        }
        .exp-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.06);
        }
        .exp-img {
          width: 100%;
          height: 180px;
          object-fit: cover;
          background: #e8dad1;
        }
        .exp-content {
          padding: 20px;
          flex: 1;
        }
        .exp-title {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          font-weight: 600;
          color: var(--forest-deep);
          margin: 0 0 4px;
        }
        .exp-subtitle {
          font-size: 13px;
          color: var(--text-muted);
          margin-bottom: 16px;
        }
        .ui-exp-card-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .ui-chip-sm {
          background: var(--verde-claro);
          color: var(--verde-escuro);
          padding: 4px 10px;
          border-radius: 99px;
          font-size: 11px;
          font-weight: 600;
        }
        .exp-actions {
          border-top: 1px solid var(--cream);
          padding: 12px 20px;
          display: flex;
          justify-content: flex-end;
          background: #fafaf9;
        }
      `}</style>

      {/* ÁREA SUPERIOR FIXA (Cabeçalho e Filtros) */}
      <div style={{ flexShrink: 0 }}>
        <div className="ui-page-header">
          <div>
            <h1 className="ui-page-title">Expedições</h1>
            <p className="ui-page-subtitle">
              Cadastre destinos, conteúdo e roteiro de cada expedição.
            </p>
          </div>
          <Link to="/admin/expedicoes/new" className="ui-btn-solid">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ marginRight: 6 }}
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nova Expedição
          </Link>
        </div>

        <div style={{ marginBottom: "24px", display: "flex", gap: "12px" }}>
          <div
            className="ui-search"
            style={{ margin: 0, maxWidth: "400px", flex: 1 }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por nome, país ou tipo de destino..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ÁREA DE ROLAGEM EXCLUSIVA DA LISTAGEM */}
      <div
        className="scroll-area"
        style={{
          flex: 1,
          overflowY: "auto",
          paddingRight: "12px",
          paddingBottom: "32px",
        }}
      >
        {loading && <div className="ui-state">Carregando expedições...</div>}
        {!loading && error && (
          <div className="ui-state" style={{ color: "var(--danger-text)" }}>
            {error}
          </div>
        )}

        {!loading && !error && expedicoes.length === 0 && (
          <div className="ui-empty">
            <p>Nenhuma expedição cadastrada ainda.</p>
            <Link to="/admin/expedicoes/new" className="ui-btn-solid">
              Cadastrar primeira expedição
            </Link>
          </div>
        )}

        {!loading &&
          !error &&
          expedicoesFiltradas.length === 0 &&
          expedicoes.length > 0 && (
            <div className="ui-empty">
              <p>Nenhuma expedição encontrada para a busca atual.</p>
              <button
                type="button"
                className="ui-btn-ghost"
                onClick={() => setBusca("")}
              >
                Limpar busca
              </button>
            </div>
          )}

        {!loading && !error && expedicoesFiltradas.length > 0 && (
          <div className="exp-grid">
            {expedicoesFiltradas.map((exp) => {
              const imagemCapa =
                exp.fotos && exp.fotos.length > 0 ? exp.fotos[0] : "";

              return (
                <Link
                  to={`/admin/expedicoes/${exp.id}`}
                  className="exp-card"
                  key={exp.id}
                >
                  <img src={imagemCapa} alt={exp.nome} className="exp-img" />

                  <div className="exp-content">
                    <h3 className="exp-title">{exp.nome}</h3>
                    <div className="exp-subtitle">
                      {exp.pais} - {exp.tipo_destino}
                    </div>

                    {exp.categorias?.length > 0 && (
                      <div className="ui-exp-card-chips">
                        {exp.categorias.slice(0, 3).map((cat: string) => (
                          <span className="ui-chip-sm" key={cat}>
                            {cat}
                          </span>
                        ))}
                        {exp.categorias.length > 3 && (
                          <span className="ui-chip-sm">
                            +{exp.categorias.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* COMENTADO A PARTE DE EXCLUSÂO DA EXPEDIÇÂO POIS PODE TER PROBLEMAS */}
                  {/* <div className="exp-actions">
                    <button
                      type="button"
                      className="ui-icon-btn danger"
                      onClick={(e) => handleDelete(e, exp)}
                      disabled={deletingId === exp.id}
                      title="Remover"
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <path d="M3 6h18" />
                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      </svg>
                    </button>
                  </div> */}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}