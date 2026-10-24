/* ============================================================
   便签日记 · 前端逻辑（原生 JS，无依赖）
   ============================================================ */
'use strict';

const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));

/* ---------------- 图标 ---------------- */
const ICONS = {
  undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/>',
  redo: '<path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 15-6.7L21 13"/>',
  bold: '<path d="M6 4h8a4 4 0 0 1 0 8H6z"/><path d="M6 12h9a4 4 0 0 1 0 8H6z"/>',
  italic: '<path d="M19 4h-9M14 20H5M15 4L9 20"/>',
  underline: '<path d="M6 4v6a6 6 0 0 0 12 0V4"/><path d="M4 20h16"/>',
  strike: '<path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/><path d="M4 12h16"/>',
  palette: '<path d="M12 22a10 10 0 1 1 10-10c0 2.5-2 3-3.5 3H16a2 2 0 0 0-1.4 3.4A2 2 0 0 1 12 22z"/><circle cx="7.5" cy="10.5" r="1.2" fill="currentColor"/><circle cx="12" cy="7.5" r="1.2" fill="currentColor"/><circle cx="16.5" cy="10.5" r="1.2" fill="currentColor"/>',
  highlight: '<path d="M9 11l-4 4v3h3l4-4"/><path d="M13 7l4 4"/><path d="M17.5 2.5l4 4L13 15l-4-4z"/>',
  ul: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1.1" fill="currentColor"/><circle cx="3.5" cy="12" r="1.1" fill="currentColor"/><circle cx="3.5" cy="18" r="1.1" fill="currentColor"/>',
  ol: '<path d="M10 6h11M10 12h11M10 18h11"/><path d="M4 6h1v4"/><path d="M3 12.5h2.5L3 15h2.5"/><path d="M3 17.5h2.5V19H3"/>',
  quote: '<path d="M10 8c-3 .5-5 2.5-5 6v2h4v-4H7c0-2 1-3.2 3-3.7z"/><path d="M19 8c-3 .5-5 2.5-5 6v2h4v-4h-2c0-2 1-3.2 3-3.7z"/>',
  code: '<path d="M16 18l6-6-6-6"/><path d="M8 6l-6 6 6 6"/>',
  hr: '<path d="M3 12h18"/><path d="M6 7h12M6 17h12" opacity=".35"/>',
  alignL: '<path d="M3 6h18M3 12h10M3 18h14"/>',
  alignC: '<path d="M3 6h18M6 12h12M4 18h16"/>',
  alignR: '<path d="M3 6h18M11 12h10M7 18h14"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="M21 15l-5-5L6 21"/>',
  video: '<rect x="2" y="6" width="13" height="12" rx="2"/><path d="M15 10l7-3v10l-7-3z"/>',
  audio: '<path d="M9 18V6l10-2v12"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7.1-7.1L11 5.9"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7.1 7.1L13 18.1"/>',
  eraser: '<path d="M7 21h10"/><path d="M5 15l4 4"/><path d="M13.5 4.5L20 11l-8 8H8l-3-3z"/>',
  trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>',
  restore: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  pin: '<path d="M12 17v5"/><path d="M9 3h6l-1 6 3 3H7l3-3-1-6z"/>',
  download: '<path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M4 21h16"/>',
  upload: '<path d="M12 16V4"/><path d="M7 9l5-5 5 5"/><path d="M4 21h16"/>',
  folder: '<path d="M4 8a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/>',
  export: '<path d="M14 3v5h5"/><path d="M19 8L9 18H4V13L14 3z"/><path d="M14 3h5v5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M18 6L6 18M6 6l12 12"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
};
function icon(name, size) {
  return '<svg viewBox="0 0 24 24" width="' + (size || 17) + '" height="' + (size || 17) +
    '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    (ICONS[name] || '') + '</svg>';
}

/* ---------------- 常量 ---------------- */
const CARD_COLORS = ['none', 'yellow', 'pink', 'blue', 'green', 'purple', 'orange', 'gray'];
const COLOR_NAMES = { none: '无', yellow: '黄', pink: '粉', blue: '蓝', green: '绿', purple: '紫', orange: '橙', gray: '灰' };
const MOODS = ['😊', '😄', '😢', '😭', '😡', '😴', '🤒', '❤️', '🎉', '👍', '🤔', '☕'];
const TEXT_COLORS = ['#1f2328', '#e03131', '#c2255c', '#9c36b5', '#1971c2', '#0c8599', '#2f9e44', '#e8590c'];
const HL_COLORS = ['#fff3bf', '#d3f9d8', '#d0ebff', '#ffdeeb', '#ffe8cc', '#e5dbff'];
const FONT_SIZES = [['2', '小'], ['3', '正常'], ['5', '大'], ['6', '特大']];
const FONTS = [['"Microsoft YaHei", sans-serif', '默认'], ['KaiTi, "KaiTi", serif', '楷体'], ['SimHei, sans-serif', '黑体'], ['Consolas, monospace', '等宽']];

const state = {
  notes: [],
  view: 'all',
  tag: null,
  q: '',
  sort: localStorage.getItem('zzrj.sort') || 'updated',
  theme: localStorage.getItem('zzrj.theme') || 'light',
  dataDir: '',
  autoBackup: true,
  editing: null,
  dirty: false,
  saveTimer: null,
  lastRange: null,
  fontSize: parseInt(localStorage.getItem('zzrj.fontSize') || '17', 10),
  connLost: false,
};

/* ---------------- API ---------------- */
async function api(path, opts) {
  opts = opts || {};
  const headers = {};
  if (opts.token !== false) headers['x-token'] = TOKEN;
  let body = opts.body;
  if (body && !(body instanceof Blob)) {
    body = JSON.stringify(body);
    headers['Content-Type'] = 'application/json';
  }
  if (opts.headers) Object.assign(headers, opts.headers);
  const res = await fetch(path, { method: opts.method || 'GET', headers, body });
  if (!res.ok) {
    let msg = res.status + ' 错误';
    try { msg = (await res.json()).error || msg; } catch (e) { /* ignore */ }
    throw new Error(msg);
  }
  const ct = res.headers.get('content-type') || '';
  return ct.indexOf('json') >= 0 ? res.json() : res;
}

/* ---------------- 提示 ---------------- */
let toastTimer = null;
function toast(msg, isErr) {
  const el = $('#toast');
  el.textContent = msg;
  el.className = 'toast' + (isErr ? ' err' : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 2600);
}
function showConnLost() {
  if (state.connLost) return;
  state.connLost = true;
  const d = document.createElement('div');
  d.className = 'conn-lost';
  d.id = 'connLost';
  d.textContent = '与本地服务失去连接，请关闭窗口并重新双击「启动便签日记.vbs」';
  document.body.appendChild(d);
}
function hideConnLost() {
  state.connLost = false;
  const el = $('#connLost');
  if (el) el.remove();
}

