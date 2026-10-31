import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { requestMuse, MUSE_TEXT_MODEL, museText } from "./muse";
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
describe("Muse transport", () => {
  it("uses only the official endpoint, shared credential and non-persisted Responses contract", async () => {
    vi.stubEnv("MODEL_API_KEY", "unit-key");
    const fetch = vi.fn(async () =>
      Response.json({ status: "completed", output: [] }),
    );
    vi.stubGlobal("fetch", fetch);
    await requestMuse({
      model: MUSE_TEXT_MODEL,
      input: "A wardrobe request",
      store: true,
    });
    const [url, options] = fetch.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe("https://api.meta.ai/v1/responses");
    expect(options.redirect).toBe("error");
    expect(JSON.parse(options.body as string)).toMatchObject({
      model: "muse-spark-1.3",
      store: false,
    });
  });
  it("rejects incomplete or refused text output", () => {
    expect(() => museText({ status: "incomplete", output: [] })).toThrow(
      /complete/,
    );
    expect(() =>
      museText({
        status: "completed",
        output: [
          {
            type: "message",
            content: [{ type: "refusal", refusal: "Not available" }],
          },
        ],
      }),
    ).toThrow(/usable text/);
  });
  it("maps provider throttling to a bounded retry response", async () => {
    vi.stubEnv("MODEL_API_KEY", "unit-key");
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () => new Response("private upstream detail", { status: 429 }),
      ),
    );
    await expect(
      requestMuse({ model: MUSE_TEXT_MODEL, input: "test" }),
    ).rejects.toMatchObject({ status: 429, code: "AI_RATE_LIMITED" });
  });
});
