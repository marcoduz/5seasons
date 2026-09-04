import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PrivateRoute } from './privateRoute';

// Layouts
import { AdminLayout } from '@/pages/admin/Layout';
import { PublicLayout } from '@/pages/public/Layout';

// Páginas Públicas
import { HomePublica } from '@/pages/public/Home';
import { ExpedicaoPublica } from '@/pages/public/Expedicao';

// Páginas Admin
import { AdminLogin } from '@/pages/admin/Login';
import { AdminDashboard } from '@/pages/admin/Dashboard';
import { PacotesList } from '@/pages/admin/Pacotes';
import { PacoteForm } from '@/pages/admin/Pacotes/pacotesForm';
import { ExpedicoesList } from '@/pages/admin/Expedicoes';
import { ExpedicaoForm } from '@/pages/admin/Expedicoes/expedicaoForm';
import { ClientesList } from '@/pages/admin/Clientes';
import { ClienteForm } from '@/pages/admin/Clientes/clientesForm';
import { ReservasList } from '@/pages/admin/Reservas';
import { ReservaForm } from '@/pages/admin/Reservas/reservasForm';

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ==========================================
            ROTAS PÚBLICAS (COM HEADER E FOOTER)
        ========================================== */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePublica />} />
          <Route path="/expedicao/:id" element={<ExpedicaoPublica />} />
        </Route>

        {/* ==========================================
            ROTA PÚBLICA DE LOGIN (SEM LAYOUT)
        ========================================== */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* ==========================================
            ROTAS PRIVADAS (PAINEL ADMIN)
        ========================================== */}
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
            
            <Route path="clientes">
              <Route index element={<ClientesList />} />
              <Route path="new" element={<ClienteForm />} />
              <Route path=":id" element={<ClienteForm />} />
            </Route>
            
            <Route path="reservas">
              <Route index element={<ReservasList />} />
              <Route path="new" element={<ReservaForm/>} />
              <Route path=":id" element={<ReservaForm/>} />
            </Route>
          </Route>
        </Route>
        
      </Routes>
    </BrowserRouter>
  );
}