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

  it("should execute code in sandbox tool successfully", async () => {
    const codeExecutor = toolExecutors["execute_code"];
    assert.ok(codeExecutor);

    const dummyCtx = {
      channelId: "chn_123",
      agentId: "agt_123",
      workspaceId: "ws_123",
      userId: "usr_123",
      agentName: "coder",
    };

    const codeScript = `
      const numbers = [10, 20, 30, 40];
      const sum = numbers.reduce((a, b) => a + b, 0);
      console.log("Suma total:", sum);
      sum;
    `;

    const resJson = await codeExecutor({ code: codeScript }, dummyCtx);
    const parsed = JSON.parse(resJson);

    assert.equal(parsed.ok, true);
    assert.ok(parsed.output.includes("Suma total: 100"));
    assert.ok(parsed.output.includes("Retorno: 100"));
  });

  it("should handle error gracefully when executing search_web with query", async () => {
    const searchExecutor = toolExecutors["search_web"];
    assert.ok(searchExecutor);

    const dummyCtx = {
      channelId: "chn_123",
      agentId: "agt_123",
      workspaceId: "ws_123",
      userId: "usr_123",
      agentName: "scout",
    };

    const resJson = await searchExecutor({ query: "Helm AI collaboration" }, dummyCtx);
    const parsed = JSON.parse(resJson);
    assert.ok(typeof parsed === "object");
    assert.ok("ok" in parsed);
  });
});
