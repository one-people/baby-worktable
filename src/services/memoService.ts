import { touch } from '@/core/database/BaseRepository';
import {
  MemoCategoryRepository,
  MemoRepository,
} from '@/core/database/repositories/memoRepo';
import { reminderScheduler } from '@/core/reminders/reminderScheduler';
import { nowISO } from '@/core/utils/datetime';
import { newId } from '@/core/utils/id';
import { ReminderRepeat, type ISODateTime } from '@/models/common';
import type {
  Memo,
  MemoCategory,
  MemoCategoryDraft,
  MemoCategoryNode,
  MemoDraft,
} from '@/models/Memo';

import type { IMemoService } from './interfaces';

export function createMemoService(
  repo: MemoRepository,
  categoryRepo: MemoCategoryRepository,
): IMemoService {
  return {
    async add(draft: MemoDraft): Promise<Memo> {
      const now = nowISO();
      const reminderAt = draft.reminderAt ?? null;
      const reminderEnabled = Boolean(reminderAt && (draft.reminderEnabled ?? true));
      const memo: Memo = {
        id: newId(),
        babyId: draft.babyId,
        categoryId: draft.categoryId,
        title: draft.title.trim(),
        content: draft.content?.trim() || null,
        pinned: draft.pinned ?? false,
        reminderAt,
        reminderRepeat: draft.reminderRepeat ?? ReminderRepeat.None,
        reminderEnabled,
        notificationId: null,
        createdAt: now,
        updatedAt: now,
      };
      await repo.insert(memo);
      if (memo.reminderEnabled && memo.reminderAt) {
        const notificationId = await reminderScheduler.schedule({
          title: `备忘提醒：${memo.title}`,
          body: memo.content ?? undefined,
          at: memo.reminderAt,
          repeat: memo.reminderRepeat,
        });
        if (notificationId) {
          const updated = { ...memo, notificationId };
          await repo.update(updated);
          return updated;
        }
      }
      return memo;
    },

    async update(memo: Memo): Promise<void> {
      await repo.update(touch(memo));
    },

    async remove(id: string): Promise<void> {
      const memo = await repo.getById(id);
      if (memo) {
        await reminderScheduler.cancel(memo.notificationId);
      }
      await repo.remove(id);
    },

    async list(categoryId) {
      return categoryId === undefined ? repo.listOrdered() : repo.listByCategory(categoryId);
    },

    async search(keyword: string): Promise<Memo[]> {
      const all = await repo.listOrdered();
      const kw = keyword.trim().toLowerCase();
      if (!kw) return all;
      return all.filter(
        (m) =>
          m.title.toLowerCase().includes(kw) || (m.content ?? '').toLowerCase().includes(kw),
      );
    },

    /* ---- 分类树 ---- */

    async addCategory(draft: MemoCategoryDraft): Promise<MemoCategory> {
      const now = nowISO();
      const category: MemoCategory = {
        id: newId(),
        parentId: draft.parentId,
        name: draft.name.trim(),
        sortOrder: draft.sortOrder ?? 0,
        createdAt: now,
        updatedAt: now,
      };
      await categoryRepo.insert(category);
      return category;
    },

    async updateCategory(category: MemoCategory): Promise<void> {
      await categoryRepo.update(touch(category));
    },

    async removeCategory(id: string): Promise<void> {
      await categoryRepo.remove(id);
    },

    async listCategoryTree(): Promise<MemoCategoryNode[]> {
      const all = await categoryRepo.listAll();
      const byParent = new Map<string | null, MemoCategory[]>();
      for (const c of all) {
        const list = byParent.get(c.parentId) ?? [];
        list.push(c);
        byParent.set(c.parentId, list);
      }
      const build = (parentId: string | null, depth: number): MemoCategoryNode[] =>
        (byParent.get(parentId) ?? []).map((c) => ({
          ...c,
          depth,
          children: build(c.id, depth + 1),
        }));
      return build(null, 0);
    },

    /* ---- 智能提醒 ---- */

    async setReminder(
      memo: Memo,
      at: ISODateTime | null,
      repeat: Memo['reminderRepeat'],
    ): Promise<Memo> {
      await reminderScheduler.cancel(memo.notificationId);
      let notificationId: string | null = null;
      if (at) {
        notificationId = await reminderScheduler.schedule({
          title: `备忘提醒：${memo.title}`,
          body: memo.content ?? undefined,
          at,
          repeat,
        });
      }
      const updated: Memo = {
        ...memo,
        reminderAt: at,
        reminderRepeat: repeat,
        reminderEnabled: Boolean(at && notificationId),
        notificationId,
        updatedAt: nowISO(),
      };
      await repo.update(updated);
      return updated;
    },
  };
}
