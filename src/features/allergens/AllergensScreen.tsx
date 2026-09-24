import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import type { Allergen, BabyAllergen } from '@/models/Allergen';
import { ALLERGEN_CATEGORIES, SEVERITY_LEVELS, labelOf } from '@/models/common';
import { useServices } from '@/services';
import { useApp } from '@/store/AppStore';
import {
  AppText,
  Button,
  Card,
  Chip,
  EmptyState,
  Fab,
  ListRow,
  ModalSheet,
  Screen,
  SectionTitle,
  SeverityTag,
  TextField,
  theme,
} from '@/ui';

/** 过敏原管理：可配置过敏原库 + 与宝宝的关联（预警来源） */
export function AllergensScreen() {
  const { allergen } = useServices();
  const { activeBaby, dataVersion } = useApp();
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [links, setLinks] = useState<BabyAllergen[]>([]);
  const [customOpen, setCustomOpen] = useState(false);
  const [linkTarget, setLinkTarget] = useState<Allergen | null>(null);

  const load = useCallback(async () => {
    setAllergens(await allergen.listAll());
    if (activeBaby) setLinks(await allergen.listForBaby(activeBaby.id));
  }, [allergen, activeBaby, dataVersion]);

  useEffect(() => {
    load();
  }, [load]);

  const linkOf = (allergenId: string) => links.find((l) => l.allergenId === allergenId);

  const toggleLink = async (item: Allergen) => {
    if (!activeBaby) return;
    const existing = linkOf(item.id);
    if (existing) {
      await allergen.unlink(activeBaby.id, item.id);
    } else {
      setLinkTarget(item);
    }
    load();
  };

  const confirmLink = async (severity: (typeof SEVERITY_LEVELS)[number], confirmed: boolean) => {
    if (!activeBaby || !linkTarget) return;
    await allergen.link({
      babyId: activeBaby.id,
      allergenId: linkTarget.id,
      severity,
      confirmed,
    });
    setLinkTarget(null);
    load();
  };

  const removeCustom = (item: Allergen) =>
    Alert.alert('删除自定义过敏原', `确定删除「${item.name}」？内置条目不可删除。`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          await allergen.removeCustom(item.id);
          load();
        },
      },
    ]);

  if (!activeBaby) {
    return (
      <Screen>
        <EmptyState icon="⚠️" title="先创建宝宝档案" subtitle="过敏原关联到具体宝宝后才能提供预警。" />
      </Screen>
    );
  }

  const linked = allergens.filter((a) => linkOf(a.id));
  const unlinked = allergens.filter((a) => !linkOf(a.id));

  return (
    <Screen
      bottomInset
      fab={<Fab label="新增过敏原" icon="edit" onPress={() => setCustomOpen(true)} />}
    >
      <Card style={styles.hintCard}>
        <AppText variant="caption">
          登记过敏原后，在「异常事件 / 备忘」的文本中自动检测并弹出预警。点击右侧徽标即可关联或取消。
        </AppText>
      </Card>

      <SectionTitle title={`宝宝已登记（${linked.length}）`} icon="alert" />
      {linked.length === 0 && <AppText variant="caption">暂无登记，从下方库中选择。</AppText>}
      {linked.map((a) => {
        const link = linkOf(a.id)!;
        return (
          <ListRow
            key={a.id}
            icon={a.isCustom ? 'edit' : 'tag'}
            title={a.name}
            subtitle={`${labelOf(a.category)} · ${link.confirmed ? '已确诊' : '观察中'}`}
            onLongPress={() => void toggleLink(a)}
            trailing={
              <View style={styles.trailing}>
                <SeverityTag severity={link.severity} />
                <Chip label="取消关联" onPress={() => void toggleLink(a)} />
              </View>
            }
          />
        );
      })}

      <SectionTitle title="过敏原库（点击关联）" icon="check" />
      <View style={styles.pool}>
        {unlinked.map((a) => (
          <Chip
            key={a.id}
            label={a.name}
            onLongPress={a.isCustom ? () => removeCustom(a) : undefined}
            onPress={() => void toggleLink(a)}
          />
        ))}
      </View>
      <AppText variant="caption">长按自定义条目可删除；长按已登记条目可取消关联。</AppText>

      <CustomAllergenSheet
        visible={customOpen}
        onClose={() => setCustomOpen(false)}
        onSaved={() => {
          setCustomOpen(false);
          load();
        }}
      />

      <LinkSheet
        target={linkTarget}
        onCancel={() => setLinkTarget(null)}
        onConfirm={confirmLink}
      />
    </Screen>
  );
}

