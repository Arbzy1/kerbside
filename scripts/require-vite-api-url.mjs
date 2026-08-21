const apiUrl = process.env.VITE_API_URL?.trim();
const expected = process.argv[2];

if (!apiUrl) {
  console.error(
    "VITE_API_URL is required for a Pages deployment. Refusing to build a frontend that would request its own /api routes.",
  );
  process.exit(1);
}

try {
  const url = new URL(apiUrl);
  if (url.protocol !== "https:") {
    throw new Error("must use HTTPS");
  }
} catch (error) {
  console.error(
    `VITE_API_URL must be an absolute HTTPS URL; received ${JSON.stringify(apiUrl)} (${error instanceof Error ? error.message : "invalid URL"}).`,
  );
  process.exit(1);
}

if (expected === "staging" && !apiUrl.includes("kerbside-api-staging")) {
  console.error(
    "Staging Pages must bake in the staging Worker (hostname must include kerbside-api-staging). The current VITE_API_URL is the production Worker, which rejects https://kerbside.aden.website in the browser.",
  );
  process.exit(1);
}

if (expected === "production" && apiUrl.includes("kerbside-api-staging")) {
  console.error(
    "Production Pages must bake in the production Worker, not kerbside-api-staging.",
  );
  process.exit(1);
}
