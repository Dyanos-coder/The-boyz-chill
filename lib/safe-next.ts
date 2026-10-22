/** N'accepte que des chemins internes, pour éviter les redirections vers un autre site. */
export function safeNext(value: FormDataEntryValue | string | null | undefined) {
  const s = typeof value === "string" ? value : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : "/";
}