/* --------------------------- 自定义过敏原 --------------------------- */

function CustomAllergenSheet({
  visible,
  onClose,
  onSaved,
}: {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { allergen } = useServices();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<(typeof ALLERGEN_CATEGORIES)[number]>(ALLERGEN_CATEGORIES[0]!);

  useEffect(() => {
    if (visible) {
      setName('');
      setCategory(ALLERGEN_CATEGORIES[0]!);
    }
  }, [visible]);

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('提示', '请填写过敏原名称。');
      return;
    }
    await allergen.createCustom({ name: name.trim(), category });
    onSaved();
  };

  return (
    <ModalSheet
      visible={visible}
      title="新增自定义过敏原"
      onClose={onClose}
      footer={
        <>
          <Button title="取消" variant="ghost" block onPress={onClose} />
          <Button title="保存" block onPress={() => void save()} />
        </>
      }
    >
      <TextField label="名称" value={name} onChangeText={setName} placeholder="例如：猕猴桃" />
      <View style={styles.fieldBlock}>
        <AppText variant="caption" style={styles.fieldLabel}>类别</AppText>
        <View style={styles.pool}>
          {ALLERGEN_CATEGORIES.map((c) => (
            <Chip key={c} label={labelOf(c)} selected={category === c} onPress={() => setCategory(c)} />
          ))}
        </View>
      </View>
    </ModalSheet>
  );
}

/* ------------------------------ 关联设置 ------------------------------ */

function LinkSheet({
  target,
  onCancel,
  onConfirm,
}: {
  target: Allergen | null;
  onCancel: () => void;
  onConfirm: (severity: (typeof SEVERITY_LEVELS)[number], confirmed: boolean) => Promise<void>;
}) {
  const [severity, setSeverity] = useState<(typeof SEVERITY_LEVELS)[number]>(SEVERITY_LEVELS[0]!);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (target) {
      setSeverity(SEVERITY_LEVELS[0]!);
      setConfirmed(false);
    }
  }, [target]);

  return (
    <ModalSheet
      visible={target != null}
      title={`关联「${target?.name ?? ''}」`}
      onClose={onCancel}
      footer={
        <>
          <Button title="取消" variant="ghost" block onPress={onCancel} />
          <Button title="确认关联" block onPress={() => void onConfirm(severity, confirmed)} />
        </>
      }
    >
      <View style={styles.fieldBlock}>
        <AppText variant="caption" style={styles.fieldLabel}>反应严重程度</AppText>
        <View style={styles.pool}>
          {SEVERITY_LEVELS.map((s) => (
            <Chip key={s} label={labelOf(s)} selected={severity === s} onPress={() => setSeverity(s)} />
          ))}
        </View>
      </View>
      <View style={styles.pool}>
        <Chip label={confirmed ? '✅ 已确诊' : '标记为已确诊'} selected={confirmed} onPress={() => setConfirmed(!confirmed)} />
      </View>
      <AppText variant="caption">不确定时保持“观察中”，先按轻度处理。</AppText>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  hintCard: { marginBottom: 4, backgroundColor: theme.colors.warningSoft },
  pool: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  fieldBlock: { gap: 6 },
  fieldLabel: { fontWeight: '500' },
  trailing: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
