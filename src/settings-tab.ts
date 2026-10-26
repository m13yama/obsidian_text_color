import { PluginSettingTab, Setting } from "obsidian";
import type { App } from "obsidian";
import { COLORS, HEX_COLOR } from "./colors";
import type SelectionTextColorPlugin from "./main";

export class TextColorSettingTab extends PluginSettingTab {
  constructor(app: App, private readonly textColorPlugin: SelectionTextColorPlugin) {
    super(app, textColorPlugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    new Setting(containerEl)
      .setName("Text color palette")
      .setDesc("Color names in notes stay fixed. Choose their display colors; existing shorthand updates immediately.")
      .setHeading();

    for (const preset of COLORS) {
      const value = this.textColorPlugin.settings.colors[preset.id];
      const setting = new Setting(containerEl)
        .setName(preset.id)
        .setDesc(`[text]{${preset.id}} · ${value}`);
      setting.addColorPicker(picker => {
        picker.setValue(value).onChange(async color => {
          if (!HEX_COLOR.test(color)) return;
          this.textColorPlugin.settings.colors[preset.id] = color.toUpperCase();
          setting.setDesc(`[text]{${preset.id}} · ${color.toUpperCase()}`);
          await this.textColorPlugin.saveSettings();
        });
      });
      setting.controlEl.querySelector('input[type="color"]')?.setAttribute("aria-label", `Display color for ${preset.id}`);
    }

    new Setting(containerEl)
      .setName("Restore default colors")
      .setDesc("Reset all six display colors to the default palette.")
      .addButton(button => button.setButtonText("Restore defaults").onClick(async () => {
        await this.textColorPlugin.resetColors();
        this.display();
      }));
  }
}
