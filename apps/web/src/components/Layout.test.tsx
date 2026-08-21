import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { Layout } from "@/components/Layout";

describe("Layout", () => {
  it("uses the glass navigation shell and identifies the active route", () => {
    render(
      <MemoryRouter initialEntries={["/controls"]}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/controls" element={<p>Controls content</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Controls content")).toBeTruthy();
    expect(document.title).toBe("Controls | Kerbside");
    expect(
      screen.getByRole("link", { name: "Controls" }).className,
    ).toContain("glass-tab-active");
    expect(document.querySelector(".page-shell")).toBeTruthy();
  });
});
