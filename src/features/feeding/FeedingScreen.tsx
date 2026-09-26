import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { formatTime, nowISO } from '@/core/utils/datetime';
import { fromMl, toMl } from '@/core/utils/volume';
import type { FeedingRecord } from '@/models/Feeding';
import {
  FEEDING_METHODS,
  FeedingMethod,
  NURSING_SIDES,
  VolumeUnit,
  labelOf,
} from '@/models/common';
import { useServices } from '@/services';
import { useApp } from '@/store/AppStore';
import type { MainTabScreenProps } from '@/navigation/types';
import {
  AppText,
  Button,
  Chip,
  DateTimeField,
  EmptyState,
  Fab,
  ModalSheet,
  Screen,
  SearchBox,
  SegmentedControl,
  StatCard,
  TextField,
  TimelineDay,
  TimelineItem,
  theme,
  timelineDayLabel,
  type Tone,
} from '@/ui';

const UNIT_OPTIONS: readonly VolumeUnit[] = [VolumeUnit.ML, VolumeUnit.OZ];

const METHOD_TONE: Record<FeedingMethod, Tone> = {
  [FeedingMethod.Breast]: 'pink',
  [FeedingMethod.Formula]: 'sky',
  [FeedingMethod.Mixed]: 'mint',
  [FeedingMethod.Solid]: 'lemon',
};

/** 喂养记录：当日统计 + 时间轴（按日分组）+ 名称检索 + 新增弹层 */
export function FeedingScreen({ navigation }: MainTabScreenProps<'Feeding'>) {
  const { feeding } = useServices();
  const { activeBaby, volumeUnit, setVolumeUnit, dataVersion } = useApp();

  const [records, setRecords] = useState<FeedingRecord[]>([]);
  const [totalMl, setTotalMl] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FeedingRecord | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    if (!activeBaby) return;
    const [list, stats] = await Promise.all([
      feeding.listForBaby(activeBaby.id, { limit: 60 }),
      feeding.getDayStats(activeBaby.id),
    ]);
    setRecords(list);
    setTotalMl(stats.totalMl);
  }, [activeBaby, feeding, dataVersion]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    if (!kw) return records;
    return records.filter((r) =>
      [labelOf(r.method), r.nursingSide != null ? labelOf(r.nursingSide) : '', r.note ?? '']
        .join(' ')
        .toLowerCase()
        .includes(kw),
    );
  }, [records, search]);

  const grouped = useMemo(() => groupByDay(filtered), [filtered]);

  if (!activeBaby) {
    return (
      <Screen>
        <EmptyState icon="🍼" title="先创建宝宝档案" subtitle="喂养记录需要归属到宝宝名下。" />
      </Screen>
    );
  }

  return (
    <Screen
      bottomInset
      title="喂养记录"
      subtitle="时间 · 方式 · 奶量 · 时长，一目了然"
      fab={<Fab label="记一次" onPress={() => { setEditingRecord(null); setFormOpen(true); }} />}
    >
      <View style={styles.statsRow}>
        <StatCard
          label="今日总奶量"
          icon="bottle"
          tone="pink"
          value={volumeUnit === VolumeUnit.OZ ? fromMl(totalMl, VolumeUnit.OZ).toFixed(1) : `${Math.round(totalMl)}`}
          unit={volumeUnit === VolumeUnit.OZ ? 'oz' : 'ml'}
          hint={`今日 ${records.filter(isToday).length} 次`}
        />
        <View style={styles.unitCard}>
          <AppText variant="caption">单位</AppText>
          <SegmentedControl
            options={UNIT_OPTIONS}
            labels={{ [VolumeUnit.ML]: 'ml', [VolumeUnit.OZ]: 'oz' }}
            value={volumeUnit}
            onChange={setVolumeUnit}
          />
        </View>
      </View>

      <SearchBox placeholder="搜索方式 / 备注…" value={search} onChange={setSearch} />

      {records.length === 0 ? (
        <EmptyState icon="🍼" title="还没有喂养记录" subtitle="点击右下角“记一次”开始记录。" />
      ) : grouped.length === 0 ? (
        <EmptyState icon="🔍" title="没有匹配的记录" subtitle="换个关键词试试，例如“配方奶”或备注里的词。" />
      ) : (
        grouped.map(([day, items]) => (
          <View key={day}>
            <TimelineDay label={timelineDayLabel(day)} />
            {items.map((r, i) => (
              <TimelineItem
                key={r.id}
                time={formatTime(r.startedAt)}
                tone={METHOD_TONE[r.method]}
                first={i === 0}
                last={i === items.length - 1}
                onPress={() => navigation.navigate('FeedingDetail', { id: r.id })}
                onLongPress={() =>
                  Alert.alert('删除记录', '确定删除这条喂养记录吗？', [
                    { text: '取消', style: 'cancel' },
                    { text: '删除', style: 'destructive', onPress: () => void feeding.remove(r.id).then(load) },
                  ])
                }
              >
                <View style={styles.cardTitleRow}>
                  <AppText variant="body" style={styles.cardTitle}>
                    {labelOf(r.method)}
                    {r.nursingSide != null && ` · ${labelOf(r.nursingSide)}`}
                  </AppText>
                  {r.volumeMl != null && (
                    <AppText style={styles.cardVolume}>
                      {volumeUnit === VolumeUnit.OZ
                        ? `${fromMl(r.volumeMl, VolumeUnit.OZ).toFixed(1)} oz`
                        : `${Math.round(r.volumeMl)} ml`}
                    </AppText>
                  )}
                </View>
                {(r.durationSeconds != null || r.note != null) && (
                  <AppText variant="caption" numberOfLines={2}>
                    {[
                      r.durationSeconds != null ? `持续 ${Math.round(r.durationSeconds / 60)} 分钟` : '',
                      r.note ?? '',
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </AppText>
                )}
              </TimelineItem>
            ))}
          </View>
        ))
      )}

      <FeedingFormSheet
        visible={formOpen}
        editing={editingRecord}
        babyId={activeBaby.id}
        unit={volumeUnit}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          load();
        }}
      />
    </Screen>
  );
}

