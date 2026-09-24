import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { formatDate, formatTime, relativeTime } from '@/core/utils/datetime';
import { fromMl } from '@/core/utils/volume';
import type { FeedingRecord } from '@/models/Feeding';
import { FeedingMethod, VolumeUnit, labelOf } from '@/models/common';
import { useServices } from '@/services';
import { useApp } from '@/store/AppStore';
import {
  AppIcon,
  AppText,
  Button,
  Card,
  DetailRow,
  EmptyState,
  Screen,
  SectionTitle,
  Tag,
  theme,
  tones,
} from '@/ui';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'FeedingDetail'>;

/** 喂养记录详情：大数值摘要 + 全字段展示 + 删除 */
export function FeedingDetailScreen({ navigation, route }: Props) {
  const { feeding } = useServices();
  const { volumeUnit } = useApp();
  const [record, setRecord] = useState<FeedingRecord | null | undefined>(undefined);

  useEffect(() => {
    feeding.get(route.params.id).then(setRecord);
  }, [feeding, route.params.id]);

  const remove = () =>
    Alert.alert('删除记录', '确定删除这条喂养记录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          await feeding.remove(route.params.id);
          navigation.goBack();
        },
      },
    ]);

  if (record === null) {
    return (
      <Screen>
        <EmptyState icon="🍼" title="记录不存在" subtitle="这条喂养记录可能已被删除。" />
      </Screen>
    );
  }
  if (record === undefined) return <Screen>{null}</Screen>;

  const isOz = volumeUnit === VolumeUnit.OZ;
  const volumeText =
    record.volumeMl != null
      ? isOz
        ? fromMl(record.volumeMl, VolumeUnit.OZ).toFixed(1)
        : `${Math.round(record.volumeMl)}`
      : null;
  const unitText = volumeText != null ? (isOz ? 'oz' : 'ml') : null;

  return (
    <Screen>
      <Card style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={[styles.heroBubble, { backgroundColor: tones.pink.soft }]}>
            <AppIcon name="bottle" size={26} color={tones.pink.deep} strokeWidth={2.2} />
          </View>
          <Tag text={labelOf(record.method)} />
        </View>
        <View style={styles.heroValueRow}>
          <AppText variant="stat">{volumeText ?? labelOf(record.method)}</AppText>
          {unitText != null && <AppText style={styles.heroUnit}>{unitText}</AppText>}
        </View>
        <AppText variant="caption">
          {formatDate(record.startedAt)} {formatTime(record.startedAt)} · {relativeTime(record.startedAt)}
        </AppText>
      </Card>

      <SectionTitle title="详细信息" icon="note" />
      <Card style={styles.fields}>
        <DetailRow label="开始时间" value={`${formatDate(record.startedAt)} ${formatTime(record.startedAt)}`} />
        <DetailRow
          label="喂养方式"
          value={
            labelOf(record.method) +
            (record.nursingSide != null && record.method === FeedingMethod.Breast
              ? ` · ${labelOf(record.nursingSide)}`
              : '')
          }
        />
        <DetailRow label="奶量" value={volumeText != null ? `${volumeText} ${unitText}` : '未记录'} />
        <DetailRow
          label="持续时长"
          value={record.durationSeconds != null ? `${Math.round(record.durationSeconds / 60)} 分钟` : null}
        />
        <DetailRow label="备注" value={record.note} multiline />
        <DetailRow label="记录于" value={`${formatDate(record.createdAt)} ${formatTime(record.createdAt)}`} />
      </Card>

      <Button title="删除这条记录" variant="danger" block onPress={remove} style={styles.deleteBtn} />
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
  heroUnit: { fontSize: 15, fontWeight: '700', color: theme.colors.textSubdued, paddingBottom: 5 },
  fields: { gap: theme.spacing.lg },
  deleteBtn: { marginTop: theme.spacing.xl },
});
