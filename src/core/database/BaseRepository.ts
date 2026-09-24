import type * as SQLite from 'expo-sqlite';

import { nowISO } from '@/core/utils/datetime';

type BindParams = SQLite.SQLiteBindParams;
type BindValue = SQLite.SQLiteBindValue;

/**
 * 通用仓库基类：封装行 <-> 实体的映射样板与基础 CRUD。
 * 子类只需提供表名与 toEntity 映射，即可获得 getById / list / update / remove。
 */
export abstract class BaseRepository<Entity, Row extends object> {
  constructor(
    protected readonly db: SQLite.SQLiteDatabase,
    protected readonly table: string,
  ) {}

  /** 数据库行 -> 领域实体（snake_case -> camelCase、数值/布尔还原等） */
  protected abstract toEntity(row: Row): Entity;

  /** 实体 -> 数据库行（与 toEntity 互逆，值须为 SQLite 可绑定类型） */
  protected abstract toRow(entity: Entity): Record<string, unknown>;

  protected mapRows(rows: Row[]): Entity[] {
    return rows.map((r) => this.toEntity(r));
  }

  protected bind(values: unknown[]): BindValue[] {
    return values.map((v) => v as BindValue);
  }

  async getById(id: string): Promise<Entity | null> {
    const row = await this.db.getFirstAsync<Row>(
      `SELECT * FROM ${this.table} WHERE id = ? LIMIT 1;`,
      [id],
    );
    return row ? this.toEntity(row) : null;
  }

  async list(orderBy = 'created_at DESC', limit?: number, offset = 0): Promise<Entity[]> {
    const limitClause = limit != null ? `LIMIT ${Number(limit)} OFFSET ${Number(offset)}` : '';
    const rows = await this.db.getAllAsync<Row>(
      `SELECT * FROM ${this.table} ORDER BY ${orderBy} ${limitClause};`,
    );
    return this.mapRows(rows);
  }

  async insert(entity: Entity): Promise<void> {
    const row = this.toRow(entity);
    const cols = Object.keys(row);
    const placeholders = cols.map(() => '?').join(', ');
    await this.db.runAsync(
      `INSERT INTO ${this.table} (${cols.join(', ')}) VALUES (${placeholders});`,
      this.bind(cols.map((c) => row[c])),
    );
  }

  async update(entity: Entity): Promise<void> {
    const row = this.toRow(entity);
    const id = row['id'];
    const cols = Object.keys(row).filter((c) => c !== 'id');
    const assignments = cols.map((c) => `${c} = ?`).join(', ');
    await this.db.runAsync(
      `UPDATE ${this.table} SET ${assignments} WHERE id = ?;`,
      this.bind([...cols.map((c) => row[c]), id]),
    );
  }

  async remove(id: string): Promise<void> {
    await this.db.runAsync(`DELETE FROM ${this.table} WHERE id = ?;`, [id]);
  }

  async count(where = '1=1', params: BindParams = []): Promise<number> {
    const r = await this.db.getFirstAsync<{ n: number }>(
      `SELECT COUNT(*) AS n FROM ${this.table} WHERE ${where};`,
      params,
    );
    return r?.n ?? 0;
  }
}

/** 更新时间戳的便捷工具（供服务层更新实体时调用） */
export function touch<T extends { updatedAt: string }>(entity: T): T {
  return { ...entity, updatedAt: nowISO() };
}
