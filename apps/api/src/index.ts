import { Hono } from "hono";
import { cors } from "hono/cors";
import type { HealthResponse } from "@kerbside/shared";
import packageJson from "../package.json" with { type: "json" };
import { LOCAL_CORS_ORIGINS, type AppEnv } from "./env";
import { citiesRoutes } from "./routes/cities";
import { experimentsRoutes } from "./routes/experiments";
import { verdictsRoutes } from "./routes/verdicts";

const app = new Hono<AppEnv>();

app.use(
  "*",
  cors({
    origin: (origin, c) => {
      const allowed = new Set<string>(LOCAL_CORS_ORIGINS);
      const pagesOrigin = c.env.CORS_ORIGIN;
      if (pagesOrigin) {
        allowed.add(pagesOrigin);
      }
      return allowed.has(origin) ? origin : null;
    },
  }),
);

app.get("/health", (c) => {
  const body: HealthResponse = {
    status: "ok",
    version: packageJson.version,
    timestamp: new Date().toISOString(),
  };
  return c.json(body);
});

app.route("/api/experiments", experimentsRoutes);
app.route("/api/verdicts", verdictsRoutes);
app.route("/api/cities", citiesRoutes);

export default app;
export { app };
