import { COLORS } from "./colors";
import { normalizeSettings } from "./settings";
import type { Palette } from "./settings";

const STYLE_ID = "selection-text-color-palette";

/** Share the palette with reading views, editors, and separate Obsidian windows. */
export class PaletteStyles {
  private readonly styles = new Map<Document, HTMLStyleElement>();
  private css = "";

  setColors(colors: Palette): void {
    const palette = normalizeSettings({ colors }).colors;
    this.css = `:root {\n${COLORS.map(preset => `  --selection-text-color-${preset.id}: ${palette[preset.id]};`).join("\n")}\n}`;
    for (const style of this.styles.values()) style.textContent = this.css;
  }

  attach(doc: Document): void {
    if (this.styles.has(doc)) return;
    // Popout windows may already contain a copy of the main window's styles.
    const style = doc.querySelector<HTMLStyleElement>(`style#${STYLE_ID}`) ?? doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = this.css;
    if (!style.isConnected) doc.head.append(style);
    this.styles.set(doc, style);
  }

  detach(doc: Document): void {
    this.styles.get(doc)?.remove();
    this.styles.delete(doc);
  }

  destroy(): void {
    for (const doc of this.styles.keys()) this.detach(doc);
  }
}
