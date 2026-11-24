create table if not exists public.depoimentos (
  id uuid primary key default gen_random_uuid(),
  nome_cliente text not null,
  expedicao_id uuid references public.expedicoes(id) on delete cascade,
  depoimento text not null,
  foto_viagem_url text,
  foto_perfil_url text,
  ativo boolean not null default false,
  ordem integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_depoimentos_expedicao_id
  on public.depoimentos(expedicao_id);

alter table public.depoimentos enable row level security;

create policy "Leitura publica de depoimentos ativos"
  on public.depoimentos for select
  using (ativo = true);

create policy "Envio publico de depoimentos para moderacao"
  on public.depoimentos for insert
  with check (ativo = false);

create policy "Gerenciamento completo para autenticados"
  on public.depoimentos for all
  to authenticated
  using (true)
  with check (true);