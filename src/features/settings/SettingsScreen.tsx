import React from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';

import { useServices } from '@/services';
import { useApp } from '@/store/AppStore';
import { BackupFormatError } from '@/core/backup/exportService';
import { pickBackupJson } from '@/core/backup/pickBackupFile';
import { VolumeUnit, labelOf } from '@/models/common';
import {
  AppIcon,
  AppText,
  Card,
  ListRow,
  PressableScale,
  Screen,
  SectionTitle,
  SegmentedControl,
  Tag,
} from '@/ui';
import { theme } from '@/ui/theme';
import type { MainTabScreenProps } from '@/navigation/types';

type Props = MainTabScreenProps<'Settings'>;

const UNIT_OPTIONS: readonly VolumeUnit[] = [VolumeUnit.ML, VolumeUnit.OZ];

/** 我的：宝宝管理、偏好设置、数据导入导出与隐私说明 */
export function SettingsScreen({ navigation }: Props) {
  const { backup } = useServices();
  const { babies, activeBaby, setActiveBaby, volumeUnit, setVolumeUnit, notifyDataReloaded } = useApp();

  const exportData = async () => {
    try {
      const result = await backup.exportAll();
      if (result.via === 'cancel') return; // 用户在系统对话框/分享面板点了取消
      if (result.via === 'picker') {
        Alert.alert('导出成功', `已保存备份文件（共 ${result.rowCount} 条记录）：\n${result.fileName}`);
      } else if (result.via === 'share') {
        Alert.alert(
          '导出成功',
          `备份文件已进入分享面板（共 ${result.rowCount} 条记录）。\n选择「存储到文件」即可保存，也可以直接通过微信 / AirDrop 发送。`,
        );
      } else if (Platform.OS === 'web') {
        Alert.alert(
          '导出成功',
          `已开始下载备份文件（共 ${result.rowCount} 条记录）：\n${result.fileName}\n\n请到浏览器的下载目录查收。`,
        );
      } else {
        Alert.alert(
          '导出成功',
          `已导出 ${result.rowCount} 条记录到：\n${result.filePath}\n\n未自动弹出分享时，可通过文件 App（iOS）或系统文件管理器（Android）取走留存。`,
        );
      }
    } catch (err) {
      Alert.alert('导出失败', String(err instanceof Error ? err.message : err));
    }
  };

  const runImport = async () => {
    try {
      const json = await pickBackupJson();
      if (json == null) return; // 用户取消选择
      const rowCount = await backup.importAll(json);
      await notifyDataReloaded();
      Alert.alert('导入成功', `已从备份恢复 ${rowCount} 条记录，各页面数据已刷新。`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      Alert.alert('导入失败', message);
    }
  };

  const confirmImport = () => {
    Alert.alert(
      '导入备份',
      '将用备份文件覆盖当前全部数据（宝宝档案、喂养、事件、备忘、过敏原、生长记录）。\n建议先导出一份当前数据作为留存。',
      [
        { text: '取消', style: 'cancel' },
        { text: '选择文件并覆盖', style: 'destructive', onPress: () => void runImport() },
      ],
    );
  };

  return (
    <Screen title="我的" subtitle="宝宝档案 · 偏好 · 数据，都只存在本机">
      <SectionTitle title="宝宝档案" icon="baby" />
      {babies.map((b) => (
        <ListRow
          key={b.id}
          icon="baby"
          tone={b.id === activeBaby?.id ? 'coral' : undefined}
          title={b.name}
          subtitle={`${labelOf(b.gender)} · ${b.birthDate}`}
          onPress={() => setActiveBaby(b.id)}
          onLongPress={() => navigation.navigate('BabyEditor', { babyId: b.id })}
          trailing={
            <View style={styles.rowTrailing}>
              {b.id === activeBaby?.id && <Tag text="当前" />}
              <PressableScale
                accessibilityLabel={`编辑${b.name}的档案`}
                scaleTo={0.85}
                hitSlop={6}
                style={styles.editBtn}
                onPress={(e) => {
                  // 阻止事件冒泡到整行，避免同时触发“设为当前”
                  e.stopPropagation();
                  navigation.navigate('BabyEditor', { babyId: b.id });
                }}
              >
                <AppIcon name="edit" size={15} color={theme.colors.primaryDeep} strokeWidth={2.2} />
              </PressableScale>
            </View>
          }
        />
      ))}
      <ListRow
        icon="plus"
        title="新建宝宝档案"
        onPress={() => navigation.navigate('BabyEditor')}
      />

      <SectionTitle title="偏好" icon="milk" />
      <Card style={styles.prefCard}>
        <AppText variant="body">奶量单位</AppText>
        <SegmentedControl
          options={UNIT_OPTIONS}
          labels={{ [VolumeUnit.ML]: '毫升 ml', [VolumeUnit.OZ]: '盎司 oz' }}
          value={volumeUnit}
          onChange={setVolumeUnit}
        />
        <AppText variant="caption">数据内部始终以毫升存储，切换单位只影响显示。</AppText>
      </Card>

      <SectionTitle title="数据" icon="download" />
      <ListRow icon="download" title="导出数据（JSON）" subtitle="全部记录导出为一个备份文件" onPress={() => void exportData()} />
      <ListRow icon="upload" title="导入数据" subtitle="从备份文件恢复（覆盖当前数据）" onPress={confirmImport} />
      <ListRow icon="alert" title="过敏原管理" subtitle="过敏原与关联事件" onPress={() => navigation.navigate('Allergens')} />
      <ListRow icon="note" title="日常备忘录" subtitle="带提醒的育儿备忘" onPress={() => navigation.navigate('Memos')} />

      <SectionTitle title="关于与隐私" icon="heartPulse" />
      <Card style={styles.prefCard}>
        <AppText variant="caption" style={styles.privacy}>
          宝宝工作台是一款纯本地应用：所有数据（喂养、事件、照片、备忘、过敏原、生长记录）仅保存在本机应用沙盒，没有任何服务器，也不请求网络权限之外的任何数据。卸载应用即彻底删除全部数据。
        </AppText>
        <AppText variant="caption" style={styles.privacy}>
          版本 0.1.0 · 生长参考带当前为示例占位数据，不构成医学建议。
        </AppText>
      </Card>
      <View style={styles.bottomSpace} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  prefCard: { gap: 10 },
  privacy: { lineHeight: 19 },
  bottomSpace: { height: 40 },
  rowTrailing: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
