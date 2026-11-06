CREATE TABLE IF NOT EXISTS public.paletas_temas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  cor_primaria TEXT NOT NULL,
  cor_secundaria TEXT NOT NULL,
  cor_fundo TEXT NOT NULL,
  cor_texto TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir os temas iniciais para não perder o que já tínhamos
INSERT INTO public.paletas_temas (nome, cor_primaria, cor_secundaria, cor_fundo, cor_texto)
VALUES
  ('Padrão 5 Seasons (Verde Floresta)', '#2f4842', '#fdb17f', '#fffaf8', '#26332f'),
  ('Azul Adriático (Croácia / Verão Europeu)', '#1b4965', '#e09f3e', '#f8fbfd', '#162a38'),
  ('Aurora Boreal (Ártico / Inverno)', '#16302b', '#69e0a3', '#f4f7f6', '#152421'),
  ('Terra & Sol (Desertos / Safári / Brasil)', '#5c3a21', '#e68a47', '#fdf9f5', '#2e1f14')
ON CONFLICT (nome) DO NOTHING;

ALTER TABLE public.paletas_temas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura publica de paletas" 
ON public.paletas_temas FOR SELECT 
USING (true);

CREATE POLICY "Usuarios autenticados podem criar paletas" 
ON public.paletas_temas FOR INSERT 
TO authenticated 
WITH CHECK (true);