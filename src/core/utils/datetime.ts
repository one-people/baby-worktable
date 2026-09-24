import type { ISODate, ISODateTime } from '@/models/common';

const pad = (n: number) => String(n).padStart(2, '0');

/** Date -> 'YYYY-MM-DDTHH:mm:ss'（本地时间，不含时区后缀） */
export function toISODateTime(d: Date): ISODateTime {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** Date -> 'YYYY-MM-DD' */
export function toISODate(d: Date): ISODate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 'YYYY-MM-DDTHH:mm:ss' -> Date（按本地时间解析） */
export function parseISODateTime(s: ISODateTime): Date {
  const parts = s.split('T');
  const datePart = parts[0] ?? s;
  const timePart = parts[1] ?? '00:00:00';
  const [y, m, d] = datePart.split('-').map(Number);
  const [hh, mm, ss] = timePart.split(':').map(Number);
  return new Date(y ?? 2000, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0, ss ?? 0);
}

export function parseISODate(s: ISODate): Date {
  return parseISODateTime(`${s}T00:00:00`);
}

export function nowISO(): ISODateTime {
  return toISODateTime(new Date());
}

/** 两个 ISO 时间之间相差的分钟数（a - b） */
export function diffMinutes(a: ISODateTime, b: ISODateTime): number {
  return Math.round((parseISODateTime(a).getTime() - parseISODateTime(b).getTime()) / 60000);
}

/** 目标日期当天的 00:00 / 23:59:59，用于按日查询边界 */
export function dayStart(d: Date = new Date()): ISODateTime {
  const s = new Date(d);
  s.setHours(0, 0, 0, 0);
  return toISODateTime(s);
}

export function dayEnd(d: Date = new Date()): ISODateTime {
  const s = new Date(d);
  s.setHours(23, 59, 59, 999);
  return toISODateTime(s);
}

/** 'HH:mm' 展示 */
export function formatTime(s: ISODateTime): string {
  return s.slice(11, 16);
}

/** 'M月d日' 展示（跨天列表分组标题用） */
export function formatDate(s: ISODateTime | ISODate): string {
  const [y, m, d] = s.slice(0, 10).split('-').map(Number);
  return `${y ?? ''}年${m ?? ''}月${d ?? ''}日`;
}

/** 相对时间：刚刚 / n分钟前 / n小时前 / n天前 */
export function relativeTime(s: ISODateTime, base: Date = new Date()): string {
  const mins = Math.round((base.getTime() - parseISODateTime(s).getTime()) / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins}分钟前`;
  if (mins < 60 * 24) return `${Math.floor(mins / 60)}小时前`;
  return `${Math.floor(mins / (60 * 24))}天前`;
}

/** 由出生日期计算日龄 */
export function ageInDays(birthDate: ISODate, at: Date = new Date()): number {
  return Math.max(
    0,
    Math.floor((at.getTime() - parseISODate(birthDate).getTime()) / 86400000),
  );
}

type Ymd = { y: number; m: number; d: number };

/** 在 y/m/d 基础上加 n 个日历月，日期超出目标月天数时收敛到当月最后一天（1月31日 + 1月 = 2月28/29日） */
function addMonthsYmd({ y, m, d }: Ymd, months: number): Ymd {
  const total = y * 12 + (m - 1) + months;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  const daysInMonth = new Date(ny, nm, 0).getDate();
  return { y: ny, m: nm, d: Math.min(d, daysInMonth) };
}

function cmpYmd(a: Ymd, b: Ymd): number {
  return a.y !== b.y ? a.y - b.y : a.m !== b.m ? a.m - b.m : a.d - b.d;
}

function toYmdDate({ y, m, d }: Ymd): Date {
  return new Date(y, m - 1, d);
}

/**
 * 出生日期 -> 'x岁y个月z天'（按日历月精确计算，为 0 的前置单位省略，如 '7个月11天'、'27天'）。
 * 月份推进遇到月末不等长（如 1月31日 + 1个月 = 2月28日）按收敛规则处理。
 */
export function formatAgeYMD(birthDate: ISODate, at: Date = new Date()): string {
  const [by, bm, bd] = birthDate.split('-').map(Number);
  if (!by || !bm || !bd) return '';
  const today: Ymd = { y: at.getFullYear(), m: at.getMonth() + 1, d: at.getDate() };
  const birth: Ymd = { y: by, m: bm, d: bd };
  if (cmpYmd(today, birth) < 0) return '0天';

  let years = 0;
  while (cmpYmd(addMonthsYmd(birth, (years + 1) * 12), today) <= 0) years++;
  const yearAnchor = addMonthsYmd(birth, years * 12);
  let months = 0;
  while (cmpYmd(addMonthsYmd(yearAnchor, months + 1), today) <= 0) months++;
  const monthAnchor = addMonthsYmd(yearAnchor, months);
  const days = Math.round((toYmdDate(today).getTime() - toYmdDate(monthAnchor).getTime()) / 86400000);

  const parts: string[] = [];
  if (years > 0) parts.push(`${years}岁`);
  if (months > 0) parts.push(`${months}个月`);
  parts.push(`${days}天`);
  return parts.join('');
}
