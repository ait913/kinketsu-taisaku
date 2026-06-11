# 金欠対策 — UI Cloudflare dashboard 風 再設計 (視覚 + レイアウトのみ)

> 対象: `client/` の見た目とレイアウトの全面再設計。データモデル・API・挙動は **一切変えない**。
> 前提 doc: [`20260608-mvp-core.md`](./20260608-mvp-core.md) §7 (現行 UI)。本 doc は **§7 の視覚/レイアウト記述を上書きする**（§7.7 の prop 契約・data-testid は温存。後述）。
> デザイン基準: [`Muraki/knowledge/pattern/cloudflare-dashboard-design-language.md`](../../../knowledge/pattern/cloudflare-dashboard-design-language.md)

---

## 0. デザイン哲学の宣言 (Developer 必読・逸脱禁止)

本 UI は **Cloudflare dashboard の視覚言語** に統一する。CF らしさの本質は **塗り・装飾ではなく**:

> **小 radius (2–4px) + 細 border + 控えめ shadow + 14px base + 行高を詰めた高密度 + ニュートラルグレー面 + orange 単一アクセント**

である。「データを主役にする実務ツール」のトーン。装飾を足さず、罫線と余白の縮小で密度を出す。

**禁止事項 (混入すると密度が崩れる)**:
- **aisaba デザイン言語を混ぜない** (ダーク主体・余白広め・線を使わず余白で区切る・中央寄せ — CF と真逆)。
- **ティール/ミント基調 (`#0f766e` `#ccfbf1` `#5eead4` 等) を全廃**。CF ニュートラルグレー + orange アクセントへ全置換。
- **重い塗り・大きな drop-shadow・グラデーション・大 radius (8px超) を使わない**。
- **外部 UI ライブラリ (Chakra/MUI/shadcn 等) を導入しない**。既存の素 Tailwind v4 + 自前コンポーネント構成を維持。

---

## 1. 目的

現行 UI は (a) 中央 880px 固定 1 カラムでデスクトップの横スペースが死んでいる、(b) 素 Tailwind + ティール差し色で「家計簿の試作」感が強い。これを **CF dashboard 風の高密度データ UI** に再設計し、デスクトップでは横幅を使い切る左サイドバー + トップバー + ワイドコンテンツに、テーマは **ライト主 + ダーク + auto(OS追従)** 対応にする。**機能は不変**、見た目とレイアウトだけを変える。

---

## 2. 変更スコープ (Developer への境界線)

### 触ってよい (client/ のみ)

| ファイル | 変更内容 |
|---|---|
| `client/styles.css` | **全面書き換え**。`@theme` に CF トークン、`[data-theme]` 系、全コンポーネント class を CF 調へ。ティール class 全廃 |
| `client/routes/AppShell.tsx` | レスポンシブ nav の再構築 (サイドバー拡張 + トップバー + テーマトグル + アカウント)。後述 §5 |
| `client/components/*.tsx` | restyle (className 変更・構造微調整・新 data-testid 付与)。**prop 契約と既存 data-testid は §8 の規律で温存** |
| `client/routes/MonthView/TrendView/RecurringView/SettingsView/Login.tsx` | レイアウト再構成 (テーブル化・カード化・ツールバー)。**API 呼び出し・query key・mutation は一切変えない** |
| `client/components/format.ts` | 変更不要 (yen フォーマッタはそのまま) |
| 新規: `client/lib/useTheme.ts` | テーマ解決フック (§4) |
| 新規: `client/components/ThemeToggle.tsx` | テーマ 3 択トグル (§7) |
| 新規: `client/components/Table.tsx` 等 (任意) | テーブル/ツールバー共通化。Developer 判断で分割可だが **既存 data-testid を移送すること** |

### 絶対に触らない

- `src/` 配下すべて (backend / schema / services / routes API / auth)。**データモデル・API・挙動・エラーモデルは不変**。
- `client/api/*.ts` (client.ts / types.ts / auth.ts) — DTO 型・fetch ラッパ・authClient は不変。
- query key (`["month"]` `["trend"]` `["forecast"]` `["categories"]` `["tags"]` `["recurring-rules"]` `["settings"]` `["anchor"]` `["records"]`) と invalidate 呼び出しは不変。
- backend テスト (`tests/api`, `src/**/__tests__`) は本 doc の対象外 (UI 再設計は backend 挙動に影響しない)。

> Developer は backend を 1 行も変更しない。本 doc に backend 記述が無いのは意図的。

---

## 3. デザイントークン (`client/styles.css` の `@theme` + `[data-theme]`)

現行 `styles.css` 冒頭の `@theme { --color-mint ... }` を以下で **全置換**する。値は CF knowledge (cf-style-const v3.3.0) 準拠。

