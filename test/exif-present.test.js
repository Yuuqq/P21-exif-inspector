const test = require("node:test");
const assert = require("node:assert/strict");
const { gpsPair, formatExifValue, escapeHtml, isAcceptableImage } = require("../exif-present.js");

test("numeric zero is a real coordinate", () => {
  assert.deepEqual(gpsPair({ latitude: 0, longitude: 0 }), {
    lat: "0.000000",
    lng: "0.000000"
  });
});

test("null and empty string do not become 0,0", () => {
  assert.equal(gpsPair({ latitude: null, longitude: 1 }), null);
  assert.equal(gpsPair({ latitude: "", longitude: 1 }), null);
  assert.equal(gpsPair({ latitude: undefined, longitude: 0 }), null);
});

test("NaN and out-of-range values are dropped", () => {
  assert.equal(gpsPair({ latitude: NaN, longitude: 10 }), null);
  assert.equal(gpsPair({ latitude: 91, longitude: 0 }), null);
  assert.equal(gpsPair({ latitude: 0, longitude: 181 }), null);
  assert.equal(gpsPair({ latitude: -90, longitude: 180 }).lat, "-90.000000");
});

test("numeric strings are not coerced", () => {
  assert.equal(gpsPair({ latitude: "39.9", longitude: 116.3 }), null);
});

test("escapeHtml escapes quote and keeps amp first", () => {
  assert.equal(escapeHtml(`&<>"'`), "&amp;&lt;&gt;&quot;&#039;");
});

test("objects stringify instead of [object Object]", () => {
  assert.equal(formatExifValue({ a: 1 }), '{"a":1}');
  assert.equal(formatExifValue("Canon"), "Canon");
});

test("blank MIME is allowed, non-image MIME is not", () => {
  assert.equal(isAcceptableImage({ type: "" }), true);
  assert.equal(isAcceptableImage({ type: "image/jpeg" }), true);
  assert.equal(isAcceptableImage({ type: "text/plain" }), false);
  assert.equal(isAcceptableImage(null), false);
});
