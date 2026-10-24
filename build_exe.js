'use strict';
/**
 * 构建脚本：把「便签日记」打包成单个 SEA exe（便签日记.exe）
 * 流程：暂存 server.js + web 资产 → 生成 SEA blob → 复制 Node → 写入图标/版本信息
 *      → 注入 blob → PE 子系统改为 GUI（无黑窗）
 *
 * 用法（Windows）：
 *   1. 安装 Node.js 22+（或把 node.exe 放到 runtime/ 目录）
 *   2. npm install postject rcedit
 *   3. node build_exe.js
 * 产物：dist-exe/便签日记.exe（图标取 assets/icon.ico，缺失则保持 Node 默认图标）
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const APP = __dirname;
const DIST = path.join(APP, 'dist-exe');

/* Node 可执行文件：优先 runtime/node.exe，否则用当前运行的 Node */
function resolveNode() {
  const local = path.join(APP, 'runtime', 'node.exe');
  if (fs.existsSync(local)) return local;
  return process.execPath;
}
/* postject CLI：定位包的 bin 入口（注意 require.resolve 返回的是 main 而非 bin） */
function resolvePostject() {
  try {
    const pkgDir = path.dirname(require.resolve('postject')); // .../node_modules/postject/dist
    const cli = path.join(pkgDir, 'cli.js');
    if (fs.existsSync(cli)) return cli;
  } catch (e) { /* not found */ }
  if (process.env.POSTJECT_CLI && fs.existsSync(process.env.POSTJECT_CLI)) return process.env.POSTJECT_CLI;
  throw new Error('未找到 postject，请先执行: npm install postject');
}
/* 加载 rcedit：兼容 4.x（CommonJS 默认导出）与 5.x（ESM 命名导出） */
async function loadRcedit() {
  let resolved = null;
  try { resolved = require.resolve('rcedit'); } catch (e) { /* not found */ }
  if (!resolved && process.env.RCEDIT_PATH && fs.existsSync(process.env.RCEDIT_PATH)) resolved = process.env.RCEDIT_PATH;
  if (!resolved) throw new Error('未找到 rcedit，请先执行: npm install rcedit');
  const mod = await import(require('url').pathToFileURL(resolved).href);
  const fn = mod.rcedit || mod.default;
  if (typeof fn !== 'function') throw new Error('rcedit 加载失败：未知的导出形式');
  return fn;
}
/* 从 Node 二进制中提取 SEA fuse 标记（不同 Node 版本值不同，必须动态提取） */
function findFuse(nodePath) {
  const buf = fs.readFileSync(nodePath);
  const m = /NODE_SEA_FUSE_[0-9a-f]+/.exec(buf.toString('latin1'));
  if (!m) throw new Error('未在 Node 二进制中找到 SEA fuse 标记');
  return m[0];
}
function step(msg) { console.log('\n==> ' + msg); }

(async () => {
  const NODE = resolveNode();
  const POSTJECT = resolvePostject();
  const FUSE = findFuse(NODE);
  console.log('Node:', NODE);
  console.log('postject:', POSTJECT);
  console.log('fuse:', FUSE);

  /* 1. 清理并暂存 */
  step('暂存构建文件');
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(path.join(DIST, 'web'), { recursive: true });
  fs.copyFileSync(path.join(APP, 'server.js'), path.join(DIST, 'server.js'));
  for (const f of ['index.html', 'app.js', 'style.css']) {
    fs.copyFileSync(path.join(APP, 'web', f), path.join(DIST, 'web', f));
  }

  /* 2. SEA 配置（前端三个文件作为内置资产） */
  step('生成 sea-config.json');
  const seaConfig = {
    main: 'server.js',
    output: 'sea-prep.blob',
    disableExperimentalSEAWarning: true,
    assets: {
      'index.html': 'web/index.html',
      'app.js': 'web/app.js',
      'style.css': 'web/style.css',
    },
  };
  fs.writeFileSync(path.join(DIST, 'sea-config.json'), JSON.stringify(seaConfig, null, 2));

  /* 3. 生成 SEA blob */
  step('生成 SEA blob');
  execFileSync(NODE, ['--experimental-sea-config', 'sea-config.json'], { cwd: DIST, stdio: 'inherit' });
  if (!fs.existsSync(path.join(DIST, 'sea-prep.blob'))) throw new Error('sea-prep.blob 未生成');

  /* 4. 复制 Node 作为 exe 基底 */
  step('复制 Node 运行时');
  const exe = path.join(DIST, '便签日记.exe');
  fs.copyFileSync(NODE, exe);

  /* 5. 写入图标与版本信息（在 SEA 注入前改资源段，不影响注入结构） */
  step('写入图标与版本信息');
  const ICON = path.join(APP, 'assets', 'icon.ico');
  if (fs.existsSync(ICON)) {
    const rcedit = await loadRcedit();
    await rcedit(exe, {
      icon: ICON,
      'file-version': '1.0.0.0',
      'product-version': '1.0.0.0',
      'version-string': {
        ProductName: '便签日记',
        FileDescription: '便签日记 — Windows 便携单文件日记应用',
        CompanyName: '便签日记 contributors',
        InternalName: 'StickyNoteDiary',
        OriginalFilename: '便签日记.exe',
        LegalCopyright: 'Copyright (c) 2026 便签日记 contributors (MIT)',
      },
    });
    console.log('    图标: ' + ICON);
  } else {
    console.log('    未找到 assets/icon.ico，保持 Node 默认图标');
  }

  /* 6. 注入 blob */
  step('注入 SEA blob');
  execFileSync(NODE, [POSTJECT, exe, 'NODE_SEA_BLOB', 'sea-prep.blob', '--sentinel-fuse', FUSE],
    { cwd: DIST, stdio: 'inherit' });

  /* 7. PE 子系统改为 GUI（双击不出现黑色控制台窗口） */
  step('修改 PE 子系统为 GUI');
  const before = patchSubsystem(exe);
  console.log('    subsystem: ' + before + ' (CONSOLE) -> 2 (WINDOWS_GUI)');

  step('构建完成');
  console.log('    输出: ' + exe);
  console.log('    大小: ' + (fs.statSync(exe).size / 1024 / 1024).toFixed(1) + ' MB');
})().catch(e => { console.error('\n构建失败:', e.message); process.exit(1); });

function patchSubsystem(file) {
  const buf = fs.readFileSync(file);
  if (buf.readUInt16LE(0) !== 0x5A4D) throw new Error('不是有效的 MZ 文件');
  const peOff = buf.readUInt32LE(0x3C);
  if (buf.toString('latin1', peOff, peOff + 4) !== 'PE\0\0') throw new Error('不是有效的 PE 文件');
  const optOff = peOff + 4 + 20;
  const magic = buf.readUInt16LE(optOff);
  if (magic !== 0x20B) throw new Error('意外的可选头 magic: 0x' + magic.toString(16));
  const subOff = optOff + 68; // IMAGE_OPTIONAL_HEADER64.Subsystem
  const before = buf.readUInt16LE(subOff);
  buf.writeUInt16LE(2, subOff); // IMAGE_SUBSYSTEM_WINDOWS_GUI
  fs.writeFileSync(file, buf);
  return before;
}