```css
@import "tailwindcss";

@theme {
  /* ===== gray (neutral 10 段) ===== */
  --color-gray-0:#1d1f20; --color-gray-1:#36393a; --color-gray-2:#4e5255;
  --color-gray-3:#62676a; --color-gray-4:#72777b; --color-gray-5:#92979b;
  --color-gray-6:#b7bbbd; --color-gray-7:#d5d7d8; --color-gray-8:#eaebeb; --color-gray-9:#f7f7f8;

  /* ===== brand orange (単一アクセント) ===== */
  --color-brand:#f6821f;          /* primary accent (ロゴ orange) */
  --color-brand-hover:#e06d10;    /* orange[5] : hover/active で 1 段濃く */
  --color-brand-soft:#fbdbc1;     /* orange[8] : 淡い背景 (active nav 等) */

  /* ===== hue (必要分のみ) ===== */
  --color-blue-4:#2c7cb0; --color-blue-5:#479ad1; --color-blue-9:#ebf4fa;
  --color-green-3:#31724b; --color-green-5:#46a46c; --color-green-9:#eff8f3;
  --color-red-3:#a01c32;  --color-red-4:#da304c;  --color-red-9:#fcf0f2;
  --color-gold-6:#f4a929; --color-gold-9:#fdf3e2;

  /* ===== semantic ===== */
  --color-success:#46a46c;  /* 収入 (green[5]) */
  --color-danger:#da304c;   /* 支出 (red[4]) */
  --color-warning:#f4a929;  /* gold[6] */
  --color-info:#479ad1;     /* blue[5] : chart 残高線 */

  /* ===== surfaces (light = 既定) ===== */
  --color-bg:#eaebeb;        /* page 背景 (gray[8]) */
  --color-surface:#ffffff;   /* card / table / sheet */
  --color-surface-2:#f7f7f8; /* hover 行 / subtle 背景 (gray[9]) */
  --color-border:#d5d7d8;    /* 罫線 (gray[7]) */
  --color-border-strong:#b7bbbd; /* 強め罫線 (gray[6]) */
  --color-text:#36393a;      /* 本文 (gray[1]) */
  --color-text-muted:#72777b;/* 補助/未確定 (gray[4]) */
  --color-overlay:rgba(0,0,0,.7);

  /* ===== typography ===== */
  --font-sans: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Hiragino Sans", "Noto Sans JP", sans-serif;
  --text-2xs:10px; --text-xs:12px; --text-sm:14px; --text-base:14px;
  --text-lg:16px; --text-xl:20px; --text-2xl:24px; --text-3xl:32px;
  --font-weight-light:300; --font-weight-normal:400; --font-weight-semibold:600; --font-weight-bold:700;
  --leading-solid:1; --leading-title:1.25; --leading-copy:1.5;

  /* ===== radius (CF は小さい) ===== */
  --radius-sm:2px; --radius-md:4px; --radius-lg:6px; --radius-pill:9999px;

  /* ===== shadow (控えめ) ===== */
  --shadow-card:0 1px 2px 0 rgba(0,0,0,.06);
  --shadow-pop:0 0 20px 0 rgba(136,136,136,.30);

  /* ===== spacing (4 基点。Tailwind 既定と合致) ===== */
  --space-1:4px; --space-2:8px; --space-3:12px; --space-4:16px; --space-6:24px; --space-8:32px;

  /* ===== layout 定数 ===== */
  --sidebar-w:240px; --topbar-h:56px; --bottomtab-h:56px; --row-h:40px; --input-h:36px;
}

/* ===== dark : reverse 原則 (明度反転・hue 保持) ===== */
[data-theme="dark"] {
  --color-bg:#1d1d1d;          /* 純黒回避のオフブラック */
  --color-surface:#262626;     /* page より 1 段明るい card */
  --color-surface-2:#303030;   /* hover 行 */
  --color-border:#3a3a3a;
  --color-border-strong:#4e5255;
  --color-text:#eaebeb;        /* gray[8] */
  --color-text-muted:#92979b;  /* gray[5] */
  --color-overlay:rgba(0,0,0,.7);
  --color-brand:#f6821f;       /* orange は視認性高く維持 (dark でも飽和保つ) */
  --color-brand-hover:#f4a15d; /* dark hover は明るい段 (orange[6]) */
  --color-brand-soft:#5b2c06;  /* orange[1] : dark の淡い active 背景 */
  --color-success:#79c698;     /* dark は 1 段明るい段で AA 確保 */
  --color-danger:#ec93a2;
  --color-info:#7cb7de;
  --shadow-card:0 1px 2px 0 rgba(0,0,0,.5);
  --shadow-pop:0 0 20px 0 rgba(0,0,0,.6);
}
```

### 3.1 base/body

```css
* { box-sizing: border-box; }
html { color-scheme: light dark; }
body {
  margin: 0;
  font-family: var(--font-sans);
  font-size: var(--text-base);            /* 14px base */
  line-height: var(--leading-copy);
  background: var(--color-bg);
  color: var(--color-text);
  -webkit-font-smoothing: antialiased;
}
button, input, select { font: inherit; color: inherit; }
button { cursor: pointer; }
```

### 3.2 トークン適用の原則 (Developer 規律)

- 色は **必ず CSS 変数経由** (`var(--color-*)`)。ハードコード hex を新規に書かない (現行コードに残るティール hex は全削除)。
- 半径は `--radius-sm`(2px) を既定。card/sheet/input は `--radius-md`(4px)。pill/badge は `--radius-pill`。**8px 超は使わない**。
- 余白は 4 基点 (4/8/12/16/24/32)。高密度のため行/セルは 8–12px を主に使う。
- フォント: base 14px、caption/meta 12px、セクション見出し 16–20px、ページ見出し 20–24px。**見出しに 32px 超を使わない** (家計簿はデータ密度優先)。

