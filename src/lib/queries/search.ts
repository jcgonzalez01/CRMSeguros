// Escapes characters that are structurally significant in PostgREST's
// `.or()` filter string syntax, so a search term containing `%`, `_`,
// `,`, `(` or `)` can't break the filter, reach into other columns, or
// use `_` as a single-character LIKE wildcard.
export function escapeOrFilterValue(value: string) {
  return value.replace(/[%_,()]/g, "\\$&");
}
