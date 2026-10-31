import { afterEach, describe, expect, it, vi } from "vitest";

const BASE_ENV = {
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SECRET_KEY: "test-secret",
} as const;

function setEnv(overrides: Record<string, string | undefined>) {
  for (const key of ["META_API_KEY", "META_TEXT_MODEL"])
    delete process.env[key];
  for (const [key, value] of Object.entries({ ...BASE_ENV, ...overrides })) {
    if (value === undefined) delete process.env[key];
    else vi.stubEnv(key, value);
  }
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("meta text provider", () => {
  it("reports unconfigured without key and model", async () => {
    setEnv({});
    const { isMetaTextConfigured, metaChatCompletion } = await import("./meta");
    expect(isMetaTextConfigured()).toBe(false);
    await expect(
      metaChatCompletion([{ role: "user", content: "hi" }]),
    ).rejects.toMatchObject({
      code: "AI_NOT_CONFIGURED",
      status: 503,
    });
  });
  it("returns completion content on success", async () => {
    setEnv({ META_API_KEY: "key", META_TEXT_MODEL: "model" });
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ choices: [{ message: { content: "hello" } }] }),
            {
              status: 200,
            },
          ),
      ),
    );
    const { metaChatCompletion } = await import("./meta");
    await expect(
      metaChatCompletion([{ role: "user", content: "hi" }]),
    ).resolves.toBe("hello");
  });
  it("maps provider errors without leaking details", async () => {
    setEnv({ META_API_KEY: "key", META_TEXT_MODEL: "model" });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("secret-failure", { status: 500 })),
    );
    const { metaChatCompletion } = await import("./meta");
    const error = await metaChatCompletion([
      { role: "user", content: "hi" },
    ]).catch((failure: unknown) => failure);
    expect(error).toMatchObject({ code: "AI_UPSTREAM_ERROR", status: 502 });
    expect(String((error as Error).message)).not.toContain("secret-failure");
  });
  it("extracts embedded JSON and rejects prose-only output", async () => {
    const { extractJsonObject } = await import("./meta");
    expect(extractJsonObject('note {"a":1} tail')).toEqual({ a: 1 });
    expect(() => extractJsonObject("no json here")).toThrow(/no JSON object/);
    expect(() => extractJsonObject("{broken")).toThrow(/malformed JSON/);
  });
});
vi.mock("server-only", () => ({}));