---

## 4. テーマ機構 (light / dark / auto)

[`theme-auto-resolve-data-theme-matchmedia`](../../../knowledge/pattern/theme-auto-resolve-data-theme-matchmedia.md) に準拠。本アプリは **light が既定** (パターン例の dark 既定とは逆) なので、解決の既定だけ light にする。

新規 `client/lib/useTheme.ts`:

```ts
export type ThemeMode = "light" | "dark" | "auto";
const STORAGE_KEY = "kt-theme";

export function resolveTheme(mode: ThemeMode): "light" | "dark" {
  if (mode !== "auto") return mode;
  if (typeof window === "undefined" || !window.matchMedia) return "light"; // 既定 light
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(mode: ThemeMode): void {
  document.documentElement.setAttribute("data-theme", resolveTheme(mode)); // 常設・remove しない
}

// React フック: state(ThemeMode) + localStorage 永続 + auto 時のみ matchMedia change 監視
export function useTheme(): { mode: ThemeMode; setMode: (m: ThemeMode) => void };
```

- 初期化: `main.tsx`(または index.html の inline script) で render 前に localStorage の mode を読み `applyTheme` → FOUC 回避。Developer は **`client/main.tsx` の React mount 前に 1 行 `applyTheme(savedMode ?? "auto")` を入れる**。
- `useTheme` は `data-theme` を常に light/dark のどちらかに設定 (auto でも remove しない)。`mode==="auto"` のときだけ `matchMedia("(prefers-color-scheme: dark)")` の `change` を監視し再適用、cleanup で `removeEventListener`。
- localStorage: light/dark を選んだら保存、auto を選んだら削除 (= 次回 auto 復元)。
- 既定値: localStorage 無しは **`"auto"`**。
- CSS は `[data-theme="dark"]` 単系のみ (§3)。`@media (prefers-color-scheme)` を CSS に書かない (二重経路禁止)。

### 4.1 挙動仕様 (Reviewer テスト根拠)

- 正常系: `resolveTheme("light")==="light"` / `resolveTheme("dark")==="dark"`。
- 正常系: `matchMedia.matches===true` のとき `resolveTheme("auto")==="dark"`、`false` のとき `"light"`。
- 異常系: `window.matchMedia` 未定義のとき `resolveTheme("auto")==="light"` (既定)。
- 正常系: `setMode("dark")` 後に `document.documentElement.getAttribute("data-theme")==="dark"`。
- 正常系: `mode==="auto"` で matchMedia の `change` を発火させると `data-theme` がライブ更新される。
- 正常系: `mode!=="auto"` のとき matchMedia change を発火しても `data-theme` は変わらない。
- 正常系: cleanup (unmount) で `removeEventListener` が呼ばれる。

---

## 5. レイアウト (レスポンシブ)

ブレークポイント **768px**。`<768px` = モバイル (bottom tab 維持)、`≥768px` = CF デスクトップ (サイドバー + トップバー + ワイドコンテンツ)。切替は CSS メディアクエリで行い、AppShell は両構造を常にレンダーし表示切替 (現行と同じ手法を継承)。

### 5.1 モバイル (<768px) — bottom tab 維持

```
┌──────────────────────────────┐
│ TopBar  ‹ 2026年6月 ›   [☀/🌙]│  ← 高さ 56px。月ビュー時は月送り。右にテーマトグル
├──────────────────────────────┤
│                              │
│  (画面本文 = 行リスト/カード)   │
│                              │
│                         [＋]  │  ← FAB (月タブのみ。bottom tab 上)
├─────┬─────┬─────┬───────────┤
│ 月  │ 推移 │ 定期 │   設定     │  ← bottom tab (4)。active = orange
└─────┴─────┴─────┴───────────┘
```

- bottom tab: 高さ 56px、`var(--color-surface)` 背景 + 上 1px border。active タブは `--color-brand` 文字 + 上端 2px orange バー。
- FAB はモバイルのみ。デスクトップでは非表示 (§6.2 でツールバーボタンに代替)。
- テーマトグルはモバイルでは TopBar 右端のアイコンボタン (タップで light→dark→auto 循環、aria-label に現在値)。

### 5.2 デスクトップ (≥768px) — CF サイドバー + トップバー

```
┌────────────┬──────────────────────────────────────────────┐
│ 金欠対策    │ TopBar: ‹ 2026年6月 ›        [＋ 記録を追加]   │ 56px
│            ├──────────────────────────────────────────────┤
│ ● 月        │                                              │
│ ○ 推移      │   ワイドコンテンツ (max-width 1100px, 横余白)   │
│ ○ 定期      │   メトリクスカード行 + 高密度テーブル          │
│ ○ 設定      │                                              │
│            │                                              │
│ ───────    │                                              │
│ [テーマ ▾]  │                                              │
│ user@...   │                                              │
│ [ログアウト] │                                              │
└────────────┴──────────────────────────────────────────────┘
  240px サイドバー
```

