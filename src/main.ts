import { editorLivePreviewField, MarkdownView, Plugin } from "obsidian";
import type { Editor, EditorPosition, Menu } from "obsidian";
import { COLORS, colorWrappers } from "./colors";
import type { ColorId } from "./colors";
import { colorEditorExtension } from "./editor";
import { renderColors } from "./render";

function advancePosition(start: EditorPosition, text: string): EditorPosition {
  const lines = text.split("\n");
  if (lines.length === 1) {
    return { line: start.line, ch: start.ch + text.length };
  }
  return { line: start.line + lines.length - 1, ch: lines[lines.length - 1]?.length ?? 0 };
}

export default class SelectionTextColorPlugin extends Plugin {
  async onload(): Promise<void> {
    this.registerMarkdownPostProcessor(element => renderColors(element));
    this.registerEditorExtension(colorEditorExtension(editorLivePreviewField));

    COLORS.forEach((option, index) => {
      this.addCommand({
        // Keep the IDs so existing hotkey assignments continue to work.
        id: `apply-preset-color-${index + 1}`,
        name: `Apply ${option.name.toLowerCase()} to selected text`,
        editorCheckCallback: (checking, editor) => {
          const selectedText = editor.getSelection();
          if (selectedText.length === 0) return false;
          if (!checking) {
            this.applyColor(editor, selectedText, editor.getCursor("from"), editor.getCursor("to"), option.id);
          }
          return true;
        },
      });
    });

    this.registerEvent(this.app.workspace.on("editor-menu", (menu, editor) => {
      this.addTextColorMenu(menu, editor);
    }));

    this.app.workspace.onLayoutReady(() => {
      this.app.workspace.iterateAllLeaves(leaf => {
        if (leaf.view instanceof MarkdownView) leaf.view.previewMode.rerender(true);
      });
    });
  }

  private addTextColorMenu(menu: Menu, editor: Editor): void {
    const selectedText = editor.getSelection();
    if (selectedText.length === 0) return;
    const from = editor.getCursor("from");
    const to = editor.getCursor("to");

    menu.addSeparator();
    menu.addItem(item => item.setTitle("Text color").setIcon("palette").setIsLabel(true));
    for (const option of COLORS) {
      menu.addItem(item => {
        const title = createFragment(fragment => {
          fragment.createSpan({ cls: "selection-text-color-swatch", attr: { style: `background-color: ${option.color}` } });
          fragment.createSpan({ cls: "selection-text-color-option-name", text: option.name });
          fragment.createSpan({ cls: "selection-text-color-option-code", text: `{${option.id}}` });
        });
        item.setTitle(title).onClick(() => this.applyColor(editor, selectedText, from, to, option.id));
      });
    }
  }

  private applyColor(editor: Editor, selectedText: string, from: EditorPosition, to: EditorPosition, color: ColorId): void {
    const { prefix, suffix } = colorWrappers(selectedText, color);
    editor.replaceRange(`${prefix}${selectedText}${suffix}`, from, to);
    const selectionStart = advancePosition(from, prefix);
    editor.setSelection(selectionStart, advancePosition(selectionStart, selectedText));
    editor.focus();
  }
}
