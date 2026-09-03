-- 0. Limpeza de segurança
DROP TABLE IF EXISTS roteiros;
DROP TABLE IF EXISTS pacotes;
DROP TABLE IF EXISTS expedicoes;

-- 1. Tabela Base: Expedição (Roteiro fixo)
CREATE TABLE expedicoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  pais TEXT NOT NULL,
  tipo_destino TEXT NOT NULL,
  categorias TEXT[] DEFAULT '{}',
  descricao TEXT,
  fotos TEXT[] DEFAULT '{}',
  incluso TEXT[] DEFAULT '{}',
  nao_incluso TEXT[] DEFAULT '{}',
  observacoes TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela Instância: Pacote (Datas e Valores)
CREATE TABLE pacotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  expedicao_id UUID REFERENCES expedicoes(id) ON DELETE CASCADE,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  vagas INTEGER NOT NULL DEFAULT 0,
  preco_duplo NUMERIC(10,2) NOT NULL,
  preco_single NUMERIC(10,2),
  status TEXT DEFAULT 'Ativo',
  desconto_percentual NUMERIC(5,2) DEFAULT 0,
  promocao_inicio DATE,
  promocao_fim DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabela de Roteiro Diário
CREATE TABLE roteiros (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  expedicao_id UUID REFERENCES expedicoes(id) ON DELETE CASCADE,
  dia INTEGER NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Segurança (RLS)
ALTER TABLE expedicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE roteiros ENABLE ROW LEVEL SECURITY;

-- Leitura pública liberada (para o site principal no futuro)
CREATE POLICY "Leitura publica de expedicoes" ON expedicoes FOR SELECT USING (true);
CREATE POLICY "Leitura publica de pacotes" ON pacotes FOR SELECT USING (true);

-- Acesso total liberado para usuários logados (Admin)
CREATE POLICY "Admin total expedicoes" ON expedicoes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin total pacotes" ON pacotes FOR ALL USING (auth.role() = 'authenticated');

-- Políticas de Roteiros
CREATE POLICY "Leitura publica de roteiros" ON roteiros FOR SELECT USING (true);
CREATE POLICY "Admin total roteiros" ON roteiros FOR ALL USING (auth.role() = 'authenticated');