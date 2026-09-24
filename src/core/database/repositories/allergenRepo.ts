import type * as SQLite from 'expo-sqlite';

import { BaseRepository } from '@/core/database/BaseRepository';
import type { Allergen, BabyAllergen } from '@/models/Allergen';
import { AllergenCategory, SeverityLevel } from '@/models/common';

interface AllergenRow {
  id: string;
  name: string;
  category: string;
  is_custom: number;
  note: string | null;
  created_at: string;
}

interface BabyAllergenRow {
  baby_id: string;
  allergen_id: string;
  severity: string;
  confirmed: number;
  note: string | null;
  linked_at: string;
}

export class AllergenRepository extends BaseRepository<Allergen, AllergenRow> {
  constructor(db: SQLite.SQLiteDatabase) {
    super(db, 'allergens');
  }

  protected toEntity(row: AllergenRow): Allergen {
    return {
      id: row.id,
      name: row.name,
      category: row.category as AllergenCategory,
      isCustom: row.is_custom === 1,
      note: row.note,
      createdAt: row.created_at,
    };
  }

  protected toRow(a: Allergen): Record<string, unknown> {
    return {
      id: a.id,
      name: a.name,
      category: a.category,
      is_custom: a.isCustom ? 1 : 0,
      note: a.note ?? null,
      created_at: a.createdAt,
    };
  }

  async findByName(name: string): Promise<Allergen | null> {
    const row = await this.db.getFirstAsync<AllergenRow>(
      'SELECT * FROM allergens WHERE name = ? LIMIT 1;',
      [name],
    );
    return row ? this.toEntity(row) : null;
  }
}

/** 关联表（复合主键，无 id 列），不走 BaseRepository */
export class BabyAllergenRepository {
  constructor(private readonly db: SQLite.SQLiteDatabase) {}

  async listForBaby(babyId: string): Promise<BabyAllergen[]> {
    const rows = await this.db.getAllAsync<BabyAllergenRow>(
      'SELECT * FROM baby_allergens WHERE baby_id = ? ORDER BY linked_at DESC;',
      [babyId],
    );
    return rows.map(toLink);
  }

  async get(babyId: string, allergenId: string): Promise<BabyAllergen | null> {
    const row = await this.db.getFirstAsync<BabyAllergenRow>(
      'SELECT * FROM baby_allergens WHERE baby_id = ? AND allergen_id = ? LIMIT 1;',
      [babyId, allergenId],
    );
    return row ? toLink(row) : null;
  }

  async upsert(link: BabyAllergen): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO baby_allergens (baby_id, allergen_id, severity, confirmed, note, linked_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(baby_id, allergen_id)
       DO UPDATE SET severity = excluded.severity,
                     confirmed = excluded.confirmed,
                     note = excluded.note;`,
      [link.babyId, link.allergenId, link.severity, link.confirmed ? 1 : 0, link.note ?? null, link.linkedAt],
    );
  }

  async delete(babyId: string, allergenId: string): Promise<void> {
    await this.db.runAsync(
      'DELETE FROM baby_allergens WHERE baby_id = ? AND allergen_id = ?;',
      [babyId, allergenId],
    );
  }
}

function toLink(row: BabyAllergenRow): BabyAllergen {
  return {
    babyId: row.baby_id,
    allergenId: row.allergen_id,
    severity: row.severity as SeverityLevel,
    confirmed: row.confirmed === 1,
    note: row.note,
    linkedAt: row.linked_at,
  };
}
