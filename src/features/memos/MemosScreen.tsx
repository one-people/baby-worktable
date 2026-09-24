import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { formatDate, formatTime, nowISO } from '@/core/utils/datetime';
import type { Memo, MemoCategoryNode } from '@/models/Memo';
import { ReminderRepeat, labelOf } from '@/models/common';
import { useServices } from '@/services';
import { useApp } from '@/store/AppStore';
import {
  AppIcon,
  AppText,
  Button,
  Chip,
  DateTimeField,
  EmptyState,
  Fab,
  ListRow,
  ModalSheet,
  Screen,
  Tag,
  TextField,
  theme,
} from '@/ui';

const REPEATS = [ReminderRepeat.None, ReminderRepeat.Daily, ReminderRepeat.Weekly];

/** 日常备忘录：多级分类过滤 + 提醒 + 快捷编辑 */
export function MemosScreen() {
  const { memo } = useServices();
  const { activeBabyId, dataVersion } = useApp();
  const [memos, setMemos] = useState<Memo[]>([]);
  const [tree, setTree] = useState<MemoCategoryNode[]>([]);
  const [flatCategories, setFlatCategories] = useState<MemoCategoryNode[]>([]);
  const [filterId, setFilterId] = useState<string | null | undefined>(undefined); // undefined=全部
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Memo | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [categoryAdminOpen, setCategoryAdminOpen] = useState(false);

  const load = useCallback(async () => {
    const [list, categoryTree] = await Promise.all([
      search.trim() ? memo.search(search) : memo.list(filterId),
      memo.listCategoryTree(),
    ]);
    setMemos(list);
    setTree(categoryTree);
    setFlatCategories(flattenTree(categoryTree));
  }, [memo, filterId, search, dataVersion]);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (m: Memo) => {
    setEditing(m);
    setFormOpen(true);
  };

  const deleteMemo = (m: Memo) =>
    Alert.alert('删除备忘', `确定删除「${m.title}」？`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: async () => { await memo.remove(m.id); load(); } },
    ]);

  return (
    <Screen
      bottomInset
      fab={<Fab label="写备忘" onPress={openNew} />}
    >
      <View style={styles.searchBox}>
        <AppIcon name="search" size={16} color={theme.colors.textSubdued} strokeWidth={2.2} />
        <TextInput
          style={styles.searchInput}
          placeholder="搜索备忘…"
          placeholderTextColor={theme.colors.textSubdued}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <Pressable hitSlop={8} accessibilityLabel="清空搜索" onPress={() => setSearch('')}>
            <AppIcon name="close" size={15} color={theme.colors.textSubdued} strokeWidth={2.2} />
          </Pressable>
        )}
      </View>

      <View style={styles.filterRow}>
        <Chip label="全部" selected={filterId === undefined} onPress={() => setFilterId(undefined)} />
        <Chip label="未分类" selected={filterId === null} onPress={() => setFilterId(null)} />
        {flatCategories.map((c) => (
          <Chip
            key={c.id}
            label={`${'　'.repeat(c.depth)}${c.name}`}
            selected={filterId === c.id}
            onPress={() => setFilterId(c.id)}
          />
        ))}
        <Button title="管理分类" size="sm" variant="secondary" onPress={() => setCategoryAdminOpen(true)} />
      </View>

      {memos.length === 0 ? (
        <EmptyState icon="📝" title="这里还很干净" subtitle="用备忘记录疫苗、辅食计划、待办…，可设置提醒。" />
      ) : (
        memos.map((m) => (
          <ListRow
            key={m.id}
            icon={m.pinned ? 'pin' : 'note'}
            tone={m.pinned ? 'lemon' : undefined}
            title={m.title}
            subtitle={memoSubtitle(m)}
            onPress={() => openEdit(m)}
            onLongPress={() => deleteMemo(m)}
            trailing={
              m.reminderEnabled && m.reminderAt ? <Tag text={`⏰ ${formatDate(m.reminderAt)} ${formatTime(m.reminderAt)}`} /> : undefined
            }
          />
        ))
      )}

      <MemoFormSheet
        visible={formOpen}
        editing={editing}
        categories={flatCategories}
        defaultBabyId={activeBabyId}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          load();
        }}
      />

      <CategoryAdminSheet
        visible={categoryAdminOpen}
        tree={tree}
        onClose={() => setCategoryAdminOpen(false)}
        onChanged={load}
      />
    </Screen>
  );
}

function memoSubtitle(m: Memo): string {
  const lines: string[] = [];
  if (m.content) lines.push(m.content);
  lines.push(`更新于 ${formatDate(m.updatedAt)}`);
  return lines.join('\n');
}

function flattenTree(nodes: MemoCategoryNode[], depth = 0): MemoCategoryNode[] {
  return nodes.flatMap((n) => [{ ...n, depth }, ...flattenTree(n.children, depth + 1)]);
}

/* ----------------------------- 备忘表单 ----------------------------- */

