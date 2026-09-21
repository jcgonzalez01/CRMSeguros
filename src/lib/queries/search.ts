// Escapes characters that are structurally significant in PostgREST's
// `.or()` filter string syntax, so a search term containing `%`, `,`, `(`
// or `)` can't break the filter or reach into other columns.
export function escapeOrFilterValue(value: string) {
  return value.replace(/[%,()]/g, "\\$&");
}
