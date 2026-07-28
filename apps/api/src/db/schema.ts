import { relations } from "drizzle-orm";
import {
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const verdictKindEnum = pgEnum("verdict_kind", [
  "proven",
  "disproven",
  "harmful",
  "untested",
]);

export const cities = pgTable(
  "cities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    laCode: varchar("la_code", { length: 64 }).notNull(),
    country: text("country").notNull(),
    nCountPoints: integer("n_count_points").notNull(),
    heldOutR2: doublePrecision("held_out_r2").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("cities_la_code_uidx").on(table.laCode),
    uniqueIndex("cities_name_uidx").on(table.name),
  ],
);

export const experiments = pgTable(
  "experiments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 64 }).notNull(),
    title: text("title").notNull(),
    question: text("question").notNull(),
    methodNote: text("method_note").notNull(),
  },
  (table) => [uniqueIndex("experiments_slug_uidx").on(table.slug)],
);

export const modelResults = pgTable(
  "model_results",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    experimentId: uuid("experiment_id")
      .notNull()
      .references(() => experiments.id, { onDelete: "cascade" }),
    modelName: text("model_name").notNull(),
    k: integer("k"),
    randomR2: doublePrecision("random_r2"),
    spatialR2: doublePrecision("spatial_r2"),
    locoR2: doublePrecision("loco_r2"),
    n: integer("n"),
    notes: text("notes").notNull().default(""),
  },
  (table) => [
    index("model_results_experiment_id_idx").on(table.experimentId),
    uniqueIndex("model_results_natural_uidx").on(
      table.experimentId,
      table.modelName,
      table.k,
      table.notes,
    ),
  ],
);

export const verdicts = pgTable(
  "verdicts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    experimentId: uuid("experiment_id").references(() => experiments.id, {
      onDelete: "set null",
    }),
    claim: text("claim").notNull(),
    verdict: verdictKindEnum("verdict").notNull(),
    evidence: text("evidence").notNull(),
  },
  (table) => [uniqueIndex("verdicts_claim_uidx").on(table.claim)],
);

export const experimentsRelations = relations(experiments, ({ many }) => ({
  modelResults: many(modelResults),
  verdicts: many(verdicts),
}));

export const modelResultsRelations = relations(modelResults, ({ one }) => ({
  experiment: one(experiments, {
    fields: [modelResults.experimentId],
    references: [experiments.id],
  }),
}));

export const verdictsRelations = relations(verdicts, ({ one }) => ({
  experiment: one(experiments, {
    fields: [verdicts.experimentId],
    references: [experiments.id],
  }),
}));
