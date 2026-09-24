import {
  ageInDays,
  diffMinutes,
  formatAgeYMD,
  parseISODateTime,
  toISODateTime,
} from './datetime';

describe('datetime 工具', () => {
  it('ISO 字符串与 Date 往返一致（本地时区）', () => {
    const d = new Date(2026, 8, 24, 8, 30, 0);
    const iso = toISODateTime(d);
    expect(iso).toBe('2026-09-24T08:30:00');
    expect(parseISODateTime(iso).getTime()).toBe(d.getTime());
  });

  it('diffMinutes 计算时间差（分钟）', () => {
    expect(diffMinutes('2026-09-24T09:00:00', '2026-09-24T08:00:00')).toBe(60);
    expect(diffMinutes('2026-09-24T08:30:00', '2026-09-24T08:00:00')).toBe(30);
  });

  it('日龄计算', () => {
    const birth = '2026-01-01';
    const at = new Date(2026, 0, 31); // 30 天后
    expect(ageInDays(birth, at)).toBe(30);
  });

  it('岁/月/天精确年龄展示', () => {
    // 2026-02-13 → 2026-09-24：7 个日历月 + 11 天
    expect(formatAgeYMD('2026-02-13', new Date(2026, 8, 24))).toBe('7个月11天');
    // 满周岁且带三个月单位
    expect(formatAgeYMD('2025-07-21', new Date(2026, 8, 24))).toBe('1岁2个月3天');
    // 不足一个月只显示天数
    expect(formatAgeYMD('2026-02-13', new Date(2026, 2, 12))).toBe('27天');
    // 出生当天
    expect(formatAgeYMD('2026-02-13', new Date(2026, 1, 13))).toBe('0天');
    // 月末不等长：1月31日 + 1个月收敛到 2月28日
    expect(formatAgeYMD('2026-01-31', new Date(2026, 2, 1))).toBe('1个月1天');
    // 闰月收敛：2024-02-29 满两岁推进到 2026-02-28
    expect(formatAgeYMD('2024-02-29', new Date(2026, 8, 24))).toBe('2岁6个月27天');
  });
});
