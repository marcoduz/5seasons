import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/services/supabase';

export function PacoteForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Estados dos campos básicos
  const [nome, setNome] = useState('');
  const [pais, setPais] = useState('');
  const [tipoDestino, setTipoDestino] = useState('Nacional');
  const [descricao, setDescricao] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('pacotes').insert([
      {
        nome,
        pais,
        tipo_destino: tipoDestino,
        descricao,
        // Arrays vazios por enquanto para não dar erro no banco
        categorias: [],
        fotos: [],
        incluso: [],
        nao_incluso: [],
        observacoes: []
      }
    ]);

    setLoading(false);

    if (error) {
      alert('Erro ao salvar o pacote. Verifique o console.');
      console.error(error);
    } else {
      navigate('/admin/pacotes');
    }
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: '#18181b' }}>Novo Pacote Base</h1>
        <button onClick={() => navigate('/admin/pacotes')} style={{ padding: '8px 16px', background: '#e4e4e7', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Voltar
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        
        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '14px', fontWeight: '500' }}>Nome Interno (Ex: Turquia Clássica 7 Dias)</label>
            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required style={{ padding: '10px', borderRadius: '4px', border: '1px solid #d4d4d8' }} />
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '14px', fontWeight: '500' }}>País</label>
            <input type="text" value={pais} onChange={(e) => setPais(e.target.value)} required style={{ padding: '10px', borderRadius: '4px', border: '1px solid #d4d4d8' }} />
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '14px', fontWeight: '500' }}>Tipo</label>
            <select value={tipoDestino} onChange={(e) => setTipoDestino(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #d4d4d8' }}>
              <option value="Nacional">Nacional</option>
              <option value="Internacional">Internacional</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '14px', fontWeight: '500' }}>Descrição Resumida</label>
          <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={4} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #d4d4d8', resize: 'vertical' }} />
        </div>

        <button type="submit" disabled={loading} style={{ padding: '12px', backgroundColor: '#047857', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '10px' }}>
          {loading ? 'Salvando...' : 'Salvar Pacote'}
        </button>
      </form>
    </div>
  );
}