import assert from "node:assert/strict";
import { test } from "node:test";
import { COLORS, colorWrappers, findColors } from "../src/colors.ts";

test("all six readable names preserve Japanese text and emoji offsets", () => {
  for (const color of COLORS) {
    const content = "赤い文字 🐈";
    const text = `前 [${content}]{${color.id}} 後`;
    const [match] = findColors(text);
    assert.equal(match?.color, color.id);
    assert.equal(text.slice(match!.contentFrom, match!.contentTo), content);
    assert.equal(text.slice(match!.from, match!.to), `[${content}]{${color.id}}`);
  }
});

test("balanced brackets, adjacent colors, and nested colors", () => {
  assert.deepEqual(findColors("[a [bracket] b]{red}[c]{blue}").map(match => match.color), ["red", "blue"]);
  assert.deepEqual(findColors("[[blue]{blue} red]{red}").map(match => match.color), ["red", "blue"]);
});

test("unknown colors, incomplete spans, empty spans, and multiple lines stay literal", () => {
  for (const text of ["[x]{pink}", "[x]{1}", "[x]{RED}", "[x]{red", "[]{red}", "[a\nb]{red}", "![image]{red}", "[[note]]{red}", "[^note]{red}"]) {
    assert.deepEqual(findColors(text), [], text);
  }
});

test("escaped delimiters and excluded syntax are not treated as color markers", () => {
  assert.deepEqual(findColors(String.raw`\[x]{red} [x\]{blue}`), []);
  const text = "[code]{red} [text]{blue}";
  assert.deepEqual(findColors(text, [{ from: 0, to: 11 }]).map(match => match.color), ["blue"]);
  assert.deepEqual(findColors("[x]{red}", [{ from: 3, to: 8 }]), []);
});

test("commands use named shorthand, keeping multiline selections in the existing HTML format", () => {
  assert.deepEqual(colorWrappers("文字", "red"), { prefix: "[", suffix: "]{red}" });
  assert.deepEqual(colorWrappers("one\ntwo", "blue"), { prefix: '<span style="color: #3B82F6;">', suffix: "</span>" });
});

test("commands preserve literal brackets when shorthand would be ambiguous", () => {
  for (const text of ["a]b", "a[b", "[brackets]"]) {
    assert.deepEqual(colorWrappers(text, "red"), { prefix: '<span style="color: #E05252;">', suffix: "</span>" });
  }
});
