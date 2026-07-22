import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AGENT_TOOLS } from "../lib/tools";

describe("Agent Tool Definitions Suite", () => {
  it("should define exactly 12 agent tools", () => {
    assert.equal(AGENT_TOOLS.length, 12);
  });

  it("should have valid function specs for all tools", () => {
    for (const tool of AGENT_TOOLS) {
      assert.equal(tool.type, "function");
      assert.ok(typeof tool.function.name === "string" && tool.function.name.length > 0);
      assert.ok(typeof tool.function.description === "string" && tool.function.description.length > 0);
      assert.equal(tool.function.parameters.type, "object");
      assert.ok(typeof tool.function.parameters.properties === "object");
      assert.ok(Array.isArray(tool.function.parameters.required));
    }
  });

  it("should contain all expected tool names", () => {
    const names = AGENT_TOOLS.map((t) => t.function.name);
    const expected = [
      "create_task",
      "list_tasks",
      "update_task",
      "create_channel",
      "search_web",
      "mention_agent",
      "list_agents",
      "save_memory",
      "recall_memory",
      "add_reaction",
      "set_reminder",
    ];

    for (const name of expected) {
      assert.ok(names.includes(name), `Missing expected tool: ${name}`);
    }
  });

  it("should enforce required fields for tools", () => {
    const createTask = AGENT_TOOLS.find((t) => t.function.name === "create_task");
    assert.ok(createTask?.function.parameters.required.includes("title"));

    const updateTask = AGENT_TOOLS.find((t) => t.function.name === "update_task");
    assert.ok(updateTask?.function.parameters.required.includes("number"));
    assert.ok(updateTask?.function.parameters.required.includes("status"));

    const saveMemory = AGENT_TOOLS.find((t) => t.function.name === "save_memory");
    assert.ok(saveMemory?.function.parameters.required.includes("content"));
  });
});
