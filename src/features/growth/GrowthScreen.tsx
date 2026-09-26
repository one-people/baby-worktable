import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { formatDate, formatAgeYMD, nowISO } from '@/core/utils/datetime';
import { gramsToKg, kgToGrams } from '@/core/utils/volume';
import type { GrowthRecord } from '@/models/Growth';
import { GrowthMetric, labelOf } from '@/models/common';
import { useServices } from '@/services';
import { useApp } from '@/store/AppStore';
import {
  AppText,
  Button,
  DateTimeField,
  EmptyState,
  Fab,
  GrowthChart,
  ListRow,
  ModalSheet,
  Screen,
  SectionTitle,
  SegmentedControl,
  StatCard,
  TextField,
} from '@/ui';

const METRICS = [GrowthMetric.Weight, GrowthMetric.Height, GrowthMetric.HeadCircumference];

/** 生长发育追踪：曲线图（含参考带）+ 测量记录 + 对比摘要 */
export function GrowthScreen() {
  const { growth } = useServices();
  const { activeBaby, dataVersion } = useApp();
  const [records, setRecords] = useState<GrowthRecord[]>([]);
  const [metric, setMetric] = useState<GrowthMetric>(GrowthMetric.Weight);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<GrowthRecord | null>(null);

  const load = useCallback(async () => {
    if (!activeBaby) return;
    setRecords(await growth.listForBaby(activeBaby.id));
  }, [activeBaby, growth, dataVersion]);

  useEffect(() => {
    load();
  }, [load]);

  if (!activeBaby) {
    return (
      <Screen>
        <EmptyState icon="📈" title="先创建宝宝档案" subtitle="生长曲线需要宝宝的出生日期作为横轴基准。" />
      </Screen>
    );
  }

  const points = records
    .map((r) => {
      const value = pickMetric(r, metric);
      const measured = new Date(r.measuredAt.replace(' ', 'T'));
      const ageDays = Math.max(
        0,
        Math.floor((measured.getTime() - new Date(`${activeBaby.birthDate}T00:00:00`).getTime()) / 86400000),
      );
      return value == null ? null : { ageDays, value };
    })
    .filter((p): p is { ageDays: number; value: number } => p != null)
    .sort((a, b) => a.ageDays - b.ageDays);

  const latest = records[records.length - 1] ?? null;
  const comparison = latest ? growth.compareWithReference(activeBaby, latest, metric) : null;

  return (
    <Screen
      bottomInset
      title="生长发育"
      subtitle="身高 · 体重 · 头围，追踪宝宝每一厘米"
      fab={<Fab label="记一次测量" onPress={() => { setEditingRecord(null); setFormOpen(true); }} />}
    >
      <View style={styles.metricSwitch}>
        <SegmentedControl
          options={METRICS}
          labels={Object.fromEntries(METRICS.map((m) => [m, labelOf(m)]))}
          value={metric}
          onChange={setMetric}
        />
      </View>

      {points.length === 0 ? (
        <EmptyState icon="📏" title="还没有测量数据" subtitle="记录身高体重后自动生成生长曲线。" />
      ) : (
        <GrowthChart baby={activeBaby} metric={metric} points={points} />
      )}

      <View style={styles.statsRow}>
        <StatCard
          label="当前体重"
          icon="weight"
          tone="mint"
          value={latest?.weightG != null ? gramsToKg(latest.weightG).toFixed(1) : '—'}
          unit="kg"
        />
        <StatCard
          label="当前身高"
          icon="ruler"
          tone="sky"
          value={latest?.heightCm != null ? latest.heightCm.toFixed(1) : '—'}
          unit="cm"
        />
      </View>

      {comparison && comparison.zScore != null && (
        <AppText variant="caption" style={styles.comparison}>
          最近一次{labelOf(metric)}约位于参考区间
          {comparison.band === 'below' ? '下方' : comparison.band === 'above' ? '上方' : '之内'}
          （z ≈ {comparison.zScore}，示例参考数据，仅供趋势观察）。
        </AppText>
      )}

      <SectionTitle title="测量记录" icon="calendar" trailing={<AppText variant="caption">点击编辑 · 长按删除</AppText>} />
      {records.length === 0 && <AppText variant="caption">暂无记录。</AppText>}
      {[...records].reverse().map((r) => (
        <ListRow
          key={r.id}
          icon="ruler"
          title={formatDate(r.measuredAt)}
          subtitle={describeRecord(r)}
          onPress={() => { setEditingRecord(r); setFormOpen(true); }}
          onLongPress={() =>
            Alert.alert('删除记录', '确定删除这条测量记录吗？', [
              { text: '取消', style: 'cancel' },
              { text: '删除', style: 'destructive', onPress: async () => { await growth.remove(r.id); load(); } },
            ])
          }
        />
      ))}
      <AppText variant="caption" style={styles.footerNote}>
        宝宝当前{formatAgeYMD(activeBaby.birthDate)}。
      </AppText>

      <GrowthFormSheet
        visible={formOpen}
        editing={editingRecord}
        babyId={activeBaby.id}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          load();
        }}
      />
    </Screen>
  );
}

