import type * as SQLite from 'expo-sqlite';

import { BaseRepository } from '@/core/database/BaseRepository';
import type { Baby } from '@/models/Baby';
import { Gender } from '@/models/common';

interface BabyRow {
  id: string;
  name: string;
  gender: string;
  birth_date: string;
  avatar_path: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export class BabyRepository extends BaseRepository<Baby, BabyRow> {
  constructor(db: SQLite.SQLiteDatabase) {
    super(db, 'babies');
  }

  protected toEntity(row: BabyRow): Baby {
    return {
      id: row.id,
      name: row.name,
      gender: row.gender as Gender,
      birthDate: row.birth_date,
      avatarPath: row.avatar_path,
      note: row.note,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  protected toRow(baby: Baby): Record<string, unknown> {
    return {
      id: baby.id,
      name: baby.name,
      gender: baby.gender,
      birth_date: baby.birthDate,
      avatar_path: baby.avatarPath ?? null,
      note: baby.note ?? null,
      created_at: baby.createdAt,
      updated_at: baby.updatedAt,
    };
  }
}
