import { editorLivePreviewField, MarkdownView, Plugin } from "obsidian";
import type { Editor, EditorPosition, Menu } from "obsidian";
import { COLORS, colorWrappers } from "./colors";
import type { ColorId } from "./colors";
import { colorEditorExtension } from "./editor";
import { renderColors } from "./render";
import { PaletteStyles } from "./palette-styles";
import { normalizeSettings } from "./settings";
import { TextColorSettingTab } from "./settings-tab";

function advancePosition(start: EditorPosition, text: string): EditorPosition {
  const lines = text.split("\n");
  if (lines.length === 1) {
    return { line: start.line, ch: start.ch + text.length };
  }
  return { line: start.line + lines.length - 1, ch: lines[lines.length - 1]?.length ?? 0 };
}

export default class SelectionTextColorPlugin extends Plugin {
  settings = normalizeSettings(undefined);
  private readonly paletteStyles = new PaletteStyles();

  async onload(): Promise<void> {
    this.settings = normalizeSettings(await this.loadData());
    this.paletteStyles.setColors(this.settings.colors);
    this.paletteStyles.attach(document);
    this.register(() => this.paletteStyles.destroy());
    this.registerEvent(this.app.workspace.on("window-open", (_workspaceWindow, win) => this.paletteStyles.attach(win.document)));
    this.registerEvent(this.app.workspace.on("window-close", (_workspaceWindow, win) => this.paletteStyles.detach(win.document)));
    this.addSettingTab(new TextColorSettingTab(this.app, this));
    this.registerMarkdownPostProcessor(element => {
      this.paletteStyles.attach(element.ownerDocument);
      renderColors(element);
    });
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
        this.paletteStyles.attach(leaf.view.containerEl.ownerDocument);
        if (leaf.view instanceof MarkdownView) leaf.view.previewMode.rerender(true);
      });
    });
  }

  async saveSettings(): Promise<void> {
    this.paletteStyles.setColors(this.settings.colors);
    await this.saveData(this.settings);
  }

  async resetColors(): Promise<void> {
    this.settings = normalizeSettings(undefined);
    await this.saveSettings();
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
          fragment.createSpan({ cls: "selection-text-color-swatch", attr: { style: `background-color: ${this.settings.colors[option.id]}` } });
          fragment.createSpan({ cls: "selection-text-color-option-name", text: option.name });
          fragment.createSpan({ cls: "selection-text-color-option-code", text: `{${option.id}}` });
        });
        item.setTitle(title).onClick(() => this.applyColor(editor, selectedText, from, to, option.id));
      });
    }
  }

  private applyColor(editor: Editor, selectedText: string, from: EditorPosition, to: EditorPosition, color: ColorId): void {
    const { prefix, suffix } = colorWrappers(selectedText, color, this.settings.colors[color]);
    editor.replaceRange(`${prefix}${selectedText}${suffix}`, from, to);
    const selectionStart = advancePosition(from, prefix);
    editor.setSelection(selectionStart, advancePosition(selectionStart, selectedText));
    editor.focus();
  }
}