function pickMetric(r: GrowthRecord, metric: GrowthMetric): number | null {
  switch (metric) {
    case GrowthMetric.Weight:
      return r.weightG ?? null;
    case GrowthMetric.Height:
      return r.heightCm ?? null;
    case GrowthMetric.HeadCircumference:
      return r.headCircumferenceCm ?? null;
  }
}

function describeRecord(r: GrowthRecord): string {
  const parts: string[] = [];
  if (r.heightCm != null) parts.push(`身高 ${r.heightCm.toFixed(1)}cm`);
  if (r.weightG != null) parts.push(`体重 ${gramsToKg(r.weightG).toFixed(2)}kg`);
  if (r.headCircumferenceCm != null) parts.push(`头围 ${r.headCircumferenceCm.toFixed(1)}cm`);
  return parts.join(' · ') || '无数值';
}

/* ----------------------------- 测量表单 ----------------------------- */

/** 新增 / 编辑测量记录的弹层表单：传入 editing 时为编辑模式（预填并走更新） */
function GrowthFormSheet({
  visible,
  editing,
  babyId,
  onClose,
  onSaved,
}: {
  visible: boolean;
  editing?: GrowthRecord | null;
  babyId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { growth } = useServices();
  const [measuredAt, setMeasuredAt] = useState(nowISO());
  const [heightInput, setHeightInput] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [headInput, setHeadInput] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (visible) {
      setMeasuredAt(editing ? editing.measuredAt : nowISO());
      setHeightInput(editing?.heightCm != null ? String(editing.heightCm) : '');
      setWeightInput(editing?.weightG != null ? String(gramsToKg(editing.weightG)) : '');
      setHeadInput(editing?.headCircumferenceCm != null ? String(editing.headCircumferenceCm) : '');
      setNote(editing?.note ?? '');
    }
  }, [visible, editing]);

  const save = async () => {
    const height = parseFloat(heightInput);
    const weightKg = parseFloat(weightInput);
    const head = parseFloat(headInput);
    const noneFilled =
      !Number.isFinite(height) && !Number.isFinite(weightKg) && !Number.isFinite(head);
    if (noneFilled) {
      Alert.alert('提示', '至少填写一项测量值。');
      return;
    }
    const fields = {
      measuredAt,
      heightCm: Number.isFinite(height) && height > 0 ? height : null,
      weightG: Number.isFinite(weightKg) && weightKg > 0 ? kgToGrams(weightKg) : null,
      headCircumferenceCm: Number.isFinite(head) && head > 0 ? head : null,
      note,
    };
    if (editing) {
      await growth.update({ ...editing, ...fields });
    } else {
      await growth.add({ babyId, ...fields });
    }
    onSaved();
  };

  return (
    <ModalSheet
      visible={visible}
      title={editing ? '编辑测量记录' : '记录测量'}
      onClose={onClose}
      footer={
        <>
          <Button title="取消" variant="ghost" block onPress={onClose} />
          <Button title={editing ? '保存修改' : '保存'} block onPress={() => void save()} />
        </>
      }
    >
      <DateTimeField label="测量日期" value={measuredAt} onChange={setMeasuredAt} mode="date" />
      <TextField
        label="身高（cm）"
        keyboardType="decimal-pad"
        value={heightInput}
        onChangeText={setHeightInput}
        placeholder="如 68.5"
      />
      <TextField
        label="体重（kg）"
        keyboardType="decimal-pad"
        value={weightInput}
        onChangeText={setWeightInput}
        placeholder="如 7.8"
      />
      <TextField
        label="头围（cm，选填）"
        keyboardType="decimal-pad"
        value={headInput}
        onChangeText={setHeadInput}
        placeholder="如 43.2"
      />
      <TextField label="备注（选填）" value={note} onChangeText={setNote} placeholder="如：社区医院体检" />
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  metricSwitch: { marginBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 14, marginBottom: 6 },
  comparison: { lineHeight: 19, marginBottom: 4 },
  footerNote: { marginTop: 4 },
});
