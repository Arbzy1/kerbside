export type AppEnv = {
  Bindings: {
    DATABASE_URL: string;
    /** Pages origin for this Worker env; localhost origins are always allowed. */
    CORS_ORIGIN?: string;
  };
};

export const LOCAL_CORS_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
] as const;

export function requireDatabaseUrl(envUrl: string | undefined): string {
  const url = envUrl ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not configured");
  }
  return url;
}
