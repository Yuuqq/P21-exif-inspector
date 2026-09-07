# P21 EXIF Inspector - Code Review

This document summarizes the findings from a thorough code review of the
`P21-exif-inspector` repository based on architecture, security, reliability,
test coverage, and documentation.

## 🏗️ Architecture & Code Organization

The overall architecture is highly solid and performant. Relying on
zero-dependency pure HTML/CSS/JS is an excellent choice for a lightweight
utility tool. The modular use of shared scripts (`dark-toggle.js`,
`cmd-palette.js`, `sw.js`) and CSS variables demonstrates good maintainability
and consistency with the rest of the project ecosystem. Data parsing is kept
strictly client-side, enforcing privacy by design.

---

## 🚨 Findings by Severity

### 🔴 CRITICAL

*(No critical security vulnerabilities, secret leaks, or architectural flaws
were found. The tool safely processes data locally without backend
interactions.)*

### 🟠 HIGH

#### 1. Broken "Load Demo" Button (Reliability / Edge Case)

- **File:** `app.js` (approx. line 156)
- **Impact:** The "Load Demo" button fails to work silently on initial page
  load. It tries to inject HTML into an element that doesn't match the query
  selectors, leaving users with no visual response.
- **Details:** The click handler queries `document.getElementById('exifOutput')`
  or `.output` or `[class*="result"]`. However, `index.html` uses
  `<div id="output">` to hold the output.
- **Fix Suggestion:** Update the selector query in `app.js` to include the
  correct ID used in the DOM:

  ```javascript
  var output = document.getElementById('output') ||
               document.getElementById('exifOutput') // ...
  ```

#### 2. Complete Lack of Automated Test Coverage (Test Gaps)

- **File:** *Repository-wide*
- **Impact:** There are zero automated tests in the codebase. As this is a
  data-parsing tool, high risk exists that future refactoring or dependency
  updates could silently break EXIF parsing logic or the UI.
- **Fix Suggestion:**
  - Add unit tests (e.g., using Jest/Vitest) to test the `renderExifTable`
    category grouping, data formatting, and `escapeHtml`.
  - Add a simple E2E test (e.g., Playwright or Cypress) to verify file upload
    interactions, demo button behavior, and copy-to-clipboard functionality.

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

### 🔵 LOW

#### 1. Incomplete HTML Escaping (Security / Hygiene)

- **File:** `app.js` (approx. line 102)
- **Impact:** The `escapeHtml` function omits the single quote (`'`). While
  currently safe because values are only injected as text within `<td>` elements
  (and not inside HTML attributes), it is an incomplete sanitization method and
  poses a minor maintenance hazard if reused elsewhere.
- **Fix Suggestion:** Add `.replace(/'/g, "&#039;")` to the replace chain.

#### 2. NaN Output for Malformed GPS Coordinates (Reliability)

- **File:** `app.js` (approx. line 49)
- **Impact:** If the underlying EXIF library returns a non-numeric string for
  corrupted `data.latitude` or `data.longitude`, `Number(...).toFixed(6)`
  results in `"NaN"`. The UI map card will ungracefully display `NaN, NaN`.
- **Fix Suggestion:** Add a quick numerical validation check before rendering the
  GPS card:

  ```javascript
  if (!isNaN(data.latitude) && !isNaN(data.longitude)) { /* render map card */ }
  ```
