// empresa_id on every business table is stamped by the set_empresa_id()
// BEFORE INSERT trigger (always overwritten server-side, ignoring
// whatever the client sends), so action code never supplies it — but the
// generated Insert type still marks it required, since Postgres has no
// column DEFAULT for it. This cast documents that gap once instead of
// threading a placeholder value through every insert call site.
export function omitEmpresaId<T extends { empresa_id: string }>(
  row: Omit<T, "empresa_id">
): T {
  return row as T;
}