function isToday(r: FeedingRecord): boolean {
  return r.startedAt.slice(0, 10) === nowISO().slice(0, 10);
}

function groupByDay(records: FeedingRecord[]): [string, FeedingRecord[]][] {
  const map = new Map<string, FeedingRecord[]>();
  for (const r of records) {
    const day = r.startedAt.slice(0, 10);
    const list = map.get(day) ?? [];
    list.push(r);
    map.set(day, list);
  }
  return [...map.entries()];
}

/* ----------------------------- 新增表单 ----------------------------- */

interface FormState {
  startedAt: string;
  method: FeedingMethod;
  volumeInput: string;
  durationInput: string;
  nursingSide: typeof NURSING_SIDES[number];
  note: string;
}

/** 新增 / 编辑喂养记录的弹层表单：传入 editing 时为编辑模式（预填并走更新） */
export function FeedingFormSheet({
  visible,
  editing,
  babyId,
  unit,
  onClose,
  onSaved,
}: {
  visible: boolean;
  editing?: FeedingRecord | null;
  babyId: string;
  unit: VolumeUnit;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { feeding } = useServices();
  const [form, setForm] = useState<FormState>(blankForm());

  useEffect(() => {
    if (visible) setForm(editing ? prefillForm(editing, unit) : blankForm());
  }, [visible, editing, unit]);

  const save = async () => {
    const volume = parseFloat(form.volumeInput);
    const durationMin = parseFloat(form.durationInput);
    const fields = {
      startedAt: form.startedAt,
      method: form.method,
      volumeMl: Number.isFinite(volume) && volume > 0 ? toMl(volume, unit) : null,
      durationSeconds: Number.isFinite(durationMin) && durationMin > 0 ? Math.round(durationMin * 60) : null,
      nursingSide: form.method === FeedingMethod.Breast ? form.nursingSide : null,
      note: form.note,
    };
    if (editing) {
      await feeding.update({ ...editing, ...fields });
    } else {
      await feeding.add({ babyId, ...fields });
    }
    onSaved();
  };

  return (
    <ModalSheet
      visible={visible}
      title={editing ? '编辑喂养记录' : '记一次喂养'}
      onClose={onClose}
      footer={
        <>
          <Button title="取消" variant="ghost" block onPress={onClose} />
          <Button title={editing ? '保存修改' : '保存'} block onPress={() => void save()} />
        </>
      }
    >
      <DateTimeField label="时间" value={form.startedAt} onChange={(v) => setForm({ ...form, startedAt: v })} />
      <View style={styles.fieldBlock}>
        <AppText variant="caption" style={styles.fieldLabel}>喂养方式</AppText>
        <View style={styles.chipRow}>
          {FEEDING_METHODS.map((m) => (
            <Chip key={m} label={labelOf(m)} selected={form.method === m} onPress={() => setForm({ ...form, method: m })} />
          ))}
        </View>
      </View>
      {form.method === FeedingMethod.Breast && (
        <View style={styles.fieldBlock}>
          <AppText variant="caption" style={styles.fieldLabel}>亲喂侧别</AppText>
          <View style={styles.chipRow}>
            {NURSING_SIDES.map((s) => (
              <Chip key={s} label={labelOf(s)} selected={form.nursingSide === s} onPress={() => setForm({ ...form, nursingSide: s })} />
            ))}
          </View>
        </View>
      )}
      {(form.method === FeedingMethod.Formula || form.method === FeedingMethod.Mixed) && (
        <TextField
          label={`奶量 (${unit === VolumeUnit.OZ ? '盎司 oz' : '毫升 ml'})`}
          keyboardType="decimal-pad"
          value={form.volumeInput}
          onChangeText={(v) => setForm({ ...form, volumeInput: v })}
        />
      )}
      {form.method === FeedingMethod.Solid && (
        <AppText variant="caption" style={styles.solidHint}>
          辅食不记奶量：吃了什么、吃了多少写进备注即可（如「米粉 + 南瓜泥，大半碗」）。
        </AppText>
      )}
      <TextField
        label="持续时长（分钟，选填）"
        keyboardType="decimal-pad"
        value={form.durationInput}
        onChangeText={(v) => setForm({ ...form, durationInput: v })}
      />
      <TextField
        label="备注（选填）"
        value={form.note}
        onChangeText={(v) => setForm({ ...form, note: v })}
        placeholder={
          form.method === FeedingMethod.Solid
            ? '例如：米粉 / 南瓜泥，吃了大半碗'
            : '例如：吃得很急 / 打嗝了'
        }
      />
    </ModalSheet>
  );
}

function blankForm(): FormState {
  return {
    startedAt: nowISO(),
    method: FeedingMethod.Formula,
    volumeInput: '',
    durationInput: '',
    nursingSide: NURSING_SIDES[0]!,
    note: '',
  };
}

/** 编辑模式：把已存记录换算回表单字符串（奶量按当前单位展示） */
function prefillForm(r: FeedingRecord, unit: VolumeUnit): FormState {
  return {
    startedAt: r.startedAt,
    method: r.method,
    volumeInput:
      r.volumeMl != null
        ? unit === VolumeUnit.OZ
          ? String(fromMl(r.volumeMl, VolumeUnit.OZ).toFixed(1))
          : String(Math.round(r.volumeMl))
        : '',
    durationInput: r.durationSeconds != null ? String(Math.round(r.durationSeconds / 60)) : '',
    nursingSide: r.nursingSide ?? NURSING_SIDES[0]!,
    note: r.note ?? '',
  };
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  unitCard: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 12,
    gap: 8,
    justifyContent: 'center',
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontWeight: '700', flex: 1 },
  cardVolume: { fontSize: 16, fontWeight: '800', color: theme.colors.primaryDeep },
  fieldBlock: { gap: 6 },
  fieldLabel: { fontWeight: '500', color: theme.colors.text },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  solidHint: { color: theme.colors.textSubdued },
});
