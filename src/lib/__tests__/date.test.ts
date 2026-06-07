import { describe, expect, it } from "vitest";
import { clampDay } from "../date";

describe("clampDay (§5.2)", () => {
  it("月末をその月の最終日にクランプする", () => {
    expect(clampDay("2026-02", 31)).toBe("2026-02-28");
    expect(clampDay("2024-02", 31)).toBe("2024-02-29");
    expect(clampDay("2026-04", 31)).toBe("2026-04-30");
    expect(clampDay("2026-03", 15)).toBe("2026-03-15");
  });
});

