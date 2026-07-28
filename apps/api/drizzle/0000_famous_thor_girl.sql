CREATE TYPE "public"."verdict_kind" AS ENUM('proven', 'disproven', 'harmful', 'untested');--> statement-breakpoint
CREATE TABLE "cities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"la_code" varchar(64) NOT NULL,
	"country" text NOT NULL,
	"n_count_points" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "experiments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(64) NOT NULL,
	"title" text NOT NULL,
	"question" text NOT NULL,
	"method_note" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "model_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"experiment_id" uuid NOT NULL,
	"model_name" text NOT NULL,
	"k" integer,
	"random_r2" double precision,
	"spatial_r2" double precision,
	"loco_r2" double precision,
	"n" integer,
	"notes" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verdicts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"experiment_id" uuid,
	"claim" text NOT NULL,
	"verdict" "verdict_kind" NOT NULL,
	"evidence" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "model_results" ADD CONSTRAINT "model_results_experiment_id_experiments_id_fk" FOREIGN KEY ("experiment_id") REFERENCES "public"."experiments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verdicts" ADD CONSTRAINT "verdicts_experiment_id_experiments_id_fk" FOREIGN KEY ("experiment_id") REFERENCES "public"."experiments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cities_la_code_uidx" ON "cities" USING btree ("la_code");--> statement-breakpoint
CREATE UNIQUE INDEX "cities_name_uidx" ON "cities" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "experiments_slug_uidx" ON "experiments" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "model_results_experiment_id_idx" ON "model_results" USING btree ("experiment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "model_results_natural_uidx" ON "model_results" USING btree ("experiment_id","model_name","k","notes");--> statement-breakpoint
CREATE UNIQUE INDEX "verdicts_claim_uidx" ON "verdicts" USING btree ("claim");