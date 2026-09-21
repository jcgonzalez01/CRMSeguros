-- poliza_documentos.empresa_id was left nullable by oversight (unlike
-- every other business table) — it's always filled by set_empresa_id()
-- since the table has no legacy data to backfill, so it should just be
-- NOT NULL like the rest.
alter table poliza_documentos alter column empresa_id set not null;
