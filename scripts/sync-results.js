/**
 * Copy research result CSVs into packages/data/results for CI/deploys.
 * Default source: ../results relative to the Application monorepo root.
 * Override with KERBSIDE_RESULTS (absolute or relative path).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultSource = path.resolve(rootDir, "..", "results");
const sourceDir = path.resolve(process.env.KERBSIDE_RESULTS ?? defaultSource);
const destDir = path.join(rootDir, "packages", "data", "results");

if (!fs.existsSync(sourceDir)) {
  console.error(`Source results directory not found: ${sourceDir}`);
  process.exit(1);
}

fs.mkdirSync(destDir, { recursive: true });

const files = fs.readdirSync(sourceDir).filter((name) => name.endsWith(".csv"));
if (files.length === 0) {
  console.error(`No CSV files found in ${sourceDir}`);
  process.exit(1);
}

for (const file of files) {
  const from = path.join(sourceDir, file);
  const to = path.join(destDir, file);
  fs.copyFileSync(from, to);
  console.log(`copied ${file}`);
}

console.log(`Synced ${files.length} CSV(s) into ${destDir}`);
