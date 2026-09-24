// SDK 54 起默认导出为新的 File/Directory API，旧异步 API 迁移至 /legacy 子路径
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import type * as SQLite from 'expo-sqlite';

import { toISODateTime } from '@/core/utils/datetime';

/** 需要随备份导出的全部业务表（导入按该依赖顺序重放） */
const EXPORTED_TABLES = [
  'babies',
  'feeding_records',
  'abnormal_events',
  'event_attachments',
  'memo_categories',
  'memos',
  'allergens',
  'baby_allergens',
  'growth_records',
] as const;

export interface BackupPayload {
  format: 'babyworktable.backup';
  version: 1;
  exportedAt: string;
  tables: Record<string, Record<string, unknown>[]>;
}

export class BackupFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BackupFormatError';
  }
}

/** 备份文件名：babyworktable-backup-2026-09-24-15-30-00.json */
export function backupFileName(now = new Date()): string {
  const stamp = toISODateTime(now).replace(/[:T]/g, '-');
  return `babyworktable-backup-${stamp}.json`;
}

/** 从数据库构建完整备份载荷（不含照片本体，附件清单已含路径） */
export async function buildBackupPayload(db: SQLite.SQLiteDatabase): Promise<BackupPayload> {
  const tables: BackupPayload['tables'] = {};
  for (const table of EXPORTED_TABLES) {
    tables[table] = await db.getAllAsync<Record<string, unknown>>(`SELECT * FROM ${table};`);
  }
  return {
    format: 'babyworktable.backup',
    version: 1,
    exportedAt: toISODateTime(new Date()),
    tables,
  };
}

export function countPayloadRows(payload: BackupPayload): number {
  return EXPORTED_TABLES.reduce((sum, t) => sum + (payload.tables[t]?.length ?? 0), 0);
}

/** 校验并解析备份 JSON；格式或版本不符抛 BackupFormatError */
export function parseBackup(json: string): BackupPayload {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new BackupFormatError('不是有效的 JSON 文件，请选择导出的备份文件。');
  }
  if (typeof raw !== 'object' || raw === null) {
    throw new BackupFormatError('备份文件结构不正确。');
  }
  const payload = raw as Partial<BackupPayload>;
  if (payload.format !== 'babyworktable.backup') {
    throw new BackupFormatError('这不是宝宝工作台的备份文件（缺少格式标识）。');
  }
  if (payload.version !== 1) {
    throw new BackupFormatError(`备份版本（v${String(payload.version)}）不被当前应用支持。`);
  }
  if (typeof payload.tables !== 'object' || payload.tables === null) {
    throw new BackupFormatError('备份缺少数据表内容。');
  }
  const tables: BackupPayload['tables'] = {};
  for (const t of EXPORTED_TABLES) {
    const rows = payload.tables[t];
    tables[t] = Array.isArray(rows) ? rows : [];
  }
  return { format: 'babyworktable.backup', version: 1, exportedAt: payload.exportedAt ?? '', tables };
}

/**
 * 全量导入：清空业务表后按外键依赖顺序重放，整个过程在单个事务内。
 * 行数据来自备份文件，重放前已通过 parseBackup 校验。
 */
export async function replayBackup(db: SQLite.SQLiteDatabase, payload: BackupPayload): Promise<number> {
  await db.withTransactionAsync(async () => {
    for (const table of [...EXPORTED_TABLES].reverse()) {
      await db.runAsync(`DELETE FROM ${table};`);
    }
    for (const table of EXPORTED_TABLES) {
      const rows = payload.tables[table] ?? [];
      for (const row of rows) {
        const cols = Object.keys(row);
        await db.runAsync(
          `INSERT OR REPLACE INTO ${table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')});`,
          cols.map((c) => row[c]) as unknown as SQLite.SQLiteBindParams,
        );
      }
    }
  });
  return countPayloadRows(payload);
}

export interface ExportResult {
  rowCount: number;
  /** web 保存 / 原生沙盒文件名 */
  fileName: string;
  /** 原生端沙盒文件路径；web 端为空串 */
  filePath: string;
  /** web 端导出方式：picker=系统保存对话框、download=浏览器下载、cancel=用户取消（未产出文件） */
  via?: 'picker' | 'download' | 'cancel';
}

/** File System Access API 的最小类型面，避免依赖 lib.dom 版本 */
type SavePicker = (options: {
  suggestedName?: string;
  types?: { description?: string; accept: Record<string, string[]> }[];
}) => Promise<{ createWritable: () => Promise<{
  write: (data: string) => Promise<void>;
  close: () => Promise<void>;
}> }>;

/**
 * 系统保存对话框保存（用户自选位置）。
 * 环境不支持或已失去用户手势时返回 unsupported，由调用方走下载兜底；
 * 用户在系统对话框点取消返回 cancel。
 */
async function saveWithFilePicker(json: string, fileName: string): Promise<'saved' | 'cancel' | 'unsupported'> {
  const picker = (window as { showSaveFilePicker?: SavePicker }).showSaveFilePicker;
  if (typeof picker !== 'function') return 'unsupported';
  try {
    const handle = await picker.call(window, {
      suggestedName: fileName,
      types: [{ description: '宝宝工作台备份', accept: { 'application/json': ['.json'] } }],
    });
    const writable = await handle.createWritable();
    await writable.write(json);
    await writable.close();
    return 'saved';
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return 'cancel';
    return 'unsupported';
  }
}

/** data URL 锚点下载。部分内嵌浏览器下载处理器不识别 blob: URL（内容会存错），data URL 无此问题 */
function downloadViaDataUrl(json: string, fileName: string): void {
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  const a = document.createElement('a');
  a.href = 'data:application/json;charset=utf-8;base64,' + btoa(binary);
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * 导出全部业务数据：
 * web 直接触发浏览器下载；原生写入沙盒 backups/ 并尽量拉起系统分享。
 */
export async function exportAll(db: SQLite.SQLiteDatabase): Promise<ExportResult> {
  const payload = await buildBackupPayload(db);
  const json = JSON.stringify(payload, null, 2);
  const fileName = backupFileName();
  const rowCount = countPayloadRows(payload);

  if (Platform.OS === 'web') {
    const picked = await saveWithFilePicker(json, fileName);
    if (picked === 'saved') return { rowCount, fileName, filePath: '', via: 'picker' };
    if (picked === 'cancel') return { rowCount: 0, fileName, filePath: '', via: 'cancel' };
    downloadViaDataUrl(json, fileName);
    return { rowCount, fileName, filePath: '', via: 'download' };
  }

  const dir = `${FileSystem.documentDirectory}backups/`;
  const dirInfo = await FileSystem.getInfoAsync(dir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
  const filePath = `${dir}${fileName}`;
  await FileSystem.writeAsStringAsync(filePath, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(filePath, {
      mimeType: 'application/json',
      dialogTitle: '导出宝宝工作台备份',
    });
  }
  return { rowCount, fileName, filePath };
}

/** 导入备份 JSON 字符串：校验 → 事务内全量重放，返回恢复的行数 */
export async function importAll(db: SQLite.SQLiteDatabase, json: string): Promise<number> {
  const payload = parseBackup(json);
  return replayBackup(db, payload);
}
