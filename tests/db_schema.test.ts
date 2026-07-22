import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  users,
  workspaces,
  workspaceMembers,
  channels,
  agents,
  messages,
  tasks,
  conversations,
  reactions,
  reminders,
  agentMemory,
} from "../lib/db/schema";

describe("Database Schema Integrity Suite", () => {
  it("should define all required core tables", () => {
    assert.ok(users);
    assert.ok(workspaces);
    assert.ok(workspaceMembers);
    assert.ok(channels);
    assert.ok(agents);
    assert.ok(messages);
    assert.ok(tasks);
    assert.ok(conversations);
    assert.ok(reactions);
    assert.ok(reminders);
    assert.ok(agentMemory);
  });

  it("should have correct primary keys and column names", () => {
    assert.equal(users.id.name, "id");
    assert.equal(users.email.name, "email");
    assert.equal(workspaces.id.name, "id");
    assert.equal(channels.workspaceId.name, "workspace_id");
    assert.equal(agents.workspaceId.name, "workspace_id");
    assert.equal(messages.channelId.name, "channel_id");
    assert.equal(tasks.channelId.name, "channel_id");
    assert.equal(reactions.messageId.name, "message_id");
    assert.equal(reminders.agentId.name, "agent_id");
    assert.equal(agentMemory.agentId.name, "agent_id");
  });
});
