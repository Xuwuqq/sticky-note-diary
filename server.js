#!/usr/bin/env node
/**
 * 便签日记 · 便携本地服务器
 * ---------------------------------------------------------------
 * 零第三方依赖，仅使用 Node.js 内置模块。
 * 只监听 127.0.0.1，所有数据只写入「数据目录」（默认为本程序文件夹下的 data\，
 * 可在软件设置里改成任意位置）。不写注册表、不改系统环境变量。
 */
'use strict';

const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const { spawn } = require('child_process');

/* 是否以 SEA 单文件 exe 方式运行（构建脚本 build_exe.js 生成） */
const IS_SEA = (() => { try { return require('node:sea').isSea(); } catch (e) { return false; } })();
const ROOT = IS_SEA ? path.dirname(process.execPath) : __dirname;
const PORT_FILE = path.join(ROOT, '.port');
const LOCATION_FILE = path.join(ROOT, 'data-location.json');
const WEB_DIR = path.join(ROOT, 'web');
const TOKEN = process.env.APP_TOKEN || crypto.randomBytes(24).toString('hex');
const MAX_BODY = 256 * 1024 * 1024;
const IDLE_EXIT_MS = 120000;   // 浏览器心跳停止 2 分钟后自动退出
const BASE_PORT = 3768;
const MAX_PORT = 3799;

const CARD_COLORS = ['none', 'yellow', 'pink', 'blue', 'green', 'purple', 'orange', 'gray'];
const IMG_EXT = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg', '.avif'];
const VID_EXT = ['.mp4', '.webm', '.mov', '.m4v', '.ogv'];
const AUD_EXT = ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac'];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.bmp': 'image/bmp',
  '.svg': 'image/svg+xml', '.avif': 'image/avif', '.ico': 'image/x-icon',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime',
  '.m4v': 'video/mp4', '.ogv': 'video/ogg',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4', '.flac': 'audio/flac', '.aac': 'audio/aac',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
};

/* ------------------------------------------------------------ 日志（写在数据目录内，程序旁边只留 data 文件夹） */
/* GUI 子系统（无控制台窗口）下 stdio 写入会失败，忽略错误避免进程崩溃 */
try { process.stdout.on('error', function () { /* ignore */ }); } catch (e) { /* ignore */ }
try { process.stderr.on('error', function () { /* ignore */ }); } catch (e) { /* ignore */ }
let logChecked = false;
function log() {
  const line = new Date().toISOString() + '  ' + Array.from(arguments).map(a =>
    (typeof a === 'string' ? a : (a && a.message ? a.message : JSON.stringify(a)))).join(' ') + '\n';
  try {
    const p = path.join(dataDir, 'server.log');
    if (!logChecked) {
      logChecked = true;
      try { if (fs.existsSync(p) && fs.statSync(p).size > 2 * 1024 * 1024) fs.unlinkSync(p); } catch (e) { /* ignore */ }
    }
    fs.appendFileSync(p, line);
  } catch (e) { /* ignore */ }
  try { process.stdout.write(line); } catch (e) { /* ignore */ }
}

/* ------------------------------------------------------------ 数据目录 */
function readLocation() {
  try {
    const j = JSON.parse(fs.readFileSync(LOCATION_FILE, 'utf8'));
    if (j && typeof j.dataDir === 'string' && j.dataDir.trim()) return path.resolve(j.dataDir.trim());
  } catch (e) { /* ignore */ }
  return DEFAULT_DATA;
}
function writeLocation(dir) {
  try { fs.writeFileSync(LOCATION_FILE, JSON.stringify({ dataDir: dir, updatedAt: Date.now() }, null, 2)); }
  catch (e) { log('无法保存数据位置配置（目录可能只读）:', e.message); }
}
/* 默认数据目录：优先放在程序旁边；程序目录只读时（如放在 Program Files）退到 %LOCALAPPDATA% */
function pickDefaultDataDir() {
  const cand = path.join(ROOT, 'data');
  try {
    fs.mkdirSync(cand, { recursive: true });
    fs.accessSync(cand, fs.constants.W_OK);
    return cand;
  } catch (e) { /* 不可写，走兜底 */ }
  const base = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || os.homedir(), 'AppData', 'Local');
  const fb = path.join(base, '便签日记', 'data');
  try { fs.mkdirSync(fb, { recursive: true }); } catch (e) { /* ignore */ }
  return fb;
}
const DEFAULT_DATA = pickDefaultDataDir();
let dataDir = readLocation();
try {
  ensureStructure(dataDir);
} catch (e) {
  // 配置的数据目录不可用（如换电脑后原路径不存在）时，回退到程序文件夹下的 data
  log('数据目录不可用，回退默认:', e.message);
  dataDir = DEFAULT_DATA;
  ensureStructure(dataDir);
}

function ensureStructure(dir) {
  fs.mkdirSync(path.join(dir, 'notes'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'backups'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'exports'), { recursive: true });
  const cfg = path.join(dir, 'config.json');
  if (!fs.existsSync(cfg)) {
    fs.writeFileSync(cfg, JSON.stringify({ version: 1, autoBackup: true, createdAt: Date.now() }, null, 2));
  }
}
function dataConfig() {
  try { return Object.assign({ autoBackup: true }, JSON.parse(fs.readFileSync(path.join(dataDir, 'config.json'), 'utf8'))); }
  catch (e) { return { autoBackup: true }; }
}
function saveDataConfig(c) { fs.writeFileSync(path.join(dataDir, 'config.json'), JSON.stringify(c, null, 2)); }
log('数据目录:', dataDir);

