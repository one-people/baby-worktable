import React from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { theme } from '@/ui/theme';
import { AppIcon } from '../icons';

interface SearchBoxProps {
  placeholder: string;
  value: string;
  onChange: (next: string) => void;
}

/** 胶囊形搜索框：放大镜图标 + 一键清空 */
export function SearchBox({ placeholder, value, onChange }: SearchBoxProps) {
  return (
    <View style={styles.box}>
      <AppIcon name="search" size={16} color={theme.colors.textSubdued} strokeWidth={2.2} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSubdued}
        value={value}
        onChangeText={onChange}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <Pressable hitSlop={8} accessibilityLabel="清空搜索" onPress={() => onChange('')}>
          <AppIcon name="close" size={15} color={theme.colors.textSubdued} strokeWidth={2.2} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
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
  input: {
    flex: 1,
    paddingVertical: 9,
    fontSize: 15,
    // 同 TextField：iOS Safari 聚焦自动放大问题，web 端强制 16px
    ...Platform.select({ web: { fontSize: 16 } }),
    color: theme.colors.text,
  },
});
