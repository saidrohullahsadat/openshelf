import { describe, expect, it } from "vitest";
import { recommendBooks } from "./recommendations.js";

const target = { id: 1, categoryId: 10, subjects: ["History", "Central Asia"], status: "approved" };
const book = (id, overrides = {}) => ({ id, title: `Book ${id}`, status: "approved", categoryId: 20, subjects: [], downloadCount: 0, readCount: 0, ...overrides });

describe("recommendBooks", () => {
  it("ranks shared subject and category matches and explains the reason", () => {
    const result = recommendBooks({ target, candidates: [book(2, { categoryId: 10 }), book(3, { subjects: ["central asia"] }), book(4)] });
    expect(result[0].id).toBe(3);
    expect(result[0].recommendationReason).toContain("Central Asia");
    expect(result[1].id).toBe(2);
  });

  it("uses reader interests, excludes interacted books and unpublished books", () => {
    const result = recommendBooks({ target, candidates: [book(2, { categoryId: 30, subjects: ["Poetry"] }), book(3, { status: "pending" }), book(4)], userInterests: [{ categoryId: 30, subjects: ["Poetry"] }], excludeIds: [4] });
    expect(result.map(row => row.id)).toEqual([2]);
    expect(result[0].recommendationReason).toContain("your reading activity");
  });

  it("provides cold-start results using popularity and recency", () => {
    const result = recommendBooks({ target: { id: 1, subjects: [], status: "approved" }, candidates: [book(2), book(3, { downloadCount: 40 })] });
    expect(result[0].id).toBe(3);
    expect(result[0].recommendationReason).toBe("Popular with Open Shelf readers");
    expect(result).toHaveLength(2);
  });

  it("uses behavior from readers with overlapping interests", () => {
    const result = recommendBooks({ target: { id: 1, subjects: [], status: "approved" }, candidates: [book(2), book(3)], similarUserBooks: [book(2), book(2)] });
    expect(result[0].id).toBe(2);
    expect(result[0].recommendationReason).toContain("similar to yours");
  });
});
