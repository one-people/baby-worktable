import {
  BackupFormatError,
  backupFileName,
  countPayloadRows,
  parseBackup,
  type BackupPayload,
} from './exportService';

function makePayload(overrides: Partial<BackupPayload> = {}): BackupPayload {
  return {
    format: 'babyworktable.backup',
    version: 1,
    exportedAt: '2026-09-24T12:00:00',
    tables: {
      babies: [{ id: 'b1', name: '小橘子', gender: 'male' }],
      feeding_records: [{ id: 'f1', baby_id: 'b1' }, { id: 'f2', baby_id: 'b1' }],
    },
    ...overrides,
  };
}

describe('backupFileName', () => {
  it('生成带时间戳的备份文件名', () => {
    expect(backupFileName(new Date('2026-09-24T15:30:00'))).toBe(
      'babyworktable-backup-2026-09-24-15-30-00.json',
    );
  });
});

describe('countPayloadRows', () => {
  it('统计所有业务表的行数', () => {
    expect(countPayloadRows(makePayload())).toBe(3);
  });

  it('缺失的表按 0 行计', () => {
    expect(countPayloadRows(makePayload({ tables: {} }))).toBe(0);
  });
});

describe('parseBackup', () => {
  it('解析合法备份并补齐缺失的表', () => {
    const payload = parseBackup(JSON.stringify(makePayload()));
    expect(payload.format).toBe('babyworktable.backup');
    expect(payload.tables.babies).toHaveLength(1);
    // 未包含的表补为空数组，导入时可安全清空重放
    expect(payload.tables.growth_records).toEqual([]);
  });

  it('拒绝非法 JSON', () => {
    expect(() => parseBackup('not json')).toThrow(BackupFormatError);
  });

  it('拒绝缺少格式标识的文件', () => {
    expect(() => parseBackup(JSON.stringify({ version: 1, tables: {} }))).toThrow(
      '这不是宝宝工作台的备份文件',
    );
  });

  it('拒绝不支持的版本', () => {
    expect(() =>
      parseBackup(JSON.stringify(makePayload({ version: 2 as unknown as 1 }))),
    ).toThrow('不被当前应用支持');
  });

  it('拒绝缺少数据表内容的载荷', () => {
    expect(() =>
      parseBackup(JSON.stringify(makePayload({ tables: undefined as unknown as BackupPayload['tables'] }))),
    ).toThrow('备份缺少数据表内容');
  });
});
