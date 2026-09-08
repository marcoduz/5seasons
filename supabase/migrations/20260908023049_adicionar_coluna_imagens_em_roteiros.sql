-- 1. Cria a coluna de array de imagens na tabela roteiros (como combinamos)
ALTER TABLE roteiros ADD COLUMN imagens TEXT[] DEFAULT '{}';

-- 2. Cria o Bucket 'roteiros' e define como público
INSERT INTO storage.buckets (id, name, public)
VALUES ('roteiros', 'roteiros', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Políticas de Segurança (RLS) para o bucket 'roteiros'
-- Garante que qualquer pessoa possa ver as imagens (Site Público)
CREATE POLICY "Imagens dos roteiros são públicas" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'roteiros');

-- Garante que apenas usuários logados (Admin) possam fazer upload
CREATE POLICY "Admin pode enviar imagens de roteiros" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'roteiros');

-- Garante que apenas usuários logados (Admin) possam deletar imagens
CREATE POLICY "Admin pode deletar imagens de roteiros" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'roteiros');