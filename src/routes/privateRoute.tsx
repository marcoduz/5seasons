import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../services/supabase';

export function PrivateRoute() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAuth() {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
    }
    checkAuth();
  }, []);

  // Enquanto o Supabase pensa, exibe uma tela em branco ou loading
  if (isAuthenticated === null) return <div>Carregando...</div>;

  // Se não tem sessão, manda para o login. Se tem, renderiza as telas do admin
  return isAuthenticated ? <Outlet /> : <Navigate to="/admin/login" replace />;
}