CREATE TABLE clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  instagram TEXT,
  data_nascimento DATE,
  cpf TEXT UNIQUE,
  passaporte TEXT,
  contato_emergencia TEXT,
  observacoes TEXT,
  aceita_ofertas BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Segurança (RLS)
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin total clientes" ON clientes FOR ALL USING (auth.role() = 'authenticated');