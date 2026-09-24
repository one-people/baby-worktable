// GitHub Pages 部署在 https://<user>.github.io/<repo>/ 子路径下，
// 而 Expo 经典项目的 web 导出产物里资源 URL 是根绝对路径（/_expo/...、/assets/...）。
// 本脚本在导出后统一补上基础路径前缀；GitHub Pages 部署必跑，本地静态服务器同理。
// 用法：node scripts/fix-pages-paths.mjs <dist目录> <baseUrl，如 /baby-worktable>
import { readdirSync, statSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const [distDir, baseUrlArg] = process.argv.slice(2);
if (!distDir || !baseUrlArg) {
  console.error('用法: node scripts/fix-pages-paths.mjs <dist目录> <baseUrl>');
  process.exit(1);
}
const baseUrl = baseUrlArg.replace(/\/+$/, '');
if (baseUrl === '') {
  console.log('baseUrl 为根路径，无需改写');
  process.exit(0);
}

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

// 只改写 HTML/JS 里「以 "/ 开头的资源 URL 字符串」：入口脚本、worker 注册路径、wasm 与静态资源 URI
const patterns = ['/_expo/', '/assets/'];
let totalFiles = 0;
let totalReplacements = 0;

for (const file of walk(distDir)) {
  if (!/\.(html|js)$/.test(file)) continue;
  const source = await readFile(file, 'utf8');
  let out = source;
  let count = 0;
  for (const p of patterns) {
    out = out.replaceAll(`"${p}`, `"${baseUrl}${p}`);
    count += (source.match(new RegExp(`"${p.replace(/\//g, '\\/')}`, 'g')) || []).length;
  }
  if (out !== source) {
    await writeFile(file, out);
    totalFiles += 1;
    totalReplacements += count;
    console.log(`改写 ${file}（${count} 处）`);
  }
}
console.log(`完成：${totalFiles} 个文件、共 ${totalReplacements} 处资源路径已加上前缀 ${baseUrl}`);
