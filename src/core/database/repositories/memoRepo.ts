import type * as SQLite from 'expo-sqlite';

import { BaseRepository } from '@/core/database/BaseRepository';
import type { Memo, MemoCategory } from '@/models/Memo';
import { ReminderRepeat } from '@/models/common';

interface MemoRow {
  id: string;
  baby_id: string | null;
  category_id: string | null;
  title: string;
  content: string | null;
  pinned: number;
  reminder_at: string | null;
  reminder_repeat: string;
  reminder_enabled: number;
  notification_id: string | null;
  created_at: string;
  updated_at: string;
}

interface CategoryRow {
  id: string;
  parent_id: string | null;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export class MemoRepository extends BaseRepository<Memo, MemoRow> {
  constructor(db: SQLite.SQLiteDatabase) {
    super(db, 'memos');
  }

  protected toEntity(row: MemoRow): Memo {
    return {
      id: row.id,
      babyId: row.baby_id,
      categoryId: row.category_id,
      title: row.title,
      content: row.content,
      pinned: row.pinned === 1,
      reminderAt: row.reminder_at,
      reminderRepeat: row.reminder_repeat as ReminderRepeat,
      reminderEnabled: row.reminder_enabled === 1,
      notificationId: row.notification_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  protected toRow(m: Memo): Record<string, unknown> {
    return {
      id: m.id,
      baby_id: m.babyId,
      category_id: m.categoryId,
      title: m.title,
      content: m.content ?? null,
      pinned: m.pinned ? 1 : 0,
      reminder_at: m.reminderAt,
      reminder_repeat: m.reminderRepeat,
      reminder_enabled: m.reminderEnabled ? 1 : 0,
      notification_id: m.notificationId ?? null,
      created_at: m.createdAt,
      updated_at: m.updatedAt,
    };
  }

  async listOrdered(): Promise<Memo[]> {
    const rows = await this.db.getAllAsync<MemoRow>(
      'SELECT * FROM memos ORDER BY pinned DESC, updated_at DESC;',
    );
    return this.mapRows(rows);
  }

  async listByCategory(categoryId: string | null): Promise<Memo[]> {
    const op = categoryId == null ? 'IS NULL' : '= ?';
    const params: SQLite.SQLiteBindParams = categoryId == null ? [] : [categoryId];
    const rows = await this.db.getAllAsync<MemoRow>(
      `SELECT * FROM memos WHERE category_id ${op} ORDER BY pinned DESC, updated_at DESC;`,
      params,
    );
    return this.mapRows(rows);
  }
}

export class MemoCategoryRepository extends BaseRepository<MemoCategory, CategoryRow> {
  constructor(db: SQLite.SQLiteDatabase) {
    super(db, 'memo_categories');
  }

  protected toEntity(row: CategoryRow): MemoCategory {
    return {
      id: row.id,
      parentId: row.parent_id,
      name: row.name,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  protected toRow(c: MemoCategory): Record<string, unknown> {
    return {
      id: c.id,
      parent_id: c.parentId,
      name: c.name,
      sort_order: c.sortOrder,
      created_at: c.createdAt,
      updated_at: c.updatedAt,
    };
  }

  async listAll(): Promise<MemoCategory[]> {
    const rows = await this.db.getAllAsync<CategoryRow>(
      'SELECT * FROM memo_categories ORDER BY sort_order ASC, created_at ASC;',
    );
    return this.mapRows(rows);
  }
}
