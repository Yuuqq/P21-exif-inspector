/**
 * 纯函数：GPS 门闩、展示格式、图片类型、HTML 转义。
 * 不碰 DOM，供 app.js 与 node:test 共用。
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.P21Present = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function formatExifValue(val) {
    if (val instanceof Date) return val.toLocaleString("zh-CN");
    if (val !== null && typeof val === "object") return JSON.stringify(val);
    return String(val);
  }

  /**
   * 只接受有限数字。数字 0 合法；null / "" / undefined / NaN / 数字字符串一律拒绝。
   * 不要先 Number()：Number(null) 和 Number("") 都是 0，会编出假坐标。
   */
  function gpsPair(data) {
    if (!data) return null;
    var lat = data.latitude;
    var lng = data.longitude;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
    return {
      lat: Number(lat).toFixed(6),
      lng: Number(lng).toFixed(6)
    };
  }

  function isAcceptableImage(file) {
    if (!file) return false;
    if (!file.type) return true;
    return file.type.indexOf("image/") === 0;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  return {
    formatExifValue: formatExifValue,
    gpsPair: gpsPair,
    isAcceptableImage: isAcceptableImage,
    escapeHtml: escapeHtml
  };
});
