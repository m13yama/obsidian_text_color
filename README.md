# Selection Text Color

An Obsidian plugin that colors text with a short, readable syntax and six fixed presets.

## Usage

Write the text in brackets followed by a lowercase color name:

```markdown
[赤い文字]{red}
[オレンジの文字]{orange}
[黄色い文字]{yellow}
[緑の文字]{green}
[青い文字]{blue}
[紫の文字]{purple}

[**Bold text** can also be colored]{red}
```

Colors appear in reading mode, Live Preview, and source mode. In Live Preview, the brackets and color name are hidden until the cursor or selection enters the colored text. Source mode always shows the full notation. Put examples in backticks or a fenced code block to display the syntax literally.

You can also select text, right-click, and choose a preset under **Text color** to insert the same notation. The text inside the brackets stays selected.

Short notation is for text on a single line. Selections containing line breaks or brackets that would conflict with the notation use the previous HTML `span` format. Existing notes using `<span style="color: …;">` continue to display their saved colors.

The short notation requires this plugin to display colors. With the plugin disabled, notes still contain readable text and color names.

## Commands and hotkeys

Select text, open the command palette, and run **Selection Text Color: Apply red to selected text** (or another color). These commands are only available when text is selected.

To assign a hotkey, search for **Selection Text Color** in **Settings → Hotkeys**. Existing numbered command IDs and hotkey assignments are preserved: 1 = red, 2 = orange, 3 = yellow, 4 = green, 5 = blue, 6 = purple.

## Fixed palette

The presets are Red, Orange, Yellow, Green, Blue, and Purple. The colors avoid excessive brightness to help keep them distinguishable in both light and dark themes.

Color names and values are now fixed, so the source text always identifies the color. Previous custom palette settings no longer affect commands; colors already saved in HTML spans remain unchanged.

## Manual installation

1. Run `npm install`.
2. Run `npm run build`.
3. Copy `manifest.json`, `main.js`, and `styles.css` to `.obsidian/plugins/selection-text-color/` inside your vault.
4. Restart Obsidian and enable the plugin in **Settings → Community plugins**.

## Development

```bash
npm install
npm test
npm run dev
```

`npm run dev` watches for source changes and rebuilds `main.js` automatically.
