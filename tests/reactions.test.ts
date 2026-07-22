import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Message Reactions & Emoji Toggle Suite", () => {
  type Reaction = { id: string; messageId: string; userId: string; emoji: string };

  it("should add reaction when emoji is not present", () => {
    let reactionsList: Reaction[] = [];
    const userId = "usr_pablo";
    const messageId = "msg_1";
    const emoji = "🚀";

    const toggleReaction = (mId: string, uId: string, em: string) => {
      const idx = reactionsList.findIndex((r) => r.messageId === mId && r.userId === uId && r.emoji === em);
      if (idx >= 0) {
        reactionsList.splice(idx, 1);
        return "removed";
      } else {
        reactionsList.push({ id: `react_${Date.now()}`, messageId: mId, userId: uId, emoji: em });
        return "added";
      }
    };

    const action1 = toggleReaction(messageId, userId, emoji);
    assert.equal(action1, "added");
    assert.equal(reactionsList.length, 1);

    const action2 = toggleReaction(messageId, userId, emoji);
    assert.equal(action2, "removed");
    assert.equal(reactionsList.length, 0);
  });
});
