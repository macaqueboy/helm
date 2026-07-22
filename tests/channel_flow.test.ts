import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Channel Slugification & Validation Suite", () => {
  const slugify = (name: string) =>
    name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

  it("should convert channel names to valid clean slugs", () => {
    assert.equal(slugify("Canal General"), "canal-general");
    assert.equal(slugify(" Backend & Infra "), "backend-infra");
    assert.equal(slugify("Diseño UI/UX!!!"), "diseo-uiux");
  });

  it("should handle empty or whitespace input safely", () => {
    assert.equal(slugify("   "), "");
  });
});
