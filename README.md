# Selection Text Color

Obsidian のエディタで選択した文字に、右クリックメニューから色を付けるプラグインです。

## 使い方

1. 編集画面で色を変えたい文字を選択します。
2. 選択範囲を右クリックします。
3. 「文字色」の下に並ぶ6色のパレットから色を選びます。

選択範囲は次のような HTML の `span` で囲まれます。色指定はノート自体に保存されるため、プラグインを無効化しても維持されます。

```html
<span style="color: #E05252;">色を付けた文字</span>
```

## パレットの変更

「設定」→「コミュニティプラグイン」→「Selection Text Color」で、6項目それぞれの表示名と色を変更できます。

初期パレットはレッド、オレンジ、イエロー、グリーン、ブルー、パープルです。ライトテーマとダークテーマのどちらでも判別しやすいよう、明るすぎない色を選んでいます。

## インストール（手動）

1. `npm install` を実行します。
2. `npm run build` を実行します。
3. `manifest.json`、`main.js`、`styles.css` を Vault 内の `.obsidian/plugins/selection-text-color/` にコピーします。
4. Obsidian を再起動し、「設定」→「コミュニティプラグイン」から有効にします。

## 開発

```bash
npm install
npm run dev
```

`npm run dev` はソースの変更を監視して `main.js` を再ビルドします。
