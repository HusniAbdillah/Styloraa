import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({
  context: vi.fn(),
  provider: vi.fn(),
  ready: vi.fn(),
}));
vi.mock("@/features/decisions/backend", () => ({
  BackendError: class extends Error {
    constructor(
      public status: number,
      public code: string,
      message: string,
    ) {
      super(message);
    }
  },
  getBackendContext: mocks.context,
  checkDatabase: (error: unknown) => {
    if (error) throw new Error("Database request failed");
  },
}));
vi.mock("./serpapi", () => ({
  searchSerpApi: mocks.provider,
  assertMarketplaceConfigured: mocks.ready,
  safePublicUrl: (url: unknown) => url,
}));
import { marketplaceQuery, searchMarketplace } from "./repository";

function query(data: unknown) {
  const chain: Record<string, unknown> = {};
  for (const name of ["select", "eq", "order", "limit", "in"])
    chain[name] = vi.fn(() => chain);
  chain.maybeSingle = vi.fn(async () => ({ data, error: null }));
  chain.then = (resolve: (value: unknown) => unknown) =>
    Promise.resolve({ data, error: null }).then(resolve);
  return chain;
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("marketplace source guards", () => {
  it("bounds a long recommendation brief without discarding its source intent", () => {
    const brief =
      "Ivory lightweight jacket " + "with practical details ".repeat(30);
    const query = marketplaceQuery(brief);
    expect(query).toBe(brief.slice(0, 240).trim());
    expect(query!.length).toBeLessThanOrEqual(240);
    expect(marketplaceQuery("  Ivory\n jacket  ")).toBe("Ivory jacket");
    expect(marketplaceQuery(null)).toBeNull();
  });

  it("rejects unavailable or foreign look context before provider or search writes", async () => {
    const from = vi.fn((table: string) =>
      query(table === "looks" ? null : { id: "option", source_revision: 1 }),
    );
    mocks.context.mockReturnValue({
      db: { from },
      workspaceId: "configured-workspace",
    });
    await expect(
      searchMarketplace("foreign-look", {
        option_id: "option",
        option_item_id: "piece",
      }),
    ).rejects.toMatchObject({ status: 404, code: "outfit_not_found" });
    expect(mocks.provider).not.toHaveBeenCalled();
    expect(
      from.mock.calls.some(([table]) => table === "shopping_searches"),
    ).toBe(false);
    const lookQuery = from.mock.results[0].value;
    expect(lookQuery.eq).toHaveBeenCalledWith(
      "workspace_id",
      "configured-workspace",
    );
  });

  it("rejects owned-only options before reserving a paid search", async () => {
    const data: Record<string, unknown> = {
      looks: { id: "look", revision: 1 },
      outfit_options: {
        id: "option",
        source_revision: 1,
        option_type: "from_wardrobe",
      },
      outfit_option_items: [
        {
          id: "piece",
          item_kind: "owned",
          requested_category: "top",
          requested_brief: "White shirt",
        },
      ],
    };
    const from = vi.fn((table: string) => query(data[table]));
    mocks.context.mockReturnValue({
      db: { from },
      workspaceId: "configured-workspace",
    });
    await expect(
      searchMarketplace("look", {
        option_id: "option",
        option_item_id: "piece",
      }),
    ).rejects.toMatchObject({ status: 422, code: "owned_piece" });
    expect(mocks.provider).not.toHaveBeenCalled();
    expect(
      from.mock.calls.some(([table]) => table === "shopping_searches"),
    ).toBe(false);
  });
});
