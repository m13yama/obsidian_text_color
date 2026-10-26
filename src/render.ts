import { colorClass, findColors } from "./colors";
import type { TextRange } from "./colors";

const BLOCKS = /^(P|DIV|LI|UL|OL|BLOCKQUOTE|H[1-6]|TABLE|THEAD|TBODY|TR|TH|TD|HR|BR)$/;
const INLINE = /^(SPAN|STRONG|EM|B|I|S|DEL|MARK|A|SUB|SUP|SMALL|CODE)$/;
const IGNORED = "pre, code, script, style, textarea, svg, .math, .internal-embed";

interface TextPart extends TextRange {
  node: Text;
}

/** Work with DOM ranges so bold, emphasis, and links keep their native markup. */
function renderRun(parts: TextPart[], excluded: TextRange[]): void {
  const text = parts.map(part => part.node.data).join("");
  const matches = findColors(text, excluded);
  if (matches.length === 0) return;
  const doc = parts[0]!.node.ownerDocument;
  const point = (offset: number, end: boolean): [Text, number] => {
    const part = parts.find(part => end ? part.from < offset && part.to >= offset : part.from <= offset && part.to > offset)!;
    return [part.node, offset - part.from];
  };
  const range = (from: number, to: number): Range => {
    const result = doc.createRange();
    result.setStart(...point(from, false));
    result.setEnd(...point(to, true));
    return result;
  };

  // Live ranges track changes while nested colors are wrapped from inside out.
  const spans = matches.map(match => ({
    color: match.color,
    opening: range(match.from, match.contentFrom),
    content: range(match.contentFrom, match.contentTo),
    closing: range(match.contentTo, match.to),
  }));
  for (const span of spans.reverse()) {
    // Include whole inline elements when a boundary lands at their edge. This
    // preserves their nodes and avoids leaving empty bold/italic shells behind.
    while (span.content.startOffset === 0 && span.content.startContainer.parentNode &&
        (span.content.startContainer.nodeType === 3 ||
         INLINE.test((span.content.startContainer as Element).tagName))) {
      span.content.setStartBefore(span.content.startContainer);
    }
    while (span.content.endContainer.parentNode &&
        span.content.endOffset === (span.content.endContainer.nodeType === 3
          ? (span.content.endContainer as Text).length : span.content.endContainer.childNodes.length) &&
        (span.content.endContainer.nodeType === 3 ||
         INLINE.test((span.content.endContainer as Element).tagName))) {
      span.content.setEndAfter(span.content.endContainer);
    }
    span.closing.deleteContents();
    span.opening.deleteContents();
    const wrapper = doc.createElement("span");
    wrapper.className = colorClass(span.color);
    wrapper.append(span.content.extractContents());
    span.content.insertNode(wrapper);
  }
}

export function renderColors(root: HTMLElement): void {
  if (root.closest(IGNORED)) return;
  let parts: TextPart[] = [];
  let excluded: TextRange[] = [];
  let length = 0;
  const flush = (): void => {
    renderRun(parts, excluded);
    parts = [];
    excluded = [];
    length = 0;
  };
  const visit = (node: Node, skip: boolean): void => {
    if (node.nodeType === 3) {
      const text = node as Text;
      if (text.length === 0) return;
      const part = { node: text, from: length, to: length + text.length };
      parts.push(part);
      if (skip) excluded.push({ from: part.from, to: part.to });
      length = part.to;
    } else if (node.nodeType === 1) {
      const element = node as HTMLElement;
      const block = BLOCKS.test(element.tagName);
      if (block) flush();
      const ignored = skip || element.matches(IGNORED) || element.tagName === "A";
      for (const child of Array.from(node.childNodes)) visit(child, ignored);
      if (block) flush();
    }
  };
  visit(root, false);
  flush();
}
