import type * as SQLite from 'expo-sqlite';

export interface Migration {
  version: number;
  name: string;
  statements: string[];
}

/**
 * 版本化迁移：只追加、不修改历史条目。
 * 每个版本的 DDL 在事务中执行并登记到 schema_migrations。
 */
const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'init-core-tables',
    statements: [
      `CREATE TABLE IF NOT EXISTS babies (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        gender TEXT NOT NULL,
        birth_date TEXT NOT NULL,
        avatar_path TEXT,
        note TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS feeding_records (
        id TEXT PRIMARY KEY NOT NULL,
        baby_id TEXT NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
        started_at TEXT NOT NULL,
        ended_at TEXT,
        method TEXT NOT NULL,
        volume_ml REAL,
        duration_seconds INTEGER,
        nursing_side TEXT,
        note TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );`,
      `CREATE INDEX IF NOT EXISTS idx_feeding_baby_time ON feeding_records(baby_id, started_at DESC);`,
      `CREATE TABLE IF NOT EXISTS abnormal_events (
        id TEXT PRIMARY KEY NOT NULL,
        baby_id TEXT NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
        occurred_at TEXT NOT NULL,
        category TEXT NOT NULL,
        severity TEXT NOT NULL,
        temperature_c REAL,
        description TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );`,
      `CREATE INDEX IF NOT EXISTS idx_events_baby_time ON abnormal_events(baby_id, occurred_at DESC);`,
      `CREATE TABLE IF NOT EXISTS event_attachments (
        id TEXT PRIMARY KEY NOT NULL,
        event_id TEXT NOT NULL REFERENCES abnormal_events(id) ON DELETE CASCADE,
        file_path TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        created_at TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS memo_categories (
        id TEXT PRIMARY KEY NOT NULL,
        parent_id TEXT REFERENCES memo_categories(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS memos (
        id TEXT PRIMARY KEY NOT NULL,
        baby_id TEXT REFERENCES babies(id) ON DELETE SET NULL,
        category_id TEXT REFERENCES memo_categories(id) ON DELETE SET NULL,
        title TEXT NOT NULL,
        content TEXT,
        pinned INTEGER NOT NULL DEFAULT 0,
        reminder_at TEXT,
        reminder_repeat TEXT NOT NULL DEFAULT 'none',
        reminder_enabled INTEGER NOT NULL DEFAULT 0,
        notification_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );`,
      `CREATE INDEX IF NOT EXISTS idx_memos_updated ON memos(updated_at DESC);`,
      `CREATE TABLE IF NOT EXISTS allergens (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        is_custom INTEGER NOT NULL DEFAULT 0,
        note TEXT,
        created_at TEXT NOT NULL
      );`,
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_allergens_name ON allergens(name);`,
      `CREATE TABLE IF NOT EXISTS baby_allergens (
        baby_id TEXT NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
        allergen_id TEXT NOT NULL REFERENCES allergens(id) ON DELETE CASCADE,
        severity TEXT NOT NULL,
        confirmed INTEGER NOT NULL DEFAULT 0,
        note TEXT,
        linked_at TEXT NOT NULL,
        PRIMARY KEY (baby_id, allergen_id)
      );`,
      `CREATE TABLE IF NOT EXISTS growth_records (
        id TEXT PRIMARY KEY NOT NULL,
        baby_id TEXT NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
        measured_at TEXT NOT NULL,
        height_cm REAL,
        weight_g INTEGER,
        head_circumference_cm REAL,
        note TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );`,
      `CREATE INDEX IF NOT EXISTS idx_growth_baby_time ON growth_records(baby_id, measured_at ASC);`,
    ],
  },
];

export async function migrateDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );`,
  );

  const appliedRows = await db.getAllAsync<{ version: number }>(
    'SELECT version FROM schema_migrations;',
  );
  const applied = new Set(appliedRows.map((r) => r.version));

  for (const migration of MIGRATIONS) {
    if (applied.has(migration.version)) continue;
    await db.withTransactionAsync(async () => {
      for (const stmt of migration.statements) {
        await db.execAsync(stmt);
      }
      await db.runAsync(
        'INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?);',
        [migration.version, migration.name, new Date().toISOString()],
      );
    });
  }
}
