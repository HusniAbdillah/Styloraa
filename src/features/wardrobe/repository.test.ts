import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { buildWardrobeSearchFilter } from "./repository";

describe("Wardrobe search filter", () => {
  it("searches item name, color and category as one phrase", () => {
    expect(buildWardrobeSearchFilter("linen shirt, blue (cotton)")).toBe(
      'name.ilike."%linen shirt, blue (cotton)%",color.ilike."%linen shirt, blue (cotton)%",category.ilike."%linen shirt, blue (cotton)%"',
    );
  });

  it("treats SQL LIKE wildcards as literal search text", () => {
    expect(buildWardrobeSearchFilter("red%_coat")).toBe(
      'name.ilike."%red\\\\%\\\\_coat%",color.ilike."%red\\\\%\\\\_coat%",category.ilike."%red\\\\%\\\\_coat%"',
    );
  });

  it("quotes reserved PostgREST syntax so search text cannot add filters", () => {
    expect(buildWardrobeSearchFilter('red"),category.eq.top')).toBe(
      'name.ilike."%red\\"),category.eq.top%",color.ilike."%red\\"),category.eq.top%",category.ilike."%red\\"),category.eq.top%"',
    );
  });

  it("escapes backslashes before composing quoted filters", () => {
    expect(buildWardrobeSearchFilter(String.raw`cotton\linen`)).toBe(
      String.raw`name.ilike."%cotton\\\\linen%",color.ilike."%cotton\\\\linen%",category.ilike."%cotton\\\\linen%"`,
    );
  });
});