- **サイドバー** (240px、`grid-template-columns: var(--sidebar-w) 1fr`):
  - 上部: アプリ名「金欠対策」(`--text-lg` semibold)。任意で orange の小さい角丸ロゴ四角を左に置いてよい (装飾過多禁止)。
  - nav: 月 / 推移 / 定期 / 設定。各項目 height 36px、左 padding 12px、radius 4px。
    - active: `--color-brand-soft` 背景 + **左端 2px の orange バー** (`box-shadow: inset 2px 0 0 var(--color-brand)`) + テキスト `--color-text` semibold。
    - hover: `--color-surface-2` 背景。
  - 下部 (mt-auto で底に固定): 区切り線 + **ThemeToggle** (3 択 segmented or select) + アカウント行 (`session.data.user.email` を muted 12px で表示) + ログアウトボタン (ghost, danger 文字色)。
- **トップバー** (56px、コンテンツ列の上端に sticky):
  - 左: 月ビュー時は月送り `‹ 2026年6月 ›` (MonthSwitcher)。他ビューはページタイトル (推移/定期/設定)。
  - 右: そのページの主アクション。月 = `＋ 記録を追加` (primary button)、定期 = `＋ 定期を追加`。推移/設定はアクション無し or 補助。
- **コンテンツ**: `padding: 24px`、`max-width: 1100px`、`margin: 0 auto` ではなく **左寄せ + 右に余白** (CF はワイド左寄せ)。縦に card/table を積む。card 間 gap 16px。

### 5.3 AppShell 構造仕様

`AppShell.tsx` を以下の責務で再構築 (認証ガード・Outlet は現行ロジック維持):

- ルート要素 `.app-shell`: モバイルは block + `padding-bottom: bottomtab`、デスクトップは `display:grid; grid-template-columns: var(--sidebar-w) 1fr`。
- `<aside class="sidebar">`: §5.2。モバイルは `display:none`。
- `<div class="content-col">`: トップバー + `<main class="content">` + `<Outlet/>`。
  - **トップバーの中身はページ依存** (月送り/タイトル/アクション)。Architect 判断: トップバーは AppShell が枠だけ持ち、中身は各ルートが **portal/context ではなく現行どおり各ビュー内に持つ** のが最小変更。よって **AppShell のトップバーは「アプリ共通要素 (テーマトグルはサイドバー、モバイルは TopBar)」のみ**を持ち、月送り・ページアクションは各ビューが自前の `.toolbar` として描く (現行 MonthView の `.topbar` を `.toolbar` に置換)。これで AppShell↔ビュー間の新規 prop 配線を増やさない。
- `<nav class="bottom-tabs">`: §5.1。デスクトップは `display:none`。
- nav 項目はサイドバー/bottom-tab で **同じ tabs 配列** を共有 (現行どおり)。

> data-testid: サイドバーに `data-testid="sidebar"`、bottom tab に `data-testid="bottom-tabs"`、各 nav link に `data-testid="nav-<slug>"` (slug = month/trend/recurring/settings) を付与。テーマトグルに `data-testid="theme-toggle"`。

---

## 6. 画面ごとの再レイアウト

各ビューは **API 呼び出し・state・mutation を変えず**、JSX のレイアウトと className のみ変更する。

### 6.1 月ビュー (MonthView) — メトリクスカード + 高密度テーブル

**ツールバー** (現行 `.topbar` を `.toolbar` に):
- モバイル: 月送り `‹ 2026年6月 ›` + テーマトグル(TopBar)。
- デスクトップ: トップバーに月送り + `＋ 記録を追加` ボタン (FAB の代替)。

**サマリ = CF メトリクスカード行**:
```
┌─ 現在残高 ──┐ ┌─ 月末着地 ──┐ ┌─ 収入 ────┐ ┌─ 支出 ────┐
│ ¥123,456   │ │ ¥98,200    │ │ +¥250,000 │ │ -¥151,800 │
│ 確定        │ │ 予測        │ │ 当月予測   │ │ 当月予測   │
└────────────┘ └────────────┘ └───────────┘ └───────────┘
```
- `SummaryCard` を **メトリクスカード 4 枚の grid** に再構成 (デスクトップ `grid-template-columns: repeat(4,1fr)`、モバイルは 2 列 grid)。
- 各カード: label (12px muted 大文字感) + 値 (20–24px semibold) + 補足 (12px muted)。border + radius-md + 控えめ shadow。
- 値の色: 残高は `--color-text`、収入は `--color-success`、支出は `--color-danger`。
- `currentBalance===null` のとき「現在残高」カードを非表示 (現行挙動維持。data-testid 維持、§8)。

**記録一覧 = デスクトップ高密度テーブル / モバイル行リスト**:
- デスクトップ (`≥768px`): `<table class="data-table">`。列 = [tag色 | 日付 | 説明/カテゴリ | 確定状態 | 金額(右寄せ)]。
  - 行高 40px、`border-bottom: 1px var(--color-border)`、行 hover `--color-surface-2`。
  - 行クリックで RecordSheet 編集 (現行 onClick 維持)。`<tr>` に `data-testid="record-row"` を移送。
