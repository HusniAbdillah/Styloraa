import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({
  getServerEnv: vi.fn(),
  isDatabaseConfigured: () => false,
}));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabase: vi.fn() }));
import {
  backendRoute,
  checkDatabase,
  getBackendContext,
  readJson,
} from "./backend";

describe("Owner 3 HTTP boundary", () => {
  it("rejects foreign origins and bounded-body overflows before parsing", async () => {
    await expect(
      readJson(
        new Request("https://stylora.test/api/looks", {
          method: "POST",
          headers: {
            Origin: "https://other.test",
            "Content-Type": "application/json",
          },
          body: "{}",
        }),
      ),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      readJson(
        new Request("https://stylora.test/api/looks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: '{"text":"too long"}',
        }),
        4,
      ),
    ).rejects.toMatchObject({ status: 413 });
  });
  it("does not expose raw secrets or database errors", async () => {
    const response = await backendRoute(async () => {
      throw new Error("private-provider-token");
    });
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain("private-provider-token");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(() => getBackendContext()).toThrow(
      "The database is not configured.",
    );
  });
  it("maps concurrency and search budget failures to stable responses", () => {
    expect(() => checkDatabase({ code: "40001" }, "ignored")).toThrow(
      "The outfit changed.",
    );
    expect(() => checkDatabase({ code: "P0429" }, "ignored")).toThrow(
      "The shared search limit",
    );
  });
});
