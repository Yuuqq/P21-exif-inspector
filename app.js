/**
 * P21 照片 EXIF 元数据扒皮机
 * Upgraded: table display, GPS map, drag-drop, copy
 */
const fileInput = document.getElementById("fileInput");
const parseBtn = document.getElementById("parseBtn");
const statusEl = document.getElementById("status");
const output = document.getElementById("output");
const dropZone = document.querySelector(".drop-zone");
const present = window.P21Present;

function setStatus(text) {
  statusEl.textContent = `状态: ${text}`;
}

function noteTask(kind, reason) {
  try {
    if (!window.pmMetrics) return;
    if (kind === "complete") window.pmMetrics.markTaskComplete("exif_parse_task");
    else window.pmMetrics.markTaskError("exif_parse_task", reason);
  } catch (_e) {}
}

const EXIFR_FALLBACK = "https://yuuqq.github.io/shared/vendor/exifr.full.umd.js";
let exifrFallbackPromise = null;

function loadExifrFallback() {
  if (typeof exifr !== "undefined") return Promise.resolve();
  if (!exifrFallbackPromise) {
    exifrFallbackPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = EXIFR_FALLBACK;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("exifr 回退脚本加载失败"));
      document.head.appendChild(s);
    });
  }
  return exifrFallbackPromise;
}

/**
 * Renders EXIF data as a structured HTML table grouped by category.
 * @param {Object} data - The parsed EXIF data object.
 */
function renderExifTable(data) {
  if (!present) {
    setStatus("解析失败: 缺少 exif-present.js");
    return;
  }
  if (!data || Object.keys(data).length === 0) {
    output.innerHTML = '<p class="empty-hint">未检测到 EXIF 元数据。该图片可能已被剥离元数据。</p>';
    setStatus("解析完成（无 EXIF）");
    return;
  }

  const categories = {
    "📷 基本信息": ["Make", "Model", "Software", "DateTime", "DateTimeOriginal", "DateTimeDigitized", "ImageWidth", "ImageHeight", "Orientation"],
    "🔧 曝光参数": ["ExposureTime", "FNumber", "ISO", "ISOSpeedRatings", "ShutterSpeedValue", "ApertureValue", "BrightnessValue", "ExposureCompensation", "MeteringMode", "Flash", "FocalLength", "FocalLengthIn35mmFormat", "WhiteBalance", "ExposureMode", "ExposureProgram"],
    "📍 GPS 信息": ["latitude", "longitude", "GPSAltitude", "GPSSpeed", "GPSImgDirection", "GPSDateStamp"],
    "📄 其他": []
  };

  const assigned = new Set();
  for (const keys of Object.values(categories)) {
    keys.forEach(k => assigned.add(k));
  }

  for (const key of Object.keys(data)) {
    if (!assigned.has(key) && data[key] !== undefined && data[key] !== null) {
      categories["📄 其他"].push(key);
    }
  }

  let html = '<div class="exif-results">';

  const gps = present.gpsPair(data);
  if (gps) {
    html += `
      <div class="gps-map-card">
        <h3>📍 GPS 定位</h3>
        <p class="gps-coords">${gps.lat}, ${gps.lng}</p>
        <a href="https://www.openstreetmap.org/?mlat=${gps.lat}&mlon=${gps.lng}#map=15/${gps.lat}/${gps.lng}"
           target="_blank" rel="noopener" class="map-link">
          🗺️ 在 OpenStreetMap 中查看
        </a>
        <a href="https://yuuqq.github.io/P22-shadow-geo-validator/?lat=${gps.lat}&lng=${gps.lng}"
           target="_blank" rel="noopener" class="map-link" style="margin-left:8px;">
          🌗 用 P22 验证阴影方位
        </a>
      </div>`;
  }

  for (const [catName, keys] of Object.entries(categories)) {
    const rows = keys.filter(k => data[k] !== undefined && data[k] !== null);
    if (rows.length === 0) continue;

    html += `<h3>${catName}</h3>`;
    html += '<table class="exif-table"><thead><tr><th>字段</th><th>值</th></tr></thead><tbody>';
    for (const key of rows) {
      const val = present.formatExifValue(data[key]);
      html += `<tr><td>${present.escapeHtml(key)}</td><td>${present.escapeHtml(val)}</td></tr>`;
    }
    html += '</tbody></table>';
  }

  html += `<button id="copyBtn" type="button" class="copy-btn">📋 复制全部元数据</button>`;
  html += '</div>';

  output.innerHTML = html;

  const copyBtn = document.getElementById("copyBtn");
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      const text = Object.entries(data)
        .map(([k, v]) => `${k}: ${present.formatExifValue(v)}`)
        .join("\n");
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(
          () => setStatus("已复制元数据到剪贴板"),
          () => setStatus("复制失败，请手动复制")
        );
      } else {
        setStatus("当前环境不支持自动复制，请手动复制");
      }
    });
  }

  const fieldCount = Object.keys(data).filter(k => data[k] !== undefined && data[k] !== null).length;
  setStatus(`解析完成，共提取 ${fieldCount} 个字段`);
}