/* ------------------------------------------------------------ 工具 */
function newId() { return 'n' + Date.now().toString(36) + crypto.randomBytes(3).toString('hex'); }
function pad(n) { return String(n).padStart(2, '0'); }
function stamp(d) {
  d = d || new Date();
  return '' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '_' + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds());
}
function safeId(id) { return typeof id === 'string' && /^[A-Za-z0-9_\-]+$/.test(id); }
function psQuote(s) { return "'" + String(s).replace(/'/g, "''") + "'"; }
/* 手工递归复制目录（比 fs.cpSync 兼容性更好，且不依赖 CopyFileEx API） */
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function htmlToText(html) {
  return String(html || '')
    .replace(/<\s*(br|\/p|\/div|\/h[1-6]|\/li|\/blockquote|\/pre|\/tr)\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ').trim();
}
function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function sanitizeHtml(html) {
  return String(html || '')
    .replace(/<\s*(script|iframe|object|embed|link|meta|form)[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<\s*\/?\s*(script|iframe|object|embed|link|meta|form)[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*("javascript:[^"]*"|'javascript:[^']*')/gi, '$1="#"');
}

/* ------------------------------------------------------------ 笔记存储 */
function noteDir(id) { return path.join(dataDir, 'notes', id); }
function readNote(id) {
  try { return JSON.parse(fs.readFileSync(path.join(noteDir(id), 'note.json'), 'utf8')); }
  catch (e) { return null; }
}
function writeNote(n) {
  n.updatedAt = Date.now();
  const dir = noteDir(n.id);
  fs.mkdirSync(path.join(dir, 'media'), { recursive: true });
  const tmp = path.join(dir, 'note.json.tmp');
  fs.writeFileSync(tmp, JSON.stringify(n, null, 2));
  fs.renameSync(tmp, path.join(dir, 'note.json'));
}
function publicNote(n) {
  const content = n.content || '';
  const text = htmlToText(content);
  const imgs = (content.match(/<img\b/gi) || []).length;
  const vids = (content.match(/<video\b/gi) || []).length;
  const auds = (content.match(/<audio\b/gi) || []).length;
  const m = /<img[^>]+src="([^"]+)"/i.exec(content);
  // 封面兜底：没有图片时，用第一个视频的 poster（浏览器端截帧生成的封面图）
  const mv = m ? null : /<video\b[^>]*\bposter="([^"]+)"/i.exec(content);
  return {
    id: n.id,
    title: n.title || '',
    preview: text.slice(0, 120),
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
    tags: Array.isArray(n.tags) ? n.tags : [],
    pinned: !!n.pinned,
    color: CARD_COLORS.indexOf(n.color) >= 0 ? n.color : 'none',
    mood: n.mood || null,
    trashed: !!n.trashed,
    trashedAt: n.trashedAt || null,
    media: { images: imgs, videos: vids, audios: auds },
    cover: m ? m[1] : (mv ? mv[1] : null),
  };
}
function listNotes() {
  const base = path.join(dataDir, 'notes');
  let entries = [];
  try { entries = fs.readdirSync(base, { withFileTypes: true }); } catch (e) { /* ignore */ }
  const out = [];
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const n = readNote(e.name);
    if (n && n.id) out.push(publicNote(n));
  }
  return out;
}
function listBackups() {
  const base = path.join(dataDir, 'backups');
  let files = [];
  try { files = fs.readdirSync(base); } catch (e) { /* ignore */ }
  return files.filter(f => /\.zip$/i.test(f)).map(f => {
    try {
      const st = fs.statSync(path.join(base, f));
      return { name: f, size: st.size, mtime: st.mtime.getTime() };
    } catch (e) { return null; }
  }).filter(Boolean).sort((a, b) => b.mtime - a.mtime);
}

/* ------------------------------------------------------------ PowerShell 助手 */
function psRun(script) {
  return new Promise((resolve, reject) => {
    const b64 = Buffer.from(script, 'utf16le').toString('base64');
    const p = spawn('powershell.exe',
      ['-NoProfile', '-STA', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', b64],
      { windowsHide: true });
    let out = '', err = '';
    p.stdout.on('data', d => { out += d.toString('utf8'); });
    p.stderr.on('data', d => { err += d.toString('utf8'); });
    p.on('error', reject);
    p.on('close', code => {
      if (code === 0) resolve(out);
      else reject(new Error((err || out || ('powershell 退出码 ' + code)).trim()));
    });
  });
}
async function folderDialog(title) {
  const script = [
    '[Console]::OutputEncoding = [Text.Encoding]::UTF8',
    'Add-Type -AssemblyName System.Windows.Forms',
    'Add-Type -AssemblyName System.Drawing',
    '$f = New-Object System.Windows.Forms.FolderBrowserDialog',
    '$f.Description = ' + psQuote(title || '请选择一个文件夹'),
    '$f.ShowNewFolderButton = $true',
    'if ($f.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { Write-Output $f.SelectedPath }',
  ].join('\n');
  const out = await psRun(script);
  return out.trim();
}
async function fileDialogZip() {
  const script = [
    '[Console]::OutputEncoding = [Text.Encoding]::UTF8',
    'Add-Type -AssemblyName System.Windows.Forms',
    'Add-Type -AssemblyName System.Drawing',
    '$f = New-Object System.Windows.Forms.OpenFileDialog',
    '$f.Title = ' + psQuote('请选择要导入的 ZIP 备份文件'),
    '$f.Filter = ' + psQuote('ZIP 备份文件 (*.zip)|*.zip|所有文件 (*.*)|*.*'),
    'if ($f.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { Write-Output $f.FileName }',
  ].join('\n');
  const out = await psRun(script);
  return out.trim();
}
function openInExplorer(dir) {
  try { spawn('explorer.exe', [dir], { detached: true, stdio: 'ignore' }).unref(); return true; }
  catch (e) { log('openInExplorer 失败', e); return false; }
}

/* ------------------------------------------------------------ 保存到桌面
   Edge --app 应用模式会拦截 <a download> + blob 的浏览器下载（只生成 0 字节文件），
   因此下载/导出统一改为「服务端直接写桌面」，用户可在资源管理器直接看到文件。 */
function desktopDir() {
  const candidates = [];
  const home = os.homedir();
  try {
    if (process.env.USERPROFILE) {
      candidates.push(path.join(process.env.USERPROFILE, 'Desktop'));
      // OneDrive 重定向桌面：根目录名不固定（OneDrive / OneDrive - 公司名…），扫描一层
      try {
        for (const d of fs.readdirSync(process.env.USERPROFILE, { withFileTypes: true })) {
          if (d.isDirectory() && /^OneDrive/i.test(d.name)) {
            candidates.push(path.join(process.env.USERPROFILE, d.name, 'Desktop'));
          }
        }
      } catch (e) { /* ignore */ }
    }
  } catch (e) { /* ignore */ }
  candidates.push(path.join(home, 'Desktop'));
  for (const c of candidates) {
    try { if (fs.existsSync(c) && fs.statSync(c).isDirectory()) return c; } catch (e) { /* ignore */ }
  }
  return null;
}
/* 桌面目标路径，重名时自动追加 (2) (3)… */
function uniqueDesktopPath(fileName) {
  const dir = desktopDir() || os.homedir();
  let dest = path.join(dir, fileName);
  if (fs.existsSync(dest)) {
    const ext = path.extname(fileName);
    const base = fileName.slice(0, fileName.length - ext.length);
    for (let i = 2; i < 1000; i++) {
      dest = path.join(dir, base + ' (' + i + ')' + ext);
      if (!fs.existsSync(dest)) break;
    }
  }
  return dest;
}
/* 把已有文件复制到桌面，返回最终路径 */
function copyFileToDesktop(srcPath, fileName) {
  const dest = uniqueDesktopPath(fileName);
  fs.copyFileSync(srcPath, dest);
  return dest;
}
/* 把文本内容写到桌面，返回最终路径 */
function writeTextToDesktop(text, fileName) {
  const dest = uniqueDesktopPath(fileName);
  fs.writeFileSync(dest, text);
  return dest;
}

/* ------------------------------------------------------------ 纯 Node ZIP 打包/解包
   不调用 PowerShell，避免被安全软件拦截；小文件用 DEFLATE，大文件直接存储 */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function dosDateTime(d) {
  const time = ((d.getHours() & 0x1F) << 11) | ((d.getMinutes() & 0x3F) << 5) | (((d.getSeconds() / 2) | 0) & 0x1F);
  const date = (((d.getFullYear() - 1980) & 0x7F) << 9) | (((d.getMonth() + 1) & 0x0F) << 5) | (d.getDate() & 0x1F);
  return { time: time & 0xFFFF, date: date & 0xFFFF };
}
async function zipWrite(destPath, files) {
  const ws = fs.createWriteStream(destPath);
  const done = new Promise((resolve, reject) => { ws.on('error', reject); ws.on('close', resolve); });
  const write = (buf) => new Promise((resolve, reject) => ws.write(buf, e => (e ? reject(e) : resolve())));
  let offset = 0;
  const central = [];
  const dt = dosDateTime(new Date());
  for (const f of files) {
    const nameBuf = Buffer.from(f.name, 'utf8');
    const raw = fs.readFileSync(f.abs);
    let method = 0, out = raw;
    if (raw.length > 0 && raw.length <= 32 * 1024 * 1024) {
      const def = zlib.deflateRawSync(raw, { level: 6 });
      if (def.length < raw.length) { method = 8; out = def; }
    }
    const crc = crc32(raw);
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0);
    lh.writeUInt16LE(20, 4);
    lh.writeUInt16LE(0x0800, 6);
    lh.writeUInt16LE(method, 8);
    lh.writeUInt16LE(dt.time, 10);
    lh.writeUInt16LE(dt.date, 12);
    lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(out.length, 18);
    lh.writeUInt32LE(raw.length, 22);
    lh.writeUInt16LE(nameBuf.length, 26);
    lh.writeUInt16LE(0, 28);
    await write(lh); await write(nameBuf); await write(out);
    central.push({ nameBuf, crc, csize: out.length, usize: raw.length, method, offset });
    offset += 30 + nameBuf.length + out.length;
  }
  const cdStart = offset;
  let cdSize = 0;
  for (const c of central) {
    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0);
    ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6);
    ch.writeUInt16LE(0x0800, 8);
    ch.writeUInt16LE(c.method, 10);
    ch.writeUInt16LE(dt.time, 12); ch.writeUInt16LE(dt.date, 14);
    ch.writeUInt32LE(c.crc, 16);
    ch.writeUInt32LE(c.csize, 20); ch.writeUInt32LE(c.usize, 24);
    ch.writeUInt16LE(c.nameBuf.length, 28);
    ch.writeUInt16LE(0, 30); ch.writeUInt16LE(0, 32); ch.writeUInt16LE(0, 34);
    ch.writeUInt16LE(0, 36); ch.writeUInt16LE(0, 38);
    ch.writeUInt32LE(0, 40);
    ch.writeUInt32LE(c.offset, 42);
    await write(ch); await write(c.nameBuf);
    cdSize += 46 + c.nameBuf.length;
  }
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4); eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(central.length, 8); eocd.writeUInt16LE(central.length, 10);
  eocd.writeUInt32LE(cdSize, 12); eocd.writeUInt32LE(cdStart, 16);
  eocd.writeUInt16LE(0, 20);
  await write(eocd);
  ws.end();
  await done;
}
function zipReadEntries(zipPath) {
  const buf = fs.readFileSync(zipPath);
  let eocd = -1;
  const min = Math.max(0, buf.length - 22 - 65536);
  for (let i = buf.length - 22; i >= min; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('不是有效的 ZIP 文件');
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const entries = [];
  for (let i = 0; i < count; i++) {
    if (p + 46 > buf.length || buf.readUInt32LE(p) !== 0x02014b50) throw new Error('ZIP 中央目录损坏');
    const method = buf.readUInt16LE(p + 10);
    const csize = buf.readUInt32LE(p + 20);
    const nlen = buf.readUInt16LE(p + 28);
    const elen = buf.readUInt16LE(p + 30);
    const clen = buf.readUInt16LE(p + 32);
    const offset = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nlen);
    entries.push({ name, method, csize, offset });
    p += 46 + nlen + elen + clen;
  }
  return { buf, entries };
}
function zipExtract(buf, e) {
  if (e.offset + 30 > buf.length || buf.readUInt32LE(e.offset) !== 0x04034b50) {
    throw new Error('ZIP 条目损坏: ' + e.name);
  }
  const nlen = buf.readUInt16LE(e.offset + 26);
  const elen = buf.readUInt16LE(e.offset + 28);
  const start = e.offset + 30 + nlen + elen;
  const data = buf.subarray(start, start + e.csize);
  if (e.method === 0) return Buffer.from(data);
  if (e.method === 8) return zlib.inflateRawSync(data);
  throw new Error('不支持的压缩方法: ' + e.method);
}

