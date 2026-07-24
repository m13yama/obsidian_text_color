import {
  App,
  Editor,
  EditorPosition,
  Menu,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
} from "obsidian";

interface ColorOption {
  name: string;
  color: string;
}

interface TextColorSettings {
  colors: ColorOption[];
}

const DEFAULT_COLORS: ReadonlyArray<Readonly<ColorOption>> = [
  { name: "レッド", color: "#E05252" },
  { name: "オレンジ", color: "#D97706" },
  { name: "イエロー", color: "#B88700" },
  { name: "グリーン", color: "#2F9E44" },
  { name: "ブルー", color: "#3B82F6" },
  { name: "パープル", color: "#8B5CF6" },
];

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

function copyDefaultColors(): ColorOption[] {
  return DEFAULT_COLORS.map(({ name, color }) => ({ name, color }));
}

function normalizeSettings(data: unknown): TextColorSettings {
  const savedColors =
    typeof data === "object" &&
    data !== null &&
    "colors" in data &&
    Array.isArray(data.colors)
      ? data.colors
      : [];

  return {
    colors: DEFAULT_COLORS.map((fallback, index) => {
      const saved = savedColors[index];
      if (typeof saved !== "object" || saved === null) {
        return { ...fallback };
      }

      const savedName = "name" in saved ? saved.name : undefined;
      const savedColor = "color" in saved ? saved.color : undefined;
      const name =
        typeof savedName === "string" && savedName.trim().length > 0
          ? savedName.trim().slice(0, 30)
          : fallback.name;
      const color =
        typeof savedColor === "string" && HEX_COLOR.test(savedColor)
          ? savedColor.toUpperCase()
          : fallback.color;

      return { name, color };
    }),
  };
}

function advancePosition(start: EditorPosition, text: string): EditorPosition {
  const lines = text.split("\n");
  if (lines.length === 1) {
    return { line: start.line, ch: start.ch + text.length };
  }

  return {
    line: start.line + lines.length - 1,
    ch: lines[lines.length - 1]?.length ?? 0,
  };
}

export default class SelectionTextColorPlugin extends Plugin {
  settings: TextColorSettings = { colors: copyDefaultColors() };

  async onload(): Promise<void> {
    this.settings = normalizeSettings(await this.loadData());
    this.addSettingTab(new TextColorSettingTab(this.app, this));

    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu, editor) => {
        this.addTextColorMenu(menu, editor);
      }),
    );
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  async resetColors(): Promise<void> {
    this.settings.colors = copyDefaultColors();
    await this.saveSettings();
  }

  private addTextColorMenu(menu: Menu, editor: Editor): void {
    const selectedText = editor.getSelection();
    if (selectedText.length === 0) {
      return;
    }

    const from = editor.getCursor("from");
    const to = editor.getCursor("to");

    menu.addSeparator();
    menu.addItem((item) => {
      item.setTitle("文字色").setIcon("palette").setIsLabel(true);
    });

    for (const option of this.settings.colors) {
      menu.addItem((colorItem) => {
        const title = createFragment((fragment) => {
          fragment.createSpan({
            cls: "selection-text-color-swatch",
            attr: { style: `background-color: ${option.color}` },
          });
          fragment.createSpan({
            cls: "selection-text-color-option-name",
            text: option.name,
          });
          fragment.createSpan({
            cls: "selection-text-color-option-code",
            text: option.color.toUpperCase(),
          });
        });

        colorItem.setTitle(title).onClick(() => {
          this.applyColor(editor, selectedText, from, to, option.color);
        });
      });
    }
  }

  private applyColor(
    editor: Editor,
    selectedText: string,
    from: EditorPosition,
    to: EditorPosition,
    color: string,
  ): void {
    if (!HEX_COLOR.test(color)) {
      new Notice("文字色の設定が正しくありません。設定画面で色を選び直してください。");
      return;
    }

    const prefix = `<span style="color: ${color.toUpperCase()};">`;
    const suffix = "</span>";
    editor.replaceRange(`${prefix}${selectedText}${suffix}`, from, to);

    const selectionStart = advancePosition(from, prefix);
    const selectionEnd = advancePosition(selectionStart, selectedText);
    editor.setSelection(selectionStart, selectionEnd);
    editor.focus();
  }
}

class TextColorSettingTab extends PluginSettingTab {
  constructor(
    app: App,
    private readonly textColorPlugin: SelectionTextColorPlugin,
  ) {
    super(app, textColorPlugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass("selection-text-color-settings");

    new Setting(containerEl)
      .setName("右クリックメニューの6色")
      .setDesc(
        "表示名と色を変更できます。変更後に開いたメニューから新しい設定が使われます。",
      )
      .setHeading();

    this.textColorPlugin.settings.colors.forEach((option, index) => {
      const setting = new Setting(containerEl)
        .setName(`カラー ${index + 1}`)
        .setDesc(option.color.toUpperCase());

      setting.settingEl.style.setProperty(
        "--selection-text-color-preview",
        option.color,
      );
      setting.settingEl.addClass("selection-text-color-setting-row");

      setting.addText((text) => {
        text
          .setPlaceholder(`カラー ${index + 1}の表示名`)
          .setValue(option.name)
          .onChange(async (value) => {
            const trimmed = value.trim();
            if (trimmed.length > 0) {
              option.name = trimmed.slice(0, 30);
              await this.textColorPlugin.saveSettings();
            }
          });
        text.inputEl.setAttr("aria-label", `カラー ${index + 1}の表示名`);
      });

      setting.addColorPicker((picker) => {
        picker.setValue(option.color).onChange(async (value) => {
          if (!HEX_COLOR.test(value)) {
            return;
          }
          option.color = value.toUpperCase();
          setting.setDesc(option.color);
          setting.settingEl.style.setProperty(
            "--selection-text-color-preview",
            option.color,
          );
          await this.textColorPlugin.saveSettings();
        });
      });
    });

    new Setting(containerEl)
      .setName("初期パレットに戻す")
      .setDesc("6色の表示名と色を、インストール時の状態に戻します。")
      .addButton((button) => {
        button
          .setButtonText("6色をリセット")
          .setWarning()
          .onClick(async () => {
            await this.textColorPlugin.resetColors();
            this.display();
            new Notice("文字色のパレットを初期値に戻しました。");
          });
      });
  }
}
