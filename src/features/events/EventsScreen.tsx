import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Image, StyleSheet, View } from 'react-native';

import { resolvePhotoUri, pickPhotoFromLibrary } from '@/core/files/photoStore';
import { formatTime, nowISO } from '@/core/utils/datetime';
import type { AbnormalEvent } from '@/models/AbnormalEvent';
import {
  EVENT_CATEGORIES,
  EventCategory,
  SEVERITY_LEVELS,
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
  SeverityTag,
  TextField,
  TimelineDay,
  TimelineItem,
  theme,
  timelineDayLabel,
  type Tone,
} from '@/ui';

const CATEGORY_TONE: Record<EventCategory, Tone> = {
  [EventCategory.Fever]: 'coral',
  [EventCategory.Rash]: 'pink',
  [EventCategory.Cough]: 'sky',
  [EventCategory.Diarrhea]: 'lemon',
  [EventCategory.Vomit]: 'lemon',
  [EventCategory.Other]: 'mint',
};

/** 异常事件记录：时间轴（按日分组）+ 名称检索 + 症状/严重度/照片表单 */
export function EventsScreen({ navigation }: MainTabScreenProps<'Events'>) {
  const { event } = useServices();
  const { activeBaby, dataVersion } = useApp();
  const [events, setEvents] = useState<AbnormalEvent[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    if (!activeBaby) return;
    setEvents(await event.listForBaby(activeBaby.id, { limit: 80 }));
  }, [activeBaby, event, dataVersion]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    if (!kw) return events;
    return events.filter((e) =>
      [labelOf(e.category), e.temperatureC != null ? `${e.temperatureC}℃` : '', e.description ?? '']
        .join(' ')
        .toLowerCase()
        .includes(kw),
    );
  }, [events, search]);

  const grouped = useMemo(() => groupByDay(filtered), [filtered]);

  if (!activeBaby) {
    return (
      <Screen>
        <EmptyState icon="🩺" title="先创建宝宝档案" subtitle="异常事件需要归属到宝宝名下。" />
      </Screen>
    );
  }

  return (
    <Screen
      bottomInset
      title="异常事件"
      subtitle="症状 · 严重度 · 照片，就医回溯更省心"
      fab={<Fab label="记异常" onPress={() => setFormOpen(true)} />}
    >
      <SearchBox placeholder="搜索症状 / 描述…" value={search} onChange={setSearch} />

      {events.length === 0 ? (
        <EmptyState icon="🌤️" title="暂无异常记录" subtitle="发热、皮疹等情况出现时，及时记录便于就医时回溯。" />
      ) : grouped.length === 0 ? (
        <EmptyState icon="🔍" title="没有匹配的记录" subtitle="换个关键词试试，例如“发热”或描述里的词。" />
      ) : (
        grouped.map(([day, items]) => (
          <View key={day}>
            <TimelineDay label={timelineDayLabel(day)} />
            {items.map((e, i) => (
              <TimelineItem
                key={e.id}
                time={formatTime(e.occurredAt)}
                tone={CATEGORY_TONE[e.category]}
                first={i === 0}
                last={i === items.length - 1}
                onPress={() => navigation.navigate('EventDetail', { id: e.id })}
                onLongPress={() =>
                  Alert.alert('删除事件', '删除后将同时移除其照片附件，确定删除？', [
                    { text: '取消', style: 'cancel' },
                    {
                      text: '删除',
                      style: 'destructive',
                      onPress: () => void event.remove(e.id).then(load),
                    },
                  ])
                }
              >
                <View style={styles.cardTitleRow}>
                  <AppText variant="body" style={styles.cardTitle}>
                    {iconFor(e.category)} {labelOf(e.category)}
                    {e.temperatureC != null && (
                      <AppText style={styles.cardTemp}> {e.temperatureC}℃</AppText>
                    )}
                  </AppText>
                  <SeverityTag severity={e.severity} />
                </View>
                {e.description != null && e.description.length > 0 && (
                  <AppText variant="caption" numberOfLines={2}>{e.description}</AppText>
                )}
                {e.attachments.length > 0 && (
                  <View style={styles.photoRow}>
                    {e.attachments.map((a) => (
                      <Image key={a.id} source={{ uri: resolvePhotoUri(a.filePath) }} style={styles.photo} />
                    ))}
                  </View>
                )}
              </TimelineItem>
            ))}
          </View>
        ))
      )}

      <EventFormSheet
        visible={formOpen}
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

function groupByDay(events: AbnormalEvent[]): [string, AbnormalEvent[]][] {
  const map = new Map<string, AbnormalEvent[]>();
  for (const e of events) {
    const day = e.occurredAt.slice(0, 10);
    const list = map.get(day) ?? [];
    list.push(e);
    map.set(day, list);
  }
  return [...map.entries()];
}

function iconFor(category: EventCategory): string {
  switch (category) {
    case EventCategory.Fever:
      return '🌡️';
    case EventCategory.Rash:
      return '🩹';
    case EventCategory.Cough:
      return '😷';
    case EventCategory.Diarrhea:
    case EventCategory.Vomit:
      return '🤢';
    default:
      return '🩺';
  }
}

interface EventFormState {
  occurredAt: string;
  category: EventCategory;
  severity: (typeof SEVERITY_LEVELS)[number];
  temperatureInput: string;
  description: string;
  photoUris: string[];
}

/** 新增 / 编辑异常事件的弹层表单：传入 editing 时为编辑模式（预填并走更新，照片仅追加） */
export function EventFormSheet({
  visible,
  editing,
  babyId,
  onClose,
  onSaved,
}: {
  visible: boolean;
  editing?: AbnormalEvent | null;
  babyId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { event, allergen } = useServices();
  const [form, setForm] = useState<EventFormState>({
    occurredAt: nowISO(),
    category: EventCategory.Fever,
    severity: SEVERITY_LEVELS[0]!,
    temperatureInput: '',
    description: '',
    photoUris: [],
  });

  useEffect(() => {
    if (visible) {
      setForm(
        editing
          ? {
              occurredAt: editing.occurredAt,
              category: editing.category,
              severity: editing.severity,
              temperatureInput: editing.temperatureC != null ? String(editing.temperatureC) : '',
              description: editing.description ?? '',
              photoUris: [],
            }
          : {
              occurredAt: nowISO(),
              category: EventCategory.Fever,
              severity: SEVERITY_LEVELS[0]!,
              temperatureInput: '',
              description: '',
              photoUris: [],
            },
      );
    }
  }, [visible, editing]);

  const addPhoto = async () => {
    const uri = await pickPhotoFromLibrary();
    if (uri) setForm((f) => ({ ...f, photoUris: [...f.photoUris, uri] }));
  };

  const save = async () => {
    const temperature = parseFloat(form.temperatureInput);
    const fields = {
      occurredAt: form.occurredAt,
      category: form.category,
      severity: form.severity,
      temperatureC: Number.isFinite(temperature) ? temperature : null,
      description: form.description,
    };

    if (editing) {
      await event.update({ ...editing, ...fields }, form.photoUris);
    } else {
      await event.add({ babyId, ...fields, newPhotoUris: form.photoUris });
    }

    // 过敏预警：描述文本命中该宝宝已登记的过敏原时提示
    const warnings = await allergen.checkTextForWarnings(babyId, form.description ?? '');
    if (warnings.length > 0) {
      Alert.alert(
        '⚠️ 过敏原预警',
        warnings.map((w) => w.message).join('\n'),
      );
    } else {
      Alert.alert('已保存', editing ? '修改已保存，密切观察宝宝状态。' : '异常事件已记录，密切观察宝宝状态。');
    }
    onSaved();
  };

  return (
    <ModalSheet
      visible={visible}
      title={editing ? '编辑异常事件' : '记录异常事件'}
      onClose={onClose}
      footer={
        <>
          <Button title="取消" variant="ghost" block onPress={onClose} />
          <Button title={editing ? '保存修改' : '保存'} block onPress={() => void save()} />
        </>
      }
    >
      <DateTimeField label="发生时间" value={form.occurredAt} onChange={(v) => setForm({ ...form, occurredAt: v })} />

      <View style={styles.fieldBlock}>
        <AppText variant="caption" style={styles.fieldLabel}>症状类别</AppText>
        <View style={styles.chipRow}>
          {EVENT_CATEGORIES.map((c) => (
            <Chip key={c} label={labelOf(c)} selected={form.category === c} onPress={() => setForm({ ...form, category: c })} />
          ))}
        </View>
      </View>

      <View style={styles.fieldBlock}>
        <AppText variant="caption" style={styles.fieldLabel}>严重程度</AppText>
        <View style={styles.chipRow}>
          {SEVERITY_LEVELS.map((s) => (
            <Chip key={s} label={labelOf(s)} selected={form.severity === s} onPress={() => setForm({ ...form, severity: s })} />
          ))}
        </View>
      </View>

      {form.category === EventCategory.Fever && (
        <TextField
          label="体温（℃，选填）"
          keyboardType="decimal-pad"
          value={form.temperatureInput}
          onChangeText={(v) => setForm({ ...form, temperatureInput: v })}
          placeholder="37.5"
        />
      )}

      <TextField
        label="详细描述"
        value={form.description}
        onChangeText={(v) => setForm({ ...form, description: v })}
        multiline
        placeholder="部位、表现、疑似诱因（如新食物）…"
      />

      <View style={styles.fieldBlock}>
        <AppText variant="caption" style={styles.fieldLabel}>
          {editing
            ? `追加照片（已有 ${editing.attachments.length} 张，不可删改）`
            : `照片附件（${form.photoUris.length}）`}
        </AppText>
        <View style={styles.chipRow}>
          <Chip label="＋ 从相册选择" onPress={() => void addPhoto()} />
          {form.photoUris.map((uri, i) => (
            <Image key={`${uri}-${i}`} source={{ uri }} style={styles.photo} />
          ))}
        </View>
        <AppText variant="caption">照片仅保存在本机应用沙盒，不会上传。</AppText>
      </View>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontWeight: '700', flex: 1 },
  cardTemp: { fontSize: 16, fontWeight: '800', color: theme.colors.primaryDeep },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  photo: { width: 56, height: 56, borderRadius: theme.radius.md, backgroundColor: theme.colors.chipOff },
  fieldBlock: { gap: 6 },
  fieldLabel: { fontWeight: '500', color: theme.colors.text },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
});
