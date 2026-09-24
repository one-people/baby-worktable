import { BabyRepository } from '@/core/database/repositories/babyRepo';
import { nowISO } from '@/core/utils/datetime';
import { newId } from '@/core/utils/id';
import type { Baby, BabyDraft } from '@/models/Baby';

import type { IBabyService } from './interfaces';

export function createBabyService(repo: BabyRepository): IBabyService {
  return {
    async list(): Promise<Baby[]> {
      return repo.list('created_at ASC');
    },

    async get(id: string): Promise<Baby | null> {
      return repo.getById(id);
    },

    async create(draft: BabyDraft): Promise<Baby> {
      const baby: Baby = {
        id: newId(),
        name: draft.name.trim(),
        gender: draft.gender,
        birthDate: draft.birthDate,
        avatarPath: draft.avatarPath ?? null,
        note: draft.note ?? null,
        createdAt: nowISO(),
        updatedAt: nowISO(),
      };
      await repo.insert(baby);
      return baby;
    },

    async update(baby: Baby): Promise<void> {
      await repo.update({ ...baby, name: baby.name.trim(), updatedAt: nowISO() });
    },

    async remove(id: string): Promise<void> {
      // 级联清空该宝宝的喂养/事件/生长记录与过敏原关联（见迁移中的 ON DELETE CASCADE）
      await repo.remove(id);
    },
  };
}
