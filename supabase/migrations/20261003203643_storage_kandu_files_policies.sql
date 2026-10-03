-- KANDU — políticas de Storage para o bucket "kandu-files".
-- Aplicada em produção (projeto bktwvgwokrnqvkpvemfv) a 2026-10-03.
--
-- Problema: storage.objects tem RLS ativa e o bucket não tinha nenhuma política,
-- por isso o Storage recusava todos os uploads ("new row violates row-level
-- security policy"). Afetava avatar, logótipo, fotos de obra (e portanto a
-- publicação de obras, que exige 3 fotos), portefólio, documentos, verificação
-- de identidade, anexos de chat, prova de trabalho e reclamações.
--
-- O código usa upload com { upsert: true }, que exige INSERT + SELECT + UPDATE.
-- A leitura continua pública via URL pública (o bucket é public=true).

create policy "kandu_files_insert_authenticated"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'kandu-files');

create policy "kandu_files_select_own"
  on storage.objects for select to authenticated
  using (bucket_id = 'kandu-files' and owner_id = (select auth.uid())::text);

create policy "kandu_files_update_own"
  on storage.objects for update to authenticated
  using (bucket_id = 'kandu-files' and owner_id = (select auth.uid())::text)
  with check (bucket_id = 'kandu-files');

create policy "kandu_files_delete_own"
  on storage.objects for delete to authenticated
  using (bucket_id = 'kandu-files' and owner_id = (select auth.uid())::text);