/* ---------------- 通用弹窗 ---------------- */
function modal(html, onMount) {
  const root = $('#modalRoot');
  root.innerHTML =
    '<div class="modal-mask" id="modalMask"><div class="modal" role="dialog">' + html + '</div></div>';
  const mask = $('#modalMask');
  mask.addEventListener('mousedown', e => { if (e.target === mask) closeModal(); });
  if (onMount) onMount($('.modal', root));
  return $('.modal', root);
}
function closeModal() { $('#modalRoot').innerHTML = ''; }
function confirmDialog(msg, okText) {
  return new Promise(resolve => {
    modal(
      '<div class="modal-head">请确认</div>' +
      '<div class="modal-body" style="font-size:14px;line-height:1.7;color:var(--text-2)">' + msg + '</div>' +
      '<div class="modal-foot">' +
      '<button class="btn" id="cfNo">取消</button>' +
      '<button class="btn primary" id="cfYes">' + (okText || '确定') + '</button></div>',
      m => {
        $('#cfNo', m).onclick = () => { closeModal(); resolve(false); };
        $('#cfYes', m).onclick = () => { closeModal(); resolve(true); };
      }
    );
  });
}
/* 系统对话框不可用时的兜底：手动输入路径 */
function pathInputModal(title, placeholder, okText) {
  return new Promise(resolve => {
    modal(
      '<div class="modal-head">' + title + '</div>' +
      '<div class="modal-body"><input id="pathInput" class="set-path" style="width:100%;font-family:inherit;font-size:14px;padding:10px 12px" placeholder="' + escapeAttr(placeholder) + '" autocomplete="off"></div>' +
      '<div class="modal-foot"><button class="btn" id="piNo">取消</button><button class="btn primary" id="piYes">' + (okText || '确定') + '</button></div>',
      m => {
        const inp = $('#pathInput', m);
        inp.focus();
        const go = () => { const v = inp.value.trim(); closeModal(); resolve(v); };
        $('#piYes', m).onclick = go;
        $('#piNo', m).onclick = () => { closeModal(); resolve(''); };
        inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
      }
    );
  });
}

/* ---------------- 主题 ---------------- */
function applyTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  $('#btnTheme').innerHTML = icon(state.theme === 'dark' ? 'sun' : 'moon', 18);
  localStorage.setItem('zzrj.theme', state.theme);
}

