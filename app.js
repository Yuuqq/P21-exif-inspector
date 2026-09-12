/**
 * P21 照片 EXIF 元数据扒皮机
 * Upgraded: table display, GPS map, drag-drop, copy
 */
const fileInput = document.getElementById("fileInput");
const parseBtn = document.getElementById("parseBtn");
const statusEl = document.getElementById("status");
const output = document.getElementById("output");
const dropZone = document.querySelector(".drop-zone");

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
  if (Number.isFinite(data.latitude) && Number.isFinite(data.longitude) && data.latitude >= -90 && data.latitude <= 90 && data.longitude >= -180 && data.longitude <= 180) {
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

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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


// === Demo EXIF data display  ===
(function() {
  var demoBtn = document.createElement('button');
  demoBtn.type = 'button';
  demoBtn.textContent = '📷 加载示例 EXIF 数据';
  demoBtn.style.cssText = 'margin:8px 0;padding:8px 16px;border:2px dashed var(--accent,#c7491f);border-radius:8px;background:transparent;color:var(--accent,#c7491f);font-weight:700;cursor:pointer;';
  var container = document.querySelector('.drop-zone') || document.querySelector('main');
  if (container) container.appendChild(demoBtn);
  demoBtn.onclick = function() {
    var output = document.getElementById('output') || document.getElementById('exifOutput') || document.querySelector('.output') || document.querySelector('[class*="result"]');
    if (output) {
      output.innerHTML = '<h3>📷 示例照片 EXIF 元数据</h3>' +
        '<table style="width:100%;border-collapse:collapse;font-size:0.9rem;">' +
        '<tr><td style="padding:6px;border-bottom:1px solid #ddd;font-weight:700;">相机型号</td><td style="padding:6px;border-bottom:1px solid #ddd;">Canon EOS R5</td></tr>' +
        '<tr><td style="padding:6px;border-bottom:1px solid #ddd;font-weight:700;">拍摄时间</td><td style="padding:6px;border-bottom:1px solid #ddd;">2024-03-15 14:23:08</td></tr>' +
        '<tr><td style="padding:6px;border-bottom:1px solid #ddd;font-weight:700;">GPS 经度</td><td style="padding:6px;border-bottom:1px solid #ddd;">116.3912° E</td></tr>' +
        '<tr><td style="padding:6px;border-bottom:1px solid #ddd;font-weight:700;">GPS 纬度</td><td style="padding:6px;border-bottom:1px solid #ddd;">39.9072° N</td></tr>' +
        '<tr><td style="padding:6px;border-bottom:1px solid #ddd;font-weight:700;">光圈</td><td style="padding:6px;border-bottom:1px solid #ddd;">f/2.8</td></tr>' +
        '<tr><td style="padding:6px;border-bottom:1px solid #ddd;font-weight:700;">ISO</td><td style="padding:6px;border-bottom:1px solid #ddd;">400</td></tr>' +
        '<tr><td style="padding:6px;border-bottom:1px solid #ddd;font-weight:700;">快门速度</td><td style="padding:6px;border-bottom:1px solid #ddd;">1/500s</td></tr>' +
        '<tr><td style="padding:6px;border-bottom:1px solid #ddd;font-weight:700;">图像尺寸</td><td style="padding:6px;border-bottom:1px solid #ddd;">8192 x 5464</td></tr>' +
        '<tr><td style="padding:6px;border-bottom:1px solid #ddd;font-weight:700;">软件</td><td style="padding:6px;border-bottom:1px solid #ddd;">Adobe Photoshop 2024</td></tr>' +
        '<tr style="background:rgba(255,100,50,0.1)"><td style="padding:6px;font-weight:700;">⚠️ 发现</td><td style="padding:6px;color:var(--bad,red);">照片经过 Photoshop 处理，GPS 坐标指向天安门广场附近</td></tr>' +
        '</table>';
    }
    demoBtn.textContent = '✅ 已加载示例';
    setTimeout(function(){ demoBtn.textContent = '📷 加载示例 EXIF 数据'; }, 3000);
  };
})();
