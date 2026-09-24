import type * as SQLite from 'expo-sqlite';

import { BaseRepository } from '@/core/database/BaseRepository';
import type { FeedingRecord } from '@/models/Feeding';
import { FeedingMethod, NursingSide, type TimeRangeQuery } from '@/models/common';

interface FeedingRow {
  id: string;
  baby_id: string;
  started_at: string;
  ended_at: string | null;
  method: string;
  volume_ml: number | null;
  duration_seconds: number | null;
  nursing_side: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export class FeedingRepository extends BaseRepository<FeedingRecord, FeedingRow> {
  constructor(db: SQLite.SQLiteDatabase) {
    super(db, 'feeding_records');
  }

  protected toEntity(row: FeedingRow): FeedingRecord {
    return {
      id: row.id,
      babyId: row.baby_id,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      method: row.method as FeedingMethod,
      volumeMl: row.volume_ml,
      durationSeconds: row.duration_seconds,
      nursingSide: (row.nursing_side as NursingSide | null) ?? null,
      note: row.note,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  protected toRow(r: FeedingRecord): Record<string, unknown> {
    return {
      id: r.id,
      baby_id: r.babyId,
      started_at: r.startedAt,
      ended_at: r.endedAt ?? null,
      method: r.method,
      volume_ml: r.volumeMl ?? null,
      duration_seconds: r.durationSeconds ?? null,
      nursing_side: r.nursingSide ?? null,
      note: r.note ?? null,
      created_at: r.createdAt,
      updated_at: r.updatedAt,
    };
  }

  async listForBaby(babyId: string, query: TimeRangeQuery = {}): Promise<FeedingRecord[]> {
    const conditions = ['baby_id = ?'];
    const params: SQLite.SQLiteBindParams = [babyId];
    if (query.from != null) {
      conditions.push('started_at >= ?');
      params.push(query.from);
    }
    if (query.to != null) {
      conditions.push('started_at <= ?');
      params.push(query.to);
    }
    const limit = query.limit != null ? `LIMIT ${Number(query.limit)} OFFSET ${Number(query.offset ?? 0)}` : '';
    const rows = await this.db.getAllAsync<FeedingRow>(
      `SELECT * FROM feeding_records WHERE ${conditions.join(' AND ')} ORDER BY started_at DESC ${limit};`,
      params,
    );
    return this.mapRows(rows);
  }
}