/* ---------------- 数据加载 / 渲染 ---------------- */
async function loadState() {
  const s = await api('/api/state');
  state.notes = s.notes;
  state.dataDir = s.dataDir;
  state.autoBackup = s.autoBackup;
  renderAll();
}
function renderAll() {
  renderNav();
  renderTagList();
  renderGrid();
}
function counts() {
  const alive = state.notes.filter(n => !n.trashed);
  return {
    all: alive.length,
    pinned: alive.filter(n => n.pinned).length,
    trash: state.notes.filter(n => n.trashed).length,
  };
}
function renderNav() {
  const c = counts();
  $('#cntAll').textContent = c.all;
  $('#cntPinned').textContent = c.pinned;
  $('#cntTrash').textContent = c.trash;
  $$('#nav .nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === state.view));
}
function renderTagList() {
  const box = $('#tagList');
  const map = {};
  state.notes.filter(n => !n.trashed).forEach(n => n.tags.forEach(t => { map[t] = (map[t] || 0) + 1; }));
  const tags = Object.keys(map).sort((a, b) => map[b] - map[a] || a.localeCompare(b, 'zh-Hans-CN'));
  if (!tags.length) {
    box.innerHTML = '<div class="tag-empty">还没有标签</div>';
    return;
  }
  box.innerHTML = tags.map(t =>
    '<button class="tag-chip' + (state.tag === t ? ' active' : '') + '" data-tag="' + escapeAttr(t) + '">#' + escapeHtml(t) +
    ' <span style="opacity:.55">' + map[t] + '</span></button>').join('');
}
function visibleNotes() {
  let arr = state.notes.slice();
  if (state.view === 'trash') arr = arr.filter(n => n.trashed);
  else arr = arr.filter(n => !n.trashed);
  if (state.view === 'pinned') arr = arr.filter(n => n.pinned);
  if (state.tag) arr = arr.filter(n => n.tags.indexOf(state.tag) >= 0);
  if (state.q) {
    const q = state.q.toLowerCase();
    arr = arr.filter(n => (n.title + ' ' + n.preview + ' ' + n.tags.join(' ')).toLowerCase().indexOf(q) >= 0);
  }
  arr.sort((a, b) => {
    if (state.view === 'trash') return (b.trashedAt || 0) - (a.trashedAt || 0);
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (state.sort === 'title') return (a.title || 'zzz').localeCompare(b.title || 'zzz', 'zh-Hans-CN');
    const va = state.sort === 'created' ? a.createdAt : a.updatedAt;
    const vb = state.sort === 'created' ? b.createdAt : b.updatedAt;
    return vb - va;
  });
  return arr;
}
function fmtDate(ts) {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const p = n => String(n).padStart(2, '0');
  if (sameDay) return '今天 ' + p(d.getHours()) + ':' + p(d.getMinutes());
  const y = new Date(now.getTime() - 86400000);
  if (d.toDateString() === y.toDateString()) return '昨天 ' + p(d.getHours()) + ':' + p(d.getMinutes());
  if (d.getFullYear() === now.getFullYear()) return (d.getMonth() + 1) + '月' + d.getDate() + '日';
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}
function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function escapeAttr(s) { return escapeHtml(s).replace(/"/g, '&quot;'); }

function renderGrid() {
  const grid = $('#grid');
  const arr = visibleNotes();
  const isTrash = state.view === 'trash';
  let html = '';
  if (!isTrash && !state.tag) {
    html += '<button class="card card-new" id="cardNew">' + icon('plus', 22) + '<span>新建日志</span></button>';
  }
  html += arr.map(n => cardHtml(n, isTrash)).join('');
  grid.innerHTML = html;
  const empty = $('#emptyState');
  if (!arr.length) {
    empty.classList.remove('hidden');
    $('#emptyText').textContent = isTrash ? '回收站是空的'
      : (state.q || state.tag) ? '没有找到匹配的日志' : '这里还没有日志，开始记录吧';
    $('#btnEmptyNew').style.display = (isTrash || state.q || state.tag) ? 'none' : '';
  } else {
    empty.classList.add('hidden');
  }
}
function cardHtml(n, isTrash) {
  const media = [];
  if (n.media.images) media.push('<span>' + icon('image', 13) + n.media.images + '</span>');
  if (n.media.videos) media.push('<span>' + icon('video', 13) + n.media.videos + '</span>');
  if (n.media.audios) media.push('<span>' + icon('audio', 13) + n.media.audios + '</span>');
  return '<div class="card c-' + n.color + (n.pinned && !isTrash ? ' pinned' : '') + '" data-id="' + n.id + '">' +
    (n.pinned && !isTrash ? '<div class="card-pin">📌</div>' : '') +
    '<button class="card-menu" data-menu="' + n.id + '" title="更多">' +
      '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>' +
    '</button>' +
    (n.cover ? '<div class="card-cover"><img src="' + escapeAttr(n.cover) + '" loading="lazy" alt=""></div>' : '') +
    '<div class="card-title' + (n.title ? '' : ' untitled') + '">' + (n.title ? escapeHtml(n.title) : '无标题') + '</div>' +
    (n.preview ? '<div class="card-snippet">' + escapeHtml(n.preview) + '</div>' : '') +
    (media.length ? '<div class="card-media">' + media.join('') + '</div>' : '') +
    '<div class="card-footer">' +
      '<span class="card-date">' + fmtDate(isTrash && n.trashedAt ? n.trashedAt : n.updatedAt) + '</span>' +
      (n.mood ? '<span class="card-mood">' + n.mood + '</span>' : '') +
      '<span class="card-tags">' + n.tags.slice(0, 2).map(t => '<span class="card-tag">#' + escapeHtml(t) + '</span>').join('') + '</span>' +
    '</div>' +
  '</div>';
}

/* ---------------- 下拉菜单 ---------------- */
let openDropdown = null;
function closeDropdown() {
  if (openDropdown) { openDropdown.remove(); openDropdown = null; }
}
function showDropdown(anchorEl, buildFn) {
  closeDropdown();
  const d = document.createElement('div');
  d.className = 'dropdown';
  d.innerHTML = typeof buildFn === 'function' ? buildFn() : buildFn;
  document.body.appendChild(d);
  const r = anchorEl.getBoundingClientRect();
  const dw = d.offsetWidth, dh = d.offsetHeight;
  let left = Math.min(r.right - dw, window.innerWidth - dw - 10);
  left = Math.max(10, left);
  let top = r.bottom + 6;
  if (top + dh > window.innerHeight - 10) top = r.top - dh - 6;
  d.style.left = left + 'px';
  d.style.top = Math.max(10, top) + 'px';
  openDropdown = d;
  return d;
}
document.addEventListener('mousedown', e => {
  if (openDropdown && !openDropdown.contains(e.target) && !e.target.closest('[data-menu]')) closeDropdown();
});

/* ---------------- 卡片操作 ---------------- */
function getNote(id) { return state.notes.find(n => n.id === id); }
function refreshNote(updated) {
  const i = state.notes.findIndex(n => n.id === updated.id);
  if (i >= 0) state.notes[i] = updated;
  renderAll();
}
function cardMenuHtml(n) {
  const isTrash = !!n.trashed;
  let html = '';
  if (isTrash) {
    html += '<button class="dropdown-item" data-act="restore">' + icon('restore', 15) + '恢复日志</button>' +
            '<div class="dropdown-sep"></div>' +
            '<button class="dropdown-item danger" data-act="delete">' + icon('trash', 15) + '彻底删除</button>';
  } else {
    html += '<button class="dropdown-item" data-act="pin">' + icon('pin', 15) + (n.pinned ? '取消置顶' : '置顶') + '</button>' +
            '<button class="dropdown-item" data-act="export">' + icon('export', 15) + '导出为 HTML</button>' +
            '<div class="dropdown-sep"></div>' +
            '<div class="dropdown-label">卡片颜色</div>' +
            '<div class="color-dots">' + CARD_COLORS.map(c =>
              '<button class="color-dot d-' + c + (n.color === c ? ' active' : '') + '" data-color="' + c + '" title="' + COLOR_NAMES[c] + '"></button>').join('') +
            '</div>' +
            '<div class="dropdown-sep"></div>' +
            '<button class="dropdown-item danger" data-act="trash">' + icon('trash', 15) + '移到回收站</button>';
  }
  return html;
}
async function cardMenuAction(id, act, val) {
  const n = getNote(id);
  if (!n) return;
  try {
    if (act === 'pin') {
      const r = await api('/api/notes/' + id, { method: 'PUT', body: { pinned: !n.pinned } });
      refreshNote(r.note);
    } else if (act === 'color') {
      const r = await api('/api/notes/' + id, { method: 'PUT', body: { color: val } });
      refreshNote(r.note);
    } else if (act === 'trash') {
      await api('/api/notes/' + id, { method: 'DELETE' });
      const i = state.notes.findIndex(x => x.id === id);
      if (i >= 0) { state.notes[i] = Object.assign({}, state.notes[i], { trashed: true, trashedAt: Date.now() }); }
      renderAll();
      toast('已移到回收站');
    } else if (act === 'restore') {
      const r = await api('/api/notes/' + id + '/restore', { method: 'POST' });
      refreshNote(r.note);
      toast('已恢复');
    } else if (act === 'delete') {
      const ok = await confirmDialog('彻底删除后无法恢复，确定删除「' + (n.title || '无标题') + '」吗？', '彻底删除');
      if (!ok) return;
      await api('/api/notes/' + id + '?permanent=1', { method: 'DELETE' });
      state.notes = state.notes.filter(x => x.id !== id);
      renderAll();
      toast('已彻底删除');
    } else if (act === 'export') {
      /* 优先服务端保存到桌面；失败时退回浏览器下载（普通浏览器可用） */
      try {
        const r = await api('/api/export/' + id + '?save=1');
        toast('已保存到桌面：' + r.savedPath);
      } catch (e) {
        const res = await api('/api/export/' + id);
        downloadBlob(await res.blob(), (n.title || '无标题日志') + '.html');
        toast('已导出 HTML 文件（浏览器下载）');
      }
    }
  } catch (e) { toast(e.message, true); }
}
function downloadBlob(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

/* ---------------- 编辑器 ---------------- */
function applyFontSize() {
  document.documentElement.style.setProperty('--editor-font', state.fontSize + 'px');
  localStorage.setItem('zzrj.fontSize', String(state.fontSize));
}
function updateEmpty() {
  const c = $('#editorContent');
  const empty = !c.textContent.trim() && !c.querySelector('img,video,audio,hr');
  c.classList.toggle('is-empty', empty);
}
function updateWordCount() {
  const text = $('#editorContent').textContent || '';
  const n = text.replace(/\s/g, '').length;
  $('#wordCount').textContent = n + ' 字';
}
function updateStatusbar() {
  const n = state.editing;
  if (!n) return;
  const imgs = (n.content.match(/<img\b/gi) || []).length;
  const vids = (n.content.match(/<video\b/gi) || []).length;
  const auds = (n.content.match(/<audio\b/gi) || []).length;
  $('#editorStatus').innerHTML =
    '<span>创建于 ' + new Date(n.createdAt).toLocaleString('zh-CN') + '</span>' +
    '<span>更新于 ' + new Date(n.updatedAt).toLocaleString('zh-CN') + '</span>' +
    (imgs ? '<span>' + imgs + ' 张图片</span>' : '') +
    (vids ? '<span>' + vids + ' 个视频</span>' : '') +
    (auds ? '<span>' + auds + ' 个音频</span>' : '');
}
function renderMeta() {
  const n = state.editing;
  // 标签
  const tb = $('#tagBox');
  tb.innerHTML = n.tags.map((t, i) =>
    '<span class="tag-pill">#' + escapeHtml(t) +
    '<button data-rmtag="' + i + '" title="移除">' +
    '<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
    '</button></span>').join('') +
    '<input class="tag-input" id="tagInput" placeholder="添加标签，回车确认" maxlength="20">';
  $('#tagInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const v = e.target.value.trim();
      if (!v) return;
      if (!n.tags.includes(v) && n.tags.length < 20) n.tags.push(v);
      e.target.value = '';
      renderMeta();
      onEditorInput();
    } else if (e.key === 'Backspace' && !e.target.value && n.tags.length) {
      n.tags.pop();
      renderMeta();
      onEditorInput();
    }
  });
  // 心情
  $('#moodBox').innerHTML = MOODS.map(m =>
    '<button class="mood-btn' + (n.mood === m ? ' active' : '') + '" data-mood="' + m + '" title="心情">' + m + '</button>').join('');
  // 颜色
  $('#colorBox').innerHTML = CARD_COLORS.map(c =>
    '<button class="color-btn d-' + c + (n.color === c ? ' active' : '') + '" data-color="' + c + '" title="' + COLOR_NAMES[c] + '"></button>').join('');
}
function setNoteColor(color) {
  const n = state.editing;
  if (!n || n.color === color) return;
  n.color = color;
  $$('#colorBox .color-btn').forEach(b => b.classList.toggle('active', b.dataset.color === color));
  onEditorInput();
}
async function openEditor(id) {
  await flushSave();
  stopAllMedia(); // 旧日志里可能还有没停的视频/声音，先停掉再换内容
  let full;
  try {
    full = (await api('/api/notes/' + id)).note;
  } catch (e) { toast(e.message, true); return; }
  state.editing = full;
  state.dirty = false;
  $('#editorTitle').value = full.title || '';
  $('#editorContent').innerHTML = full.content || '';
  renderMeta();
  updateEmpty();
  updateWordCount();
  updateStatusbar();
  setSaveStatus('saved');
  $('#editor').classList.remove('hidden');
  closeSidebar();
  // 光标放到末尾
  const c = $('#editorContent');
  c.focus();
  const range = document.createRange();
  range.selectNodeContents(c);
  range.collapse(false);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  // 后台给没有封面的老视频补生成封面（不阻塞编辑器打开）
  setTimeout(() => backfillVideoPosters(id), 400);
}
/* 暂停编辑器里所有音视频（退出/切换日志时调用）。
   编辑器是「隐藏」而非「移除」，不显式 pause 的话视频声音会一直在后台放。 */
function stopAllMedia() {
  const els = document.querySelectorAll('#editorContent video, #editorContent audio');
  for (const el of els) {
    try { el.pause(); } catch (e) { /* ignore */ }
  }
}
/* 确保编辑器末尾有一个空段落，返回它；不需要处理时返回 null。
   contenteditable 里最后一个元素是 video/audio 等媒体时，浏览器无法在它下方放置光标
   （表现为「视频下方打不了字」「先放视频就彻底没法编辑」）。 */
function ensureTrailingParagraph() {
  const c = $('#editorContent');
  const last = c.lastElementChild;
  if (!last) return null;                        // 空编辑器，浏览器自己可以处理
  const endsWithMedia = last.tagName === 'VIDEO' || last.tagName === 'AUDIO' ||
    (last.tagName === 'P' && last.querySelector('video,audio') && !last.textContent.trim());
  if (!endsWithMedia) return null;               // 末尾是普通文本行，浏览器自己能处理
  if (last.tagName === 'P' && !last.textContent.trim() && !last.querySelector('img,video,audio,hr')) {
    return last;                                 // 末尾已是空行，复用
  }
  const p = document.createElement('p');
  p.appendChild(document.createElement('br'));
  c.appendChild(p);
  return p;
}
/* 把光标移入指定段落末尾（不传则移入编辑器最后一个块） */
function focusParagraph(p) {
  const c = $('#editorContent');
  const target = p || c.lastElementChild || c;
  const range = document.createRange();
  range.selectNodeContents(target);
  range.collapse(false);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  c.focus();
}
function closeEditor() {
  flushSave();
  stopAllMedia();
  $('#editor').classList.add('hidden');
  state.editing = null;
  state.dirty = false;
}
function setSaveStatus(st) {
  const el = $('#saveStatus');
  if (st === 'saving') { el.textContent = '保存中…'; el.className = 'save-status saving'; }
  else if (st === 'dirty') { el.textContent = '未保存'; el.className = 'save-status'; }
  else {
    const d = new Date();
    const p = n => String(n).padStart(2, '0');
    el.textContent = '已保存 · ' + p(d.getHours()) + ':' + p(d.getMinutes());
    el.className = 'save-status';
  }
}
function onEditorInput() {
  if (!state.editing) return;
  state.dirty = true;
  setSaveStatus('dirty');
  updateEmpty();
  updateWordCount();
  clearTimeout(state.saveTimer);
  state.saveTimer = setTimeout(flushSave, 900);
}
async function flushSave() {
  clearTimeout(state.saveTimer);
  if (!state.editing || !state.dirty) return;
  const n = state.editing;
  n.title = $('#editorTitle').value;
  n.content = $('#editorContent').innerHTML;
  setSaveStatus('saving');
  try {
    const r = await api('/api/notes/' + n.id, { method: 'PUT', body: n });
    Object.assign(n, r.note);
    state.dirty = false;
    setSaveStatus('saved');
    const i = state.notes.findIndex(x => x.id === n.id);
    if (i >= 0) state.notes[i] = r.note;
    renderNav(); renderTagList(); renderGrid();
    updateStatusbar();
  } catch (e) {
    setSaveStatus('dirty');
    toast('保存失败: ' + e.message, true);
  }
}
async function createNote() {
  try {
    const r = await api('/api/notes', { method: 'POST' });
    state.notes.unshift(r.note);
    renderAll();
    await openEditor(r.note.id);
  } catch (e) { toast(e.message, true); }
}
/* 拖入文件但没开日志时：自动新建一篇并把媒体放进去 */
async function createNoteWithMedia(files) {
  try {
    const r = await api('/api/notes', { method: 'POST' });
    state.notes.unshift(r.note);
    renderAll();
    await openEditor(r.note.id);
    for (const f of files) {
      await uploadAndInsert(f);
    }
  } catch (e) { toast(e.message, true); }
}

/* ---------------- 富文本工具栏 ---------------- */
const TOOLBAR = [
  [
    { cmd: 'undo', icon: 'undo', title: '撤销 (Ctrl+Z)' },
    { cmd: 'redo', icon: 'redo', title: '重做 (Ctrl+Y)' },
  ],
  [
    { cmd: 'bold', icon: 'bold', cls: 'b', title: '加粗 (Ctrl+B)' },
    { cmd: 'italic', icon: 'italic', cls: 'i', title: '斜体 (Ctrl+I)' },
    { cmd: 'underline', icon: 'underline', cls: 'u', title: '下划线 (Ctrl+U)' },
    { cmd: 'strikeThrough', icon: 'strike', cls: 's', title: '删除线' },
  ],
  [
    { pop: 'color', icon: 'palette', title: '文字颜色' },
    { pop: 'highlight', icon: 'highlight', title: '荧光笔' },
  ],
  [
    { pop: 'size', label: '字号', title: '字号' },
    { pop: 'font', label: '字体', title: '字体' },
  ],
  [
    { cmd: 'insertUnorderedList', icon: 'ul', title: '无序列表' },
    { cmd: 'insertOrderedList', icon: 'ol', title: '有序列表' },
    { cmd: 'formatBlock', value: 'blockquote', icon: 'quote', title: '引用' },
    { cmd: 'formatBlock', value: 'pre', icon: 'code', title: '代码块' },
    { cmd: 'insertHorizontalRule', icon: 'hr', title: '分割线' },
  ],
  [
    { cmd: 'justifyLeft', icon: 'alignL', title: '左对齐' },
    { cmd: 'justifyCenter', icon: 'alignC', title: '居中对齐' },
    { cmd: 'justifyRight', icon: 'alignR', title: '右对齐' },
  ],
  [
    { action: 'image', icon: 'image', title: '插入图片' },
    { action: 'video', icon: 'video', title: '插入视频' },
    { action: 'audio', icon: 'audio', title: '插入音频' },
    { action: 'link', icon: 'link', title: '插入链接' },
  ],
  [
    { cmd: 'removeFormat', icon: 'eraser', title: '清除格式' },
  ],
];
function renderToolbar() {
  const bar = $('#toolbar');
  bar.innerHTML = TOOLBAR.map(group =>
    group.map(b => {
      if (b.pop) return '<button class="tb-btn" data-pop="' + b.pop + '" title="' + b.title + '">' + (b.icon ? icon(b.icon) : escapeHtml(b.label)) + '</button>';
      if (b.action) return '<button class="tb-btn" data-action="' + b.action + '" title="' + b.title + '">' + icon(b.icon) + '</button>';
      return '<button class="tb-btn' + (b.cls ? ' ' + b.cls : '') + '" data-cmd="' + b.cmd + '"' +
        (b.value ? ' data-value="' + b.value + '"' : '') + ' title="' + b.title + '">' + icon(b.icon) + '</button>';
    }).join('')
  ).join('<div class="tb-sep"></div>');
}
function execCmd(cmd, value) {
  $('#editorContent').focus();
  restoreSelection();
  try { document.execCommand(cmd, false, value || null); } catch (e) { /* ignore */ }
  onEditorInput();
}
function popoverHtml(kind) {
  if (kind === 'color') {
    return '<div class="dropdown-label">文字颜色</div><div class="color-dots">' +
      TEXT_COLORS.map(c => '<button class="color-dot" style="background:' + c + '" data-tcolor="' + c + '"></button>').join('') +
      '<button class="color-dot d-none" data-tcolor="inherit" title="默认颜色"></button></div>';
  }
  if (kind === 'highlight') {
    return '<div class="dropdown-label">荧光笔</div><div class="color-dots">' +
      HL_COLORS.map(c => '<button class="color-dot" style="background:' + c + '" data-hlcolor="' + c + '"></button>').join('') +
      '<button class="color-dot d-none" data-hlcolor="transparent" title="清除荧光"></button></div>';
  }
  if (kind === 'size') {
    return FONT_SIZES.map(s => '<button class="dropdown-item" data-size="' + s[0] + '">' + s[1] + '</button>').join('');
  }
  if (kind === 'font') {
    return FONTS.map(f => '<button class="dropdown-item" data-font="' + escapeAttr(f[0]) + '">' + f[1] + '</button>').join('');
  }
  return '';
}
function showPopover(kind, anchorEl) {
  const d = showDropdown(anchorEl, popoverHtml(kind));
  d.addEventListener('click', e => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.tcolor) {
      try { document.execCommand('styleWithCSS', false, true); } catch (err) { /* ignore */ }
      execCmd('foreColor', t.dataset.tcolor === 'inherit' ? '#1f2328' : t.dataset.tcolor);
      closeDropdown();
    } else if (t.dataset.hlcolor) {
      try { document.execCommand('styleWithCSS', false, true); } catch (err) { /* ignore */ }
      execCmd('hiliteColor', t.dataset.hlcolor);
      closeDropdown();
    } else if (t.dataset.size) {
      execCmd('fontSize', t.dataset.size);
      closeDropdown();
    } else if (t.dataset.font) {
      execCmd('fontName', t.dataset.font.replace(/"/g, "'"));
      closeDropdown();
    }
  });
}

/* ---------------- 媒体插入 ---------------- */
function pickFile(accept) {
  return new Promise(resolve => {
    const fp = $('#filePicker');
    fp.accept = accept;
    fp.value = '';
    fp.onchange = () => { resolve(fp.files && fp.files[0]); fp.onchange = null; };
    fp.click();
  });
}
async function uploadAndInsert(file) {
  const n = state.editing;
  if (!n) return;
  if (!/^(image|video|audio)\//.test(file.type)) { toast('不支持的文件类型', true); return; }
  if (file.size > 200 * 1024 * 1024) { toast('文件超过 200MB', true); return; }
  const statusEl = $('#saveStatus');
  statusEl.textContent = '上传中 ' + Math.round(file.size / 1024) + 'KB…';
  statusEl.className = 'save-status saving';
  try {
    const r = await api('/api/notes/' + n.id + '/media', {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type || 'application/octet-stream', 'x-filename': encodeURIComponent(file.name) },
    });
    let html;
    if (file.type.indexOf('video/') === 0) html = '<p><video controls src="' + r.url + '"></video></p>';
    else if (file.type.indexOf('audio/') === 0) html = '<p><audio controls src="' + r.url + '"></audio></p>';
    else html = '<p><img src="' + r.url + '" alt=""></p>';
    restoreSelection();
    document.execCommand('insertHTML', false, html);
    onEditorInput();
    setSaveStatus('dirty');
    if (file.type.indexOf('video/') === 0 || file.type.indexOf('audio/') === 0) {
      // 媒体落在内容末尾时，补一个空段落并把光标放进去：
      // contenteditable 里最后一个元素是 video/audio 时，浏览器无法在它下方放置光标，
      // 不补就会出现「视频下方打不了字」「先放视频就彻底没法编辑」
      const inserted = Array.from(document.querySelectorAll('#editorContent video, #editorContent audio'))
        .filter(el => el.getAttribute('src') === r.url).pop();
      if (inserted) {
        const block = inserted.closest('p') || inserted;
        if (block === $('#editorContent').lastElementChild) {
          const tp = ensureTrailingParagraph();
          if (tp) focusParagraph(tp);
        }
      }
    }
    if (file.type.indexOf('video/') === 0) {
      // 后台生成视频封面（截帧 → 上传 → 写回 poster），不阻塞插入
      const el = Array.from(document.querySelectorAll('#editorContent video'))
        .find(v => v.getAttribute('src') === r.url);
      if (el) attachVideoPoster(el, n.id);
    }
  } catch (e) {
    toast('上传失败: ' + e.message, true);
    setSaveStatus('dirty');
  }
}

/* ---------------- 视频封面（浏览器端截帧，零服务端依赖） ----------------
   便携版不装 ffmpeg，改用浏览器自身解码视频：隐藏 <video>  seek 到中点前一秒，
   canvas 抓帧转 JPEG。src 可以是 /media/... 地址；失败/超时返回 null，不阻塞主流程。 */
function makeVideoPoster(src, timeoutMs) {
  return new Promise(resolve => {
    let done = false;
    const finish = blob => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      try { URL.revokeObjectURL(v.src); } catch (e) { /* 非 blob 地址时忽略 */ }
      resolve(blob);
    };
    const v = document.createElement('video');
    v.muted = true;
    v.preload = 'metadata';
    const timer = setTimeout(() => finish(null), timeoutMs || 10000);
    v.onloadedmetadata = () => {
      try { v.currentTime = Math.min(1, (v.duration || 2) / 3); }
      catch (e) { finish(null); }
    };
    v.onseeked = () => {
      try {
        const w = v.videoWidth, h = v.videoHeight;
        if (!w || !h) { finish(null); return; }
        const scale = Math.min(1, 720 / Math.max(w, h));
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(w * scale));
        c.height = Math.max(1, Math.round(h * scale));
        c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
        c.toBlob(b => finish(b || null), 'image/jpeg', 0.72);
      } catch (e) { finish(null); }
    };
    v.onerror = () => finish(null);
    v.src = src;
  });
}

