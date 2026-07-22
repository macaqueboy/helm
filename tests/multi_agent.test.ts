import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Multi-Agent Mentions & Chain Reaction Parser Suite", () => {
  it("should extract @mentions from text correctly", () => {
    const text = "Hola @codebot puedes revisar esto y avisar a @designbot?";
    const mentions = text.match(/@(\w+)/g)?.map((m) => m.slice(1)) || [];

    assert.equal(mentions.length, 2);
    assert.equal(mentions[0], "codebot");
    assert.equal(mentions[1], "designbot");
  });

  it("should ignore text without @mentions", () => {
    const text = "Hola a todos en el canal general!";
    const mentions = text.match(/@(\w+)/g)?.map((m) => m.slice(1)) || [];

    assert.equal(mentions.length, 0);
  });

  it("should deduplicate mentions to avoid loop spamming", () => {
    const text = "@codebot @codebot revisa la tarea de @codebot";
    const rawMentions = text.match(/@(\w+)/g)?.map((m) => m.slice(1)) || [];
    const uniqueMentions = Array.from(new Set(rawMentions));

    assert.equal(uniqueMentions.length, 1);
    assert.equal(uniqueMentions[0], "codebot");
  });
});
