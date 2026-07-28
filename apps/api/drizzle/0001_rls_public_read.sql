-- Public reference tables (Phase 1): experiment results are not user-owned.
-- The application role may SELECT only. Write access is intentionally withheld so
-- the API cannot mutate reference data even if a bug issues an INSERT/UPDATE/DELETE.
-- drizzle-kit does not emit RLS; this migration is hand-written for that reason only.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'kerbside_app') THEN
    CREATE ROLE kerbside_app NOLOGIN;
  END IF;
END
$$;
--> statement-breakpoint

GRANT USAGE ON SCHEMA public TO kerbside_app;
--> statement-breakpoint

-- Allow the migrating/owner role to SET ROLE kerbside_app in tests and ops.
GRANT kerbside_app TO CURRENT_USER;
--> statement-breakpoint

ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE model_results ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE verdicts ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

CREATE POLICY cities_public_read ON cities FOR SELECT USING (true);
--> statement-breakpoint
CREATE POLICY experiments_public_read ON experiments FOR SELECT USING (true);
--> statement-breakpoint
CREATE POLICY model_results_public_read ON model_results FOR SELECT USING (true);
--> statement-breakpoint
CREATE POLICY verdicts_public_read ON verdicts FOR SELECT USING (true);
--> statement-breakpoint

GRANT SELECT ON cities, experiments, model_results, verdicts TO kerbside_app;
--> statement-breakpoint

REVOKE INSERT, UPDATE, DELETE ON cities FROM kerbside_app;
--> statement-breakpoint
REVOKE INSERT, UPDATE, DELETE ON experiments FROM kerbside_app;
--> statement-breakpoint
REVOKE INSERT, UPDATE, DELETE ON model_results FROM kerbside_app;
--> statement-breakpoint
REVOKE INSERT, UPDATE, DELETE ON verdicts FROM kerbside_app;
