-- RLS for controls (public-read, same Phase 1 pattern as other reference tables).
-- drizzle-kit does not emit RLS; this migration is hand-written for that reason only.

ALTER TABLE controls ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

CREATE POLICY controls_public_read ON controls FOR SELECT USING (true);
--> statement-breakpoint

GRANT SELECT ON controls TO kerbside_app;
--> statement-breakpoint

REVOKE INSERT, UPDATE, DELETE ON controls FROM kerbside_app;