- モバイル (`<768px`): 現行の行リスト (`RecordRow`) を CF 調 restyle (border 細罫線・radius-sm・行 hover)。
- **`RecordRow` コンポーネントは両モードを内包する** か、テーブル行版 `RecordRowCells` を新設するかは Developer 判断。ただし **`data-testid="record-row"` / `record-amount` / `record-unpaid-mark` を必ず保持** (§8)。最小変更を優先するなら RecordRow は `<button>` のまま CSS で `display` を切り替え、デスクトップでも `.data-table` 内に並べてよい (擬似テーブル grid)。**推奨: CSS grid による擬似テーブル** (RecordRow の構造を変えず data-testid 完全温存)。
- 未確定 (paid=false): 行テキスト `--color-text-muted` + **`予定` バッジ (pill, gold soft 背景)** + 既存 `●` マーク (`record-unpaid-mark` は維持)。金額も muted トーン。
- 空状態 (records 0 件): CF 流の空状態 — 中央に muted 14px「この月の記録はまだありません」+ デスクトップは `＋ 記録を追加` への誘導文。`data-testid="empty-records"`。

**bundle トグル**: 現行チェックボックスを CF の小さい segmented/switch 風に restyle。`BundleRow` は text `${description} (${count})` を維持 (`bundle-row` data-testid 維持)。bundle 行は通常行と区別 (左に折りたたみ ▸ アイコン + `--color-surface-2` 微背景)。

**FAB**: モバイルのみ `data-testid` 既存維持。orange 円形 (`--color-brand`) + 白 ＋。デスクトップは非表示 (`@media (min-width:768px){ .fab{display:none} }`)、代わりにトップバー `＋ 記録を追加` ボタン。

### 6.2 推移ビュー (TrendView) — CF チャートカード

- **segmented control** `[当月推移 | 多月予測]` を CF 調に restyle: 角丸 4px の 2 ボタン群、active = `--color-surface` 背景 + orange 下線 2px or `--color-brand-soft` 背景 (塗りは控えめに)。`--color-bg` 上の pill グループ。
- **チャートカード**: `<LineChart>` を白 card (border + radius-md + 控えめ shadow + padding 16px) に包む。カード上部に小タイトル (「当月残高推移」/「多月着地予測」12–14px muted) + 凡例。
- **凡例**: `━ 確定 (青)` / `┈ 着地予測 (orange 破線)`。`data-testid="chart-legend"`。
- 多月予測の月カード: `<div class="month-card">` を CF カード調 (border 細罫線・radius-md)。デスクトップは grid 複数列 (`repeat(auto-fill, minmax(160px,1fr))`)、モバイルは 1 列。各カード: 月 (semibold) + 着地額 (右上、大きめ) + 収/支 (12px muted、収=success/支=danger)。
- 表示月数 `[3 | 6 | 12]`: segmented 同様の CF pill。active = orange soft。
- 空/ローディング: card 内に muted プレースホルダ。

### 6.3 定期ビュー (RecurringView) — テーブル/カード

- ツールバー: タイトル「定期ルール」+ `＋ 定期を追加` (デスクトップはトップバー、モバイルは画面内ボタン)。
- デスクトップ: `<table class="data-table">`。列 = [ラベル | 毎月X日 | カテゴリ/タグ | 金額(右) | 状態]。行 hover、停止中は行全体 muted + `停止中` バッジ。
- モバイル: 行リスト (現行 `.row-button` を CF restyle)。
- 行クリックで RuleSheet (現行維持)。停止中 = `--color-text-muted` + `停止中` pill (gray)。
- 金額色: 収入 success / 支出 danger。
- 空状態: 「定期ルールがまだありません」+ 追加誘導。`data-testid="empty-rules"`。

### 6.4 設定ビュー (SettingsView) — セクション + テーブル

- 各 `<section>` を CF card (border + radius-md + padding 16px、見出し 16px semibold + 区切り線)。
- **カテゴリ管理**: テーブル/行リスト。列 = [名前 | signMode | システムバッジ]。システムカテゴリは `システム` バッジ (gray pill) + 行 hover で編集 (現行)。`＋追加` は CF secondary button。
- **タグ管理**: カテゴリごとグルーピング (`<strong>` 見出し + 配下に tag 行)。tag 行に色 swatch (現行 `.tag-pill` を CF 調: 小角丸 or 丸)。
- **初期残高アンカー**: inline form を CF 調 (input height 36px、border、focus ring)。デスクトップは横並び (現行 `.inline-form` grid 継承)。
- **予測期間**: range スライダ + 値表示。スライダのトラック/つまみを orange アクセントに。
- 削除時 `STILL_IN_USE` トースト: 現行 `.notice.error` を **CF toast** に置換 (§7 toast 仕様)。文言「○件で使用中のため削除できません」は維持。
- バッジ class `.badge` をティール→ gray/semantic pill へ全置換。

### 6.5 ログイン (Login) — CF カード