/* 给一个 <video> 元素生成并上传封面，成功后把 poster 写回标签并触发保存 */
const posterBusy = new WeakSet(); // 防止同一视频被重复截帧
async function attachVideoPoster(videoEl, noteId) {
  if (!videoEl || videoEl.getAttribute('poster') || posterBusy.has(videoEl)) return;
  const src = videoEl.getAttribute('src') || '';
  if (!src) return;
  posterBusy.add(videoEl);
  const blob = await makeVideoPoster(src, 10000);
  if (!blob) { posterBusy.delete(videoEl); return; }
  // 等待期间用户可能已关闭/切换日志，这里重新校验
  if (!state.editing || state.editing.id !== noteId) { posterBusy.delete(videoEl); return; }
  try {
    const r = await api('/api/notes/' + noteId + '/media', {
      method: 'PUT',
      body: blob,
      headers: { 'Content-Type': 'image/jpeg', 'x-filename': encodeURIComponent('封面_' + Date.now() + '.jpg') },
    });
    if (!state.editing || state.editing.id !== noteId) return;
    if (!videoEl.isConnected) return;
    videoEl.setAttribute('poster', r.url);
    onEditorInput(); // 标记未保存，自动保存会带上新的 poster
  } catch (e) { console.warn('封面上传失败', e); }
  finally { posterBusy.delete(videoEl); }
}

