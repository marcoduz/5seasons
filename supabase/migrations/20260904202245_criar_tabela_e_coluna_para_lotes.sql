-- 1. Cria a tabela de lotes atrelada ao pacote
CREATE TABLE pacote_lotes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  pacote_id uuid REFERENCES pacotes(id) ON DELETE CASCADE,
  lote_numero integer NOT NULL,
  preco_duplo numeric NOT NULL,
  preco_single numeric,
  vagas_gatilho integer NOT NULL DEFAULT 0
);

-- 2. Adiciona a coluna do lote atual na tabela de pacotes principal
ALTER TABLE pacotes ADD COLUMN lote_atual integer DEFAULT 1;

-- Ativa a Segurança em Nível de Linha na tabela
ALTER TABLE pacote_lotes ENABLE ROW LEVEL SECURITY;

-- Permite que qualquer pessoa (incluindo visitantes do site público) leia os lotes
CREATE POLICY "Permitir leitura pública de lotes" 
ON pacote_lotes 
FOR SELECT 
USING (true);

-- Permite que administradores logados criem, editem e deletem os lotes
CREATE POLICY "Permitir acesso total aos lotes para admin" 
ON pacote_lotes 
FOR ALL 
USING (auth.role() = 'authenticated');