- 中央 1 カラム維持 (ログインは例外的に中央寄せでよい)。`.login-panel` を CF card (border + radius-md + 控えめ shadow + padding 24px、max-width 400px)。
- 「ログインリンクを送信」= primary orange button。「Google でログイン」= secondary (white + border)。
- input は CF input (height 36–44px、border、focus blue ring)。focus outline をティール `#5eead4` → `--color-info` (blue) へ置換。

---

## 7. コンポーネント restyle 仕様 (token 参照で確定)

全て CSS 変数参照。**hover は背景を gray 1 段、focus-visible は blue ring、transition 150ms ease**。

### 7.1 button

| variant | 背景 | 文字 | border | hover | 用途 |
|---|---|---|---|---|---|
| primary | `--color-brand` | #fff | none | `--color-brand-hover` | 保存・＋追加 |
| secondary | `--color-surface` | `--color-text` | `1px --color-border` | bg `--color-surface-2` | キャンセル・補助 |
| ghost | transparent | `--color-text` | none | bg `--color-surface-2` | nav・アイコン |
| danger | `--color-surface` | `--color-danger` | `1px --color-danger` (薄) | bg `--color-red-9` | 削除 |

- 共通: radius `--radius-md`(4px)、padding 縦 8 横 16、min-height 36px (モバイルのタップ対象は 44px 確保: `.toolbar button` 等は min-h 44)、font 14px semibold。
- focus-visible: `outline: 2px solid var(--color-info); outline-offset: 1px`。
- 現行 `.danger-button` を danger variant に置換、`.login-panel .secondary` を secondary に統合。

### 7.2 badge / pill

- 基本: radius-pill、padding 縦 2 横 8、font 12px。
- 確定: 表示しない (既定) or gray pill。未確定/予定: `--color-gold-9` 背景 + `--color-gold-6` 文字 (`予定`)。
- 停止中: gray (`--color-surface-2` 背景 + `--color-text-muted`)。
- システム: gray pill。カテゴリ/タグ色 pill: tag.color 背景 (現行 `.tag-pill` 流用、ティール既定色 `#d1fae5` → `--color-brand-soft` or gray に変更)。
- 現行 `.badge` のティール (`#99f6e4`/`#0f766e`) を全置換。

### 7.3 card / metric card

- border `1px --color-border`、radius `--radius-md`、background `--color-surface`、`box-shadow: var(--shadow-card)`、padding 16px。
- metric card: 上記 + label(12px muted) / value(20–24px semibold) / sub(12px muted) 縦積み。
- 現行 `.summary-card` `.month-card` `.settings section` `.line-chart` を card トークンへ統一。

### 7.4 table (data-table)

- `border-collapse: collapse`、幅 100%。
- thead: `--color-surface-2` 背景、12px muted semibold、`border-bottom: 1px --color-border-strong`、左寄せ (金額列 右寄せ)。
- tbody tr: `border-bottom: 1px --color-border`、行高 40px、hover `--color-surface-2`。
- td: padding 縦 8 横 12、14px、`white-space: nowrap` (説明列のみ可変・省略可)。
- モバイルでは table を縦リスト化 (or RecordRow 擬似 grid)。**罫線 BP は [grid-table-borders-bp](../../../knowledge/pattern/grid-table-borders-bp.md) 準拠** (狭幅で過剰罫線にしない)。

### 7.5 input / select

- height `--input-h`(36px、フォームモーダル内のタップ対象は 44px: [form-modal-readability-bp](../../../knowledge/pattern/form-modal-readability-bp.md) 準拠で `min-h-12`=48px)。
- border `1px --color-border`、radius `--radius-md`、background `--color-surface`、padding 横 12。
- focus: `border-color: --color-info` + `box-shadow: 0 0 0 2px (info 透過)`。現行ティール outline を全置換。
- label: 14px semibold `--color-text`。値 14px。
- 現行 `.field input/select` `.login-panel input` を統一。

### 7.6 tabs / segmented

- segmented: `--color-bg` (or surface-2) のトラックに pill ボタン群、radius-md。active = `--color-surface` 背景 + 控えめ shadow + `--color-text` semibold (CF の inset segmented)。**塗り orange は使わず**、active 下線 or surface 浮きで表現。
- 現行 `.segmented .active` のティール塗りを置換。

### 7.7 Sheet (CF モーダル)

- overlay: `--color-overlay` (rgba(0,0,0,.7))。**デスクトップは中央ダイアログ** (`align-items:center; justify-content:center`)、モバイルは現行どおりボトムシート (`align-items:end`)。
- panel: `--color-surface`、radius-md (モバイルは上だけ `--radius-md --radius-md 0 0`)、`box-shadow: var(--shadow-pop)`、max-width 480px (デスクトップ中央時)、max-height 88dvh、scroll。
- header: × (左) / title (中) / action (右)。border-bottom 1px。
- **3 経路 close (overlay/ESC/×) と data-testid は完全温存** (§8)。Sheet.tsx は構造変更最小、className/CSS のみ CF 調。
- フォーム視認性: [form-modal-readability-bp](../../../knowledge/pattern/form-modal-readability-bp.md) 準拠 (label semibold、divider、input min-h 48、focus ring 3:1 以上)。

### 7.8 toast

