import { COLORS, HEX_COLOR } from "./colors";
import type { ColorId } from "./colors";

export type Palette = Record<ColorId, string>;

export interface TextColorSettings {
  colors: Palette;
}

export function normalizeSettings(data: unknown): TextColorSettings {
  const saved = typeof data === "object" && data !== null && "colors" in data ? data.colors : undefined;
  const colors = {} as Palette;
  for (const [index, preset] of COLORS.entries()) {
    let value: unknown;
    if (Array.isArray(saved)) {
      // Before 0.1.0, colors were stored by command number with editable names.
      // Keep those values, while always using the fixed names in note syntax.
      const option: unknown = saved[index];
      if (typeof option === "object" && option !== null && "color" in option) value = option.color;
    } else if (typeof saved === "object" && saved !== null && preset.id in saved) {
      value = (saved as Record<string, unknown>)[preset.id];
    }
    colors[preset.id] = typeof value === "string" && HEX_COLOR.test(value.trim())
      ? value.trim().toUpperCase() : preset.color;
  }
  return { colors };
}
