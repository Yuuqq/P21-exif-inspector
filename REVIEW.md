# P21 EXIF Inspector - Code Review

This document summarizes the findings from a thorough code review of the
`P21-exif-inspector` repository based on architecture, security, reliability,
test coverage, and documentation.

## 🏗️ Architecture & Code Organization

The overall architecture is generally lightweight, but relies on a hard dependency on `../shared/` which breaks under `file://` or standalone Pages deployments. The modular use of shared scripts (`dark-toggle.js`,
`cmd-palette.js`, `sw.js`) and CSS variables demonstrates consistency with the rest of the project ecosystem. Data parsing is kept
strictly client-side, enforcing privacy by design.

---

## 🚨 Findings by Severity

### 🔴 CRITICAL

*(No critical security vulnerabilities, secret leaks, or architectural flaws
were found. The tool safely processes data locally without backend
interactions.)*

### 🟠 HIGH

#### 1. Broken "Load Demo" Button (Reliability / Edge Case)

- **File:** `app.js` (approx. line 178)
- **Impact:** The "Load Demo" button fails to work silently on initial page
  load. It tries to inject HTML into an element that doesn't match the query
  selectors, leaving users with no visual response.
- **Details:** The click handler queries `document.getElementById('exifOutput')`
  or `.output` or `[class*="result"]`. However, `index.html` uses
  `<div id="output">` to hold the output. PR #1 is also attempting to fix this same issue.
- **Fix Suggestion:** Update the selector query in `app.js` to include the
  correct ID used in the DOM:

  ```javascript
  var output = document.getElementById('output') ||
               document.getElementById('exifOutput') // ...
  ```

#### 2. Incorrect Drop Zone Binding (Reliability)

- **File:** `app.js` (approx. line 125)
- **Impact:** `document.querySelector(".card")` binds to the teaching card, not `.drop-zone`. Dropping files on the intended drop zone will trigger default browser navigation away from the page.
- **Fix Suggestion:** Change the selector to `document.querySelector(".drop-zone")`.

#### 3. Bug in GPS Validation Logic (Reliability)

- **File:** `app.js` (approx. line 49)
- **Impact:** `if (data.latitude && data.longitude)` drops legitimate `0` coordinates for the Equator or Prime Meridian.
- **Fix Suggestion:** Use `Number.isFinite` and coordinate bounds instead of truthiness.

  ```javascript
  if (Number.isFinite(data.latitude) && Number.isFinite(data.longitude)) { /* render map card */ }
  ```

### 🟡 MEDIUM

#### 1. Incomplete PWA Pre-Caching (Reliability)

- **File:** `sw.js` (approx. line 10)
- **Impact:** The `CORE_ASSETS` array misses crucial dependencies like
  `../shared/vendor/exifr.full.umd.js` and `../shared/releases/v2.6/loader.js`.
  While they are cached dynamically upon a successful first fetch, if a user
  experiences network loss before full loading or clears their cache, the tool
  will fail to function offline, breaking the PWA promise made in `README.md`.
- **Fix Suggestion:** Add the missing shared dependencies to the `CORE_ASSETS`
  array:

  ```javascript
  const CORE_ASSETS = [
    // ...existing...
    "../shared/vendor/exifr.full.umd.js",
    "../shared/releases/v2.6/loader.js"
  ];
  ```

#### 2. Visible Whitespace for JSON Rendering (Styling)

- **File:** `styles.css`
- **Impact:** `#output { white-space: pre-wrap }` is a remnant of JSON formatting and causes the GPS template indentation to appear as visible whitespace on the page.
- **Fix Suggestion:** Remove `white-space: pre-wrap;` from `[id="output"]`.

### 🔵 LOW

#### 1. Complete Lack of Automated Test Coverage (Test Gaps)

- **File:** *Repository-wide*
- **Impact:** There are zero automated tests in the codebase. As this is a
  data-parsing tool, high risk exists that future refactoring or dependency
  updates could silently break EXIF parsing logic or the UI.
- **Fix Suggestion:**
  - Add unit tests (e.g., using Jest/Vitest) to test the `renderExifTable`
    category grouping, data formatting, and `escapeHtml`.
  - Add a simple E2E test (e.g., Playwright or Cypress) to verify file upload
    interactions, demo button behavior, and copy-to-clipboard functionality.

#### 2. Unsafe Clipboard API Usage (Reliability / Error Handling)

- **File:** `app.js` (approx. line 92)
- **Impact:** The Copy button directly invokes `navigator.clipboard.writeText()`.
  If the app is embedded in an iframe without clipboard permissions, or accessed
  over a non-secure context, `navigator.clipboard` will be `undefined`, causing
  an unhandled `TypeError` crash and failing to show user feedback.
- **Fix Suggestion:** Wrap the API call with a feature check:

  ```javascript
  if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(...)
  } else {
      setStatus("当前环境不支持自动复制，请手动复制");
  }
  ```

#### 3. Incomplete HTML Escaping (Security / Hygiene)

- **File:** `app.js` (approx. line 102)
- **Impact:** The `escapeHtml` function omits the single quote (`'`). While
  currently safe because values are only injected as text within `<td>` elements
  (and not inside HTML attributes), it is an incomplete sanitization method and
  poses a minor maintenance hazard if reused elsewhere.
- **Fix Suggestion:** Add `.replace(/'/g, "&#039;")` to the replace chain.
