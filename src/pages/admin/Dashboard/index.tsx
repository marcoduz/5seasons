import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/services/supabase';
import '../admin-theme.css';
import './dash.css'; // <-- Importando os estilos isolados

export function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [receitaTotal, setReceitaTotal] = useState(0);
  const [totalReservas, setTotalReservas] = useState(0);
  const [totalClientes, setTotalClientes] = useState(0);
  const [taxaOcupacao, setTaxaOcupacao] = useState(0);
  const [ultimasReservas, setUltimasReservas] = useState<any[]>([]);
  const [topPacotes, setTopPacotes] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);
    setError('');

    try {
      const [reservasRes, pacotesRes, clientesRes, ultimasRes] = await Promise.all([
        supabase.from('reservas').select('valor_pago, status'),
        supabase.from('pacotes').select('id, nome, vagas, vagas_ocupadas, status').in('status', ['Ativo', 'Esgotado']),
        supabase.from('clientes').select('id', { count: 'exact', head: true }),
        supabase.from('reservas')
          .select('id, valor_pago, status, created_at, pacotes(nome), clientes(nome)')
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      if (reservasRes.error) throw reservasRes.error;
      if (pacotesRes.error) throw pacotesRes.error;
      if (clientesRes.error) throw clientesRes.error;
      if (ultimasRes.error) throw ultimasRes.error;

      const reservas = reservasRes.data || [];
      const confirmadas = reservas.filter(r => r.status === 'Confirmada');
      const receita = confirmadas.reduce((acc, r) => acc + (Number(r.valor_pago) || 0), 0);
      
      setReceitaTotal(receita);
      setTotalReservas(confirmadas.length);
      setTotalClientes(clientesRes.count || 0);

      const pacotes = pacotesRes.data || [];
      let totalVagasGeral = 0;
      let totalOcupadasGeral = 0;

      const pacotesComOcupacao = pacotes.map(p => {
        const vagas = p.vagas || 0;
        const ocupadas = p.vagas_ocupadas || 0;
        totalVagasGeral += vagas;
        totalOcupadasGeral += ocupadas;

        const porcentagem = vagas > 0 ? Math.round((ocupadas / vagas) * 100) : 0;
        return { ...p, ocupadas, porcentagem };
      });

      const ocupacaoGlobal = totalVagasGeral > 0 ? (totalOcupadasGeral / totalVagasGeral) * 100 : 0;
      setTaxaOcupacao(Math.round(ocupacaoGlobal));

      const top3 = pacotesComOcupacao.sort((a, b) => b.porcentagem - a.porcentagem).slice(0, 3);
      setTopPacotes(top3);

      setUltimasReservas(ultimasRes.data || []);

    } catch (err) {
      console.error(err);
      setError('Não foi possível carregar os indicadores do dashboard.');
    } finally {
      setLoading(false);
    }
  }

  function formatarMoeda(valor: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(valor);
  }

  function formatarDataSimples(dataStr: string) {
    if (!dataStr) return '';
    const data = new Date(dataStr);
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

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
      {/* CABEÇALHO FIXO */}
      <div style={{ flexShrink: 0 }}>
        <div className="ui-page-header">
          <div>
            <h1 className="ui-page-title">Dashboard</h1>
            <p className="ui-page-subtitle">Bem-vindo de volta! Aqui estão os indicadores em tempo real das suas expedições.</p>
          </div>
          <Link to="/admin/reservas/new" className="ui-btn-solid">
            + Nova Venda
          </Link>
        </div>
      </div>

      {/* ÁREA ROLÁVEL COM MARGEM DE SEGURANÇA NO FIM */}
      <div className="scroll-area" style={{ flex: 1, overflowY: "auto", paddingRight: "12px", paddingBottom: "120px" }}>
        
        {loading ? (
          <div className="ui-state" style={{ padding: "80px 0" }}>Carregando métricas do painel...</div>
        ) : error ? (
          <div className="ui-state" style={{ color: 'var(--danger-text)' }}>{error}</div>
        ) : (
          <>
            {/* ROW 1: KPIS */}
            <div className="dash-kpis">
              <div className="dash-kpi-card">
                <div className="kpi-header">
                  Receita Confirmada
                  <div className="kpi-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
                </div>
                <h3 className="kpi-value">{formatarMoeda(receitaTotal)}</h3>
              </div>

              <div className="dash-kpi-card">
                <div className="kpi-header">
                  Reservas Confirmadas
                  <div className="kpi-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg></div>
                </div>
                <h3 className="kpi-value">{totalReservas}</h3>
              </div>

              <div className="dash-kpi-card">
                <div className="kpi-header">
                  Taxa de Ocupação Média
                  <div className="kpi-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg></div>
                </div>
                <h3 className="kpi-value">{taxaOcupacao}%</h3>
              </div>

              <div className="dash-kpi-card">
                <div className="kpi-header">
                  Total de Clientes
                  <div className="kpi-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg></div>
                </div>
                <h3 className="kpi-value">{totalClientes}</h3>
              </div>
            </div>

            {/* ROW 2: Painéis */}
            <div className="dash-row">
              
              {/* PAINEL ESQUERDO: Últimas Reservas */}
              <div className="dash-panel">
                <h2 className="panel-title">
                  Atividade Recente
                  <Link to="/admin/reservas" style={{ fontSize: '13px', color: 'var(--forest)', textDecoration: 'none', fontWeight: 500 }}>Ver todas</Link>
                </h2>

                {ultimasReservas.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', opacity: 0.6, fontSize: '14px' }}>Nenhuma reserva registrada ainda.</div>
                ) : (
                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Cliente</th>
                          <th>Pacote</th>
                          <th>Valor</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ultimasReservas.map(reserva => (
                          <tr key={reserva.id}>
                            <td>
                              <div style={{ fontWeight: 600, color: 'var(--forest-deep)' }}>{reserva.clientes?.nome || 'Cliente'}</div>
                              <div style={{ fontSize: '12px', opacity: 0.6 }}>{formatarDataSimples(reserva.created_at)}</div>
                            </td>
                            <td style={{ color: 'var(--ink)' }}>{reserva.pacotes?.nome || 'Pacote'}</td>
                            <td style={{ fontWeight: 600, color: 'var(--forest-deep)' }}>{formatarMoeda(reserva.valor_pago)}</td>
                            <td>
                              <span style={{ 
                                padding: '4px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, 
                                background: reserva.status === 'Confirmada' ? 'rgba(151,183,177,0.2)' : '#fef3c7',
                                color: reserva.status === 'Confirmada' ? 'var(--forest-deep)' : '#92400e'
                              }}>
                                {reserva.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* PAINEL DIREITO: Lotação dos Pacotes */}
              <div className="dash-panel">
                <h2 className="panel-title">Lotação (Destaques)</h2>
                
                {topPacotes.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', opacity: 0.6, fontSize: '14px' }}>Nenhum pacote ativo encontrado.</div>
                ) : (
                  topPacotes.map(pacote => {
                    let barClass = 'oc-bar';
                    if (pacote.porcentagem === 100) barClass += ' esgotado';
                    else if (pacote.porcentagem >= 80) barClass += ' esgotando';

                    return (
                      <div className="ocupacao-item" key={pacote.id}>
                        <div className="oc-header">
                          <span>{pacote.nome}</span>
                          <span>{pacote.porcentagem}%</span>
                        </div>
                        <div className="oc-track">
                          <div className={barClass} style={{ width: `${pacote.porcentagem}%` }}></div>
                        </div>
                        <div className="oc-sub" style={{ marginTop: '4px' }}>
                          {pacote.ocupadas} de {pacote.vagas} vagas preenchidas
                        </div>
                      </div>
                    );
                  })
                )}
                
                <Link to="/admin/pacotes" className="ui-btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: '24px' }}>
                  Gerenciar Pacotes
                </Link>
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
}