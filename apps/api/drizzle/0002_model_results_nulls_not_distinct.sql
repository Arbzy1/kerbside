-- Ensure upsert natural keys treat NULL k as equal (PostgreSQL 15+).
DROP INDEX IF EXISTS "model_results_natural_uidx";
--> statement-breakpoint
CREATE UNIQUE INDEX "model_results_natural_uidx" ON "model_results" USING btree ("experiment_id","model_name","k","notes") NULLS NOT DISTINCT;
