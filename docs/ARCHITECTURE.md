# 架构说明

## 分层总览

```
┌─────────────────────────────────────────────────┐
│ features/  页面层（五大模块 Screen + 表单弹层）        │
│ navigation/  路由（Tabs + Stack）                    │
├─────────────────────────────────────────────────┤
│ ui/  基础组件库（design tokens + 组件 + 图表）        │  ← 不依赖业务
│ store/  会话状态（当前宝宝 / 单位偏好）                │
├─────────────────────────────────────────────────┤
│ services/  服务层（interfaces.ts 契约 + 实现）        │  ← 页面唯一的数据入口
├─────────────────────────────────────────────────┤
│ core/  基础设施（SQLite/迁移/仓库/照片/提醒/备份）     │  ← 不依赖 UI
│ models/  数据模型（纯类型，全员共享）                  │
│ data/  参考数据（WHO 占位集）                        │
└─────────────────────────────────────────────────┘
```

依赖规则（由上向下单向依赖）：

- `features` 只 import `services`（接口）、`ui`、`store`、`models`，**不直接触碰** SQLite 或文件系统。
- `services` 依赖 `core`（仓库）与 `models`，实现业务规则（统计聚合、预警检测、提醒编排）。
- `ui` 与 `core` 互不依赖；`models` 不依赖任何人。

## 数据流：以“新增喂养记录”为例

```
FeedingScreen(表单)
  → useServices().feeding.add(draft)          # 页面只调接口
    → FeedingRepository.insert(entity)        # camelCase → snake_case 落库
  → 页面 load() 重新拉取列表 + getDayStats     # 聚合在服务层，UI 只展示
```

## 数据库与迁移

- 单文件 SQLite（`babyworktable.db`），WAL + 外键开启（`core/database/client.ts`）。
- 迁移是**只追加**的版本数组（`core/database/migrations.ts`）：每版 DDL 在事务中执行并登记 `schema_migrations`。加表/加列 = 新增一个 `{ version, statements }` 条目。
- 删除宝宝时，喂养/事件/生长/过敏原关联靠 `ON DELETE CASCADE` 级联清理，备忘的 `baby_id` 置空（`SET NULL`）。

## 服务层模式

`services/interfaces.ts` 定义七个接口（baby / feeding / event / memo / allergen / growth / backup）。页面通过 `useServices()` 拿到实现，测试或换存储时用同名接口替换实现即可。`ServicesProvider`（`services/index.tsx`）负责：打开数据库 → 跑迁移 → 写入内置过敏原库 → 把实现放进 Context。

## 各模块设计要点

### 喂养
- 数值规范：内部一律 `volume_ml`（REAL）与 `duration_seconds`（INT）；盎司是展示层换算（`core/utils/volume.ts`，1 oz = 29.5735295625 ml）。
- `getDayStats` 返回当日总量、次数、方式分布、最近一次与距上次分钟数，首页看板与喂养页头部共用。

### 异常事件
- 事件（`abnormal_events`）与附件（`event_attachments`）分表；照片复制进沙盒 `photos/`，库里只存相对路径。
- 删除事件时先物理删除照片文件再删记录（`eventService.remove`）。
- 保存事件后调用 `allergen.checkTextForWarnings(babyId, description)` 命中预警即向用户弹窗——这是过敏原模块的“触发预警机制”落点。

### 备忘
- 分类：`memo_categories.parent_id` 自关联 → 任意层级树；服务层 `listCategoryTree` 组装成带 `depth` 的节点树供 UI 缩进展示。
- 提醒：`reminder_at / reminder_repeat / reminder_enabled / notification_id` 四字段与 `core/reminders/reminderScheduler.ts`（expo-notifications 封装）联动；编辑提醒 = 撤销旧通知 + 排定新通知；未获通知权限时备忘仍保存但提示用户。

### 过敏原
- 库 = 内置（`is_custom=0`，首启幂等写入 15 项）+ 自定义；重名合并（`findByName`）。
- 关联表 `baby_allergens` 复合主键，`upsert` 冲突更新严重度/确诊状态。
- 预警是纯查询式检测：对文本做过敏原名称（按 `/` 分词）子串匹配，返回结构化 `AllergyWarning[]`，UI 决定如何呈现。

### 生长发育
- 体重以克（INTEGER）存储避免浮点误差，展示换算 kg。
- 曲线横轴统一为**日龄**（`ageInDays(birthDate, measuredAt)`），身高/体重/头围共用一个 `LineChart`。
- 参考数据在 `data/whoGrowthReference.ts`：当前为示例占位集（月龄中位数 ±2SD + 变异系数），`estimateZScore` 用简化公式 `(value/M − 1)/S` + 相邻点线性插值，`normalCDF` 输出百分位。**替换为 WHO 官方 LMS 表时只需改这个文件**，导出接口不变。

## 如何新增一个模块（示例：辅食记录）

1. `models/`: 新建 `Food.ts`（实体 + Draft + 枚举）并在 `models/index.ts` 导出。
2. `core/database/migrations.ts`: 追加 version=2 迁移（建表 + 索引）。
3. `core/database/repositories/`: 新建仓库，继承 `BaseRepository`，实现 `toEntity/toRow` + 专用查询。
4. `services/interfaces.ts`: 定义 `IFoodService`；新建 `foodService.ts` 实现；在 `services/index.tsx` 的 `Services` 工厂注册。
5. `features/food/`: 页面（Screen + ModalSheet 表单），只用 `useServices()` 和 `ui/` 组件。
6. 需要入口时在 `navigation/types.ts` 加路由、`RootNavigator.tsx` 挂载。

## 测试策略

- 当前覆盖纯函数层（`core/utils`、`data/whoGrowthReference`），可在 node 环境快速运行。
- 服务层测试规划：以内存 SQLite（`openDatabaseAsync(':memory:')`）+ 真实迁移跑接口契约测试。
- UI 层以手动验收 + 后续 RNTL 冒烟为主。

## 已知边界（诚实清单）

- WHO 参考带为占位示例数据；头围无参考数据（曲线仍可展示实测值）。
- 备份仅支持导出，导入未实现（接口已预留）。
- Android 日期时间选择为“日期 + 15 分钟步进微调”的简化交互，正式版可换滚轮。
- 数据库未做静态加密（路线图：SQLCipher dev client）。
