import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Pixel Art Avatar Generator Suite", () => {
  it("should generate deterministic color seed hash", () => {
    const hashString = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
      }
      return Math.abs(hash);
    };

    const hash1 = hashString("pablo");
    const hash2 = hashString("pablo");
    const hash3 = hashString("gale");

    assert.equal(hash1, hash2);
    assert.notEqual(hash1, hash3);
  });

  it("should generate valid pixel grid coordinates for 8x8 avatar", () => {
    const generateGrid = (seed: string) => {
      const grid = [];
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 4; x++) {
          const charCode = seed.charCodeAt((y * 4 + x) % seed.length) || 0;
          const active = charCode % 2 === 0;
          grid.push({ x, y, active });
          grid.push({ x: 7 - x, y, active }); // mirror horizontally
        }
      }
      return grid;
    };

    const grid = generateGrid("helm_agent");
    assert.equal(grid.length, 64); // 8x8 = 64 pixels
  });
});