/* ------------------------------------------------------------ 备份 / 导入 */
async function makeBackup() {
  const notesDir = path.join(dataDir, 'notes');
  const files = [];
  (function walk(dir, rel) {
    let entries = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
    for (const e of entries) {
      const r = rel ? rel + '/' + e.name : e.name;
      if (e.isDirectory()) walk(path.join(dir, e.name), r);
      else files.push({ name: r, abs: path.join(dir, e.name) });
    }
  })(notesDir, 'notes');
  const cfgFile = path.join(dataDir, 'config.json');
  if (fs.existsSync(cfgFile)) files.push({ name: 'config.json', abs: cfgFile });
  if (!files.length) throw new Error('数据目录为空，没有可备份的内容');
  fs.mkdirSync(path.join(dataDir, 'backups'), { recursive: true });
  const name = '便签日记备份_' + stamp() + '.zip';
  await zipWrite(path.join(dataDir, 'backups', name), files);
  log('已创建备份:', name, '(' + files.length + ' 个文件)');
  return name;
}
async function importZip(zipPath) {
  if (!zipPath || !fs.existsSync(zipPath)) throw new Error('找不到文件: ' + zipPath);
  const staging = path.join(dataDir, '.import_' + Date.now().toString(36));
  fs.mkdirSync(staging, { recursive: true });
  try {
    const { buf, entries } = zipReadEntries(zipPath);
    // 定位 notes 目录：zip 根目录或下一级目录
    let prefix = null;
    for (const e of entries) {
      const n = e.name.replace(/\\/g, '/');
      const m = /^(.*?)notes\//.exec(n);
      if (m) { prefix = m[1]; break; }
    }
    if (prefix === null) throw new Error('这个 ZIP 里没有找到便签日记的笔记数据（缺少 notes 目录）');
    const base = prefix + 'notes/';
    let extracted = 0;
    for (const e of entries) {
      const n = e.name.replace(/\\/g, '/');
      if (n.indexOf(base) !== 0) continue;
      const rel = n.slice(base.length);
      if (!rel || rel.endsWith('/')) continue;
      const dest = path.join(staging, 'notes', rel);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, zipExtract(buf, e));
      extracted++;
    }
    if (!extracted) throw new Error('这个 ZIP 里没有找到便签日记的笔记数据');

    const notesRoot = path.join(staging, 'notes');
    let imported = 0, renamed = 0, skipped = 0;
    for (const entry of fs.readdirSync(notesRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const src = path.join(notesRoot, entry.name);
      let note = null;
      try { note = JSON.parse(fs.readFileSync(path.join(src, 'note.json'), 'utf8')); } catch (e) { /* ignore */ }
      if (!note || !note.id) { skipped++; continue; }
      let id = entry.name;
      if (!safeId(id)) id = newId();
      if (fs.existsSync(path.join(dataDir, 'notes', id, 'note.json'))) {
        id = id + '_i' + crypto.randomBytes(2).toString('hex');
        renamed++;
      }
      note.id = id;
      const dest = path.join(dataDir, 'notes', id);
      copyDir(src, dest);
      fs.writeFileSync(path.join(dest, 'note.json'), JSON.stringify(note, null, 2));
      imported++;
    }
    log('导入完成: 成功', imported, '重命名', renamed, '跳过', skipped);
    return { imported, renamed, skipped };
  } finally {
    try { fs.rmSync(staging, { recursive: true, force: true }); } catch (e) { /* ignore */ }
  }
}

