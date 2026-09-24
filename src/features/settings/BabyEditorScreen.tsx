import React, { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';

import { formatAgeYMD, toISODate } from '@/core/utils/datetime';
import { Gender, labelOf } from '@/models/common';
import { useServices } from '@/services';
import { useApp } from '@/store/AppStore';
import {
  AppIcon,
  AppText,
  Button,
  Card,
  DateTimeField,
  PressableScale,
  Screen,
  SectionTitle,
  Tag,
  TextField,
  theme,
  tones,
} from '@/ui';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'BabyEditor'>;

/** 性别选项：色调 + 是否展示在头像气泡 */
const GENDER_META: Record<Gender, { tone: 'sky' | 'pink' | 'lemon'; avatar: string }> = {
  [Gender.Male]: { tone: 'sky', avatar: '👦' },
  [Gender.Female]: { tone: 'pink', avatar: '👧' },
  [Gender.Other]: { tone: 'lemon', avatar: '👶' },
};

const GENDER_OPTIONS: readonly Gender[] = [Gender.Male, Gender.Female, Gender.Other];

/** 宝宝档案新建 / 编辑：头像预览 + 性别瓦片 + 实时年龄反馈 */
export function BabyEditorScreen({ navigation, route }: Props) {
  const { baby: babyService } = useServices();
  const { refreshBabies, setActiveBaby, babies, activeBaby } = useApp();
  const editingId = route.params?.babyId;

  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>(Gender.Other);
  const [birthISO, setBirthISO] = useState(toISODate(new Date()));
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({ headerTitle: editingId ? '编辑档案' : '新建档案' });
  }, [navigation, editingId]);

  useEffect(() => {
    if (!editingId) return;
    babyService.get(editingId).then((baby) => {
      if (!baby) return;
      setName(baby.name);
      setGender(baby.gender);
      setBirthISO(baby.birthDate);
      setNote(baby.note ?? '');
    });
  }, [editingId, babyService]);

  /** 出生日期 → 日龄（实时反馈，选择日期即更新） */
  const ageDays = useMemo(() => {
    const birth = new Date(`${birthISO}T00:00:00`).getTime();
    const today = new Date(`${toISODate(new Date())}T00:00:00`).getTime();
    if (!Number.isFinite(birth)) return null;
    return Math.max(0, Math.floor((today - birth) / 86400000));
  }, [birthISO]);

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('提示', '请填写宝宝昵称。');
      return;
    }
    if (ageDays == null) {
      Alert.alert('提示', '请选择有效的出生日期。');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const existing = await babyService.get(editingId);
        if (existing) {
          await babyService.update({
            ...existing,
            name: name.trim(),
            gender,
            birthDate: birthISO,
            note: note.trim() || null,
          });
        }
      } else {
        const created = await babyService.create({
          name: name.trim(),
          gender,
          birthDate: birthISO,
          note: note.trim() || null,
        });
        setActiveBaby(created.id);
      }
      await refreshBabies();
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  const meta = GENDER_META[gender] ?? GENDER_META[Gender.Other];
  const displayName = name.trim() || '宝宝昵称';
  const canSave = name.trim().length > 0 && !saving;
  const editingBaby = babies.find((b) => b.id === editingId);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen keyboardShouldPersistTaps="handled">
        {/* 身份预览卡：随表单实时更新 */}
        <Card elevated style={styles.hero}>
          <View style={[styles.avatar, { backgroundColor: tones[meta.tone].soft }]}>
            <AppText style={styles.avatarEmoji}>{meta.avatar}</AppText>
          </View>
          <View style={styles.heroTexts}>
            <View style={styles.nameRow}>
              <AppText variant="title" numberOfLines={1}>{displayName}</AppText>
              {editingBaby && activeBaby?.id === editingBaby.id && <Tag text="当前" />}
            </View>
            <AppText variant="caption">
              {labelOf(gender)} · {birthISO}
            </AppText>
            <AppText variant="caption">
              {ageDays === 0
                ? '今天出生，欢迎小天使 👶'
                : ageDays != null
                  ? `宝宝今天 ${formatAgeYMD(birthISO)}啦`
                  : '请选择出生日期'}
            </AppText>
          </View>
        </Card>

        <SectionTitle title="基本信息" icon="baby" />
        <TextField
          label="宝宝昵称"
          value={name}
          onChangeText={setName}
          placeholder="例如：小橘子"
          autoFocus={!editingId}
        />
        <View style={styles.genderRow}>
          {GENDER_OPTIONS.map((g) => {
            const gm = GENDER_META[g];
            const selected = gender === g;
            return (
              <PressableScale
                key={g}
                onPress={() => setGender(g)}
                accessibilityLabel={labelOf(g)}
                accessibilityState={{ selected }}
                style={[
                  styles.genderTile,
                  selected && { backgroundColor: tones[gm.tone].soft, borderColor: tones[gm.tone].deep },
                ]}
              >
                <AppText
                  variant="body"
                  style={[styles.genderLabel, selected && { color: tones[gm.tone].deep }]}
                >
                  {labelOf(g)}
                </AppText>
                {selected && (
                  <View style={styles.genderCheck}>
                    <AppIcon name="check" size={11} color="#FFFFFF" strokeWidth={3} />
                  </View>
                )}
              </PressableScale>
            );
          })}
        </View>
        <AppText variant="caption" style={styles.genderHint}>
          点击选择性别，头像气泡颜色会随之变化
        </AppText>

        <DateTimeField
          label="出生日期"
          value={`${birthISO}T09:00:00`}
          onChange={(v) => setBirthISO(v.slice(0, 10))}
          mode="date"
        />
        {ageDays != null && (
          <AppText variant="caption" style={styles.ageHint}>
            {ageDays === 0
              ? '宝宝今天出生，生长曲线与日龄统计从今天开始计算'
              : `出生至今 ${ageDays} 天（${formatAgeYMD(birthISO)}），生长曲线与日龄统计以该日期为基准`}
          </AppText>
        )}

        <SectionTitle title="备注" icon="note" />
        <TextField
          label="备注（选填）"
          value={note}
          onChangeText={setNote}
          placeholder="如：足月 / 早产 / 过敏体质…"
          multiline
        />

        <View style={styles.actions}>
          <Button title="取消" variant="ghost" block onPress={() => navigation.goBack()} />
          <Button title={editingId ? '保存修改' : '创建档案'} block disabled={!canSave} loading={saving} onPress={() => void save()} />
        </View>
        {!canSave && !saving && (
          <AppText variant="caption" style={styles.saveHint}>
            填写宝宝昵称后即可{editingId ? '保存' : '创建'}
          </AppText>
        )}
        <View style={styles.bottomSpace} />
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
    marginBottom: 4,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 32 },
  heroTexts: { flex: 1, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  genderRow: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: 4 },
  genderTile: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 15,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
    ...theme.shadows.card,
  },
  genderLabel: { fontWeight: '700' },
  genderCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderHint: { marginTop: 8, marginBottom: 4 },
  ageHint: { marginTop: 6, marginBottom: 4 },
  actions: { flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.xl },
  saveHint: { textAlign: 'center', marginTop: theme.spacing.sm },
  bottomSpace: { height: 24 },
});
