# Selection Text Color

An Obsidian plugin that colors selected text using the editor context menu or commands.

## Usage

1. Select the text you want to color in the editor.
2. Right-click the selection.
3. Choose one of the six preset colors under **Text color**.

The selected text is wrapped in an HTML `span` like this. The color is saved in the note itself, so it remains even if you disable the plugin.

```html
<span style="color: #E05252;">Colored text</span>
```

## Commands and hotkeys

Select text, open the command palette, and run **Selection Text Color: Apply color 1 to selected text** through **Apply color 6 to selected text**. Each command uses the corresponding numbered color in the plugin settings. These commands are only available when text is selected.

To assign a hotkey to each color command, search for **Selection Text Color** in **Settings → Hotkeys**. Changing a color or resetting the palette takes effect immediately for commands and preserves your hotkey assignments.

## Customize the palette

Open **Settings → Community plugins → Selection Text Color** to change the display name and color of each of the six presets.

The default palette contains Red, Orange, Yellow, Green, Blue, and Purple. The colors avoid excessive brightness to help keep them distinguishable in both light and dark themes.

## Manual installation

1. Run `npm install`.
2. Run `npm run build`.
3. Copy `manifest.json`, `main.js`, and `styles.css` to `.obsidian/plugins/selection-text-color/` inside your vault.
4. Restart Obsidian and enable the plugin in **Settings → Community plugins**.

## Development

```bash
npm install
npm run dev
```

`npm run dev` watches for source changes and rebuilds `main.js` automatically.
