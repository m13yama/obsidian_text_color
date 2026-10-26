import { syntaxTree } from "@codemirror/language";
import type { Extension, Range, StateField } from "@codemirror/state";
import { Decoration, ViewPlugin } from "@codemirror/view";
import type { DecorationSet, EditorView, ViewUpdate } from "@codemirror/view";
import { colorClass, findColors } from "./colors";
import type { TextRange } from "./colors";

function excludedSyntax(tree: ReturnType<typeof syntaxTree>, from: number, to: number): TextRange[] {
  const ranges: TextRange[] = [];
  tree.iterate({
    from, to,
    enter(node) {
      // HyperMD labels ordinary [text] as a bare link even without a URL.
      // Those brackets are the start of our shorthand, so keep them eligible.
      const actualLink = /link/i.test(node.name) && !/hmd-barelink/i.test(node.name);
      if (/code|comment|frontmatter|html|math|url|escape/i.test(node.name) || actualLink) {
        ranges.push({ from: Math.max(from, node.from) - from, to: Math.min(to, node.to) - from });
        return false;
      }
      return undefined;
    },
  });
  return ranges;
}

export function colorDecorations(view: EditorView, livePreview: boolean, tree = syntaxTree(view.state)): DecorationSet {
  const decorations: Range<Decoration>[] = [];
  const visited = new Set<number>();
  const hidden = new Set<string>();
  const hide = (from: number, to: number): void => {
    const key = `${from}:${to}`;
    if (!hidden.has(key)) decorations.push(Decoration.replace({}).range(from, to));
    hidden.add(key);
  };
  for (const visible of view.visibleRanges) {
    for (let position = visible.from; position <= visible.to;) {
      const line = view.state.doc.lineAt(position);
      position = line.to + 1;
      if (visited.has(line.number)) continue;
      visited.add(line.number);
      for (const match of findColors(line.text, excludedSyntax(tree, line.from, line.to))) {
        const from = line.from + match.from;
        const to = line.from + match.to;
        decorations.push(Decoration.mark({ class: colorClass(match.color) }).range(line.from + match.contentFrom, line.from + match.contentTo));
        const editing = view.state.selection.ranges.some(range => range.from <= to && range.to >= from);
        if (livePreview && !editing) {
          hide(from, line.from + match.contentFrom);
          hide(line.from + match.contentTo, to);
          // HyperMD keeps emphasis markers visible in bare-link labels. Hide
          // those markers along with our own while retaining native styling.
          tree.iterate({
            from: line.from + match.contentFrom,
            to: line.from + match.contentTo,
            enter(node) {
              if (/hmd-barelink/.test(node.name) &&
                  /formatting-(strong|em|strikethrough|highlight|code)(_|$)/.test(node.name) &&
                  node.from >= line.from + match.contentFrom && node.to <= line.from + match.contentTo) {
                hide(node.from, node.to);
              }
            },
          });
        }
      }
    }
  }
  return Decoration.set(decorations, true);
}

export function colorEditorExtension(editorLivePreviewField: StateField<boolean>): Extension {
  return ViewPlugin.fromClass(class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = colorDecorations(view, view.state.field(editorLivePreviewField, false) === true);
    }

    update(update: ViewUpdate): void {
      if (update.docChanged || update.viewportChanged || update.selectionSet ||
          syntaxTree(update.startState) !== syntaxTree(update.state) ||
          update.startState.field(editorLivePreviewField, false) !== update.state.field(editorLivePreviewField, false)) {
        this.decorations = colorDecorations(update.view, update.state.field(editorLivePreviewField, false) === true);
      }
    }
  }, { decorations: plugin => plugin.decorations });
}
