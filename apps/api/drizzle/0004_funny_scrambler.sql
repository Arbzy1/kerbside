ALTER TYPE "public"."verdict_kind" ADD VALUE 'withdrawn';--> statement-breakpoint
ALTER TYPE "public"."verdict_kind" ADD VALUE 'city_specific';--> statement-breakpoint
CREATE TABLE "controls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"experiment_id" uuid,
	"city" text NOT NULL,
	"test_name" text NOT NULL,
	"config_name" text NOT NULL,
	"real_value" double precision NOT NULL,
	"null_mean" double precision NOT NULL,
	"null_sd" double precision NOT NULL,
	"null_n" integer NOT NULL,
	"percentile" double precision NOT NULL,
	"interpretation" text NOT NULL,
	"null_draws" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
DROP INDEX "model_results_natural_uidx";--> statement-breakpoint
ALTER TABLE "model_results" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "controls" ADD CONSTRAINT "controls_experiment_id_experiments_id_fk" FOREIGN KEY ("experiment_id") REFERENCES "public"."experiments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "controls_city_idx" ON "controls" USING btree ("city");--> statement-breakpoint
CREATE UNIQUE INDEX "controls_natural_uidx" ON "controls" USING btree ("city","test_name","config_name");--> statement-breakpoint
CREATE UNIQUE INDEX "model_results_natural_uidx" ON "model_results" USING btree ("experiment_id","model_name","k","notes","city") NULLS NOT DISTINCT;