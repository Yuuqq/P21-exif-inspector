/**
 * P21 照片 EXIF 元数据扒皮机
 * Upgraded: table display, GPS map, drag-drop, copy
 */
const fileInput = document.getElementById("fileInput");
const parseBtn = document.getElementById("parseBtn");
const statusEl = document.getElementById("status");
const output = document.getElementById("output");
const dropZone = document.querySelector(".card");

function setStatus(text) {
  statusEl.textContent = `状态: ${text}`;
}

/**
 * Renders EXIF data as a structured HTML table grouped by category.
 * @param {Object} data - The parsed EXIF data object.
 */
function renderExifTable(data) {
  if (!data || Object.keys(data).length === 0) {
    output.innerHTML = '<p class="empty-hint">未检测到 EXIF 元数据。该图片可能已被剥离元数据。</p>';
    setStatus("解析完成（无 EXIF）");
    return;
  }

  // Categorize EXIF fields
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

  // Assign remaining keys to "其他"
  for (const key of Object.keys(data)) {
    if (!assigned.has(key) && data[key] !== undefined && data[key] !== null) {
      categories["📄 其他"].push(key);
    }
  }

  let html = '<div class="exif-results">';

  // GPS map if available
  if (data.latitude && data.longitude) {
    const lat = Number(data.latitude).toFixed(6);
    const lng = Number(data.longitude).toFixed(6);
    html += `
      <div class="gps-map-card">
        <h3>📍 GPS 定位</h3>
        <p class="gps-coords">${lat}, ${lng}</p>
        <a href="https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}"
           target="_blank" rel="noopener" class="map-link">
          🗺️ 在 OpenStreetMap 中查看
        </a>
        <a href="https://yuuqq.github.io/P22-shadow-geo-validator/?lat=${lat}&lng=${lng}"
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
      let val = data[key];
      if (val instanceof Date) val = val.toLocaleString("zh-CN");
      else if (typeof val === "object") val = JSON.stringify(val);
      else val = String(val);
      html += `<tr><td>${escapeHtml(key)}</td><td>${escapeHtml(val)}</td></tr>`;
    }
    html += '</tbody></table>';
  }

  html += `<button id="copyBtn" type="button" class="copy-btn">📋 复制全部元数据</button>`;
  html += '</div>';

  output.innerHTML = html;

  // Bind copy button
  const copyBtn = document.getElementById("copyBtn");
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      const text = Object.entries(data)
        .map(([k, v]) => `${k}: ${v instanceof Date ? v.toLocaleString("zh-CN") : v}`)
        .join("\n");
      navigator.clipboard.writeText(text).then(
        () => setStatus("已复制元数据到剪贴板"),
        () => setStatus("复制失败，请手动复制")
      );
    });
  }

  const fieldCount = Object.keys(data).filter(k => data[k] !== undefined && data[k] !== null).length;
  setStatus(`解析完成，共提取 ${fieldCount} 个字段`);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function parseFile(file) {
  if (!file) {
    setStatus("请先选择图片");
    return;
  }
  setStatus("解析中...");
  try {
    const data = await exifr.parse(file, { gps: true, tiff: true, exif: true, xmp: true });
    renderExifTable(data);
  } catch (err) {
    setStatus(`解析失败: ${err.message}`);
  }
}

parseBtn.addEventListener("click", () => {
  parseFile(fileInput.files?.[0]);
});

// Drag-and-drop support
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
    if (file && file.type.startsWith("image/")) {
      parseFile(file);
    }
  });
}

// === PM Metrics Integration ===
(function() {
  try {
    if (!window.pmMetrics) return;
    // Auto mark task start on first meaningful interaction
    let taskStarted = false;
    document.addEventListener('click', function(e) {
      if (taskStarted) return;
      const btn = e.target.closest('button');
      if (btn) {
        taskStarted = true;
        window.pmMetrics.markTaskStart('exif_parse_task');
      }
    }, { once: false });
  } catch (_e) {}
})();


// === Classroom sample (wires into #output via renderExifTable) ===
(function() {
  var demoBtn = document.createElement("button");
  demoBtn.type = "button";
  demoBtn.id = "demoExifBtn";
  demoBtn.textContent = "加载课堂样例 EXIF";
  demoBtn.style.cssText = "margin:8px 0;padding:10px 16px;min-height:44px;border:2px dashed var(--accent,#c7491f);border-radius:8px;background:transparent;color:var(--accent,#c7491f);font-weight:700;cursor:pointer;";
  var zone = document.querySelector(".drop-zone") || document.querySelector("main");
  if (zone) {
    var parseBtn = document.getElementById("parseBtn");
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
  });
})();
