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

  if (isAuthenticated === null) return <div>Carregando...</div>;

  return isAuthenticated ? <Outlet /> : <Navigate to="/admin/login" replace />;
}