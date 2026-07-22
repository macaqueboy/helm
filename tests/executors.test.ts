import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { toolExecutors } from "../lib/tool-executors";
import { AGENT_TOOLS } from "../lib/tools";

describe("Tool Executors Mapping Suite", () => {
  it("should have an executor for every tool defined in AGENT_TOOLS", () => {
    for (const tool of AGENT_TOOLS) {
      const name = tool.function.name;
      const executor = toolExecutors[name];
      assert.ok(typeof executor === "function", `Missing executor for tool: ${name}`);
    }
  });

  it("should handle error gracefully when executing search_web with bad parameters", async () => {
    const searchExecutor = toolExecutors["search_web"];
    assert.ok(searchExecutor);

    // Call search_web with dummy query
    const dummyCtx = {
      channelId: "chn_123",
      agentId: "agt_123",
      workspaceId: "ws_123",
      userId: "usr_123",
      agentName: "test_agent",
    };

    const resJson = await searchExecutor({ query: "Helm AI collaboration" }, dummyCtx);
    const parsed = JSON.parse(resJson);
    assert.ok(typeof parsed === "object");
    assert.ok("ok" in parsed);
  });
});
