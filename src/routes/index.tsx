import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PrivateRoute } from './privateRoute'; 
import { AdminLayout } from '@/pages/admin/Layout';
import { AdminLogin } from '@/pages/admin/Login';
import { AdminDashboard } from '@/pages/admin/Dashboard';
import { PacotesList } from '@/pages/admin/Pacotes';
import { PacoteForm } from '@/pages/admin/Pacotes/form'; 

const Home = () => <h1>Página Inicial Pública</h1>;
const ExpedicoesList = () => <h1>Gerenciar Expedições (Em construção)</h1>;

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        <Route element={<PrivateRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/pacotes" element={<PacotesList />} />
            <Route path="/admin/pacotes/novo" element={<PacoteForm />} />
            <Route path="/admin/expedicoes" element={<ExpedicoesList />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}