/* 打开日志时给没有封面的老视频补生成（后台逐个进行，不阻塞编辑器） */
async function backfillVideoPosters(noteId) {
  const vids = Array.from(document.querySelectorAll('#editorContent video'))
    .filter(v => !v.getAttribute('poster') && v.getAttribute('src'))
    .slice(0, 5);
  for (const v of vids) {
    if (!state.editing || state.editing.id !== noteId) return;
    await attachVideoPoster(v, noteId);
  }
}
function saveSelection() {
  const sel = window.getSelection();
  if (sel.rangeCount && $('#editorContent').contains(sel.anchorNode)) {
    state.lastRange = sel.getRangeAt(0).cloneRange();
  }
}
function restoreSelection() {
  const c = $('#editorContent');
  c.focus();
  const sel = window.getSelection();
  sel.removeAllRanges();
  if (state.lastRange && c.contains(state.lastRange.commonAncestorContainer)) {
    sel.addRange(state.lastRange);
  } else {
    // 没有有效选区记录时，光标放到内容末尾
    const range = document.createRange();
    range.selectNodeContents(c);
    range.collapse(false);
    sel.addRange(range);
    state.lastRange = range.cloneRange();
  }
}
function linkDialog() {
  modal(
    '<div class="modal-head">插入链接</div>' +
    '<div class="modal-body"><input id="linkUrl" class="set-path" style="width:100%;font-family:inherit;font-size:14px;padding:10px 12px" placeholder="https://…" autocomplete="off"></div>' +
    '<div class="modal-foot"><button class="btn" id="lkNo">取消</button><button class="btn primary" id="lkYes">插入</button></div>',
    m => {
      const inp = $('#linkUrl', m);
      inp.focus();
      const go = () => {
        let url = inp.value.trim();
        if (!url) { closeModal(); return; }
        if (!/^[a-z]+:/i.test(url)) url = 'https://' + url;
        closeModal();
        restoreSelection();
        const sel = window.getSelection();
        if (sel.isCollapsed) {
          document.execCommand('insertHTML', false, '<a href="' + escapeAttr(url) + '" target="_blank">' + escapeHtml(url) + '</a>');
        } else {
          document.execCommand('createLink', false, url);
        }
        onEditorInput();
      };
      $('#lkYes', m).onclick = go;
      $('#lkNo', m).onclick = closeModal;
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    }
  );
}

