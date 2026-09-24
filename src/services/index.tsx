import React, { createContext, useContext, useEffect, useState } from 'react';
import type { SQLiteDatabase } from 'expo-sqlite';
import { ActivityIndicator, View } from 'react-native';

import { exportAll, importAll } from '@/core/backup/exportService';
import { migrateDatabase } from '@/core/database/migrations';
import { openDatabase } from '@/core/database/client';
import { AllergenRepository, BabyAllergenRepository } from '@/core/database/repositories/allergenRepo';
import { BabyRepository } from '@/core/database/repositories/babyRepo';
import { EventAttachmentRepository, EventRepository } from '@/core/database/repositories/eventRepo';
import { FeedingRepository } from '@/core/database/repositories/feedingRepo';
import { GrowthRepository } from '@/core/database/repositories/growthRepo';
import { MemoCategoryRepository, MemoRepository } from '@/core/database/repositories/memoRepo';

import { createAllergenService } from './allergenService';
import { createBabyService } from './babyService';
import { createEventService } from './eventService';
import { createFeedingService } from './feedingService';
import { createGrowthService } from './growthService';
import { createMemoService } from './memoService';
import type {
  IAbnormalEventService,
  IAllergenService,
  IBabyService,
  IBackupService,
  IFeedingService,
  IGrowthService,
  IMemoService,
} from './interfaces';

/** 服务注册表：依赖服务时使用 useServices().feeding 等形式 */
export interface Services {
  db: SQLiteDatabase;
  baby: IBabyService;
  feeding: IFeedingService;
  event: IAbnormalEventService;
  memo: IMemoService;
  allergen: IAllergenService;
  growth: IGrowthService;
  backup: IBackupService;
}

export function createServices(db: SQLiteDatabase): Services {
  const babyRepo = new BabyRepository(db);
  const feedingRepo = new FeedingRepository(db);
  const attachmentRepo = new EventAttachmentRepository(db);
  const eventRepo = new EventRepository(db, attachmentRepo);
  const memoRepo = new MemoRepository(db);
  const memoCategoryRepo = new MemoCategoryRepository(db);
  const allergenRepo = new AllergenRepository(db);
  const babyAllergenRepo = new BabyAllergenRepository(db);
  const growthRepo = new GrowthRepository(db);

  return {
    db,
    baby: createBabyService(babyRepo),
    feeding: createFeedingService(feedingRepo),
    event: createEventService(eventRepo, attachmentRepo),
    memo: createMemoService(memoRepo, memoCategoryRepo),
    allergen: createAllergenService(allergenRepo, babyAllergenRepo),
    growth: createGrowthService(growthRepo),
    backup: {
      exportAll: () => exportAll(db),
      importAll: (json: string) => importAll(db, json),
    },
  };
}

const ServicesContext = createContext<Services | null>(null);

/** 打开数据库、执行迁移并注入服务（应用启动时挂载一次） */
export function ServicesProvider({ children }: { children: React.ReactNode }) {
  const [services, setServices] = useState<Services | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const db = await openDatabase();
      await migrateDatabase(db);
      const s = createServices(db);
      await s.allergen.ensurePresets();
      if (!cancelled) setServices(s);
    })().catch((err) => {
      console.error('[ServicesProvider] 数据库初始化失败', err);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!services) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  return <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>;
}

export function useServices(): Services {
  const ctx = useContext(ServicesContext);
  if (!ctx) throw new Error('useServices 必须在 <ServicesProvider> 内使用');
  return ctx;
}
