import { BrowserRouter, Route, Routes } from "react-router";
import { Layout } from "@/components/Layout";
import { CitiesPage } from "@/routes/CitiesPage";
import { ExperimentDetailPage } from "@/routes/ExperimentDetail";
import { NotFound } from "@/routes/NotFound";
import { ScoreboardPage } from "@/routes/ScoreboardPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<ScoreboardPage />} />
          <Route path="cities" element={<CitiesPage />} />
          <Route path="experiments/:slug" element={<ExperimentDetailPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