async function parseFile(file) {
  if (!file) {
    setStatus("请先选择图片");
    return;
  }
  if (!present) {
    setStatus("解析失败: 缺少 exif-present.js");
    return;
  }
  if (!present.isAcceptableImage(file)) {
    setStatus("请选择图片文件");
    return;
  }
  setStatus("解析中...");
  try {
    if (typeof exifr === "undefined") {
      await loadExifrFallback();
    }
    if (typeof exifr === "undefined") {
      throw new Error("未加载 exifr（../shared/ 不可用，回退也失败）");
    }
    const data = await exifr.parse(file, { gps: true, tiff: true, exif: true, xmp: true });
    renderExifTable(data);
    noteTask("complete");
  } catch (err) {
    const message = err && err.message ? err.message : String(err);
    setStatus(`解析失败: ${message}`);
    if (output) {
      output.innerHTML = `<p class="empty-hint">解析失败：${present ? present.escapeHtml(message) : message}</p>`;
    }
    noteTask("error", message);
  }
}

parseBtn.addEventListener("click", () => {
  parseFile(fileInput.files?.[0]);
});

if (dropZone) {
  dropZone.addEventListener("dragover", e => {
    e.preventDefault();
    dropZone.classList.add("drag-over");
  });
  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("drag-over");
  });
  dropZone.addEventListener("drop", e => {
    e.preventDefault();
    dropZone.classList.remove("drag-over");
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!present) {
      setStatus("解析失败: 缺少 exif-present.js");
      return;
    }
    if (!present.isAcceptableImage(file)) {
      setStatus("请选择图片文件");
      return;
    }
    parseFile(file);
  });
}

// === PM Metrics Integration ===
(function() {
  try {
    if (!window.pmMetrics) return;
    let taskStarted = false;
    document.addEventListener("click", function(e) {
      if (taskStarted) return;
      const btn = e.target.closest("button");
      if (btn) {
        taskStarted = true;
        window.pmMetrics.markTaskStart("exif_parse_task");
      }
    }, { once: false });
  } catch (_e) {}
})();

// 课堂样例走 renderExifTable，不再往不存在的 #exifOutput 写一套内联表。
(function() {
  var demoBtn = document.createElement("button");
  demoBtn.type = "button";
  demoBtn.id = "demoExifBtn";
  demoBtn.textContent = "加载课堂样例 EXIF";
  demoBtn.style.cssText = "margin:8px 0;padding:10px 16px;min-height:44px;border:2px dashed var(--accent,#c7491f);border-radius:8px;background:transparent;color:var(--accent,#c7491f);font-weight:700;cursor:pointer;";
  var zone = document.querySelector(".drop-zone") || document.querySelector("main");
  if (zone) {
    if (parseBtn && parseBtn.parentNode) parseBtn.parentNode.insertBefore(demoBtn, parseBtn.nextSibling);
    else zone.appendChild(demoBtn);
  }
  demoBtn.addEventListener("click", function () {
    renderExifTable({
      Make: "Canon",
      Model: "EOS R5",
      Software: "Adobe Photoshop 2024",
      DateTimeOriginal: "2024:03:15 14:23:08",
      DateTime: "2024:03:15 18:02:11",
      ImageWidth: 8192,
      ImageHeight: 5464,
      ExposureTime: "1/500",
      FNumber: 2.8,
      ISO: 400,
      FocalLength: "35mm",
      latitude: 39.9072,
      longitude: 116.3912
    });
    setStatus("已载入课堂样例（合成 EXIF：Photoshop 处理 + 天安门附近 GPS）");
    setTimeout(function () { noteTask("complete"); }, 0);
  });
})();
