import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { describe, expect, it } from "vitest";

const monorepoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../..",
);
config({ path: path.join(monorepoRoot, ".env") });

const TABLES = [
  "cities",
  "experiments",
  "model_results",
  "verdicts",
  "controls",
] as const;

describe("RLS — kerbside_app cannot write", () => {
  it("rejects INSERT into each public reference table as kerbside_app", async () => {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL required for RLS test");
    }

    const sql = postgres(databaseUrl, { max: 1 });

    try {
      for (const table of TABLES) {
        // Privilege layer: must fail if someone GRANTs INSERT (comments out REVOKE).
        const privilegeRows = await sql<{ allowed: boolean }[]>`
          SELECT has_table_privilege('kerbside_app', ${table}, 'INSERT') AS allowed
        `;
        expect(
          privilegeRows[0]?.allowed,
          `kerbside_app must not have INSERT on ${table}`,
        ).toBe(false);

        let failed = false;
        let message = "";
        try {
          await sql.begin(async (tx) => {
            await tx`SET LOCAL ROLE kerbside_app`;
            if (table === "cities") {
              await tx`
                INSERT INTO cities (name, la_code, country, n_count_points, held_out_r2)
                VALUES ('RLS Probe', 'RLS_PROBE', 'Nowhere', 1, 0)
              `;
            } else if (table === "experiments") {
              await tx`
                INSERT INTO experiments (slug, title, question, method_note)
                VALUES ('rls-probe', 'x', 'y', 'z')
              `;
            } else if (table === "model_results") {
              await tx`
                INSERT INTO model_results (experiment_id, model_name)
                VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'rls-probe')
              `;
            } else if (table === "controls") {
              await tx`
                INSERT INTO controls (
                  city, test_name, config_name, real_value, null_mean, null_sd,
                  null_n, percentile, interpretation
                ) VALUES (
                  'cardiff', 'rls', 'probe', 0, 0, 0, 1, 50, 'should fail'
                )
              `;
            } else {
              await tx`
                INSERT INTO verdicts (claim, verdict, evidence)
                VALUES ('rls probe claim', 'untested', 'should fail')
              `;
            }
          });
        } catch (err) {
          failed = true;
          message = err instanceof Error ? err.message : String(err);
        }

        // RLS / policy layer: INSERT must still be rejected even if privileges slip.
        expect(failed, `expected INSERT into ${table} to be rejected`).toBe(
          true,
        );
        expect(message.length).toBeGreaterThan(0);
      }
    } finally {
      await sql.end({ timeout: 5 });
    }
  });
});
