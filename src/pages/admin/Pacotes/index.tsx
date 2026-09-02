import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import type { Pacote } from '@/types';

export function PacotesList() {
  const [pacotes, setPacotes] = useState<Pacote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPacotes() {
      const { data, error } = await supabase
        .from('pacotes')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) setPacotes(data);
      setLoading(false);
    }
    loadPacotes();
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: '#18181b' }}>Gerenciar Pacotes</h1>
        <button style={{ padding: '10px 20px', backgroundColor: '#047857', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          + Novo Pacote
        </button>
      </div>

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <thead style={{ backgroundColor: '#e4e4e7' }}>
            <tr>
              <th style={{ padding: '12px', textAlign: 'left' }}>Nome (Interno)</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>País</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {pacotes.length === 0 ? (
              <tr><td colSpan={3} style={{ padding: '20px', textAlign: 'center' }}>Nenhum pacote cadastrado.</td></tr>
            ) : (
              pacotes.map((pacote) => (
                <tr key={pacote.id} style={{ borderBottom: '1px solid #e4e4e7' }}>
                  <td style={{ padding: '12px' }}>{pacote.nome}</td>
                  <td style={{ padding: '12px' }}>{pacote.pais}</td>
                  <td style={{ padding: '12px', display: 'flex', gap: '10px' }}>
                    <button style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}>Editar</button>
                    <button style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>Excluir</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}