import * as SQLite from 'expo-sqlite';

export const DB_NAME = 'babyworktable.db';

/**
 * 打开本地 SQLite 数据库（应用沙盒内，不上传任何服务器）。
 * 纯本地方案：后续如需静态加密，可在 dev client 中替换为 SQLCipher 发行版，
 * 调用方仅依赖本模块返回的 SQLiteDatabase 实例，无需改动。
 */
export async function openDatabase(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');
  return db;
}
