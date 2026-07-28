ALTER TABLE "cities" ADD COLUMN "held_out_r2" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "cities" ALTER COLUMN "held_out_r2" DROP DEFAULT;
