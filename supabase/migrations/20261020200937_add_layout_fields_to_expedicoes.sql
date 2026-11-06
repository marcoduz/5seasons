-- Migration: Adiciona campos de identidade visual e novos blocos de conteúdo para Landing Page

ALTER TABLE public.expedicoes
ADD COLUMN IF NOT EXISTS cor_primaria TEXT DEFAULT '#2f4842',
ADD COLUMN IF NOT EXISTS cor_secundaria TEXT DEFAULT '#fdb17f',
ADD COLUMN IF NOT EXISTS cor_fundo TEXT DEFAULT '#fffaf8',
ADD COLUMN IF NOT EXISTS cor_texto TEXT DEFAULT '#26332f',
ADD COLUMN IF NOT EXISTS frase_destaque TEXT,
ADD COLUMN IF NOT EXISTS motivo_epoca_titulo TEXT,
ADD COLUMN IF NOT EXISTS motivo_epoca_texto TEXT,
ADD COLUMN IF NOT EXISTS blocos_ziguezague JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS conteudo_experiencia JSONB DEFAULT '{}'::jsonb;