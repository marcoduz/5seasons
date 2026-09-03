import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PrivateRoute } from './privateRoute';
import { AdminLayout } from '@/pages/admin/Layout';
import { AdminLogin } from '@/pages/admin/Login';
import { AdminDashboard } from '@/pages/admin/Dashboard';
import { PacotesList } from '@/pages/admin/Pacotes';
import { PacoteForm } from '@/pages/admin/Pacotes/pacotesForm';
import { ExpedicoesList } from '@/pages/admin/Expedicoes';
import { ExpedicaoForm } from '@/pages/admin/Expedicoes/expedicaoForm';

const Home = () => <h1>Página Inicial Pública</h1>;

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        <Route element={<PrivateRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />

            <Route path="pacotes">
              <Route index element={<PacotesList />} />
              <Route path="new" element={<PacoteForm />} />
              <Route path=":id" element={<PacoteForm />} />
            </Route>

            <Route path="expedicoes">
              <Route index element={<ExpedicoesList />} />
              <Route path="new" element={<ExpedicaoForm />} />
              <Route path=":id" element={<ExpedicaoForm />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}