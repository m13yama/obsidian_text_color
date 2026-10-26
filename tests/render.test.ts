import assert from "node:assert/strict";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { renderColors } from "../src/render.ts";

function root(html: string): HTMLElement {
  return new JSDOM(`<body>${html}</body>`).window.document.body;
}

test("renders a bare inline fragment without moving its container", () => {
  const element = root("[text]{red}");
  renderColors(element);
  assert.equal(element.ownerDocument.body, element);
  assert.equal(element.innerHTML, '<span class="selection-text-color-red">text</span>');
});

test("renders adjacent colors while preserving surrounding text and formatting", () => {
  const element = root("<p>Before [赤い<strong>太字</strong>]{red}[<em>青</em>]{blue} after</p>");
  renderColors(element);
  assert.equal(element.textContent, "Before 赤い太字青 after");
  assert.equal(element.querySelector(".selection-text-color-red strong")?.textContent, "太字");
  assert.equal(element.querySelector("em")?.textContent, "青");
  assert.equal(element.querySelector(".selection-text-color-blue")?.textContent, "青");
  const html = element.innerHTML;
  renderColors(element);
  assert.equal(element.innerHTML, html, "Rendering twice must be idempotent");
});

test("nested colors retain both wrappers and their text", () => {
  const element = root("<p>[outer [inner]{blue} tail]{red}</p>");
  renderColors(element);
  assert.equal(element.textContent, "outer inner tail");
  assert.equal(element.querySelector(".selection-text-color-red .selection-text-color-blue")?.textContent, "inner");
});

test("formatting at either edge keeps its original node without empty shells", () => {
  const element = root("<p>[<strong>太字</strong> と <em>斜体</em>]{red}</p>");
  const bold = element.querySelector("strong");
  const italic = element.querySelector("em");
  renderColors(element);
  assert.equal(element.querySelectorAll("strong").length, 1);
  assert.equal(element.querySelectorAll("em").length, 1);
  assert.equal(element.querySelector(".selection-text-color-red strong"), bold);
  assert.equal(element.querySelector(".selection-text-color-red em"), italic);
});

test("preserves native links and their event handlers inside a colored span", () => {
  const element = root('<p>[See <a href="note">note</a> here]{green}</p>');
  const link = element.querySelector("a")!;
  let clicked = false;
  link.addEventListener("click", event => { event.preventDefault(); clicked = true; });
  renderColors(element);
  assert.equal(element.querySelector(".selection-text-color-green a"), link);
  link.click();
  assert.equal(clicked, true);
});

test("ignores code, math, link labels and embeds without merging separate blocks", () => {
  const element = root('<pre><code>[code]{red}</code></pre><p><code>[inline]{red}</code> <a href="#">[link]{red}</a> <span class="math">[math]{red}</span></p><div class="internal-embed">[embed]{red}</div><p>[start</p><p>end]{red}</p><p>[text]{purple}</p>');
  renderColors(element);
  assert.equal(element.querySelectorAll('[class^="selection-text-color-"]').length, 1);
  assert.equal(element.querySelector("code")?.textContent, "[code]{red}");
  assert.equal(element.querySelector(".selection-text-color-purple")?.textContent, "text");
});

test("supports headings, list items and table cells; keeps legacy HTML colors", () => {
  const element = root('<h2>[Heading]{red}</h2><ul><li>[Item]{green}</li></ul><table><tr><td>[Cell]{yellow}</td></tr></table><p><span style="color: #123456;">Existing</span></p>');
  renderColors(element);
  assert.equal(element.querySelector("h2 span")?.textContent, "Heading");
  assert.equal(element.querySelector("li span")?.textContent, "Item");
  assert.equal(element.querySelector("td span")?.textContent, "Cell");
  assert.equal(element.querySelector("span[style]")?.getAttribute("style"), "color: #123456;");
});
