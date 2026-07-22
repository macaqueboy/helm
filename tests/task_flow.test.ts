import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Task Workflow & Status Machine Suite", () => {
  const validStatuses = ["todo", "in_progress", "in_review", "done", "closed"];

  it("should validate allowed task status values", () => {
    assert.ok(validStatuses.includes("todo"));
    assert.ok(validStatuses.includes("in_progress"));
    assert.ok(validStatuses.includes("done"));
    assert.ok(!validStatuses.includes("invalid_status"));
  });

  it("should format task numbers correctly (#1, #2, #3)", () => {
    const formatTaskTitle = (num: number, title: string) => `#${num} ${title}`;
    assert.equal(formatTaskTitle(1, "Fix Next.js build"), "#1 Fix Next.js build");
    assert.equal(formatTaskTitle(42, "Deploy to Coolify"), "#42 Deploy to Coolify");
  });

  it("should compute status counts accurately", () => {
    const taskList = [
      { id: "1", status: "todo" },
      { id: "2", status: "todo" },
      { id: "3", status: "in_progress" },
      { id: "4", status: "done" },
    ];

    const counts = taskList.reduce((acc: Record<string, number>, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {});

    assert.equal(counts["todo"], 2);
    assert.equal(counts["in_progress"], 1);
    assert.equal(counts["done"], 1);
  });
});
