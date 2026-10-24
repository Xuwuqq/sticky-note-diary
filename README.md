# 便签日记 (Sticky Note Diary)

一个 **Windows 便携单文件日记应用**：一个 exe，双击即用。不安装、不写注册表、不开服务，所有数据只保存在你自己电脑上。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![Platform](https://img.shields.io/badge/platform-Windows-lightgrey.svg)
![Runtime](https://img.shields.io/badge/runtime-Node.js%2022-green.svg)

## 特性

- **单文件便携**：整个程序打包为一个 exe（约 83MB，内置 Node.js 运行时），拷贝到任何 Windows 电脑即可用；运行后只在旁边生成一个 `data` 文件夹存数据
- **零环境侵入**：不安装、不写注册表、不改系统环境变量、不开系统服务；卸载 = 删除文件
- **卡片式日记**：彩色便签卡片、封面图、置顶、心情表情、标签系统
- **富文本编辑**：加粗 / 斜体 / 下划线 / 删除线、荧光笔、文字颜色、字号、字体（楷体/黑体/等宽）、列表、引用、代码块、对齐、链接
- **多媒体**：插入图片 / 视频 / 音频，支持拖拽文件、粘贴截图，视频可拖动进度条播放
- **完整的数据管理**：全文搜索、排序、回收站（可恢复）、自动保存
- **备份与迁移**：每天自动备份 + 手动备份为 ZIP；换电脑拷贝即用，或导入 ZIP（重名自动改名不覆盖）；单篇可导出为自包含 HTML
- **隐私优先**：只监听 `127.0.0.1` 本地回环，无任何外部网络请求，无遥测
- **不冲突**：端口从 3768 起自动避让（3769-3799）；单实例（重复双击只开新窗口）；关窗几秒后自动退出

## 下载

前往 [Releases](https://github.com/Xuwuqq/sticky-note-diary/releases) 页面下载 `便签日记_v1.0.zip`，解压后双击 `便签日记.exe` 使用。

> 💡 仓库主页绿色 **Code** 按钮里的 “Download ZIP” 是 GitHub 自动生成的**源代码包**（`sticky-note-diary-main.zip`，只有源码、没有 exe，仅供开发者参考）。普通用户请下载上方 Releases 里的发布包。

> ⚠️ **杀毒软件误报提示**：本程序未购买数字签名，且基于 Node.js 单文件技术构建，个别杀毒软件（如 360、Windows Defender）可能启发式误报。每个 Release 都附有 SHA256 校验值（见 `校验和.txt` 或 Release 说明），请核对后选择信任。你也可以参考下文「从源码构建」自行编译。

**v1.0 校验和：**

| 文件 | SHA256 |
|---|---|
| `便签日记_v1.0.zip` | `c0c8e232a95ae8350ad49cb507d735793f6c644f53053fb63fe41d9ff7c91887` |
| `便签日记.exe`（包内） | `880d8b2727df278e481ee76bb1b2f81561de1cd1fcfd014c06c84a166439ef7d` |

## 系统要求

- Windows 10 / 11
- 已安装 Microsoft Edge 或 Google Chrome（应用窗口以浏览器应用模式打开）

## 快速上手

1. 双击 `便签日记.exe`，约 1 秒后弹出应用窗口
2. 首次运行自动创建一篇欢迎日志
3. 点左上角「＋ 新建日志」开始记录；工具栏可插入图片/视频/音频，也可直接把文件拖进窗口
4. 「设置」里可更改数据存储位置、管理备份、切换深浅主题

详细说明见 [使用说明.txt](使用说明.txt)。

## 从源码构建

```powershell
# 1. 安装 Node.js 22+（https://nodejs.org ），或把 node.exe 放到 runtime/ 目录
# 2. 安装构建依赖
npm install postject

# 3. 构建
node build_exe.js
```

产物为 `dist-exe/便签日记.exe`。构建流程：将 `server.js` 与前端资产（`web/`）打包为 Node SEA blob → 注入 Node 可执行文件副本 → 修改 PE 子系统为 GUI（双击无黑窗）。

## 目录结构

```
├── server.js            # 本地服务（零依赖，仅 Node 内置模块）
├── web/                 # 前端（原生 HTML/CSS/JS，无框架、无 CDN）
│   ├── index.html
│   ├── app.js
│   └── style.css
├── build_exe.js         # SEA 单文件构建脚本
├── 使用说明.txt          # 用户手册
├── third-party-licenses/
│   └── Node.js-LICENSE.txt   # Node.js 许可证（exe 内嵌 Node 运行时）
└── LICENSE              # 本项目许可证 (MIT)
```

## 隐私说明

- 程序仅在本机运行，只监听 `127.0.0.1`，不发起任何外部网络请求
- 你的所有日志、图片、视频都只保存在本地数据文件夹中
- 没有任何遥测、统计、崩溃上报

## 免责声明

本软件按「现状」提供，不作任何明示或暗示的担保，包括但不限于适销性、特定用途适用性的担保。作者不对因使用或无法使用本软件所导致的数据丢失或损坏承担任何责任。**请定期使用内置备份功能备份你的数据。**

## 许可证

- 本项目代码采用 [MIT License](LICENSE)
- 发布包内嵌的 Node.js 运行时采用 Node.js 自身的 [MIT License](third-party-licenses/Node.js-LICENSE.txt)（版权归 Node.js contributors）
- 构建工具 [postject](https://github.com/nodejs/postject) 仅在构建时使用，不随程序分发，采用 MIT License
- 界面仅按名称引用操作系统自带字体（微软雅黑、楷体、黑体、Consolas 等），未打包任何字体文件