/* ------------------------------------------------------------ 单篇导出（自包含 HTML） */
function buildExportHtml(note) {
  const mediaDir = path.join(noteDir(note.id), 'media');
  let html = String(note.content || '');
  html = html.replace(/(src|href)="(\/media\/[^"]+)"/g, (m, attr, url) => {
    const rel = decodeURIComponent(url.replace(/^\/media\/[^/]+\//, ''));
    try {
      const fp = path.join(mediaDir, rel);
      const ext = path.extname(rel).toLowerCase();
      const mime = MIME[ext] || 'application/octet-stream';
      const b64 = fs.readFileSync(fp).toString('base64');
      return attr + '="data:' + mime + ';base64,' + b64 + '"';
    } catch (e) { return m; }
  });
  const created = new Date(note.createdAt).toLocaleString('zh-CN');
  const updated = new Date(note.updatedAt).toLocaleString('zh-CN');
  return '<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '<title>' + escapeHtml(note.title || '无标题日志') + '</title>\n<style>\n' +
    'body{margin:0;background:#f6f7f9;font-family:"Microsoft YaHei","PingFang SC",system-ui,sans-serif;color:#222;}\n' +
    '.wrap{max-width:760px;margin:40px auto;background:#fff;border-radius:16px;padding:48px 56px;box-shadow:0 2px 16px rgba(0,0,0,.06);}\n' +
    'h1{font-size:26px;margin:0 0 6px;}\n' +
    '.meta{color:#8a919e;font-size:13px;margin-bottom:28px;}\n' +
    '.content{font-size:16px;line-height:1.85;}\n' +
    '.content img{max-width:100%;border-radius:10px;}\n' +
    '.content video,.content audio{max-width:100%;border-radius:10px;}\n' +
    '.content blockquote{margin:14px 0;padding:8px 16px;border-left:4px solid #d7dbe2;background:#f6f7f9;border-radius:0 8px 8px 0;color:#555;}\n' +
    '.content pre{background:#f2f3f5;padding:14px 16px;border-radius:10px;overflow:auto;font-family:Consolas,monospace;font-size:14px;}\n' +
    '.content hr{border:none;border-top:1px solid #e5e7eb;margin:22px 0;}\n' +
    '.content a{color:#3b6ef7;}\n' +
    '.foot{margin-top:36px;padding-top:14px;border-top:1px dashed #e5e7eb;color:#aab; font-size:12px;text-align:center;}\n' +
    '</style>\n</head>\n<body>\n<div class="wrap">\n' +
    '<h1>' + escapeHtml(note.title || '无标题日志') + '</h1>\n' +
    '<div class="meta">创建于 ' + created + ' · 更新于 ' + updated + '</div>\n' +
    '<div class="content">' + (html || '<p>（空日志）</p>') + '</div>\n' +
    '<div class="foot">由「便签日记」导出</div>\n</div>\n</body>\n</html>\n';
}

