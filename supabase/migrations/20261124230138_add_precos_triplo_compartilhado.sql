alter table public.pacotes
  add column if not exists preco_triplo numeric,
  add column if not exists preco_compartilhado numeric;

alter table public.pacote_lotes
  add column if not exists preco_triplo numeric,
  add column if not exists preco_compartilhado numeric;