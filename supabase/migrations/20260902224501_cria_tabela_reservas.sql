
CREATE TABLE reservas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pacote_id UUID REFERENCES pacotes(id) ON DELETE RESTRICT,
  cliente_id UUID REFERENCES clientes(id) ON DELETE RESTRICT,
  valor_pago NUMERIC(10,2) NOT NULL DEFAULT 0,
  forma_pagamento TEXT,
  status TEXT DEFAULT 'Pendente',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Segurança (RLS)
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin total reservas" ON reservas FOR ALL USING (auth.role() = 'authenticated');