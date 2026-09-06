import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/services/supabase";
import type { Pacote } from "@/types";
import "../admin-theme.css";

interface PacoteComExpedicao extends Pacote {
  expedicoes?: { nome: string };
  oculto?: boolean;
}

const VISIBILIDADE_OPCOES = ["Visíveis", "Ocultos", "Todos"];

export function PacotesList() {
  const [pacotes, setPacotes] = useState<PacoteComExpedicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("");
  const [dataFiltro, setDataFiltro] = useState("");
  const [vagasFiltro, setVagasFiltro] = useState("");
  const [visibilidadeFiltro, setVisibilidadeFiltro] = useState("Visíveis"); // Padrão: Visíveis

  const filterBarRef = useRef<HTMLDivElement>(null);
  const filterBtnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [filterPill, setFilterPill] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  });

  useEffect(() => {
    fetchPacotes();
  }, []);

  function updateFilterPill() {
    const activeIndex = VISIBILIDADE_OPCOES.indexOf(visibilidadeFiltro);
    const activeEl = filterBtnRefs.current[activeIndex];
    const barEl = filterBarRef.current;

    if (!activeEl || !barEl) {
      setFilterPill((p) => ({ ...p, opacity: 0 }));
      return;
    }

    const barRect = barEl.getBoundingClientRect();
    const btnRect = activeEl.getBoundingClientRect();
    setFilterPill({
      left: btnRect.left - barRect.left,
      width: btnRect.width,
      opacity: 1,
    });
  }

  useLayoutEffect(() => {
    updateFilterPill();
  }, [visibilidadeFiltro]);

  useEffect(() => {
    window.addEventListener("resize", updateFilterPill);
    setTimeout(updateFilterPill, 100);
    return () => window.removeEventListener("resize", updateFilterPill);
  }, []);

  async function fetchPacotes() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("pacotes")
      .select("*, expedicoes(nome)")
      .order("data_inicio", { ascending: true });

    if (error) {
      setError("Não foi possível carregar os pacotes.");
    } else {
      setPacotes(data ?? []);
    }
    setLoading(false);
  }

  async function handleDelete(e: React.MouseEvent, pacote: Pacote) {
    e.preventDefault();
    e.stopPropagation();

    const confirmado = window.confirm(
      `Remover o pacote "${pacote.nome}"?\nAtenção: Você não poderá excluir se houver reservas vinculadas a ele.`,
    );
    if (!confirmado) return;

    setDeletingId(pacote.id);
    const { error } = await supabase
      .from("pacotes")
      .delete()
      .eq("id", pacote.id);
    setDeletingId(null);

    if (error) {
      window.alert(
        "Erro ao excluir. Verifique se existem reservas ativas neste pacote.",
      );
      return;
    }

    setPacotes((prev) => prev.filter((p) => p.id !== pacote.id));
  }

  function formatarData(dataString: string) {
    if (!dataString) return "-";
    const [ano, mes, dia] = dataString.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  function formatarMoeda(valor: number) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  }

  // Lógica de filtragem avançada
  const pacotesFiltrados = useMemo(() => {
    return pacotes.filter((pacote) => {
      // 1. Filtro por texto
      const termo = busca.toLowerCase().trim();
      const nomePacote = (pacote.nome || "").toLowerCase();
      const nomeExpedicao = (pacote.expedicoes?.nome || "").toLowerCase();
      const matchBusca =
        !termo || nomePacote.includes(termo) || nomeExpedicao.includes(termo);

      // 2. Filtro por Status
      const matchStatus = !statusFiltro || pacote.status === statusFiltro;

      // 3. Filtro por Data
      const matchData =
        !dataFiltro ||
        (pacote.data_inicio <= dataFiltro && pacote.data_fim >= dataFiltro);

      // 4. Filtro por Vagas
      const temVagas = (pacote.vagas_ocupadas || 0) < pacote.vagas;
      let matchVagas = true;
      if (vagasFiltro === "com_vagas") {
        matchVagas = temVagas && pacote.status === "Ativo";
      } else if (vagasFiltro === "esgotado") {
        matchVagas = !temVagas || pacote.status === "Esgotado";
      }

      // 5. Filtro de Visibilidade
      let matchVisibilidade = true;
      if (visibilidadeFiltro === "Visíveis") {
        matchVisibilidade = pacote.oculto == false;
      } else if (visibilidadeFiltro === "Ocultos") {
        matchVisibilidade = pacote.oculto === true;
      }

      return (
        matchBusca &&
        matchStatus &&
        matchData &&
        matchVagas &&
        matchVisibilidade
      );
    });
  }, [
    pacotes,
    busca,
    statusFiltro,
    dataFiltro,
    vagasFiltro,
    visibilidadeFiltro,
  ]);

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

        /* Estilos do filtro em pílula */
        .admin-pill-bar {
          position: relative;
          display: inline-flex;
          background: rgba(151, 183, 177, 0.15);
          padding: 4px;
          border-radius: 99px;
          align-items: center;
        }
        .admin-pill-bg {
          position: absolute;
          top: 4px;
          bottom: 4px;
          background: white;
          border-radius: 99px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.06);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 1;
        }
        .admin-pill-btn {
          position: relative;
          z-index: 2;
          background: transparent;
          border: none;
          padding: 6px 16px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-muted);
          cursor: pointer;
          transition: color 0.3s;
          font-family: inherit;
        }
        .admin-pill-btn.active {
          color: var(--forest-deep);
        }
      `}</style>

      {/* ÁREA SUPERIOR FIXA (Cabeçalho e Filtros) */}
      <div style={{ flexShrink: 0 }}>
        <div className="ui-page-header">
          <div>
            <h1 className="ui-page-title">Pacotes (Datas e Valores)</h1>
            <p className="ui-page-subtitle">
              Gerencie as datas de saída, preços e vagas das suas expedições.
            </p>
          </div>
          <Link to="/admin/pacotes/new" className="ui-btn-solid">
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
            Novo Pacote
          </Link>
        </div>

        {/* Barra de Filtros */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "24px",
            alignItems: "center",
          }}
        >

          {/* Busca por texto */}
          <div className="ui-search" style={{ margin: 0, flex: "1 1 200px" }}>
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
              placeholder="Buscar pacote..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          {/* Nova Pílula de Visibilidade */}
          <div className="admin-pill-bar" ref={filterBarRef}>
            <div
              className="admin-pill-bg"
              style={{
                left: filterPill.left,
                width: filterPill.width,
                opacity: filterPill.opacity,
              }}
            />
            {VISIBILIDADE_OPCOES.map((filtro, i) => (
              <button
                key={filtro}
                ref={(el) => {
                  filterBtnRefs.current[i] = el;
                }}
                className={`admin-pill-btn ${visibilidadeFiltro === filtro ? "active" : ""}`}
                onClick={() => setVisibilidadeFiltro(filtro)}
              >
                {filtro}
              </button>
            ))}
          </div>

          {/* Filtro por Status */}
          <select
            value={statusFiltro}
            onChange={(e) => setStatusFiltro(e.target.value)}
            style={{
              padding: "10px 12px",
              borderRadius: "6px",
              border: "1px solid var(--cream)",
              background: "var(--warm-white)",
              color: "var(--ink)",
              fontSize: "13px",
              fontFamily: "inherit",
            }}
          >
            <option value="">Todos os Status</option>
            <option value="Ativo">Ativo</option>
            <option value="Esgotado">Esgotado</option>
            <option value="Em breve">Em breve</option>
            <option value="Encerrado">Encerrado</option>
            <option value="Cancelado">Cancelado</option>
          </select>

          {/* Filtro por Data */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "var(--warm-white)",
              border: "1px solid var(--cream)",
              borderRadius: "6px",
              padding: "4px 10px",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--forest-deep)",
              }}
            >
              Data:
            </span>
            <input
              type="date"
              value={dataFiltro}
              onChange={(e) => setDataFiltro(e.target.value)}
              style={{
                border: "none",
                background: "transparent",
                fontSize: "13px",
                fontFamily: "inherit",
                color: "var(--ink)",
                outline: "none",
              }}
            />
            {dataFiltro && (
              <button
                type="button"
                onClick={() => setDataFiltro("")}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "var(--danger-text)",
                  padding: "0 4px",
                }}
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
            style={{
              padding: "10px 12px",
              borderRadius: "6px",
              border: "1px solid var(--cream)",
              background: "var(--warm-white)",
              color: "var(--ink)",
              fontSize: "13px",
              fontFamily: "inherit",
            }}
          >
            <option value="">Todas as Vagas</option>
            <option value="com_vagas">Com Vagas</option>
            <option value="esgotado">Esgotados</option>
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
          paddingBottom: "32px",
        }}
      >
        {loading && <div className="ui-state">Carregando pacotes...</div>}
        {!loading && error && (
          <div className="ui-state" style={{ color: "var(--danger-text)" }}>
            {error}
          </div>
        )}

        {!loading && !error && pacotes.length === 0 && (
          <div className="ui-empty">
            <p>Nenhum pacote de viagem cadastrado ainda.</p>
            <Link to="/admin/pacotes/new" className="ui-btn-solid">
              Cadastrar primeiro pacote
            </Link>
          </div>
        )}

        {!loading &&
          !error &&
          pacotes.length > 0 &&
          pacotesFiltrados.length === 0 && (
            <div className="ui-empty">
              <p>Nenhum pacote encontrado com os filtros selecionados.</p>
              <button
                type="button"
                className="ui-btn-ghost"
                onClick={() => {
                  setBusca("");
                  setStatusFiltro("");
                  setDataFiltro("");
                  setVagasFiltro("");
                  setVisibilidadeFiltro("Visíveis");
                }}
              >
                Limpar filtros
              </button>
            </div>
          )}

        {!loading && !error && pacotesFiltrados.length > 0 && (
          <div
            style={{
              backgroundColor: "var(--warm-white)",
              border: "1px solid var(--cream)",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                fontSize: 14,
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid var(--cream)",
                    backgroundColor: "rgba(151, 183, 177, 0.08)",
                    color: "var(--forest-deep)",
                  }}
                >
                  <th style={{ padding: "14px 16px", fontWeight: 600 }}>
                    Nome / Expedição
                  </th>
                  <th style={{ padding: "14px 16px", fontWeight: 600 }}>
                    Período
                  </th>
                  <th style={{ padding: "14px 16px", fontWeight: 600 }}>
                    Vagas
                  </th>
                  <th style={{ padding: "14px 16px", fontWeight: 600 }}>
                    Valor (Duplo)
                  </th>
                  <th style={{ padding: "14px 16px", fontWeight: 600 }}>
                    Status
                  </th>
                  <th
                    style={{ padding: "14px 16px", fontWeight: 600, width: 90 }}
                  >
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {pacotesFiltrados.map((pacote) => {
                  const esgotado = (pacote.vagas_ocupadas || 0) >= pacote.vagas;
                  const isOculto = pacote.oculto === true;

                  let badgeStyle = {
                    background: "rgba(151, 183, 177, 0.2)",
                    color: "var(--forest-deep)",
                  };

                  if (
                    esgotado ||
                    pacote.status === "Esgotado" ||
                    pacote.status === "Cancelado" ||
                    pacote.status === "Encerrado"
                  ) {
                    badgeStyle = {
                      background: "var(--danger-bg)",
                      color: "var(--danger-text)",
                    };
                  } else if (pacote.status === "Em breve") {
                    badgeStyle = { background: "#fef3c7", color: "#d97706" };
                  }

                  return (
                    <tr
                      key={pacote.id}
                      style={{
                        borderBottom: "1px solid var(--cream)",
                        transition: "background-color 0.15s ease",
                        opacity: isOculto ? 0.75 : 1,
                      }}
                    >
                      <td style={{ padding: "14px 16px" }}>
                        <div
                          style={{
                            fontWeight: 600,
                            color: "var(--forest-deep)",
                            marginBottom: 2,
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          {pacote.nome}

                          {/* SINALIZADOR VISUAL DE PACOTE OCULTO */}
                          {isOculto && (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "3px",
                                fontSize: "10px",
                                background: "#e2e8f0",
                                color: "#475569",
                                padding: "2px 6px",
                                borderRadius: "99px",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                              }}
                              title="Este pacote não aparece no site público"
                            >
                              <svg
                                width="10"
                                height="10"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                                <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                                <line x1="2" y1="2" x2="22" y2="22" />
                              </svg>
                              Oculto
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: 12.5,
                            color: "var(--ink)",
                            opacity: 0.65,
                          }}
                        >
                          {pacote.expedicoes?.nome ||
                            "Expedição não encontrada"}
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px", color: "var(--ink)" }}>
                        {formatarData(pacote.data_inicio)} <br />
                        <span style={{ fontSize: 12, opacity: 0.6 }}>
                          até {formatarData(pacote.data_fim)}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            fontWeight: esgotado ? 600 : 400,
                            color: esgotado ? "var(--danger-text)" : "inherit",
                          }}
                        >
                          {pacote.vagas_ocupadas || 0} / {pacote.vagas}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          color: "var(--forest-deep)",
                          fontWeight: 500,
                        }}
                      >
                        {formatarMoeda(pacote.preco_duplo)}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: 999,
                            fontSize: 11.5,
                            fontWeight: 600,
                            letterSpacing: "0.02em",
                            ...badgeStyle,
                          }}
                        >
                          {esgotado ? "Esgotado" : pacote.status}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <Link
                            to={`/admin/pacotes/${pacote.id}`}
                            className="ui-icon-btn"
                            title="Editar"
                          >
                            <svg
                              width="15"
                              height="15"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                            >
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
