import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { agentLoop, type ChatMessage } from "../lib/ai";

describe("AI Agent Loop Engine Suite", () => {
  it("should process conversation messages and return output text", async () => {
    const messages: ChatMessage[] = [
      { role: "system", content: "You are a test agent." },
      { role: "user", content: "Say hello in one word." },
    ];

    // Mock tool context
    const toolCtx = {
      channelId: "chn_test",
      agentId: "agt_test",
      workspaceId: "ws_test",
      userId: "usr_test",
      agentName: "test_bot",
    };

    // Run agent loop
    const result = await agentLoop(messages, {
      model: "deepseek-v4-flash",
      toolContext: toolCtx,
      maxIterations: 3,
    });

    assert.ok(typeof result.text === "string");
    assert.ok(result.text.length > 0);
    assert.ok(Array.isArray(result.toolCallsMade));
  });
});
