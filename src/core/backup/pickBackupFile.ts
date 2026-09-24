import * as DocumentPicker from 'expo-document-picker';
// SDK 54 起默认导出为新的 File/Directory API，旧异步 API 迁移至 /legacy 子路径
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

/**
 * 选择备份 JSON 文件并读出文本内容。
 * 返回 null 表示用户取消；读取失败抛出异常由调用方提示。
 */
export async function pickBackupJson(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: false,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset) return null;
  // web 端直接拿到 File 对象；原生端通过 uri 读缓存/原文件
  if (Platform.OS === 'web' && asset.file != null) {
    return await asset.file.text();
  }
  return await FileSystem.readAsStringAsync(asset.uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });
}
