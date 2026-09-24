import type * as SQLite from 'expo-sqlite';

import { BaseRepository } from '@/core/database/BaseRepository';
import type { GrowthRecord } from '@/models/Growth';

interface GrowthRow {
  id: string;
  baby_id: string;
  measured_at: string;
  height_cm: number | null;
  weight_g: number | null;
  head_circumference_cm: number | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export class GrowthRepository extends BaseRepository<GrowthRecord, GrowthRow> {
  constructor(db: SQLite.SQLiteDatabase) {
    super(db, 'growth_records');
  }

  protected toEntity(row: GrowthRow): GrowthRecord {
    return {
      id: row.id,
      babyId: row.baby_id,
      measuredAt: row.measured_at,
      heightCm: row.height_cm,
      weightG: row.weight_g,
      headCircumferenceCm: row.head_circumference_cm,
      note: row.note,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  protected toRow(r: GrowthRecord): Record<string, unknown> {
    return {
      id: r.id,
      baby_id: r.babyId,
      measured_at: r.measuredAt,
      height_cm: r.heightCm ?? null,
      weight_g: r.weightG ?? null,
      head_circumference_cm: r.headCircumferenceCm ?? null,
      note: r.note ?? null,
      created_at: r.createdAt,
      updated_at: r.updatedAt,
    };
  }

  /** 生长曲线需要按时间升序的全量记录 */
  async listForBabyAsc(babyId: string): Promise<GrowthRecord[]> {
    const rows = await this.db.getAllAsync<GrowthRow>(
      'SELECT * FROM growth_records WHERE baby_id = ? ORDER BY measured_at ASC;',
      [babyId],
    );
    return this.mapRows(rows);
  }
}
