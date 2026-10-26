export const COLORS = [
  { id: "red", name: "Red", color: "#E05252" },
  { id: "orange", name: "Orange", color: "#D97706" },
  { id: "yellow", name: "Yellow", color: "#B88700" },
  { id: "green", name: "Green", color: "#2F9E44" },
  { id: "blue", name: "Blue", color: "#3B82F6" },
  { id: "purple", name: "Purple", color: "#8B5CF6" },
] as const;

export type ColorId = (typeof COLORS)[number]["id"];

export interface TextRange {
  from: number;
  to: number;
}

export interface ColorRange extends TextRange {
  contentFrom: number;
  contentTo: number;
  color: ColorId;
}

const SUFFIX = /^\{(red|orange|yellow|green|blue|purple)\}/;

/** Find inline color spans, respecting balanced brackets and escaped delimiters. */
export function findColors(text: string, excluded: readonly TextRange[] = []): ColorRange[] {
  const result: ColorRange[] = [];
  const openings: number[] = [];
  let excludedIndex = 0;

  for (let index = 0; index < text.length; index++) {
    while (excluded[excludedIndex] && excluded[excludedIndex]!.to <= index) excludedIndex++;
    const exclusion = excluded[excludedIndex];
    if (exclusion && exclusion.from <= index) {
      index = exclusion.to - 1;
      continue;
    }
    const char = text[index];
    if (char === "\\") {
      index++;
    } else if (char === "\n" || char === "\r") {
      openings.length = 0;
    } else if (char === "[") {
      openings.push(index);
    } else if (char === "]") {
      const from = openings.pop();
      const suffix = SUFFIX.exec(text.slice(index + 1));
      if (from === undefined || index === from + 1 || !suffix) continue;
      // Do not turn images, wiki links, or footnote syntax into color spans.
      if (text[from - 1] === "!" || text[from + 1] === "^" || (text[from + 1] === "[" && text[index - 1] === "]")) continue;
      const to = index + 1 + suffix[0].length;
      if (excluded.some(range => range.from < to && range.to > index)) continue;
      result.push({ from, to, contentFrom: from + 1, contentTo: index, color: suffix[1] as ColorId });
      index = to - 1;
    }
  }

  return result.sort((left, right) => left.from - right.from);
}

export function colorClass(color: ColorId): string {
  return `selection-text-color-${color}`;
}

export function colorWrappers(text: string, color: ColorId): { prefix: string; suffix: string } {
  const shorthand = `[${text}]{${color}}`;
  // Preserve text that cannot safely be enclosed in inline bracket notation.
  if (/[\r\n]/.test(text) || !findColors(shorthand).some(range => range.from === 0 && range.to === shorthand.length)) {
    const preset = COLORS.find(option => option.id === color)!;
    return { prefix: `<span style="color: ${preset.color};">`, suffix: "</span>" };
  }
  return { prefix: "[", suffix: `]{${color}}` };
}
