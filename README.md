# 宝宝工作台（Baby Worktable）

一款**纯本地、零后端**的婴儿数据记录与管理移动应用：喂养、异常事件、日常备忘、过敏原与生长发育，全部数据只存在你自己的手机里。

> 原始需求文档见 [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md)，架构与模块设计详见 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)。

## 项目背景与目标

新生儿阶段（0–2 岁）家长需要在疲劳中记录大量碎片化信息：几点喂的奶、吃了多少、今天有没有发热、辅食试了什么新食材、体检身高体重多少。这些信息分散在记忆、聊天记录和纸上，就医时难以回溯。

宝宝工作台的目标是把这五类高频记录收进一个**随手可记、可回溯、可导出**的应用，并坚持一条隐私底线：**宝宝的健康数据不出设备**。

## 核心功能模块

| 模块 | 能力 | 代码入口 |
|------|------|----------|
| 🍼 喂养记录 | 时间、奶量（ml/oz 双单位）、方式（母乳/配方奶/混合）、亲喂侧别与时长、备注；当日总量统计与"距上次喂养" | `src/features/feeding` |
| 🩺 异常事件 | 发热/皮疹/咳嗽等症状、严重度分级、体温、结构化描述、照片附件（仅存本机沙盒） | `src/features/events` |
| 📝 日常备忘录 | 任意层级分类树、置顶、搜索、智能提醒（一次/每天/每周，走系统通知） | `src/features/memos` |
| ⚠️ 过敏原管理 | 内置 15 项常见过敏原库 + 用户自定义、与具体宝宝关联（严重度/是否确诊）、文本命中自动预警 | `src/features/allergens` |
| 📈 生长发育 | 身高/体重/头围记录、自动生成生长曲线并与参考带对比（z-score/百分位） | `src/features/growth` |

> **参考数据声明**：生长曲线的参考带目前是**示例占位数据**（`src/data/whoGrowthReference.ts`），仅用于可视化演示，不可用于医学判断；接入 WHO 官方 LMS 全量表即可替换，接口无需改动。

## 技术栈与选型理由

| 技术 | 用途 | 选择理由 |
|------|------|----------|
| React Native + Expo（SDK 54，托管工作流） | 跨端框架 | 一套 TypeScript 代码同时产出 iOS/Android；Expo 托管原生配置，新成员 `npx expo start` 即可跑起来；后续需要 SQLCipher 加密时可通过 dev client 平滑迁出托管限制 |
| TypeScript（strict） | 语言 | 婴儿健康数据对字段正确性要求高，类型即文档；模型层枚举直接对齐数据库取值 |
| expo-sqlite | 本地数据库 | 应用沙盒内的单文件 SQLite，WAL 模式 + 外键约束；版本化迁移机制内置（`src/core/database/migrations.ts`） |
| AsyncStorage | 轻量偏好 | 仅存"当前宝宝 / 奶量单位"两个会话偏好 |
| expo-image-picker + expo-file-system | 照片附件 | 相册选图后复制进沙盒 `photos/` 目录，数据库只存相对路径，删除记录时同步清理文件 |
| expo-notifications | 备忘提醒 | 系统级本地通知，应用被杀也能准时提醒 |
| @react-navigation（native-stack + bottom-tabs） | 导航 | 显式声明式路由，五个高频入口进底部 Tab，备忘/过敏原/宝宝编辑走堆栈 |
| react-native-svg（自绘 LineChart） | 生长曲线 | 只有折线图+参考带一种需求，自绘约 150 行可控代码，避免引入整图表库；后续需要更复杂交互再换 victory-native |
| jest-expo | 单测 | 覆盖纯函数层（单位换算、日期计算、z-score 估算） |

**为什么纯本地优先**：宝宝喂养/健康/照片属于高敏感数据，需求明确强调"数据安全"。纯本地方案零账号、零服务器、零泄露面；数据安全边界 = 手机本身的安全边界。备份通过导出 JSON 留存，导入能力与（可选的）端到端加密同步在路线图中。

## 目录结构

