import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PrivateRoute } from './privateRoute';

// (Em breve criaremos essas páginas de verdade)
const Home = () => <h1>Página Inicial Pública</h1>;
const ViagemDetalhes = () => <h1>Detalhes da Expedição Pública</h1>;
const AdminLogin = () => <h1>Login do Administrador</h1>;
const AdminDashboard = () => <h1>Painel de Controle Admin</h1>;

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ============================== */}
        {/* ROTAS PÚBLICAS (Livre Acesso) */}
        {/* ============================== */}
        <Route path="/" element={<Home />} />
        <Route path="/expedicao/:id" element={<ViagemDetalhes />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* ============================== */}
        {/* ROTAS PRIVADAS (Apenas Admins) */}
        {/* ============================== */}
        <Route element={<PrivateRoute />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/pacotes" element={<h2>Gerenciar Pacotes</h2>} />
          <Route path="/admin/expedicoes" element={<h2>Gerenciar Expedições</h2>} />
        </Route>
        
      </Routes>
    </BrowserRouter>
  );
}