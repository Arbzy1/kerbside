/**
 * Post-deploy smoke check.
 * - SMOKE_API_URL: Worker origin — GET /health and /api/verdicts must be 200
 * - SMOKE_WEB_URL: Pages origin — GET /cities must be 200 with the SPA shell
 *   (hard-refresh deep link; the most common Pages misconfiguration)
 */
const apiBase = process.env.SMOKE_API_URL?.replace(/\/$/, "");
const webBase = process.env.SMOKE_WEB_URL?.replace(/\/$/, "");

if (!apiBase) {
  console.error("SMOKE_API_URL is required (Worker origin, no trailing slash)");
  process.exit(1);
}

if (!webBase) {
  console.error("SMOKE_WEB_URL is required (Pages origin, no trailing slash)");
  process.exit(1);
}

let failed = false;

async function check(url, { expectHtmlRoot = false } = {}) {
  try {
    const res = await fetch(url);
    if (res.status !== 200) {
      console.error(`FAIL ${url} → ${res.status}`);
      failed = true;
      return;
    }
    if (expectHtmlRoot) {
      const body = await res.text();
      if (!body.includes('id="root"')) {
        console.error(
          `FAIL ${url} → 200 but missing SPA shell (id="root"); likely a 404 page or wrong asset`,
        );
        failed = true;
        return;
      }
    }
    console.log(`OK   ${url} → ${res.status}`);
  } catch (err) {
    console.error(`FAIL ${url} → ${err instanceof Error ? err.message : err}`);
    failed = true;
  }
}

await check(`${apiBase}/health`);
await check(`${apiBase}/api/verdicts`);
await check(`${webBase}/cities`, { expectHtmlRoot: true });

if (failed) {
  process.exit(1);
}