- 現行 `.notice` / `.notice.error` を CF toast へ: card + 左 4px semantic バー (error=danger, success=success, info=info)。radius-md、`--shadow-pop`、14px。
- 配置: デスクトップは右下 fixed、モバイルは上部。自動消滅は現行が手動 setMessage なので **既存挙動 (state 表示) を維持** (タイマー追加は任意・スコープ外)。
- `data-testid="toast"` を付与 (現行 `.notice` に testid 無し。新規付与は既存テスト非破壊)。

### 7.9 FAB

- モバイルのみ。`--color-brand` 円 56px、白 ＋ 28px、`--shadow-pop`。bottom tab の上。
- デスクトップ `display:none` (トップバー `＋追加` が代替)。

---

## 8. prop 契約 / data-testid (Reviewer 既存テスト非破壊が最優先)

### 8.1 温存する data-testid (変更・削除禁止)

現行 client テスト (32 件) が依存。**これらは値・存在・テキスト規約を維持**:

| data-testid | 場所 | 維持する不変条件 |
|---|---|---|
| `record-row` | RecordRow ルート要素 | クリックで `onClick(record.id)` |
| `record-amount` | 金額要素 | `yen(signedAmount)` テキスト、収入/支出で色 class 切替 |
| `record-unpaid-mark` | RecordRow | **paid=false のときのみ存在** |
| `bundle-row` | BundleRow | テキスト `${description} (${count})` |
| `line-chart` | LineChart `<svg>` | 各 series が `<polyline data-series-id={id}>`、null 点で分割 |
| `summary-current` | SummaryCard | **currentBalance===null のとき非存在** |
| `summary-forecast` | SummaryCard | 常に存在、`yen(endingBalanceForecast)` |
| `sheet-overlay` `sheet` `sheet-close` `sheet-action` | Sheet | 3 経路 close 維持 |

- LineChart の `series[].id` 規約 (`"confirmed"` / `"forecast"`) と `data-series-id` を**維持**。TrendView が渡す series id 文字列は変えない。
- **prop 契約 (型) は §7.7 コア doc のまま不変**: `RecordRowProps` / `BundleRowProps` / `SummaryCardProps` / `LineChartProps` / `SheetProps`。引数の追加・削除・型変更をしない (restyle は内部 className のみ)。

> SummaryCard を 4 枚メトリクスカードに再構成する際も、`summary-current` (currentBalance!==null 時のみ) と `summary-forecast` の data-testid を該当カードに必ず付与する。「currentBalance===null で summary-current 非表示」の不変条件を壊さないこと。

### 8.2 新規 data-testid (追加)

| data-testid | 用途 |
|---|---|
| `sidebar` / `bottom-tabs` | nav コンテナ (レスポンシブ検証用) |
| `nav-month` / `nav-trend` / `nav-recurring` / `nav-settings` | nav link |
| `theme-toggle` | テーマ 3 択トグル |
| `empty-records` / `empty-rules` | 空状態 |
| `chart-legend` | 推移凡例 |
| `toast` | 通知 |

### 8.3 変更/削除する data-testid

- **なし**。本再設計は既存 data-testid を 1 つも削除/改名しない。LineChart の series id 文字列も不変。
- → Reviewer の既存 32 件は**そのまま通る想定**。新規テストは §10 の項目を追加するのみ。

> Sheet をデスクトップ中央ダイアログ化しても、close 経路 (overlay click / ESC / ×) と 4 testid は不変。`sheet-overlay` のクリックで dismiss する挙動も維持 (中央配置でも overlay 領域クリックで閉じる)。

---

## 9. アクセシビリティ

- **focus-visible**: 全インタラクティブ要素に `outline: 2px solid var(--color-info); outline-offset: 1px` (CF の青フォーカス)。透明 outline で潰さない。
- **コントラスト AA 4.5:1**:
  - light: 本文 `--color-text #36393a` on `#fff` = 約 10:1 OK。muted `#72777b` on `#fff` ≈ 4.6:1 (本文 14px で AA 可、12px caption も境界クリア)。orange `#f6821f` on #fff は **大きい文字/非テキスト用**に留め、orange 上の文字は白 (primary button: #fff on #f6821f ≈ 3.0:1 → **ボタン文字は 14px semibold 以上で「大きい文字 AA 3:1」を満たす**。小文字には orange 文字を本文に使わない)。
  - dark: surface `#262626` 上に text `#eaebeb` ≈ 12:1 OK。success/danger/info は dark 用に 1 段明るい段 (§3 dark) で AA 確保。
  - 収入 success / 支出 danger は **色のみに依存しない** (符号 +/− と `予定`/確定の文字も併記)。
- **nav active** は色だけでなく左バー + semibold で区別 (色覚多様性)。
- bottom tab / FAB / トグルのタップ対象は 44px 以上。
- table 行 hover は色変化のみだが、行クリック可能性は `<button>`/`role` + cursor で示す。
- `<table>` には `<caption class="sr-only">` (画面リーダ用、任意) と適切な `<th scope>`。
- ThemeToggle は `aria-label` に現在モード、各選択肢に `aria-pressed`/`aria-checked`。

---

