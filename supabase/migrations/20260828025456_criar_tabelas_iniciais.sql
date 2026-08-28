-- 1. Limpeza de segurança
DROP TABLE IF EXISTS expedicoes;
DROP TABLE IF EXISTS roteiros;
DROP TABLE IF EXISTS pacotes;
DROP TABLE IF EXISTS admins;

-- 2. Tabela de Administradores
CREATE TABLE admins (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nome TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela Base de Pacotes (O template operacional)
CREATE TABLE pacotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  pais TEXT NOT NULL,
  tipo_destino TEXT NOT NULL, 
  categorias TEXT[],          
  descricao TEXT,
  fotos TEXT[],               
  incluso TEXT[],             
  nao_incluso TEXT[],
  observacoes TEXT[],         
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabela de Roteiros Diários
CREATE TABLE roteiros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pacote_id UUID REFERENCES pacotes(id) ON DELETE CASCADE,
  dia INT NOT NULL,           
  titulo TEXT NOT NULL,       
  descricao TEXT NOT NULL,
  UNIQUE(pacote_id, dia)      
);

-- 5. Tabela de Expedições (O produto vendido no site)
CREATE TABLE expedicoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pacote_id UUID REFERENCES pacotes(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  vagas INT NOT NULL,
  preco_duplo DECIMAL(10,2) NOT NULL, 
  preco_single DECIMAL(10,2),         
  status TEXT DEFAULT 'vagas abertas',
  
  -- Campos de Promoção
  desconto_percentual DECIMAL(5,2) DEFAULT 0,
  promocao_inicio TIMESTAMP WITH TIME ZONE,
  promocao_fim TIMESTAMP WITH TIME ZONE
);

-- 6. Habilitar Políticas de Segurança (Row Level Security)
ALTER TABLE pacotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE roteiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE expedicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- 7. Permissões de Visualização (Visitantes)
CREATE POLICY "Leitura publica pacotes" ON pacotes FOR SELECT USING (true);
CREATE POLICY "Leitura publica roteiros" ON roteiros FOR SELECT USING (true);
CREATE POLICY "Leitura publica expedicoes" ON expedicoes FOR SELECT USING (true);

-- 8. Permissões de Administração (Admins logados)
CREATE POLICY "Controle total admins pacotes" ON pacotes FOR ALL USING (auth.uid() IN (SELECT id FROM admins));
CREATE POLICY "Controle total admins roteiros" ON roteiros FOR ALL USING (auth.uid() IN (SELECT id FROM admins));
CREATE POLICY "Controle total admins expedicoes" ON expedicoes FOR ALL USING (auth.uid() IN (SELECT id FROM admins));