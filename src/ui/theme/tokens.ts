/**
 * 设计令牌：「奶油马卡龙」主题 —— 蜜桃奶油底 + 珊瑚橙主色 + 马卡龙点缀色。
 * 全局唯一的颜色 / 间距 / 圆角 / 字号来源；组件禁止出现魔法颜色值。
 */
export const palette = {
  // 主色：珊瑚橙（主按钮、Tab 高亮、选中态）
  primary: '#FF8A5E',
  primarySoft: '#FFE4D4',
  primaryDeep: '#EF6C3C',
  // 底色与容器
  bg: '#FFF4EC',
  card: '#FFFFFF',
  // 文字：可可棕系（比纯灰更暖更软）
  text: '#4A3728',
  textSubdued: '#8A7264',
  border: '#F7E2D2',
  // 时间轴轨道线：比 border 深一档，避免在奶油底上过于寡淡
  rail: '#EFD8C1',
  // 马卡龙点缀（统计卡、快捷入口、图标气泡）
  pink: '#F27D9B',
  pinkSoft: '#FFE3EA',
  mint: '#35B392',
  mintSoft: '#DCF4EC',
  sky: '#4D9FE0',
  skySoft: '#E2F1FC',
  lemon: '#F09A2E',
  lemonSoft: '#FFF1D6',
  // 语义色（柔化处理）
  danger: '#F76D6D',
  dangerSoft: '#FFE4E4',
  success: '#3BAE7D',
  successSoft: '#DDF3E7',
  warning: '#F09A2E',
  warningSoft: '#FFF1D6',
  info: '#4D9FE0',
  infoSoft: '#E2F1FC',
  chipOff: '#FBEEE1',
} as const;

/** 点缀色调映射：soft 作底、deep 作字，用于气泡/统计卡/快捷瓦片 */
export const tones = {
  coral: { soft: palette.primarySoft, deep: palette.primaryDeep },
  pink: { soft: palette.pinkSoft, deep: palette.pink },
  mint: { soft: palette.mintSoft, deep: palette.mint },
  sky: { soft: palette.skySoft, deep: palette.sky },
  lemon: { soft: palette.lemonSoft, deep: palette.lemon },
} as const;
export type Tone = keyof typeof tones;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 26,
  pill: 999,
} as const;

/** 暖色软阴影：贴纸悬浮感（card 轻浮、float 强浮） */
export const shadows = {
  card: {
    shadowColor: '#E8A87C',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  float: {
    shadowColor: '#E8703F',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
} as const;

/** 行高按字号 ×1.45 预留，中文阅读更松 */
export const typography = {
  title: { fontSize: 23, fontWeight: '800' as const, color: palette.text, lineHeight: 30 },
  heading: { fontSize: 17, fontWeight: '700' as const, color: palette.text, lineHeight: 24 },
  body: { fontSize: 15, fontWeight: '400' as const, color: palette.text, lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '400' as const, color: palette.textSubdued, lineHeight: 19 },
  stat: { fontSize: 26, fontWeight: '800' as const, color: palette.text, lineHeight: 32 },
} as const;

export const theme = { colors: palette, spacing, radius, typography, shadows };
export type Theme = typeof theme;