/* ---------------- 设置 ---------------- */
function fmtSize(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}
async function openSettings() {
  await flushSave();
  let backups = [];
  try { backups = (await api('/api/backups')).backups; } catch (e) { /* ignore */ }
  const m = modal(
    '<div class="modal-head">设置' +
      '<button class="icon-btn" id="setClose">' + icon('x', 18) + '</button></div>' +
    '<div class="modal-body">' +
      '<div class="set-row"><div class="set-info">' +
        '<div class="set-title">数据存储位置</div>' +
        '<div class="set-desc">所有日志与媒体都保存在这个文件夹里，可随时更改或迁移到 U 盘 / 移动硬盘。</div>' +
        '<div class="set-path" style="margin-top:8px">' + escapeHtml(state.dataDir) + '</div>' +
        '<div class="set-actions" style="margin-top:10px">' +
          '<button class="btn sm" id="btnChangeDir">更改位置…</button>' +
          '<button class="btn sm" id="btnOpenDir">打开数据文件夹</button>' +
          '<button class="btn sm" id="btnOpenAppDir">打开程序文件夹</button>' +
        '</div>' +
      '</div></div>' +
      '<div class="set-row"><div class="set-info">' +
        '<div class="set-title">自动备份</div>' +
        '<div class="set-desc">每天首次打开时自动创建一份完整备份（保存在数据文件夹的 backups 里）</div>' +
      '</div>' +
      '<label class="switch"><input type="checkbox" id="ckAutoBk"' + (state.autoBackup ? ' checked' : '') + '><span class="sl"></span></label></div>' +
      '<div class="set-row"><div class="set-info">' +
        '<div class="set-title">备份管理</div>' +
        '<div class="set-desc">备份为 ZIP 文件，换电脑时选择下面的 ZIP「恢复」即可完整迁移（含图片视频）。</div>' +
        '<div class="set-actions" style="margin-top:10px">' +
          '<button class="btn sm primary" id="btnBackupNow">立即备份</button>' +
          '<button class="btn sm" id="btnImport">从 ZIP 导入…</button>' +
        '</div>' +
        '<div id="bkList" style="margin-top:12px">' + backupTableHtml(backups) + '</div>' +
      '</div></div>' +
      '<div class="set-row"><div class="set-info">' +
        '<div class="set-title">外观</div>' +
        '<div class="set-desc">深色主题更适合夜间记录</div>' +
      '</div>' +
      '<button class="btn sm" id="btnThemeSet">切换到' + (state.theme === 'dark' ? '浅色' : '深色') + '主题</button></div>' +
      '<div class="set-row"><div class="set-info">' +
        '<div class="set-title">退出程序</div>' +
        '<div class="set-desc">关闭本地服务并退出（数据已自动保存）</div>' +
      '</div>' +
      '<button class="btn sm danger" id="btnExit">退出</button></div>' +
    '</div>'
  );
  $('#setClose', m).onclick = closeModal;

  $('#btnOpenDir', m).onclick = async () => {
    try { await api('/api/open-dir', { method: 'POST', body: { dir: 'data' } }); } catch (e) { toast(e.message, true); }
  };
  $('#btnOpenAppDir', m).onclick = async () => {
    try { await api('/api/open-dir', { method: 'POST', body: { dir: 'app' } }); } catch (e) { toast(e.message, true); }
  };
  $('#btnChangeDir', m).onclick = async () => {
    let p = '';
    try { p = (await api('/api/dialog/folder', { method: 'POST' })).path; }
    catch (e) {
      p = await pathInputModal('系统对话框不可用，请手动输入数据文件夹路径', '例如：D:\\我的日志', '使用这个路径');
      if (!p) return;
    }
    if (!p) return;
    const ok = await confirmDialog('将把数据存储位置更改为：<div class="set-path" style="margin-top:8px">' + escapeHtml(p) +
      '</div><div style="margin-top:8px">是否同时把现有日志复制过去？（选「取消」则只切换位置，不复制数据）</div>', '切换并复制');
    try {
      const r = await api('/api/data-dir', { method: 'POST', body: { path: p, copy: ok } });
      state.dataDir = r.dataDir;
      toast('数据位置已更改' + (r.copied ? '，已迁移 ' + r.copied + ' 条日志' : ''));
      closeModal();
      loadState();
    } catch (e) { toast(e.message, true); }
  };
  $('#ckAutoBk', m).onchange = async e => {
    try {
      await api('/api/settings', { method: 'POST', body: { autoBackup: e.target.checked } });
      state.autoBackup = e.target.checked;
      toast(e.target.checked ? '已开启自动备份' : '已关闭自动备份');
    } catch (err) { toast(err.message, true); }
  };
  $('#btnBackupNow', m).onclick = async e => {
    const btn = e.currentTarget;
    btn.textContent = '备份中…';
    btn.disabled = true;
    try {
      const r = await api('/api/backups', { method: 'POST' });
      $('#bkList', m).innerHTML = backupTableHtml(r.backups);
      toast('已创建备份: ' + r.name);
    } catch (err) { toast('备份失败: ' + err.message, true); }
    btn.textContent = '立即备份';
    btn.disabled = false;
  };
  $('#btnImport', m).onclick = async () => {
    let p = '';
    try { p = (await api('/api/dialog/file', { method: 'POST' })).path; }
    catch (e) {
      p = await pathInputModal('系统对话框不可用，请手动输入 ZIP 备份文件路径', '例如：D:\\备份\\便签日记备份_20261024.zip', '开始导入');
      if (!p) return;
    }
    if (!p) return;
    const ok = await confirmDialog('将从以下 ZIP 导入日志（已存在的同名日志会自动改名保留，不会覆盖）：<div class="set-path" style="margin-top:8px">' + escapeHtml(p) + '</div>', '开始导入');
    if (!ok) return;
    try {
      const r = await api('/api/import', { method: 'POST', body: { path: p } });
      state.notes = r.notes;
      renderAll();
      closeModal();
      toast('导入完成：新增 ' + r.result.imported + ' 条' + (r.result.renamed ? '（' + r.result.renamed + ' 条重名自动改名）' : ''));
    } catch (err) { toast('导入失败: ' + err.message, true); }
  };
  $('#btnThemeSet', m).onclick = () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme();
    $('#btnThemeSet', m).textContent = '切换到' + (state.theme === 'dark' ? '浅色' : '深色') + '主题';
  };
  $('#btnExit', m).onclick = async () => {
    const ok = await confirmDialog('确定退出便签日记吗？数据已自动保存。', '退出');
    if (!ok) return;
    try { await api('/api/shutdown', { method: 'POST' }); } catch (e) { /* ignore */ }
    document.body.innerHTML = '<div style="height:100vh;display:flex;flex-direction:column;gap:10px;align-items:center;justify-content:center;color:var(--muted)">' +
      '<div style="font-size:40px">📒</div><div>便签日记已退出，可以关闭这个窗口了</div></div>';
    setTimeout(() => { try { window.close(); } catch (e) { /* ignore */ } }, 800);
  };
}
function backupTableHtml(backups) {
  if (!backups.length) return '<div class="bk-empty">还没有备份，建议先「立即备份」一份</div>';
  return '<table class="bk-table"><thead><tr><th>备份文件</th><th>大小</th><th>时间</th><th style="text-align:right">操作</th></tr></thead><tbody>' +
    backups.map(b =>
      '<tr><td style="word-break:break-all">' + escapeHtml(b.name) + '</td>' +
      '<td style="white-space:nowrap">' + fmtSize(b.size) + '</td>' +
      '<td style="white-space:nowrap">' + new Date(b.mtime).toLocaleString('zh-CN') + '</td>' +
      '<td><div class="bk-actions">' +
      '<button class="btn sm" data-bkdown="' + escapeAttr(b.name) + '">下载</button>' +
      '<button class="btn sm" data-bkrestore="' + escapeAttr(b.name) + '">恢复</button>' +
      '<button class="btn sm danger" data-bkdel="' + escapeAttr(b.name) + '">删除</button>' +
      '</div></td></tr>').join('') +
    '</tbody></table>';
}
async function backupAction(act, name) {
  try {
    if (act === 'down') {
      /* 服务端直接保存到桌面（Edge app 模式下浏览器下载只会生成 0 字节文件） */
      try {
        const r = await api('/api/backups/' + encodeURIComponent(name) + '/save', { method: 'POST' });
        toast('已保存到桌面：' + r.savedPath);
      } catch (e) {
        await api('/api/open-dir', { method: 'POST', body: { dir: 'backups' } });
        toast('保存到桌面失败（' + e.message + '），已打开备份文件夹，请手动复制', true);
      }
    } else if (act === 'del') {
      const ok = await confirmDialog('确定删除备份「' + escapeHtml(name) + '」吗？', '删除');
      if (!ok) return;
      const r = await api('/api/backups/' + encodeURIComponent(name), { method: 'DELETE' });
      toast('备份已删除');
      refreshBackupList(r.backups);
    } else if (act === 'restore') {
      const zipPath = state.dataDir + '\\backups\\' + name;
      const ok = await confirmDialog('将用备份「' + escapeHtml(name) + '」恢复日志（已存在的同名日志会自动改名保留，不会覆盖）。', '开始恢复');
      if (!ok) return;
      const r = await api('/api/import', { method: 'POST', body: { path: zipPath } });
      state.notes = r.notes;
      renderAll();
      closeModal();
      toast('恢复完成：新增 ' + r.result.imported + ' 条');
    }
  } catch (e) { toast(e.message, true); }
}
function refreshBackupList(backups) {
  const box = $('#bkList');
  if (box) box.innerHTML = backupTableHtml(backups);
}

