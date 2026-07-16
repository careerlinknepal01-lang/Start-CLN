/** Escape user input for PostgREST `.or()` ilike filters. */
export function escapeIlike(term: string): string {
  return term.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export function profileSearchOr(term: string): string {
  const t = escapeIlike(term.trim());
  if (!t) return "";
  return `name.ilike.%${t}%,college.ilike.%${t}%,field.ilike.%${t}%`;
}
