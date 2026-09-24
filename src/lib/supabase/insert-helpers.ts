// empresa_id on every business table is stamped by the set_empresa_id()
// BEFORE INSERT trigger, but only when the client leaves it null (see
// migration 0009) — action code never supplies it, so it's always null
// going in and the trigger always fills it. If a client ever did send an
// explicit empresa_id, the trigger would leave it alone, but each
// table's RLS `with check (empresa_id = current_user_empresa_id())`
// still rejects a spoofed value — the trigger is a convenience, RLS is
// the real boundary. The generated Insert type still marks the column
// required, since Postgres has no column DEFAULT for it. This cast
// documents that gap once instead of threading a placeholder value
// through every insert call site.
export function omitEmpresaId<T extends { empresa_id: string }>(
  row: Omit<T, "empresa_id">
): T {
  return row as T;
}
