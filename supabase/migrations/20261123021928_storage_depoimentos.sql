insert into storage.buckets (id, name, public)
values ('depoimentos', 'depoimentos', true)
on conflict (id) do update set public = true;

create policy "Upload publico de fotos de depoimentos"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'depoimentos');