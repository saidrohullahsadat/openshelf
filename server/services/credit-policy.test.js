import { describe, expect, it } from "vitest";
import { calculateAllowance } from "./credit-policy.js";

describe("distinct download allowance", () => {
  it("starts with three free distinct-book downloads", () => {
    expect(calculateAllowance({ used: 0, approvedContributions: 0 })).toMatchObject({ allowance: 3, remaining: 3, freeUsed: 0 });
  });

  it("blocks after the free allowance until two contributions are approved", () => {
    expect(calculateAllowance({ used: 3, approvedContributions: 1 })).toMatchObject({ allowance: 3, remaining: 0, credits: 0 });
  });

  it("unlocks ten more downloads after three approved contributions", () => {
    expect(calculateAllowance({ used: 3, approvedContributions: 2 })).toMatchObject({ allowance: 3, remaining: 0, credits: 0 });
    expect(calculateAllowance({ used: 3, approvedContributions: 3 })).toMatchObject({ allowance: 13, remaining: 10, credits: 10 });
  });

  it("does not count a pending contribution", () => {
    expect(calculateAllowance({ used: 3, approvedContributions: 0 })).toMatchObject({ remaining: 0 });
  });

  it("uses configured allowance and milestone values", () => {
    expect(calculateAllowance({ used: 4, approvedContributions: 3, freeAllowance: 2, contributionsPerUnlock: 3, downloadsPerUnlock: 2 })).toMatchObject({ allowance: 4, remaining: 0, credits: 2 });
  });
});
