import assert from "node:assert/strict";
import { test } from "node:test";
import { COLORS, colorWrappers } from "../src/colors.ts";
import { normalizeSettings } from "../src/settings.ts";

test("missing or malformed settings restore independent default palettes", () => {
  const defaults = Object.fromEntries(COLORS.map(preset => [preset.id, preset.color]));
  for (const saved of [null, undefined, [], "invalid", { colors: null }, { colors: 7 }]) {
    assert.deepEqual(normalizeSettings(saved).colors, defaults);
  }
  const edited = normalizeSettings(undefined);
  edited.colors.red = "#123456";
  assert.deepEqual(normalizeSettings(undefined).colors, defaults);
});

test("saved display colors keep fixed names and normalize hex values", () => {
  const settings = normalizeSettings({ colors: { red: " #abcdef ", blue: "#112233", custom: "#456789" } });
  assert.equal(settings.colors.red, "#ABCDEF");
  assert.equal(settings.colors.blue, "#112233");
  assert.deepEqual(Object.keys(settings.colors), COLORS.map(preset => preset.id));
  assert.equal(settings.colors.orange, "#D97706");
  assert.deepEqual(normalizeSettings(JSON.parse(JSON.stringify(settings))), settings);
});

test("invalid values cannot enter CSS and fall back independently", () => {
  for (const value of ["red", "#abc", "#123456; color: transparent", "</style>", 5, {}, null]) {
    const settings = normalizeSettings({ colors: { red: value, blue: "#123456" } });
    assert.equal(settings.colors.red, "#E05252");
    assert.equal(settings.colors.blue, "#123456");
  }
});

test("legacy numbered palette values migrate without changing syntax names", () => {
  const settings = normalizeSettings({ colors: [
    { name: "Custom name", color: "#aabbcc" },
    { name: "Another name", color: "#112233" },
    { name: "Invalid", color: "not-a-color" },
  ] });
  assert.equal(settings.colors.red, "#AABBCC");
  assert.equal(settings.colors.orange, "#112233");
  assert.equal(settings.colors.yellow, "#B88700");
  assert.deepEqual(Object.keys(settings.colors), COLORS.map(preset => preset.id));
});

test("configured colors affect HTML fallback while shorthand stays unchanged", () => {
  assert.deepEqual(colorWrappers("文字", "red", "#123456"), { prefix: "[", suffix: "]{red}" });
  assert.deepEqual(colorWrappers("one\ntwo", "red", "#aabbcc"), { prefix: '<span style="color: #AABBCC;">', suffix: "</span>" });
  assert.deepEqual(colorWrappers("[brackets]", "blue", "#112233"), { prefix: '<span style="color: #112233;">', suffix: "</span>" });
  assert.deepEqual(colorWrappers("one\ntwo", "red", '"><script>'), { prefix: '<span style="color: #E05252;">', suffix: "</span>" });
});