/* ------------------------------------------------------------ 欢迎日志 */
function ensureWelcomeNote() {
  const base = path.join(dataDir, 'notes');
  let has = false;
  try {
    for (const d of fs.readdirSync(base)) {
      if (fs.existsSync(path.join(base, d, 'note.json'))) { has = true; break; }
    }
  } catch (e) { /* ignore */ }
  if (has) return;
  const note = {
    id: newId(),
    title: '欢迎使用便签日记',
    content:
      '<p>这是你的第一篇日志，随便写点什么吧。</p>' +
      '<p><b>你可以：</b></p>' +
      '<ul>' +
      '<li>点击左上角「＋ 新建日志」开始记录</li>' +
      '<li>在编辑器里插入图片、视频、音频（也支持直接粘贴截图、拖拽文件）</li>' +
      '<li>用工具栏给文字加粗、加下划线、画荧光笔、改颜色</li>' +
      '<li>给日志设置标签、心情和卡片颜色，重要日志可以置顶</li>' +
      '<li>删除的日志会进回收站，可随时恢复</li>' +
      '</ul>' +
      '<p><b>关于数据：</b>所有内容都保存在你自己的数据文件夹里，可在「设置」中更改位置；' +
      '建议定期在「设置 → 备份管理」里创建备份，换电脑时用「导入 ZIP」即可迁移。</p>',
    tags: ['入门'],
    color: 'yellow',
    mood: '😊',
    pinned: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    trashed: false,
  };
  writeNote(note);
  log('已创建欢迎日志');
}

/* 前端资产：SEA 模式从 exe 内置资产读取，普通模式从 web 目录读取 */
function getWebAsset(name) {
  if (IS_SEA) {
    try {
      const a = require('node:sea').getAsset(name);
      if (a == null) return null;
      return typeof a === 'string' ? a : Buffer.from(a).toString('utf8');
    } catch (e) { return null; }
  }
  try { return fs.readFileSync(path.join(WEB_DIR, name), 'utf8'); } catch (e) { return null; }
}

/* ------------------------------------------------------------ HTTP 助手 */
function sendJson(res, code, obj) {
  const b = Buffer.from(JSON.stringify(obj));
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(b);
}
function sendErr(res, code, msg) { sendJson(res, code, { error: msg }); }
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', c => {
      size += c.length;
      if (size > MAX_BODY) { reject(new Error('内容太大')); req.destroy(); }
      else chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