function MemoFormSheet({
  visible,
  editing,
  categories,
  defaultBabyId,
  onClose,
  onSaved,
}: {
  visible: boolean;
  editing: Memo | null;
  categories: MemoCategoryNode[];
  defaultBabyId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { memo } = useServices();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [pinned, setPinned] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderAt, setReminderAt] = useState(nowISO());
  const [repeat, setRepeat] = useState<ReminderRepeat>(ReminderRepeat.None);

  useEffect(() => {
    if (!visible) return;
    setTitle(editing?.title ?? '');
    setContent(editing?.content ?? '');
    setCategoryId(editing?.categoryId ?? null);
    setPinned(editing?.pinned ?? false);
    setReminderEnabled(editing?.reminderEnabled ?? false);
    setReminderAt(editing?.reminderAt ?? nowISO());
    setRepeat(editing?.reminderRepeat ?? ReminderRepeat.None);
  }, [visible, editing]);

  const save = async () => {
    if (!title.trim()) {
      Alert.alert('提示', '标题不能为空。');
      return;
    }
    if (editing) {
      const updated = await memo.setReminder(
        {
          ...editing,
          title: title.trim(),
          content: content.trim() || null,
          categoryId,
          pinned,
        },
        reminderEnabled ? reminderAt : null,
        repeat,
      );
      await memo.update(updated);
    } else {
      const created = await memo.add({
        babyId: defaultBabyId,
        categoryId,
        title: title.trim(),
        content: content.trim() || null,
        pinned,
        reminderAt: reminderEnabled ? reminderAt : null,
        reminderRepeat: repeat,
        reminderEnabled,
      });
      if (reminderEnabled && !created.notificationId) {
        Alert.alert('提醒未开启', '未获得通知权限，备忘已保存但不会提醒。请在系统设置中允许通知。');
      }
    }
    onSaved();
  };

  return (
    <ModalSheet
      visible={visible}
      title={editing ? '编辑备忘' : '新建备忘'}
      onClose={onClose}
      footer={
        <>
          <Button title="取消" variant="ghost" block onPress={onClose} />
          <Button title="保存" block onPress={() => void save()} />
        </>
      }
    >
      <TextField label="标题" value={title} onChangeText={setTitle} placeholder="例如：下周五疫苗" />
      <TextField label="内容（选填）" value={content} onChangeText={setContent} multiline placeholder="补充说明…" />

      <View style={styles.fieldBlock}>
        <AppText variant="caption" style={styles.fieldLabel}>分类</AppText>
        <View style={styles.chipRow}>
          <Chip label="未分类" selected={categoryId === null} onPress={() => setCategoryId(null)} />
          {categories.map((c) => (
            <Chip
              key={c.id}
              label={`${'　'.repeat(c.depth)}${c.name}`}
              selected={categoryId === c.id}
              onPress={() => setCategoryId(c.id)}
            />
          ))}
        </View>
      </View>

      <View style={styles.chipRow}>
        <Chip label={pinned ? '📌 已置顶' : '置顶'} selected={pinned} onPress={() => setPinned(!pinned)} />
        <Chip label={reminderEnabled ? '⏰ 提醒已开启' : '开启提醒'} selected={reminderEnabled} onPress={() => setReminderEnabled(!reminderEnabled)} />
      </View>

      {reminderEnabled && (
        <>
          <DateTimeField label="提醒时间" value={reminderAt} onChange={setReminderAt} />
          <View style={styles.fieldBlock}>
            <AppText variant="caption" style={styles.fieldLabel}>重复</AppText>
            <View style={styles.chipRow}>
              {REPEATS.map((r) => (
                <Chip key={r} label={labelOf(r)} selected={repeat === r} onPress={() => setRepeat(r)} />
              ))}
            </View>
          </View>
        </>
      )}
    </ModalSheet>
  );
}

/* ----------------------------- 分类管理 ----------------------------- */

function CategoryAdminSheet({
  visible,
  tree,
  onClose,
  onChanged,
}: {
  visible: boolean;
  tree: MemoCategoryNode[];
  onClose: () => void;
  onChanged: () => Promise<void>;
}) {
  const { memo } = useServices();
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);
  const flat = useMemo(() => flattenTree(tree), [tree]);

  const addCategory = async () => {
    if (!name.trim()) return;
    await memo.addCategory({ parentId, name: name.trim() });
    setName('');
    onChanged();
  };

  const removeCategory = (node: MemoCategoryNode) =>
    Alert.alert('删除分类', `删除「${node.name}」？其下备忘会变为未分类，子分类将被一并删除。`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: async () => { await memo.removeCategory(node.id); onChanged(); } },
    ]);

  return (
    <ModalSheet visible={visible} title="分类管理" onClose={onClose}>
      <TextField label="新建分类名称" value={name} onChangeText={setName} placeholder="例如：疫苗 / 辅食 / 用药" />
      <View style={styles.fieldBlock}>
        <AppText variant="caption" style={styles.fieldLabel}>上级分类</AppText>
        <View style={styles.chipRow}>
          <Chip label="作为顶级分类" selected={parentId === null} onPress={() => setParentId(null)} />
          {flat.map((c) => (
            <Chip
              key={c.id}
              label={`${'　'.repeat(c.depth)}${c.name}`}
              selected={parentId === c.id}
              onPress={() => setParentId(c.id)}
            />
          ))}
        </View>
      </View>
      <Button title="添加分类" block onPress={() => void addCategory()} />

      <AppText variant="heading" style={styles.adminListTitle}>现有分类</AppText>
      {flat.length === 0 && <AppText variant="caption">暂无分类。</AppText>}
      {flat.map((c) => (
        <ListRow
          key={c.id}
          icon="🗂️"
          title={`${'　'.repeat(c.depth)}${c.name}`}
          onLongPress={() => removeCategory(c)}
        />
      ))}
      <AppText variant="caption">长按分类可删除。</AppText>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 9,
    fontSize: 15,
    color: theme.colors.text,
  },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  fieldBlock: { gap: 6 },
  fieldLabel: { fontWeight: '500', color: theme.colors.text },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  adminListTitle: { marginTop: 8, marginBottom: 8 },
});
