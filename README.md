# P21 照片 EXIF 元数据扒皮机

> 照片 EXIF 元数据扒皮机

[![Live Demo](https://img.shields.io/badge/Live-Demo-c7491f?style=for-the-badge)](https://yuuqq.github.io/P21-exif-inspector/)
[![PWA](https://img.shields.io/badge/PWA-Installable-4ade80?style=for-the-badge)](#)

## 🚀 在线体验

**[https://yuuqq.github.io/P21-exif-inspector/](https://yuuqq.github.io/P21-exif-inspector/)**

可以安装为 PWA。离线只覆盖已经成功缓存的本仓库文件；`../shared/` 不在本仓库里。相对路径失败时会回退到 `https://yuuqq.github.io/shared/`。

## ✨ 功能特性

- 🌗 暗色/亮色模式一键切换
- 🔍 `Ctrl+K` 跨工具搜索跳转
- 📱 可安装为 PWA。离线不等于 shared 脚本已预缓存
- ♿ 主按钮使用可见文字「解析 EXIF」作为无障碍名称，不再用 `aria-label="parse"` 盖住它
- 🔒 图片解析不上传。点击地图链接会打开带坐标的第三方网址。使用记录只写在本机 `localStorage`

## 🛠️ 技术栈

- 纯 HTML + CSS + JavaScript（无 React / Vue 等框架）。解析依赖仓库外的 exifr
- CSS 变量设计令牌系统
- Service Worker 缓存策略

## 📦 页面实际加载

- `../shared/design-tokens.css`，失败时再请求 `https://yuuqq.github.io/shared/design-tokens.css`
- `../shared/vendor/exifr.full.umd.js`，失败时换同一站点的绝对地址
- `../shared/releases/v2.6/loader.js`，用 `data-modules` 加载暗色、命令面板、toast、引导。页面不直接写 `dark-toggle.js` 或 `cmd-palette.js`
- `./sw.js` 在本仓库，不是 shared 模块
- `./pm-metrics.js` 只写本机 `localStorage`
- `./exif-present.js` 放 GPS 门闩、转义和类型判断，不碰 DOM

## 📄 许可

本项目为新闻素养教学工具，仅供学习与研究使用。

---

*本项目是 [新闻素养工具箱](https://yuuqq.github.io/journalism-toolbox/) 的第 21 号工具。*
