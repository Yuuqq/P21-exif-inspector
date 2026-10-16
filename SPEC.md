# P21 Spec - 照片 EXIF 元数据扒皮机

## 1. Summary

- **Project ID**: P21
- **Project Name**: 照片 EXIF 元数据扒皮机
- **Goal**: 纯客户端读取 EXIF（拍摄时间/GPS/设备型号），不上传服务器
- **User Persona**: 核查员 / 调查记者

## 2. Scope

- **In scope**:
  - 纯客户端读取 EXIF（拍摄时间/GPS/设备型号）
  - 不上传服务器
- **Out of scope**:
  - 后端代理或服务端逻辑
  - API Key 持久化存储

## 3. UX

- **Core workflow**: 用户输入 → 前端处理 → 结果展示
- **Inputs**: 照片文件
- **Outputs**: EXIF 元数据表格 + GPS 地图标注
- **States**: empty (初始) / loading (处理中) / error (失败) / success (完成)

## 4. Functional Requirements

1. FR-1: 纯客户端读取 EXIF（拍摄时间/GPS/设备型号）
2. FR-2: 结果可视化展示
3. FR-3: 错误状态可见提示

## 5. Non-Functional Requirements

- **Performance**: 核心任务 3 分钟内完成
- **Accessibility**: 键盘导航、aria-label、焦点可见、WCAG AA 对比度
- **Privacy**: 本地处理优先，不默认上传数据
- **Browser support**: 现代 Chromium (Chrome 110+)

## 6. Dependencies

- **Libraries/CDNs**: 仓库外的 `../shared/vendor/exifr.full.umd.js`（不是 exif-js CDN）。相对路径失败时回退到 `https://yuuqq.github.io/shared/vendor/exifr.full.umd.js`。页面壳由 `../shared/releases/v2.6/loader.js` 加载。
- **Local data**: 无

## 7. Risks & Mitigations

- **Risk**: 部分照片已被剥离 EXIF
- **Mitigation**: 提示无 EXIF 数据

## 8. Acceptance Criteria

- [ ] 本地图片读取
- [ ] EXIF 解析
- [ ] HTML 表格结果（不是 JSON 文本）
- [ ] 纯静态页面可部署 GitHub Pages
- [ ] 移动端可用
- [ ] 隐私提示清晰可见
