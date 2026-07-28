/** API origin override. Empty = same-origin relative paths (Vite proxy in dev). */
export function apiUrl(path: string): string {
  const base = (import.meta.env.VITE_API_URL as string | undefined)?.replace(
    /\/$/,
    "",
  );
  const normalised = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${normalised}` : normalised;
}