## 10. テスト基盤

- フレームワーク: **Vitest 4** + React Testing Library + jsdom (現行 §8 のまま)。配置 `tests/client/*.test.tsx`、新規フックは `tests/client/useTheme.test.ts`。
- `vitest.config.ts` の `fileParallelism:false` は維持。
- **既存 32 件は非破壊** (§8.3)。Reviewer はまず既存テストが GREEN のままか確認。
- 新規テスト観点 (Reviewer が本 doc から生成):
  - **useTheme/resolveTheme** (§4.1 の全項目): light/dark/auto 解決、matchMedia 未定義時 light、setMode で data-theme 更新、auto 時 change でライブ更新、非 auto 時 change 無反応、cleanup で removeEventListener。`window.matchMedia` を matches 可変 + change 発火できる stub に差し替え。
  - **ThemeToggle**: 3 択描画、クリックで mode 遷移 (light→dark→auto→light)、`theme-toggle` 存在。
  - **AppShell レスポンシブ**: `sidebar` と `bottom-tabs` が両方 DOM に存在 (表示切替は CSS なので jsdom では両方 render される)、nav link `nav-*` が 4 つ、`data-testid` 経由でルート遷移。
  - **空状態**: records 0 件で `empty-records`、rules 0 件で `empty-rules`。
  - **SummaryCard メトリクス再構成**: currentBalance=null で `summary-current` 非存在 (既存不変条件の回帰)、4 値表示。
  - jsdom は CSS メディアクエリ/レイアウトを評価しないため、**「デスクトップ専用表示」自体は単体テストで検証しない** (両 DOM の存在のみ)。視覚回帰は §11 の手動/MCP 確認に委ねる。
  - LineChart の viewBox 計算は DOM 寸法非依存 (props 数値のみ) を維持 → 既存テスト継続。

### 10.1 E2E / 視覚確認 (任意・手動)

- ブレークポイント切替・テーマ切替の見た目は **chrome-devtools MCP** で desktop(≥768) / mobile(<768) × light/dark のスクショ取得で確認 (CLAUDE.md ブラウザ自動化規約)。自動アサーションは必須にしない (視覚は Touri レビュー)。

---

## 11. 不採用案 (再検討ループ防止)

| 案 | 却下理由 |
|---|---|
| **aisaba トーン混在** (ダーク主体・余白広め・線を使わず余白区切り) | CF と真逆。家計簿の高密度データ UI に余白主体は不適。混ぜると密度が崩れ「どっちつかず」になる。CF 単一言語で統一 |
| **重い塗り / 大 drop-shadow / グラデーション** | CF らしさは塗りでなく細罫線 + 小 radius + 控えめ shadow。重い装飾はデータの視認を妨げ実務トーンを壊す |
| **外部 UI ライブラリ (Chakra/MUI/shadcn/Radix 等) 導入** | 数百 KB バンドル増 + 既存自前コンポーネント (Sheet/LineChart/RecordRow) との二重化。CF トークンは素 Tailwind v4 `@theme` で十分表現でき、data-testid 温存もしやすい |
| **デスクトップ専用化 (モバイル bottom tab 廃止)** | Touri は両対応を承認。モバイル家計簿入力は主要動線。bottom tab を捨てる理由がない |
| **ティール/ミント基調の継続** | CF はニュートラルグレー + orange 単一アクセント。ティール差し色は CF トーンと衝突。全廃して orange に統一 |
| **チャートを外部ライブラリ (Recharts 等) に差し替え** | コア §9 で却下済。自前 `<LineChart>` の prop 契約・data-testid を温存する方が安全。色だけ CF 調 (青/orange) に変える |
| **テーマ auto を `@media (prefers-color-scheme)` 任せ** | [theme-auto-resolve-data-theme-matchmedia] gotcha。React state と DOM がズレる。data-theme 常設 + matchMedia 監視に統一 |
| **トップバー中身を AppShell↔ビュー間で context/portal 配線** | 月送り・ページアクションをビュー外に持ち上げると新規 prop/context 配線が増え変更スコープ拡大。各ビューが自前 `.toolbar` を持つ最小変更で十分 (§5.3) |

---

## 12. Touri が承認すべき判断点

1. **配色の最終トーン**: アクセント = ロゴ orange `#f6821f` (hover `#e06d10`)、面 = CF ニュートラルグレー、収入=green/支出=red/予定=gold。ティール全廃。
2. **サイドバー項目**: 月 / 推移 / 定期 / 設定 (現行 4 タブ踏襲) + 下部にテーマトグル + アカウント(email) + ログアウト。アプリ名「金欠対策」を上部に。
3. **FAB 廃止可否 (デスクトップ)**: デスクトップは FAB を消しトップバー `＋ 記録を追加` ボタンに。モバイルは FAB 維持。
4. **テーマ既定 = auto (OS 追従)**、light/dark 手動選択を localStorage 永続。
5. **Sheet のデスクトップ中央ダイアログ化** (モバイルはボトムシート維持) — close 3 経路は不変。
6. **既存 data-testid 完全温存** (削除/改名ゼロ) で Reviewer 32 件を非破壊。新規 testid は追加のみ。