```
├── index.ts                  # Expo 入口（registerRootComponent）
├── App.tsx                   # 根组件：Provider 装配 + NavigationContainer
├── app.json                  # Expo 配置（权限文案、插件）
├── docs/
│   ├── REQUIREMENTS.md       # 原始需求文档（归档）
│   └── ARCHITECTURE.md       # 架构与模块设计
└── src/
    ├── models/               # 标准化数据模型（纯类型 + 枚举 + 中文标签）
    │   ├── common.ts         #   通用类型、五大模块共享枚举
    │   ├── Baby.ts / Feeding.ts / AbnormalEvent.ts / Memo.ts / Allergen.ts / Growth.ts
    │   └── index.ts
    ├── core/                 # 基础设施层（与业务 UI 无关）
    │   ├── database/         #   SQLite 客户端、版本化迁移、BaseRepository
    │   │   └── repositories/ #   各表仓库（行 ↔ 实体映射 + 专用查询）
    │   ├── files/            #   照片沙盒存储
    │   ├── reminders/        #   expo-notifications 封装（备忘提醒）
    │   ├── backup/           #   JSON 导出/导入
    │   └── utils/            #   id / 日期 / 单位换算（含单测）
    ├── services/             # 核心服务层
    │   ├── interfaces.ts     #   七个服务接口（UI 依赖的唯一契约）
    │   ├── *Service.ts       #   各模块实现（仓库编排 + 业务规则）
    │   └── index.tsx         #   ServicesProvider（开库→迁移→注入）
    ├── data/                 # WHO 生长参考（占位示例集）
    ├── store/                # 全局状态（当前宝宝 / 单位偏好）
    ├── ui/                   # 基础 UI 组件库
    │   ├── theme/tokens.ts   #   设计令牌（颜色/间距/圆角/字号）
    │   ├── components/       #   Button/Card/Chip/TextField/ModalSheet/Fab…
    │   └── charts/           #   LineChart / GrowthChart（生长曲线）
    ├── features/             # 五大模块页面（按功能域组织）
    │   ├── home/ feeding/ events/ memos/ allergens/ growth/ settings/
    └── navigation/           # 路由类型与 RootNavigator
```

## 各模块设计思路（摘要）

- **喂养记录**：内部统一以毫升、秒存储（`volume_ml` / `duration_seconds`），盎司只是展示偏好；`getDayStats` 一次查询聚合出当日总量/次数/方式分布/距上次喂养，首页与喂养页共用。
- **异常事件**：事件与照片附件分表（`event_attachments`），照片本体复制进沙盒、库内只存相对路径，删除事件级联清理文件；发热类事件带 `temperature_c` 字段。
- **日常备忘**：分类表 `parent_id` 自关联支持任意层级；提醒字段（时间/重复/通知 id）与系统通知联动——编辑提醒先撤销旧通知再排定新通知，删除备忘同步撤销。
- **过敏原**：内置库（`is_custom=0`）+ 自定义条目；宝宝与过敏原多对多关联带"严重度/是否确诊"；预警是纯函数式检测——事件/备忘保存时把文本送入 `checkTextForWarnings`，命中已登记过敏原名称即弹预警。
- **生长发育**：体重以克存整数避免浮点误差；曲线横轴统一为日龄；参考数据模块与 WHO 官方 LMS 表结构对齐（median/±2SD + 变异系数），替换数据不动代码。

## 快速开始

环境要求：Node ≥ 18、npm；iOS 真机/模拟器需 Xcode，Android 需 Android Studio（或直接用 [Expo Go](https://expo.dev/go) 扫码）。

```bash
npm install
npx expo start        # 生成二维码，用 Expo Go 扫码即可运行
```

常用脚本：

```bash
npm run typecheck     # tsc --noEmit 全量类型检查
npm test              # jest 单元测试（工具函数层）
npm run doctor        # expo-doctor 依赖健康检查
```

> 若依赖版本与当前 Expo SDK 不匹配，`npx expo install --check` 会自动校正。

## 数据安全与隐私

- 所有数据存储于应用沙盒（SQLite 文件 + `photos/` + `backups/`），**无任何网络请求**，卸载即彻底删除。
- 权限最小化：仅申请相册读取（附加照片）与通知（备忘提醒），权限文案见 `app.json`。
- 备份导出为明文 JSON，请自行存放到安全位置；数据库静态加密（SQLCipher via dev client）在路线图中。

## 路线图

- **v0.2**：导入备份（外键顺序重放）；接入 WHO 官方 LMS 全量参考表；喂养/睡眠周报
- **v0.3**：SQLCipher 静态加密（dev client）；深色模式；iPad 适配
- **v1.0**：可选的端到端加密云同步（iCloud / 自建），默认仍为纯本地

## 免责声明

本项目为家庭记录工具，不提供医学建议；生长参考带当前为示例占位数据。健康问题请咨询专业医生。