async function readJson(req) {
  const buf = await readBody(req);
  if (!buf.length) return {};
  try { return JSON.parse(buf.toString('utf8')); }
  catch (e) { throw new Error('JSON 格式错误'); }
}
function serveMedia(req, res, filePath) {
  let stat;
  try { stat = fs.statSync(filePath); } catch (e) { res.writeHead(404); res.end('not found'); return; }
  if (!stat.isFile()) { res.writeHead(404); res.end('not found'); return; }
  const total = stat.size;
  const type = MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'no-store');
  const range = req.headers.range;
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    if (m && (m[1] || m[2])) {
      let start = m[1] ? parseInt(m[1], 10) : Math.max(0, total - parseInt(m[2], 10));
      let end = m[2] ? parseInt(m[2], 10) : total - 1;
      if (isNaN(start) || isNaN(end) || start > end || end >= total) {
        res.writeHead(416, { 'Content-Range': 'bytes */' + total });
        res.end();
        return;
      }
      res.writeHead(206, {
        'Content-Type': type,
        'Content-Length': end - start + 1,
        'Content-Range': 'bytes ' + start + '-' + end + '/' + total,
      });
      fs.createReadStream(filePath, { start, end }).pipe(res);
      return;
    }
  }
  res.writeHead(200, { 'Content-Type': type, 'Content-Length': total });
  fs.createReadStream(filePath).pipe(res);
}
function safeMediaName(raw) {
  let name = path.basename(String(raw || 'file')).replace(/[<>:"/\\|?*\x00-]/g, '_');
  if (!name || name === '.') name = 'file';
  if (name.length > 120) name = name.slice(-120);
  return name;
}

/* ------------------------------------------------------------ 路由 */
async function handler(req, res) {
  const u = new URL(req.url, 'http://127.0.0.1');
  const p = u.pathname;
  const method = req.method;

  if (p === '/api/health') return sendJson(res, 200, { ok: true, app: '便签日记' });
  if (byeTimer) { clearTimeout(byeTimer); byeTimer = null; } // 任何请求都说明窗口还活着（刷新页面会立即发请求，不会误退出）

  if (p === '/' || p === '/index.html') {
    let html = getWebAsset('index.html');
    if (html == null) { res.writeHead(500); res.end('index.html 缺失'); return; }
    html = html.replace('__TOKEN__', TOKEN);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(html);
    return;
  }
  if (p === '/favicon.ico') { res.writeHead(204); res.end(); return; }
  if (p.startsWith('/web/')) {
    const name = path.basename(decodeURIComponent(p.slice(5)));
    if (!/^(index\.html|app\.js|style\.css)$/.test(name)) { res.writeHead(404); res.end('not found'); return; }
    const asset = getWebAsset(name);
    if (asset == null) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(name).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(asset);
    return;
  }

  const mMediaFile = /^\/media\/([A-Za-z0-9_\-]+)\/(.+)$/.exec(p);
  if (mMediaFile) {
    if (!safeId(mMediaFile[1])) { res.writeHead(400); res.end(); return; }
    const name = path.basename(decodeURIComponent(mMediaFile[2]));
    const fp = path.join(dataDir, 'notes', mMediaFile[1], 'media', name);
    if (!fp.startsWith(path.join(dataDir, 'notes'))) { res.writeHead(400); res.end(); return; }
    return serveMedia(req, res, fp);
  }

  /* ---- 以下接口都需要令牌 ---- */
  if (!p.startsWith('/api/')) { res.writeHead(404); res.end('not found'); return; }
  if (req.headers['x-token'] !== TOKEN) return sendErr(res, 401, '未授权的请求');

  if (p === '/api/state' && method === 'GET') {
    return sendJson(res, 200, {
      dataDir,
      autoBackup: dataConfig().autoBackup !== false,
      notes: listNotes(),
      backups: listBackups(),
    });
  }
  if (p === '/api/settings' && method === 'POST') {
    const body = await readJson(req);
    const cfg = dataConfig();
    if (typeof body.autoBackup === 'boolean') cfg.autoBackup = body.autoBackup;
    saveDataConfig(cfg);
    return sendJson(res, 200, { ok: true, autoBackup: cfg.autoBackup });
  }

  /* ---- 数据目录 ---- */
  if (p === '/api/dialog/folder' && method === 'POST') {
    const path = await folderDialog('请选择日志数据的存储文件夹');
    return sendJson(res, 200, { path, cancelled: !path });
  }
  if (p === '/api/dialog/file' && method === 'POST') {
    const fp = await fileDialogZip();
    return sendJson(res, 200, { path: fp, cancelled: !fp });
  }
  if (p === '/api/open-dir' && method === 'POST') {
    const body = await readJson(req);
    let dir;
    if (body.dir === 'data') dir = dataDir;
    else if (body.dir === 'app') dir = ROOT;
    else if (body.dir === 'backups') dir = path.join(dataDir, 'backups');
    else dir = dataDir;
    return sendJson(res, 200, { ok: openInExplorer(dir) });
  }
  if (p === '/api/data-dir' && method === 'POST') {
    const body = await readJson(req);
    const target = String(body.path || '').trim();
    if (!target) return sendErr(res, 400, '请提供目标路径');
    if (!path.isAbsolute(target)) return sendErr(res, 400, '请提供绝对路径');
    ensureStructure(target);
    let copied = 0;
    if (body.copy !== false) {
      const srcNotes = path.join(dataDir, 'notes');
      try {
        for (const d of fs.readdirSync(srcNotes, { withFileTypes: true })) {
          if (!d.isDirectory()) continue;
          let destId = d.name;
          if (fs.existsSync(path.join(target, 'notes', destId, 'note.json'))) {
            destId = destId + '_i' + crypto.randomBytes(2).toString('hex');
          }
          try {
            copyDir(path.join(srcNotes, d.name), path.join(target, 'notes', destId));
            copied++;
          } catch (e) { log('迁移失败', d.name, e); }
        }
      } catch (e) { /* ignore */ }
    }
    const oldDir = dataDir;
    dataDir = target;
    writeLocation(target);
    ensureStructure(dataDir);
    log('数据目录已切换:', oldDir, '->', target, '迁移', copied, '条');
    return sendJson(res, 200, { ok: true, dataDir, copied });
  }

  /* ---- 备份 / 导入 ---- */
  if (p === '/api/backups' && method === 'GET') {
    return sendJson(res, 200, { backups: listBackups(), dataDir });
  }
  if (p === '/api/backups' && method === 'POST') {
    const name = await makeBackup();
    return sendJson(res, 200, { ok: true, name, backups: listBackups() });
  }
  const mBackup = /^\/api\/backups\/(.+)$/.exec(p);
  if (mBackup && method === 'GET') {
    const name = path.basename(decodeURIComponent(mBackup[1]));
    const fp = path.join(dataDir, 'backups', name);
    if (!fs.existsSync(fp)) return sendErr(res, 404, '备份不存在');
    res.writeHead(200, {
      'Content-Type': 'application/zip',
      'Content-Disposition': "attachment; filename=\"" + encodeURIComponent(name) + "\"; filename*=UTF-8''" + encodeURIComponent(name),
    });
    fs.createReadStream(fp).pipe(res);
    return;
  }
  /* 保存备份到桌面（Edge app 模式浏览器下载不可用，改服务端直写） */
  const mBackupSave = /^\/api\/backups\/(.+)\/save$/.exec(p);
  if (mBackupSave && method === 'POST') {
    const name = path.basename(decodeURIComponent(mBackupSave[1]));
    const fp = path.join(dataDir, 'backups', name);
    if (!fs.existsSync(fp)) return sendErr(res, 404, '备份不存在');
    try {
      const dest = copyFileToDesktop(fp, name);
      log('备份已保存到桌面:', dest);
      return sendJson(res, 200, { ok: true, savedPath: dest });
    } catch (e) {
      log('保存备份到桌面失败', e);
      return sendErr(res, 500, '保存到桌面失败：' + e.message);
    }
  }
  if (mBackup && method === 'DELETE') {
    const name = path.basename(decodeURIComponent(mBackup[1]));
    try { fs.unlinkSync(path.join(dataDir, 'backups', name)); } catch (e) { return sendErr(res, 404, '备份不存在'); }
    return sendJson(res, 200, { ok: true, backups: listBackups() });
  }
  if (p === '/api/import' && method === 'POST') {
    const body = await readJson(req);
    const r = await importZip(body.path);
    return sendJson(res, 200, { ok: true, result: r, notes: listNotes() });
  }

  /* ---- 导出单篇 ---- */
  const mExport = /^\/api\/export\/([A-Za-z0-9_\-]+)$/.exec(p);
  if (mExport && method === 'GET') {
    const note = readNote(mExport[1]);
    if (!note) return sendErr(res, 404, '日志不存在');
    const html = buildExportHtml(note);
    const title = (note.title || '无标题日志').replace(/[\\/:*?"<>|]/g, '_');
    /* ?save=1：服务端直接写桌面（Edge app 模式浏览器下载不可用） */
    if (u.searchParams.get('save') === '1') {
      try {
        const dest = writeTextToDesktop(html, title + '.html');
        log('导出已保存到桌面:', dest);
        return sendJson(res, 200, { ok: true, savedPath: dest });
      } catch (e) {
        log('保存导出到桌面失败', e);
        return sendErr(res, 500, '保存到桌面失败：' + e.message);
      }
    }
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': "attachment; filename=\"" + encodeURIComponent(title) + ".html\"; filename*=UTF-8''" + encodeURIComponent(title + '.html'),
    });
    res.end(html);
    return;
  }

  /* ---- 笔记 CRUD ---- */
  if (p === '/api/notes' && method === 'POST') {
    const now = Date.now();
    const note = {
      id: newId(), title: '', content: '', tags: [], color: 'none',
      mood: null, pinned: false, createdAt: now, updatedAt: now, trashed: false,
    };
    writeNote(note);
    return sendJson(res, 200, { ok: true, note: publicNote(note) });
  }
  if (p === '/api/notes' && method === 'GET') {
    return sendJson(res, 200, { notes: listNotes() });
  }
  const mNote = /^\/api\/notes\/([A-Za-z0-9_\-]+)$/.exec(p);
  if (mNote && method === 'GET') {
    const note = readNote(mNote[1]);
    if (!note) return sendErr(res, 404, '日志不存在');
    return sendJson(res, 200, { note });
  }
  if (mNote && method === 'PUT') {
    const note = readNote(mNote[1]);
    if (!note) return sendErr(res, 404, '日志不存在');
    const body = await readJson(req);
    if (typeof body.title === 'string') note.title = body.title.slice(0, 200);
    if (typeof body.content === 'string') note.content = sanitizeHtml(body.content).slice(0, 8 * 1024 * 1024);
    if (Array.isArray(body.tags)) {
      note.tags = body.tags.map(t => String(t).trim().slice(0, 24)).filter(Boolean).slice(0, 20);
      note.tags = Array.from(new Set(note.tags));
    }
    if (typeof body.color === 'string' && CARD_COLORS.indexOf(body.color) >= 0) note.color = body.color;
    if (body.mood === null || typeof body.mood === 'string') note.mood = body.mood ? String(body.mood).slice(0, 16) : null;
    if (typeof body.pinned === 'boolean') note.pinned = body.pinned;
    writeNote(note);
    return sendJson(res, 200, { ok: true, note: publicNote(note) });
  }
  if (mNote && method === 'DELETE') {
    const permanent = u.searchParams.get('permanent') === '1';
    const note = readNote(mNote[1]);
    if (!note) return sendErr(res, 404, '日志不存在');
    if (permanent) {
      try { fs.rmSync(noteDir(mNote[1]), { recursive: true, force: true }); }
      catch (e) { return sendErr(res, 500, '删除失败'); }
      return sendJson(res, 200, { ok: true });
    }
    note.trashed = true;
    note.trashedAt = Date.now();
    writeNote(note);
    return sendJson(res, 200, { ok: true, note: publicNote(note) });
  }
  const mRestore = /^\/api\/notes\/([A-Za-z0-9_\-]+)\/restore$/.exec(p);
  if (mRestore && method === 'POST') {
    const note = readNote(mRestore[1]);
    if (!note) return sendErr(res, 404, '日志不存在');
    note.trashed = false;
    note.trashedAt = null;
    writeNote(note);
    return sendJson(res, 200, { ok: true, note: publicNote(note) });
  }
  const mMedia = /^\/api\/notes\/([A-Za-z0-9_\-]+)\/media$/.exec(p);
  if (mMedia && method === 'PUT') {
    const note = readNote(mMedia[1]);
    if (!note) return sendErr(res, 404, '日志不存在');
    const rawName = decodeURIComponent(req.headers['x-filename'] || 'file');
    const ext = path.extname(rawName).toLowerCase();
    if (![].concat(IMG_EXT, VID_EXT, AUD_EXT).includes(ext)) {
      return sendErr(res, 400, '不支持的文件类型: ' + ext);
    }
    const finalName = Date.now().toString(36) + '_' + crypto.randomBytes(2).toString('hex') + '_' + safeMediaName(rawName);
    const dir = path.join(noteDir(mMedia[1]), 'media');
    fs.mkdirSync(dir, { recursive: true });
    const tmp = path.join(dir, finalName + '.tmp');
    // 直接流式写盘，大视频也不占内存
    let received = 0;
    await new Promise((resolve, reject) => {
      const ws = fs.createWriteStream(tmp);
      req.on('data', c => {
        received += c.length;
        if (received > MAX_BODY) {
          try { ws.destroy(); } catch (e) { /* ignore */ }
          reject(new Error('文件太大（上限 256MB）'));
          try { req.destroy(); } catch (e) { /* ignore */ }
        }
      });
      req.on('error', reject);
      req.pipe(ws);
      ws.on('error', reject);
      ws.on('finish', resolve);
    }).catch(async e => {
      try { fs.unlinkSync(tmp); } catch (e2) { /* ignore */ }
      throw e;
    });
    if (received <= 0) {
      try { fs.unlinkSync(tmp); } catch (e) { /* ignore */ }
      return sendErr(res, 400, '文件内容为空');
    }
    fs.renameSync(tmp, path.join(dir, finalName));
    return sendJson(res, 200, { ok: true, url: '/media/' + mMedia[1] + '/' + encodeURIComponent(finalName) });
  }

  /* ---- 心跳 / 退出 ---- */
  if (p === '/api/ping' && method === 'POST') { lastPing = Date.now(); return sendJson(res, 200, { ok: true }); }
  if (p === '/api/bye' && method === 'POST') {
    // 窗口关闭信号：5 秒内没有新请求就退出（刷新页面会因新请求取消）
    if (byeTimer) clearTimeout(byeTimer);
    byeTimer = setTimeout(() => { log('应用窗口已关闭，退出'); process.exit(0); }, 5000);
    return sendJson(res, 200, { ok: true });
  }
  if (p === '/api/shutdown' && method === 'POST') {
    sendJson(res, 200, { ok: true });
    setTimeout(() => { log('收到退出指令'); process.exit(0); }, 150);
    return;
  }

  sendErr(res, 404, '接口不存在: ' + p);
}

/* ------------------------------------------------------------ 启动 */
let lastPing = Date.now();
let byeTimer = null;      // 窗口关闭信号：收到后 5 秒无新请求即退出（刷新页面会取消）
const server = http.createServer((req, res) => {
  handler(req, res).catch(e => {
    log('请求处理出错:', e);
    try { sendErr(res, 500, e.message || '服务器内部错误'); } catch (e2) { /* ignore */ }
  });
});

function listen(port) {
  server.once('error', e => {
    if (e.code === 'EADDRINUSE' && port < MAX_PORT) {
      log('端口', port, '被占用，尝试', port + 1);
      listen(port + 1);
    } else {
      log('监听失败:', e);
      process.exit(1);
    }
  });
  server.listen(port, '127.0.0.1', () => {
    // SEA exe 模式不写 .port 文件（保持程序目录干净，单实例改用端口探测）
    if (!IS_SEA) {
      try { fs.writeFileSync(PORT_FILE, String(port)); } catch (e) { /* ignore */ }
    }
    log('便签日记服务已启动: http://127.0.0.1:' + port + (IS_SEA ? ' [SEA 单文件模式]' : ''));
    if (IS_SEA) launchBrowser(port);
    // 首次使用：创建欢迎日志 + 自动备份
    ensureWelcomeNote();
    setTimeout(async () => {
      try {
        if (dataConfig().autoBackup !== false) {
          const backups = listBackups();
          const newest = backups.length ? backups[0].mtime : 0;
          if (Date.now() - newest > 24 * 3600 * 1000) await makeBackup();
        }
      } catch (e) { log('自动备份失败:', e); }
    }, 4000);
  });
}

/* ---------- SEA exe 模式：自动打开应用窗口 + 单实例 ---------- */
function readPortFile() {
  try { const v = fs.readFileSync(PORT_FILE, 'utf8').trim(); return /^\d+$/.test(v) ? v : ''; }
  catch (e) { return ''; }
}
function findBrowserExe() {
  const cands = [
    path.join(process.env['ProgramFiles(x86)'] || '', 'Microsoft\\Edge\\Application\\msedge.exe'),
    path.join(process.env.ProgramFiles || '', 'Microsoft\\Edge\\Application\\msedge.exe'),
    path.join(process.env['ProgramFiles(x86)'] || '', 'Google\\Chrome\\Application\\chrome.exe'),
    path.join(process.env.ProgramFiles || '', 'Google\\Chrome\\Application\\chrome.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
  ].filter(Boolean);
  for (const c of cands) { try { if (fs.existsSync(c)) return c; } catch (e) { /* ignore */ } }
  return null;
}
function launchBrowser(port) {
  const url = 'http://127.0.0.1:' + port;
  const exe = findBrowserExe();
  try {
    if (exe) {
      // 用浏览器默认配置文件，不在程序目录生成任何额外文件夹
      spawn(exe, [
        '--app=' + url,
        '--no-first-run',
        '--disable-session-crashed-bubble',
      ], { detached: true, stdio: 'ignore' }).unref();
      log('已打开应用窗口:', exe);
    } else {
      spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore', windowsHide: true }).unref();
      log('未找到 Edge/Chrome，已改用默认浏览器打开');
    }
  } catch (e) { log('打开浏览器失败:', e); }
}
function healthOk(port) {
  return new Promise(resolve => {
    const req = http.get({ host: '127.0.0.1', port: port, path: '/api/health', timeout: 1500 }, res => {
      let d = '';
      res.on('data', c => { d += c; if (d.length > 4096) { req.destroy(); resolve(false); } });
      res.on('end', () => resolve(res.statusCode === 200 && d.indexOf('便签日记') >= 0));
      res.on('error', () => resolve(false));
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}
/* 端口探测：不依赖任何文件，找到已在运行的本服务实例 */
async function findRunningInstance() {
  for (let port = BASE_PORT; port <= MAX_PORT; port++) {
    if (await healthOk(port)) return port;
  }
  return 0;
}
async function seaBootstrap() {
  const found = await findRunningInstance();
  if (found) {
    launchBrowser(found);
    log('检测到已在运行的实例（端口 ' + found + '），仅打开窗口');
    setTimeout(() => process.exit(0), 300);
    return;
  }
  listen(BASE_PORT);
}

if (IS_SEA) {
  seaBootstrap().catch(e => { log('SEA 引导失败，直接启动:', e); listen(BASE_PORT); });
} else {
  listen(BASE_PORT);
}

// 心跳兜底：浏览器异常（崩溃/断网）时最终也会退出
setInterval(() => {
  if (Date.now() - lastPing > IDLE_EXIT_MS) {
    log('浏览器心跳超时，自动退出');
    process.exit(0);
  }
}, 15000);
