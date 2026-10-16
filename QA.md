# P21 QA

## Environment

- **Browser**: Chrome 110+
- **OS**: Windows / macOS
- **Date**: 2026-02-27

## Functional Test Cases

1. **核心流程测试**
   - Steps: 打开 index.html → 输入测试数据 → 执行核心操作
   - Expected: 正确输出结果
   - Actual: 通过
   - Pass/Fail: **Pass**

### 已验证项
  - [x] EXIF 读取
  - [x] 无 EXIF 场景提示

## Accessibility Checks

- [x] 键盘导航可达所有交互元素
- [x] 输入控件绑定可见 label
- [x] 焦点状态可见
- [x] 色彩对比度达标

## Privacy Checks

- [x] 无强制上传数据
- [x] 无隐式密钥持久化
- [x] 页面包含本地处理说明

## Known Issues

2026-02-27 那份「暂无已知严重问题」和三重 Approved 作废。上面的勾选是当时的橡皮图章，不是这次的复测结果。

- **Issue**: `../shared/` 不在本仓库。样式、exifr、loader 在相对路径失败时回退到 `https://yuuqq.github.io/shared/`。回退脚本是异步的；`parseFile` 会在 exifr 仍未定义时再等一次。
  **Severity**: classroom
  **Status**: 已加回退。这不是离线可用
- **Issue**: HEIC 只在提示里说明「取决于本机解码」，没有在 Chrome/Windows 课堂机上验证。
  **Severity**: low
  **Status**: 未证实
- **Issue**: Service Worker 缓存名仍是 origin 级的 `journalism-tool-v1`。`loader.js` 再拉的模块不在预缓存列表里。
  **Severity**: medium
  **Status**: 未做跨工具缓存隔离
- **Issue**: 没有自动化 UI 测试，也没有 CI。纯函数在 `test/exif-present.test.js`（`node --test`）。
  **Severity**: low
  **Status**: 只覆盖 GPS / 转义 / 类型判断

## Sign-Off

- **2026-02-27**: 撤回。不能当作当前通过。
- **2026-10-15**: 见 `REVIEW.md`。这次只把第三轮审查指出的文档和代码对齐，不重新盖章全量无障碍。
