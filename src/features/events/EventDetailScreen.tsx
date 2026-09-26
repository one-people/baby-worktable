import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, View } from 'react-native';

import { resolvePhotoUri } from '@/core/files/photoStore';
import { formatDate, formatTime, relativeTime } from '@/core/utils/datetime';
import type { AbnormalEvent } from '@/models/AbnormalEvent';
import { EventCategory, labelOf } from '@/models/common';
import { useServices } from '@/services';
import {
  AppIcon,
  AppText,
  Button,
  Card,
  DetailRow,
  EmptyState,
  Screen,
  SectionTitle,
  SeverityTag,
  theme,
  tones,
} from '@/ui';
import type { RootStackScreenProps } from '@/navigation/types';

import { EventFormSheet } from './EventsScreen';

type Props = RootStackScreenProps<'EventDetail'>;

/** 症状类别对应的色调与图标（与列表页一致） */
const CATEGORY_META: Record<EventCategory, { tone: keyof typeof tones; icon: 'heartPulse' | 'alert' }> = {
  [EventCategory.Fever]: { tone: 'coral', icon: 'heartPulse' },
  [EventCategory.Rash]: { tone: 'pink', icon: 'heartPulse' },
  [EventCategory.Cough]: { tone: 'sky', icon: 'heartPulse' },
  [EventCategory.Diarrhea]: { tone: 'lemon', icon: 'alert' },
  [EventCategory.Vomit]: { tone: 'lemon', icon: 'alert' },
  [EventCategory.Other]: { tone: 'mint', icon: 'alert' },
};

/** 异常事件详情：症状摘要 + 全字段 + 过敏原预警 + 照片 + 编辑 / 删除 */
export function EventDetailScreen({ navigation, route }: Props) {
  const { event, allergen } = useServices();
  const [record, setRecord] = useState<AbnormalEvent | null | undefined>(undefined);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false);

  const reload = useCallback(() => {
    let alive = true;
    event.get(route.params.id).then(async (e) => {
      if (!alive) return;
      setRecord(e);
      if (e?.description) {
        const hits = await allergen.checkTextForWarnings(e.babyId, e.description);
        if (alive) setWarnings(hits.map((w) => w.message));
      }
    });
    return () => {
      alive = false;
    };
  }, [event, allergen, route.params.id]);

  useEffect(() => reload(), [reload]);

  const remove = () =>
    Alert.alert('删除事件', '删除后将同时移除其照片附件，确定删除？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          await event.remove(route.params.id);
          navigation.goBack();
        },
      },
    ]);

  if (record === null) {
    return (
      <Screen>
        <EmptyState icon="🩺" title="事件不存在" subtitle="这条异常事件可能已被删除。" />
      </Screen>
    );
  }
  if (record === undefined) return <Screen>{null}</Screen>;

  const meta = CATEGORY_META[record.category] ?? CATEGORY_META[EventCategory.Other];
  const tone = tones[meta.tone];

  return (
    <Screen>
      <Card style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={[styles.heroBubble, { backgroundColor: tone.soft }]}>
            <AppIcon name={meta.icon} size={26} color={tone.deep} strokeWidth={2.2} />
          </View>
          <SeverityTag severity={record.severity} />
        </View>
        <View style={styles.heroValueRow}>
          <AppText variant="stat">{labelOf(record.category)}</AppText>
          {record.temperatureC != null && (
            <>
              <AppText style={styles.heroTemp}>{record.temperatureC}</AppText>
              <AppText style={styles.heroUnit}>℃</AppText>
            </>
          )}
        </View>
        <AppText variant="caption">
          {formatDate(record.occurredAt)} {formatTime(record.occurredAt)} · {relativeTime(record.occurredAt)}
        </AppText>
      </Card>

      {warnings.length > 0 && (
        <Card style={styles.warningCard}>
          <AppText variant="body" style={styles.warningTitle}>⚠️ 过敏原预警</AppText>
          {warnings.map((w) => (
            <AppText key={w} variant="caption" style={styles.warningText}>{w}</AppText>
          ))}
        </Card>
      )}

      <SectionTitle title="详细信息" icon="note" />
      <Card style={styles.fields}>
        <DetailRow label="发生时间" value={`${formatDate(record.occurredAt)} ${formatTime(record.occurredAt)}`} />
        <DetailRow label="症状类别" value={labelOf(record.category)} />
        <DetailRow label="严重程度" value={labelOf(record.severity)} />
        <DetailRow label="体温" value={record.temperatureC != null ? `${record.temperatureC} ℃` : null} />
        <DetailRow label="详细描述" value={record.description} multiline />
        <DetailRow label="记录于" value={`${formatDate(record.createdAt)} ${formatTime(record.createdAt)}`} />
      </Card>

      {record.attachments.length > 0 && (
        <>
          <SectionTitle title={`照片附件（${record.attachments.length}）`} icon="camera" />
          <View style={styles.photoCol}>
            {record.attachments.map((a) => (
              <Image key={a.id} source={{ uri: resolvePhotoUri(a.filePath) }} style={styles.photo} />
            ))}
          </View>
          <AppText variant="caption">照片仅保存在本机应用沙盒，不会上传。</AppText>
        </>
      )}

      <Button
        title="编辑这条事件"
        variant="secondary"
        block
        onPress={() => setFormOpen(true)}
        style={styles.editBtn}
      />
      <Button title="删除这条事件" variant="danger" block onPress={remove} style={styles.deleteBtn} />

      {record != null && (
        <EventFormSheet
          visible={formOpen}
          editing={record}
          babyId={record.babyId}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            reload();
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: 10, marginBottom: 4 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroBubble: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroValueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  heroTemp: { fontSize: 24, fontWeight: '800', color: theme.colors.primaryDeep, paddingBottom: 3 },
  heroUnit: { fontSize: 15, fontWeight: '700', color: theme.colors.textSubdued, paddingBottom: 5 },
  warningCard: { gap: 6, backgroundColor: theme.colors.warningSoft, marginBottom: 4 },
  warningTitle: { fontWeight: '700' },
  warningText: { lineHeight: 19 },
  fields: { gap: theme.spacing.lg },
  photoCol: { gap: theme.spacing.md, marginBottom: theme.spacing.sm },
  photo: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.chipOff,
  },
  editBtn: { marginTop: theme.spacing.xl },
  deleteBtn: { marginTop: theme.spacing.md },
});
