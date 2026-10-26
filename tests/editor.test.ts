import assert from "node:assert/strict";
import { test } from "node:test";
import { EditorState } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { NodeType, Tree } from "@lezer/common";
import { colorDecorations } from "../src/editor.ts";

const doc = "[red text]{red} and [blue text]{blue}\nOutside";

function decorations(livePreview: boolean, anchor: number, head = anchor) {
  const state = EditorState.create({ doc, selection: { anchor, head } });
  const view = { state, visibleRanges: [{ from: 0, to: doc.length }] } as EditorView;
  const result: { from: number; to: number; class?: string }[] = [];
  colorDecorations(view, livePreview).between(0, doc.length, (from, to, decoration) => {
    result.push({ from, to, class: decoration.spec.class });
  });
  assert.equal(state.doc.toString(), doc, "Rendering must not mutate the note");
  return result;
}

test("Live Preview hides delimiters away from the cursor", () => {
  const result = decorations(true, doc.length);
  assert.deepEqual(result.filter(item => item.class).map(item => item.class), ["selection-text-color-red", "selection-text-color-blue"]);
  assert.deepEqual(result.filter(item => !item.class).map(item => doc.slice(item.from, item.to)), ["[", "]{red}", "[", "]{blue}"]);
});

test("editing a colored span reveals its delimiters", () => {
  assert.equal(decorations(true, 3).filter(item => !item.class).length, 2);
  assert.equal(decorations(true, 3, 30).filter(item => !item.class).length, 0);
});

test("source mode always leaves all delimiters visible", () => {
  assert.equal(decorations(false, doc.length).filter(item => !item.class).length, 0);
});

test("HyperMD bare-link tokens are colored, emphasis markers hidden, and code excluded", () => {
  const source = "[**bold**]{red}\n`[code]{blue}`\nOutside";
  const state = EditorState.create({ doc: source, selection: { anchor: source.length } });
  const view = { state, visibleRanges: [{ from: 0, to: source.length }] } as EditorView;
  // Token names and boundaries captured from an actual Obsidian editor.
  const tokens: [number, number, string][] = [
    [0, 1, "formatting_formatting-link_hmd-barelink_link"],
    [1, 3, "formatting_formatting-strong_hmd-barelink_link_strong"],
    [3, 7, "hmd-barelink_link_strong"],
    [7, 9, "formatting_formatting-strong_hmd-barelink_link_strong"],
    [9, 10, "formatting_formatting-link_hmd-barelink_link"],
    [16, 30, "inline-code"],
  ];
  const tree = new Tree(NodeType.define({ id: 0, name: "Document" }),
    tokens.map(([from, to, name], index) => new Tree(NodeType.define({ id: index + 1, name }), [], [], to - from)),
    tokens.map(([from]) => from), source.length);
  const colors: string[] = [];
  const hidden: string[] = [];
  colorDecorations(view, true, tree).between(0, source.length, (from, to, decoration) => {
    if (decoration.spec.class) colors.push(source.slice(from, to));
    else hidden.push(source.slice(from, to));
  });
  assert.deepEqual(colors, ["**bold**"]);
  assert.deepEqual(hidden, ["[", "**", "**", "]{red}"]);
});
