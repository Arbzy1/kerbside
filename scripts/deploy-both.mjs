import { spawnSync } from "node:child_process";

const deployments = [
  {
    name: "staging",
    apiUrl: process.env.STAGING_API_URL,
  },
  {
    name: "production",
    apiUrl: process.env.PRODUCTION_API_URL,
  },
];

const missing = deployments.filter(({ apiUrl }) => !apiUrl?.trim());
if (missing.length > 0) {
  console.error(
    `Missing API origin${missing.length > 1 ? "s" : ""}: ${missing
      .map(({ name }) => `${name.toUpperCase()}_API_URL`)
      .join(", ")}. These public Worker origins are required to build each Pages site correctly.`,
  );
  process.exit(1);
}

for (const { name, apiUrl } of deployments) {
  const command = name === "production" ? "deploy:prod" : "deploy:staging";
  console.log(`\nDeploying ${name} with ${apiUrl}…`);

  const result = spawnSync(
    process.platform === "win32" ? "npm.cmd" : "npm",
    ["run", command],
    {
      stdio: "inherit",
      env: { ...process.env, VITE_API_URL: apiUrl },
      shell: process.platform === "win32",
    },
  );

  if (result.error) {
    console.error(`Could not start the ${name} deployment: ${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
