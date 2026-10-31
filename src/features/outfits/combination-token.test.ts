import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({
  getServerEnv: () => ({
    STYLORA_WORKSPACE_ID: "test-workspace",
    SUPABASE_SECRET_KEY: "unit-test-signing-key",
  }),
}));
import {
  signCombination,
  requireVerifiedCombination,
} from "./combination-token";
const combination = {
  title: "Workday",
  rationale: "A light top with darker trousers.",
  item_ids: ["a", "b"],
  uncertainty: "Fit is not assessed.",
};
afterEach(() => vi.useRealTimers());
describe("AI provenance", () => {
  it("accepts only the unchanged server-issued suggestion for its capsule", () => {
    const token = signCombination("capsule-a", combination);
    expect(() =>
      requireVerifiedCombination("capsule-a", combination, token),
    ).not.toThrow();
    expect(() =>
      requireVerifiedCombination("capsule-b", combination, token),
    ).toThrow(/changed or expired/);
    expect(() =>
      requireVerifiedCombination(
        "capsule-a",
        { ...combination, item_ids: ["suggested"] },
        token,
      ),
    ).toThrow(/changed or expired/);
  });
  it("rejects unsigned, modified and expired provider claims", () => {
    expect(() => requireVerifiedCombination("capsule-a", combination)).toThrow(
      /verified AI/,
    );
    const token = signCombination("capsule-a", combination);
    expect(() =>
      requireVerifiedCombination("capsule-a", combination, token + "x"),
    ).toThrow(/verified/);
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 16 * 60_000);
    expect(() =>
      requireVerifiedCombination("capsule-a", combination, token),
    ).toThrow(/expired/);
  });
});
