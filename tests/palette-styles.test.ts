import assert from "node:assert/strict";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { PaletteStyles } from "../src/palette-styles.ts";
import { normalizeSettings } from "../src/settings.ts";

test("existing and new windows receive updated colors without rewriting content", () => {
  const main = new JSDOM('<p class="selection-text-color-red">Text</p>');
  const popout = new JSDOM('<p class="selection-text-color-red">Text</p>');
  const styles = new PaletteStyles();
  styles.setColors(normalizeSettings(undefined).colors);
  styles.attach(main.window.document);
  styles.attach(main.window.document);
  assert.equal(main.window.document.querySelectorAll('#selection-text-color-palette').length, 1);
  assert.equal(main.window.getComputedStyle(main.window.document.documentElement).getPropertyValue('--selection-text-color-red'), '#E05252');
  const content = main.window.document.body.innerHTML;
  const palette = normalizeSettings({ colors: { red: "#123456" } }).colors;
  styles.setColors(palette);
  styles.attach(popout.window.document);
  for (const dom of [main, popout]) {
    assert.equal(dom.window.getComputedStyle(dom.window.document.documentElement).getPropertyValue('--selection-text-color-red'), '#123456');
    assert.equal(dom.window.document.body.innerHTML, content);
  }
  styles.setColors(normalizeSettings(undefined).colors);
  assert.equal(popout.window.getComputedStyle(popout.window.document.documentElement).getPropertyValue('--selection-text-color-red'), '#E05252');
  styles.destroy();
  for (const dom of [main, popout]) {
    assert.equal(dom.window.document.querySelector('#selection-text-color-palette'), null);
    dom.window.close();
  }
});

test("copied popout styles are reused and removed on window close", () => {
  const dom = new JSDOM('<head><style id="selection-text-color-palette">:root { --selection-text-color-red: #000000; }</style></head>');
  const styles = new PaletteStyles();
  styles.setColors(normalizeSettings(undefined).colors);
  styles.attach(dom.window.document);
  assert.equal(dom.window.document.querySelectorAll('#selection-text-color-palette').length, 1);
  assert.equal(dom.window.getComputedStyle(dom.window.document.documentElement).getPropertyValue('--selection-text-color-red'), '#E05252');
  styles.detach(dom.window.document);
  assert.equal(dom.window.document.querySelector('#selection-text-color-palette'), null);
  styles.destroy();
  dom.window.close();
});
