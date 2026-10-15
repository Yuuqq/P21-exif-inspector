# P21 审查状态（2026-10-15）

这是**当前树**的状态说明，不是一份还没动手的缺陷单。上一版把已经改掉的拖放、GPS、`pre-wrap`、剪贴板和引号转义继续写成 “Fix Suggestion”，行号也是错的。那一版作废。

页面是中文的。这份文档用中文写。

## 架构（现在实际是这样）

- `index.html` 加载 `../shared/vendor/exifr.full.umd.js` 和 `../shared/releases/v2.6/loader.js`。本仓库没有 `shared/`。
- 相对路径失败时，样式、exifr、loader 回退到 `https://yuuqq.github.io/shared/`（`index.html` 第 11、55、76–80 行）。`parseFile` 在 `exifr` 仍是 `undefined` 时会再等一次回退（`app.js` 第 147–151 行）。
- `loader.js` 按 `data-modules` 拉暗色、命令面板等。页面**不**直接引用 `dark-toggle.js` 或 `cmd-palette.js`。
- `sw.js` 在本仓库里，不是 shared 模块。
- 图片解析不上传。`pm-metrics.js` 只写本机 `localStorage`。用户点开 GPS 链接时，坐标会出现在 OpenStreetMap 和 P22 的 URL 里。不要写成 “privacy by design”。

## 已经落地

| 项 | 位置 | 行为 |
|---|---|---|
| 拖放绑到投放区 | `app.js:9` | `querySelector(".drop-zone")`。教学卡是第一张 `.card`（`index.html:37`），投放区是 `index.html:43` |
| GPS 保留数字 0，拒绝空值 | `exif-present.js` 的 `gpsPair`；`app.js:76` 调用 | `Number.isFinite` 作用在原始值上，并检查 ±90 / ±180。`null`、`""`、`undefined`、`NaN` 不会变成 `0.000000` |
| 结果区不再用 `pre-wrap` | `styles.css` 的 `[id="output"]` | 表格缩进不会变成可见空白 |
| 剪贴板 | `app.js` 复制按钮 | 先判断 `navigator.clipboard.writeText`，失败回调仍在 |
| `'` 转义 | `exif-present.js` 的 `escapeHtml` | `&` 仍最先替换 |
| 复制对象 | `formatExifValue` | 对象走 `JSON.stringify`，不再是 `[object Object]`。表格和剪贴板同一条路径 |
| 非图片 | `isAcceptableImage` | 主按钮和拖放都拒绝非空且不是 `image/` 的 MIME。MIME 为空时放行（部分浏览器里的 HEIC） |
| 课堂样例 | `app.js:211` 起，按钮 `#demoExifBtn` | 调用 `renderExifTable`，写入 `#output`，带 GPS 卡片和复制按钮。不再写内联 HTML，也不再在写失败时把按钮改成「已加载」 |
| 主按钮名称 | `index.html:46` | 去掉 `aria-label="parse"`，无障碍名称就是「解析 EXIF」 |
| 解析失败 | `app.js:156` | 状态栏和结果区都会换掉旧结果 |
| 任务记录 | `noteTask` | 解析成功或样例载入后 `markTaskComplete`，解析抛错时 `markTaskError` |
| 预缓存 | `sw.js:12` | 含 `exif-present.js`、`manifest.json`、exifr、`loader.js`。已去掉页面不加载的 `../shared/dark-toggle.js` |
| 纯函数测试 | `test/exif-present.test.js` | `node --test test/exif-present.test.js` |

## 不要这样改

- 不要把 GPS 改回 `!isNaN`。`isNaN(null)` 和 `isNaN("")` 都是 `false`。
- 不要先 `Number(data.latitude)` 再 `Number.isFinite`。`Number(null)` 和 `Number("")` 都是 `0`，会编出假的 `(0,0)`。
- 不要用另一套内联 HTML 替换 `#demoExifBtn`。和 [PR #1](https://github.com/Yuuqq/P21-exif-inspector/pull/1) 冲突时，留下 `renderExifTable` 这条。

数字字符串（`"39.9"`）不会画地图，表格里仍显示原文。`exifr` 在 `gps: true` 时给出的是 number。这是故意的。

## 仍开放

这些没有在这次修完，不要写成已完成。

1. **PWA 不是离线可用。** `CACHE_NAME` 仍是 `journalism-tool-v1`（`sw.js:11`）。Cache Storage 是整个 origin 共用的；这个 SW 激活时会删掉其他名字的 cache。`loader.js` 再拉的模块不在 `CORE_ASSETS` 里。`../shared/` 本身 404 时，预缓存这两条 URL 不会成功。
2. **HEIC 未证实。** 提示只说取决于本机解码。没有在 Chrome/Windows 课堂机上验过 UMD 能否解码。
3. **没有浏览器 CI。** 只有上面的 `node --test`。
4. **打印样式**仍有 `button[aria-label]{display:none}`（`index.html:20`）。主按钮已经不受这条影响。loader 注入的、带 `aria-label` 的按钮打印时仍会藏起来。
5. **[PR #1](https://github.com/Yuuqq/P21-exif-inspector/pull/1) 还有本分支没做的事：** 教学卡默认收起、去掉主按钮脉冲、窄屏按钮不再强制 100% 宽。合两条分支时不要用本分支覆盖那三处。

## 和 PR #3 的关系

[PR #3](https://github.com/Yuuqq/P21-exif-inspector/pull/3) 的运行时修复（拖放、GPS 门闩、删 `pre-wrap`、剪贴板、引号）保留。这份文档替换它里面那份过时的 `REVIEW.md`。
