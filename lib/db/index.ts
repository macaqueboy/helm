import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";

let _db: BetterSQLite3Database<typeof schema> | null = null;
let _sqlite: Database.Database | null = null;

function getDb() {
  if (!_db) {
    const dbPath = process.env.DATABASE_URL?.replace("file:", "") ?? "./helm.sqlite";
    // Ensure directory exists
    const dir = dbPath.substring(0, dbPath.lastIndexOf("/"));
    if (dir) {
      try {
        const fs = require("fs");
        fs.mkdirSync(dir, { recursive: true });
      } catch {}
    }
    _sqlite = new Database(dbPath);
    _sqlite.pragma("journal_mode = WAL");
    _sqlite.pragma("foreign_keys = ON");
    _db = drizzle(_sqlite, { schema });
  }
  return _db;
}

export const db = new Proxy({} as BetterSQLite3Database<typeof schema>, {
  get(_target, prop) {
    const d = getDb();
    // Auto-create tables on first access
    try {
      _sqlite!.exec(`
        CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, password TEXT NOT NULL, avatar_seed TEXT NOT NULL, status TEXT DEFAULT 'online', created_at INTEGER);
        CREATE TABLE IF NOT EXISTS workspaces (id TEXT PRIMARY KEY, name TEXT NOT NULL, avatar_seed TEXT NOT NULL, created_at INTEGER);
        CREATE TABLE IF NOT EXISTS workspace_members (id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, user_id TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'member');
        CREATE TABLE IF NOT EXISTS channels (id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, name TEXT NOT NULL, description TEXT, is_private INTEGER NOT NULL DEFAULT 0, created_by TEXT, created_at INTEGER);
        CREATE TABLE IF NOT EXISTS agents (id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, name TEXT NOT NULL, description TEXT, runtime TEXT NOT NULL DEFAULT 'deepseek-v4-flash', model TEXT NOT NULL DEFAULT 'deepseek-v4-flash', avatar_seed TEXT, status TEXT NOT NULL DEFAULT 'idle', created_by TEXT, created_at INTEGER);
        CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, channel_id TEXT, agent_id TEXT, user_id TEXT, content TEXT NOT NULL, parent_id TEXT, created_at INTEGER);
        CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, channel_id TEXT, number INTEGER NOT NULL, title TEXT NOT NULL, description TEXT, status TEXT NOT NULL DEFAULT 'todo', owner_id TEXT, agent_id TEXT, created_by_id TEXT, created_at INTEGER, updated_at INTEGER);
        CREATE TABLE IF NOT EXISTS conversations (id TEXT PRIMARY KEY, channel_id TEXT, agent_id TEXT, dm_user_id TEXT, context TEXT, created_at INTEGER);
      `);
    } catch {}
    return Reflect.get(d, prop);
  },
});

export type Db = BetterSQLite3Database<typeof schema>;

// Re-export all schema tables and types
export { schema };
export * from "./schema";