/* ---------------- 侧边栏（移动端） ---------------- */
function closeSidebar() { $('#sidebar').classList.remove('open'); }

/* ---------------- 事件绑定 ---------------- */
function bindEvents() {
  $('#btnNew').addEventListener('click', createNote);
  $('#btnEmptyNew').addEventListener('click', createNote);
  $('#btnSidebarClose').addEventListener('click', closeSidebar);
  $('#sidebarMask').addEventListener('click', closeSidebar);
  $('#btnTheme').addEventListener('click', () => { state.theme = state.theme === 'dark' ? 'light' : 'dark'; applyTheme(); });
  $('#btnSettings').addEventListener('click', openSettings);
  $('#btnMenu').addEventListener('click', () => $('#sidebar').classList.toggle('open'));

  $('#nav').addEventListener('click', e => {
    const b = e.target.closest('.nav-item');
    if (!b) return;
    state.view = b.dataset.view;
    state.tag = null;
    renderAll();
    closeSidebar();
  });
  $('#tagList').addEventListener('click', e => {
    const b = e.target.closest('.tag-chip');
    if (!b) return;
    const t = b.dataset.tag;
    state.tag = state.tag === t ? null : t;
    renderTagList();
    renderGrid();
  });

  let searchTimer = null;
  $('#searchInput').addEventListener('input', e => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { state.q = e.target.value.trim(); renderGrid(); }, 160);
  });
  $('#sortSelect').addEventListener('change', e => {
    state.sort = e.target.value;
    localStorage.setItem('zzrj.sort', state.sort);
    renderGrid();
  });

  /* 卡片区 */
  $('#grid').addEventListener('click', async e => {
    const menuBtn = e.target.closest('[data-menu]');
    if (menuBtn) {
      e.stopPropagation();
      const id = menuBtn.dataset.menu;
      const n = getNote(id);
      if (!n) return;
      const d = showDropdown(menuBtn, cardMenuHtml(n));
      d.addEventListener('click', async ev => {
        const t = ev.target.closest('button');
        if (!t) return;
        if (t.dataset.act) { closeDropdown(); await cardMenuAction(id, t.dataset.act); }
        else if (t.dataset.color) { await cardMenuAction(id, 'color', t.dataset.color); closeDropdown(); }
      });
      return;
    }
    if (e.target.closest('#cardNew')) { createNote(); return; }
    const card = e.target.closest('.card[data-id]');
    if (card) openEditor(card.dataset.id);
  });

  /* 编辑器 */
  $('#btnBack').addEventListener('click', closeEditor);
  $('#btnMore').addEventListener('click', e => {
    const n = state.editing;
    if (!n) return;
    const d = showDropdown(e.currentTarget,
      '<button class="dropdown-item" data-eact="export">' + icon('export', 15) + '导出为 HTML</button>' +
      '<div class="dropdown-sep"></div>' +
      '<button class="dropdown-item danger" data-eact="trash">' + icon('trash', 15) + '移到回收站</button>');
    d.addEventListener('click', async ev => {
      const t = ev.target.closest('button');
      if (!t) return;
      closeDropdown();
      const act = t.dataset.eact;
      if (act === 'export') {
        try {
          /* 优先服务端保存到桌面；失败时退回浏览器下载（普通浏览器可用） */
          const r = await api('/api/export/' + n.id + '?save=1');
          toast('已保存到桌面：' + r.savedPath);
        } catch (err) {
          try {
            const res = await api('/api/export/' + n.id);
            downloadBlob(await res.blob(), (n.title || '无标题日志') + '.html');
            toast('已导出 HTML 文件（浏览器下载）');
          } catch (err2) { toast(err2.message, true); }
        }
      } else if (act === 'trash') {
        await flushSave();
        try {
          await api('/api/notes/' + n.id, { method: 'DELETE' });
          const i = state.notes.findIndex(x => x.id === n.id);
          if (i >= 0) state.notes[i] = Object.assign({}, state.notes[i], { trashed: true, trashedAt: Date.now() });
          closeEditor();
          renderAll();
          toast('已移到回收站');
        } catch (err) { toast(err.message, true); }
      }
    });
  });
  $('#editorTitle').addEventListener('input', onEditorInput);
  $('#editorContent').addEventListener('input', onEditorInput);
  /* 点编辑器空白处（比如视频下方的空隙）：若末尾是视频/音频，
     补一个空段落并把光标放进去——浏览器默认无法在媒体下方放置光标 */
  $('#editorContent').addEventListener('click', e => {
    if (e.target !== $('#editorContent') || !state.editing) return;
    const p = ensureTrailingParagraph();
    if (p) focusParagraph(p);
  });
  $('#fontDec').addEventListener('click', () => { state.fontSize = Math.max(14, state.fontSize - 1); applyFontSize(); });
  $('#fontInc').addEventListener('click', () => { state.fontSize = Math.min(24, state.fontSize + 1); applyFontSize(); });

  $('#tagBox').addEventListener('click', e => {
    const b = e.target.closest('[data-rmtag]');
    if (!b || !state.editing) return;
    state.editing.tags.splice(parseInt(b.dataset.rmtag, 10), 1);
    renderMeta();
    onEditorInput();
  });
  $('#moodBox').addEventListener('click', e => {
    const b = e.target.closest('[data-mood]');
    if (!b || !state.editing) return;
    state.editing.mood = state.editing.mood === b.dataset.mood ? null : b.dataset.mood;
    renderMeta();
    onEditorInput();
  });
  $('#colorBox').addEventListener('click', e => {
    const b = e.target.closest('[data-color]');
    if (!b) return;
    setNoteColor(b.dataset.color);
  });

  /* 工具栏 */
  $('#toolbar').addEventListener('mousedown', e => {
    if (e.target.closest('.tb-btn')) e.preventDefault(); // 保持编辑器选区
  });
  $('#toolbar').addEventListener('click', e => {
    const b = e.target.closest('.tb-btn');
    if (!b) return;
    if (b.dataset.cmd) execCmd(b.dataset.cmd, b.dataset.value);
    else if (b.dataset.pop) showPopover(b.dataset.pop, b);
    else if (b.dataset.action === 'link') linkDialog();
    else if (b.dataset.action) {
      const accept = b.dataset.action === 'image' ? 'image/*'
        : b.dataset.action === 'video' ? 'video/*' : 'audio/*';
      pickFile(accept).then(f => { if (f) uploadAndInsert(f); });
    }
  });

  /* 选区保存 */
  document.addEventListener('selectionchange', () => {
    if (state.editing && !$('#editor').classList.contains('hidden')) saveSelection();
  });

  /* 粘贴 / 拖拽媒体 */
  const content = $('#editorContent');
  content.addEventListener('paste', e => {
    const items = e.clipboardData && e.clipboardData.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        const f = items[i].getAsFile();
        if (f && /^(image|video|audio)\//.test(f.type)) {
          e.preventDefault();
          uploadAndInsert(f);
          return;
        }
      }
    }
  });
  /* 拖拽媒体：窗口内任意位置松手都放入当前日志；未打开日志则自动新建一篇 */
  const editorShell = $('#editorShell');
  window.addEventListener('dragover', e => {
    const types = Array.from((e.dataTransfer && e.dataTransfer.types) || []);
    if (types.indexOf('Files') < 0) return;
    e.preventDefault(); // 允许放置，同时阻止浏览器导航到被拖入的文件
    if (!$('#editor').classList.contains('hidden')) {
      try { e.dataTransfer.dropEffect = 'copy'; } catch (err) { /* ignore */ }
      editorShell.style.outline = '2px dashed var(--accent)';
    }
  });
  window.addEventListener('dragleave', e => { if (!e.relatedTarget) editorShell.style.outline = ''; });
  window.addEventListener('dragend', () => { editorShell.style.outline = ''; });
  window.addEventListener('drop', e => {
    editorShell.style.outline = '';
    const files = e.dataTransfer && e.dataTransfer.files;
    if (!files || !files.length) return;
    e.preventDefault();
    const media = Array.from(files).filter(f => /^(image|video|audio)\//.test(f.type)).slice(0, 10);
    if (!media.length) { toast('只支持拖入图片、视频、音频文件', true); return; }
    if (state.editing) {
      // 顺序插入，避免多个上传并发打乱顺序
      (async () => { for (const f of media) { await uploadAndInsert(f); } })();
    } else {
      createNoteWithMedia(media);
    }
  });

  /* 备份表格按钮 */
  $('#modalRoot').addEventListener('click', e => {
    const t = e.target.closest('[data-bkdown],[data-bkrestore],[data-bkdel]');
    if (!t) return;
    if (t.dataset.bkdown) backupAction('down', t.dataset.bkdown);
    else if (t.dataset.bkdel) backupAction('del', t.dataset.bkdel);
    else if (t.dataset.bkrestore) backupAction('restore', t.dataset.bkrestore);
  });

  /* 快捷键 */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if ($('#modalMask')) { closeModal(); return; }
      if (!$('#editor').classList.contains('hidden')) { closeEditor(); return; }
      closeDropdown();
      closeSidebar();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      flushSave();
    }
  });

  /* 关闭页面前保存 */
  window.addEventListener('beforeunload', e => {
    if (state.dirty && state.editing) {
      const n = state.editing;
      n.title = $('#editorTitle').value;
      n.content = $('#editorContent').innerHTML;
      try {
        fetch('/api/notes/' + n.id, {
          method: 'PUT', keepalive: true,
          headers: { 'Content-Type': 'application/json', 'x-token': TOKEN },
          body: JSON.stringify(n),
        });
      } catch (err) { /* ignore */ }
      e.preventDefault();
      e.returnValue = '';
    }
  });
  /* 窗口关闭：通知服务端尽快退出（刷新页面会因新请求自动取消，不会误杀） */
  window.addEventListener('pagehide', () => {
    try {
      fetch('/api/bye', { method: 'POST', keepalive: true, headers: { 'x-token': TOKEN } });
    } catch (err) { /* ignore */ }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) flushSave(); });
}

/* ---------------- 心跳 ---------------- */
setInterval(async () => {
  try {
    await api('/api/ping', { method: 'POST' });
    hideConnLost();
  } catch (e) { showConnLost(); }
}, 15000);

/* ---------------- 启动 ---------------- */
(function init() {
  applyTheme();
  applyFontSize();
  $('#sortSelect').value = state.sort;
  renderToolbar();
  bindEvents();
  loadState().catch(e => {
    toast('加载失败: ' + e.message, true);
    showConnLost();
  });
})();
