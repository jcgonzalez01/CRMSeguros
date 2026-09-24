-- Captura por qué se pierde una oportunidad, para poder reportar patrones
-- (precio, competencia, etc.) en vez de perder esa información al marcar
-- 'perdida'. text + check (no enum nuevo) para poder ajustar la lista de
-- motivos más adelante en una sola migración, sin el baile de dos
-- archivos que exige ALTER TYPE ADD VALUE.

alter table oportunidades
  add column motivo_perdida text check (
    motivo_perdida in ('precio', 'competencia', 'no_responde', 'cambio_necesidad', 'otro')
  );
