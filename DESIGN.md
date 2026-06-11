# 金欠対策 — DESIGN.md (デザインシステム正典)

> **本書の位置づけ**: 金欠対策 `client/` の UI 実装が**一意に従う**視覚規約。Touri が「margin/padding がチグハグ・アイコン不統一・入力モーダルが select でなくボタンであるべき」と指摘し、「ルール化してから全体調整し直す」方針で確立した正典。
>
> **基準ドキュメント**: 設計前リサーチ [`Muraki/projects/_pre/research-design-system-20260611.md`](_pre/research-design-system-20260611.md) / デザイン言語 [`Muraki/knowledge/pattern/moneylog-design-language.md`](../../knowledge/pattern/moneylog-design-language.md) / フォーム視認性 [`form-modal-readability-bp.md`](../../knowledge/pattern/form-modal-readability-bp.md)。
>
> **スコープ**: 視覚規約 (token・コンポーネント・IA・アイコン) のみ。**backend / データモデル / API / 挙動ロジックは対象外** ([`20260608-mvp-core.md`](.designs/20260608-mvp-core.md) が不変の正)。既存の機能・query key・mutation・data-testid 契約は [`20260611-moneylog-faithful-redesign.md`](.designs/20260611-moneylog-faithful-redesign.md) を踏襲し、本書はその**視覚言語を正典化・体系化・拡張**する (チグハグ解消・select 廃止・アイコン統一・focus ring 補完を確定)。
>
> **関係**: `20260611-moneylog-faithful-redesign.md` §4 トークンを本書が supersede (拡張・正規化)。レイアウト・ナビ・コンポーネント prop 契約・挙動・data-testid は同 doc を引き継ぐ。矛盾する箇所は**本書が優先**する (8px グリッド正規化 / segmented 化 / lucide / focus ring)。

---

## 0. 目的

現行 `client/` は moneylog 忠実再設計が一度適用済みだが、(1) spacing/radius が 4/8/16 グリッドでなく不規則 (15/18/25・部分的 5px 系)、(2) アイコンが絵文字/記号 (✎⚙‹›×●▾▸＋) の寄せ集めで統一感がない、(3) 入力モーダルの選択が `<select>` ドロップダウンで moneylog のボタン群質感を欠く。本書はこれらを **token と コンポーネント規則で一意に固定**し、以後の全 UI 実装がここに従うことで「チグハグ」を構造的に解消する。

中核 2 原則 (Touri):
- **① 最短到達ルート / IA**: 開いた瞬間に必要情報が見え、最頻タスク (記録追加) が 1 タップ。
- **② 情報優先度づけ + 視覚レイヤー化**: size / weight / font / spacing / elevation で優先度を符号化。色は意味色のみ。

---

## 1. 基盤スケール

`client/styles.css` の `@theme` に定義し、**全コンポーネントは必ず token 経由**で参照する。ハードコード px / hex を新規に書かない。

### 1.1 spacing スケール (4px ベース / 8px グリッド)

```css
--space-0_5: 2px;   /* hairline: アイコンと文字の極小 gap、pill 内 padding-block */
--space-1:   4px;   /* tight: row 内 meta 行間、chip dot gap */
--space-2:   8px;   /* base gap: 要素間 gap の既定 */
--space-3:  12px;   /* comfortable gap: shell gap / card 間 / control-bar gap */
--space-4:  16px;   /* component padding 既定: card 内 padding / sheet-body padding */
--space-6:  24px;   /* section: モーダル外周の余裕 / 大セクション間 */
--space-8:  32px;   /* block: empty-state 上下 / 残高ヒーローの隔絶余白 */
--space-12: 48px;   /* hero 隔絶: 最優先要素を孤立させる時のみ */
```

> CSS カスタムプロパティ名にドットは使えないため `--space-0_5` 表記 (値 2px)。現行は `--space-1..8` のみ。本書で `--space-0_5` `--space-12` を**追加**する。

**使い分けルール (3 用途で段を固定。これがチグハグ解消の核)**:

| 用途 | 段 | 値 | 適用例 |
|---|---|---|---|
| コンポーネント内 padding (小) | `--space-2` | 8 | chip / pill / status-badge の横 padding |
| コンポーネント内 padding (標準) | `--space-4` | 16 | card / sheet-body / hero-card 内 |
| 要素間 gap (密) | `--space-1` | 4 | row 内の date と meta、ボタン群の中身 |
| 要素間 gap (標準) | `--space-2` | 8 | label と input、フォーム field 内、segmented ボタン間 |
| カード/セクション間 gap | `--space-3` | 12 | `.shell` gap、card 同士、control-bar の左右群 |
| セクション間 margin (大) | `--space-6` | 24 | 設定の大カテゴリ間 (任意) |
| ブロック余白 (empty/hero 隔絶) | `--space-8` / `--space-12` | 32 / 48 | empty-state padding、残高の上下隔絶 |

**moneylog 5px 系 → 8px グリッド 正規化対応表** (リサーチ A-3 の実値を Touri 希望の 4/8/16 に丸める):

| moneylog 実値 | → 正規化 token | 値 |
|---|---|---|
| 2px | `--space-0_5` | 2 |
| 3px / 5px | `--space-1` | 4 |
| 7px / 8px | `--space-2` | 8 |
| 10px | `--space-3` | 12 |
| 13px / 15px | `--space-4` | 16 |
| 20px | `--space-6` | 24 |
| 25px / 30px | `--space-8` | 32 |

> 例: moneylog の入力行 padding 10 → `--space-3` (12)、submit gap 15 → `--space-4` (16)、radio gap 5 → `--space-1` (4)。**moneylog の値を忠実コピーせず、semantic を踏襲して 8px グリッドに乗せる** (Touri 主目的 = チグハグ解消)。

### 1.2 radius スケール (moneylog 質感維持で大き目)

```css
--radius-xs:   8px;   /* chip / status-badge / segmented ボタン */
--radius-sm:  12px;   /* input / textarea / select(廃止予定) / button(pill 以外) */
--radius-md:  16px;   /* セクションカード (.card) */
--radius-lg:  18px;   /* (md と近接。.card の moneylog 質感を残す場合のみ。原則 md に統合) */
--radius-card:24px;   /* hero / sheet 上端 / login-panel */
--radius-pill:9999px; /* control-icon / fab / control-mode / 丸ボタン / tag-dot */
```

> 現行 `--radius-sm:15 / md:18 / card:25` の不規則値を **8px グリッドに正規化** (15→16=md / 18→md / 25→24=card)。chip は現行 15 → `--radius-xs` (8) に下げて「小要素は小 radius」の階層を作る。`--radius-lg:18` は md(16) と視覚差がほぼ無いため**原則 `--radius-md` に統合**し、lg は将来予約 (新規利用しない)。

**要素別 radius 割当 (固定)**:

| 要素 | radius |
|---|---|
| segmented ボタン / chip / status-badge | `--radius-xs` (8) |
| input / textarea | `--radius-sm` (12) |
| card (セクション) / record-list | `--radius-md` (16) |
| hero-card / sheet (上端) / login-panel | `--radius-card` (24) |
| control-icon / control-mode / fab / danger-button / soft-button / tag-dot / swatch | `--radius-pill` |

### 1.3 type スケール (size × weight × font で優先度符号化)

```css
--font-sans: "Noto Sans JP", "Hiragino Sans", "Yu Gothic", "游ゴシック", sans-serif;
--font-num:  "Open Sans", var(--font-sans);  /* 金額・数値専用 (moneylog 準拠) */

--text-2xs: 11px;  /* キャプション最小 (年棒グラフ軸ラベル等) */
--text-xs:  12px;  /* メタ / ラベル / 補助 (body base 密度) */
--text-sm:  13px;  /* status / toast / 補足 */
--text-base:14px;  /* フォーム標準 / 本文主 */
--text-md:  16px;  /* セクション見出し / record 主テキスト */
--text-lg:  18px;  /* control-bar 見出し / sheet タイトル */
--text-xl:  22px;  /* 大数値 (月収支・年総計) */
--text-2xl: 28px;  /* (予約: 副ヒーロー数値が要る時) */
--text-hero:38px;  /* 月末残高のみ (唯一の特大・隔絶) */

--weight-normal: 400;
--weight-medium: 500;
--weight-bold:   700;

--leading-tight: 1.1;   /* 大数値・hero */
--leading-snug:  1.3;   /* 見出し */
--leading-body:  1.5;   /* 本文 (body 既定) */
```

**情報優先度 → type 割当 (符号化ルール。色は使わない)**:

| 優先度 | 要素 | size | weight | font | leading |
|---|---|---|---|---|---|
| **最優先 (隔絶)** | 月末残高 (hero-ending) | `--text-hero` (38) | medium (500) | `--font-num` | tight (1.1) |
| 第2 | 月収支 / 年総計 (大数値) | `--text-xl` (22) | medium | `--font-num` | tight |
| 第3 | セクション見出し / record 主テキスト | `--text-md` (16) | medium | sans | snug |
| 第4 | sheet タイトル / control-bar 見出し | `--text-lg` (18) | medium | sans | snug |
| 標準 | フォーム input / 本文 / 金額 (record-amount) | `--text-base` (14) | medium (金額) / normal (本文) | sans (本文) / num (金額) | body |
| 低 | label / 日付 / カテゴリ・タグ meta | `--text-xs` (12) | normal | sans | body |
| 最低 | キャプション / status / 軸ラベル | `--text-2xs`〜`--text-sm` (11-13) | normal | sans | body |

> **原則**: 数値 (金額・残高) は `--font-num` (Open Sans) + medium、ラベル/メタは sans + normal + 小サイズ。優先度を**色でなく size+weight+font の 3 軸**で表す (リサーチ A-5 / B-3、Touri 原則② と一致)。`--text-hero` は残高 1 箇所のみ。見出しに乱用しない。`--font-num` 利用には `index.html` に Open Sans webfont 追加が必要 (§1.7)。

### 1.4 color トークン (意味色のみ / light = 既定)

```css
/* surfaces */
--color-bg:         #fafafa;
--color-text:       #1e1e1e;                /* rgb(30,30,30) 単色基調 */
--color-text-muted: rgba(30,30,30,.5);      /* 未確定 / 補助 / label */
--color-text-faint: rgba(30,30,30,.32);     /* キャプション / unpaid-mark */
--color-frost:      rgba(255,255,255,.75);   /* frosted card 面 */
--color-frost-2:    rgba(255,255,255,.55);   /* chip / 2 次面 / 非選択 segmented */
--color-line:       rgba(30,30,30,.08);      /* 極薄 divider のみ (罫線多用禁止) */
--color-overlay:    rgba(20,20,20,.45);      /* sheet overlay */

/* semantic (符号・状態。これ以外の装飾色を増やさない) */
--color-income:  #07a86b;   /* 収入 (+) */
--color-expense: #e0556b;   /* 支出 (−) / danger / error */
--color-move:    #3a86c8;   /* 移動 / 中立 / accent (focus ring・選択) */

/* blob (hero 発光。塗りでなく光で色を置く) */
--blob-from: #03d9ff; --blob-to: #07fa62; --blob-opacity: .7;
```

**light/dark は `@media (prefers-color-scheme:dark)` で `:root` 変数を上書き** (手動トグル無し。moneylog 準拠)。dark 値は現行 styles.css の `@media` ブロックを維持:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg:#181818; --color-text:#f2f2f2;
    --color-text-muted:rgba(242,242,242,.5); --color-text-faint:rgba(242,242,242,.32);
    --color-frost:rgba(40,40,40,.72); --color-frost-2:rgba(40,40,40,.5);
    --color-line:rgba(242,242,242,.1);
    --blob-from:#ff0303; --blob-to:#0747fa; --blob-opacity:1;
    --color-income:#2ad08f; --color-expense:#ff8095; --color-move:#5aa9e6;
    --shadow-card:0 0 10px rgba(0,0,0,.5); --shadow-soft:0 0 8px rgba(0,0,0,.4); --shadow-pop:0 0 24px rgba(0,0,0,.6);
  }
}
```

**規律**: 色は必ず変数経由。意味色 (income/expense/move) は**符号・状態にのみ**使い、装飾目的で増やさない。テキストは text/muted/faint の 3 段で階層化 (優先度は §1.3 の size/weight が主、color はその補助)。

### 1.5 elevation / shadow スケール

```css
--shadow-soft: 0 0 8px  rgba(20,20,20,.04);   /* chip / segmented ボタン / control / 軽い浮き */
--shadow-card: 0 0 10px rgba(20,20,20,.06);   /* card / 選択中 chip / 標準カード */
--shadow-pop:  0 0 24px rgba(20,20,20,.14);   /* fab / sheet / 浮上要素 */
```

> moneylog の極薄 **オフセット 0** 影 (`0 0 Npx`、方向を持たない「ふわっと浮く」発光)。border の代わりに shadow で要素を浮かせる (segmented 非選択ボタンは border でなく `--shadow-soft`)。dark は §1.4 の `@media` で差し替え。**3 段のみ**。新しい shadow 値を増やさない。

### 1.6 motion トークン

```css
--ease: cubic-bezier(.4,0,.2,1);
--dur:  .4s;   /* 既定 transition (moneylog 0.3-0.5s 帯の中央) */
```

開閉/伸縮は**必ず `.collapsible` (grid-template-rows 0fr↔1fr)**。`max-height` トランジション禁止。押下フィードバックは `.press` (`scale(1.04)`) / `.press--lg` (`scale(1.08)`)。

### 1.7 webfont

`client/index.html` `<head>` に Noto Sans JP (本文) + Open Sans (`--font-num` 数値) を読み込む:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=Open+Sans:wght@400;500;600&display=swap" rel="stylesheet">
```

> 現行は Noto Sans JP のみ想定。本書で **Open Sans を追加** (金額の moneylog 質感 = Open Sans medium の数値)。`--font-num` を金額・残高・統計数値に適用。

---

## 2. アイコンシステム (lucide-react 単一セットに全置換)

### 2.1 方針

絵文字 / 記号文字 (✎⚙‹›×●▾▸＋) の寄せ集めを**全廃**し、**`lucide-react` 単一 SVG セットに統一**する (リサーチ B-6: 最新活発・MIT・`stroke-width:2` / `viewBox 0 0 24 24` / `fill:none` / `stroke:currentColor` / round linecap・linejoin)。

> **新規 dependency 追加**: `npm i lucide-react` (リサーチで現行性確認済 ~1.x、MIT、tree-shaking 効く named import)。現行 `package.json` に lucide なし → 追加が必要。

### 2.2 サイズ・色の規則

- サイズは 4px グリッドの **16 / 20 / 24** のみ (`size` prop)。それ以外を使わない。
  - インライン (テキスト隣・row 内・status) = **16**
  - ボタン内 (control-icon / segmented / sheet-close / fab 以外の操作) = **20**
  - 主要操作・fab = **24**
- 色は **`color="currentColor"` (lucide 既定)**。親要素の `color` (text トークン) を継承 → light/dark 自動追従。`filter:invert` ハックを使わない。
- `strokeWidth` は lucide 既定 (2) を変えない (統一の核)。

### 2.3 用途 → lucide アイコン対応表 (確定)

| 現状 | 用途 | lucide コンポーネント | size |
|---|---|---|---|
| `‹` (control-prev) | 前の期間へ | `ChevronLeft` | 20 |
| `›` (control-next) | 次の期間へ | `ChevronRight` | 20 |
| `‹ 戻る` (control-back) | 設定→ホーム戻る | `ChevronLeft` + テキスト「戻る」 | 20 |
| `⚙` (control-settings) | 設定へ | `Settings` | 20 |
| `✎` (hero-add ボタン / fab) | 記録追加 | `Plus` | hero=20 / fab=24 |
| `×` (sheet-close / chip-clear) | 閉じる / 解除 | `X` | sheet=20 / chip=16 |
| `●` (record-unpaid-mark) | 未確定マーク | `Circle` (`size=8`, `fill="currentColor"`) ※例外 | 8 |
| `▾`/`▸` (bundle-caret) | bundle 開閉 | `ChevronDown` (展開時) / `ChevronRight` (折畳時) | 16 |
| `＋追加` (section-header) | セクション内追加 | `Plus` + テキスト「追加」 | 16 |
| (年/月モード切替の含意) | ラベル tap | アイコン無し (テキストラベルのまま) | — |
| (グラフ凡例の線) | 凡例 | アイコンでなく CSS の `<i>` 線分 (現状維持) | — |

> 未確定マークは「小さい塗り点」が意味なので `Circle` を `size=8` + `fill="currentColor"` で塗る (唯一の塗りアイコン例外、`--color-text-faint` 継承)。それ以外は全て stroke アイコン。

### 2.4 React 統一管理方式

- **named import** で個別取得 (tree-shaking): `import { ChevronLeft, ChevronRight, Settings, Plus, X, Circle, ChevronDown } from "lucide-react";`
- サイズは必ず `size={16|20|24}` prop で指定 (CSS で `width/height` を上書きしない)。
- アイコン単体ボタンは `aria-label` を必ず付与 (lucide アイコンには `aria-hidden` が既定で付くため、ボタン側でラベル補完)。
- 共通ラッパは作らない (lucide コンポーネントを直接置く)。色は親の `color` 継承に任せ、`color` prop を個別指定しない (text トークン追従のため)。

---

## 3. コンポーネント規則

### 3.1 ★ 選択コントロール = segmented ボタン群 (`<select>` / dropdown 禁止)

**2〜5 択の選択は必ず segmented (可視ボタン群)。`<select>` ドロップダウンを使わない** (リサーチ B-4: segmented が dropdown より速い・全選択肢可視で認知負荷減、Touri の核指摘)。moneylog の radio スタイルに準拠する。

**Segmented の視覚仕様 (moneylog radio 準拠)**:

```css
.segmented {                      /* 群コンテナ */
  display: flex; flex-direction: row; flex-wrap: nowrap;
  gap: var(--space-1);            /* 4px (moneylog 5→正規化) */
  overflow-x: auto;               /* はみ出たら横スクロール (折返しでなく) */
  scrollbar-width: none;
  padding: var(--space-0_5) 0;    /* shadow が切れないための余白 */
}
.segmented::-webkit-scrollbar { display: none; }
.segmented__option {              /* 各ボタン (非選択) */
  flex: 0 0 auto;
  min-width: 72px;                /* moneylog 80 を 8 グリッドへ (72=18*4)。短ラベルは fit でも可 */
  min-height: 40px;
  padding: var(--space-2) var(--space-4);   /* 8 / 16 */
  border-radius: var(--radius-xs);          /* 8 */
  text-align: center;
  background: transparent;        /* ガラス面 */
  box-shadow: var(--shadow-soft); /* border でなく極薄影で浮かす (moneylog 質感) */
  color: var(--color-text);
  white-space: nowrap;
  transition: background var(--dur) var(--ease), color var(--dur) var(--ease), box-shadow var(--dur) var(--ease);
}
.segmented__option[aria-pressed="true"],
.segmented__option.is-selected {  /* 選択時 = accent 塗り + 文字反転 */
  background: var(--color-move);  /* accent。意味が固定の群は §下記で income/expense に差し替え可 */
  color: var(--color-bg);         /* 背景色を文字色へ = 反転塗り */
  box-shadow: var(--shadow-card);
}
```

**実装方式**: ネイティブ radio を CSS 非表示にして label を見せる方式 **でなく**、React は `<button role="radiogroup">` 内の `<button aria-pressed>` 群で実装する (テスト容易・data-testid 付与が明確)。

**Segmented を適用する箇所 (全 `<select>` / 確定 checkbox を置換)**:

| 画面 | フィールド | 選択肢 | 選択色 |
|---|---|---|---|
| RecordSheet | 確定状態 | 確定 / 未確定 (2) | accent (move) |
| RecordSheet | カテゴリ | カテゴリ数 (可変) | §3.2 で分岐 |
| RecordSheet | タグ | 当該カテゴリ配下タグ + 「未指定」 (可変) | §3.2 で分岐 |
| RuleSheet | 有効状態 | 有効 / 停止 (2) | accent |
| RuleSheet | カテゴリ / タグ | 可変 | §3.2 で分岐 |
| CategorySheet | 符号 (signMode) | 収入 / 支出 / 自由 (3) | 収入=income / 支出=expense / 自由=move |
| TagSheet | カテゴリ | 可変 | §3.2 で分岐 |

> 確定 / 有効の checkbox (`type="checkbox"`) も segmented 2 択化する (「確定/未確定」「有効/停止」)。on/off の checkbox より 2 択ボタンの方が状態が可視で moneylog 質感に合う。Home の「bundle で表示」トグルは閲覧切替であり入力フォームでないため**現状の checkbox/toggle のまま維持**してよい (segmented 化は入力モーダルの選択に限定)。

### 3.2 選択肢が 6 件以上の場合 (カテゴリ / タグ)

カテゴリ・タグは件数可変。リサーチ B-4 の「2-5 = segmented、6+ = ピッカー」に従い分岐:

- **選択肢 ≤ 5 件**: segmented 群 (横並び、はみ出たら横スクロール)。
- **選択肢 ≥ 6 件**: segmented では横スクロールが長大化するため **横スクロール segmented を維持しつつ `flex-wrap: wrap` で 2-3 段に折返す**。ドロップダウンには**戻さない** (Touri 指摘の select 廃止を貫く)。`max-height` を `--space-12*2` 程度に制限し超過時のみ群内スクロール。
  - 「未指定」(タグ) は群の先頭に固定オプションとして置く。
- **判断基準の数値**: `options.length <= 5 ? nowrap-横スクロール : wrap-折返し`。どちらも segmented__option スタイルは共通。**dropdown には一切しない**。

> 理由: Touri の指摘は「入力モーダルが select でなくボタンであるべき」。件数が増えても select に戻すと指摘に反する。多件時は wrap で全可視を保つ。

### 3.3 Sheet / モーダル共通コンポーネント

全モーダル (Record/Rule/Category/Tag) は単一の `Sheet` を使う (現行構造を踏襲)。規格を token で固定:

```css
.sheet-overlay {                  /* 背景オーバーレイ (blur は overlay のみ) */
  position: fixed; inset: 0; z-index: 20;
  display: grid; align-items: end;          /* モバイル = ボトムシート */
  background: var(--color-overlay);
  -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px);
}
.sheet {
  width: 100%; max-height: 88dvh; overflow: auto;
  border-radius: var(--radius-card) var(--radius-card) 0 0;   /* 上端 24 */
  background: var(--color-frost);
  box-shadow: var(--shadow-pop);
  -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px);
}
.sheet-header {
  display: grid; grid-template-columns: 44px 1fr auto; align-items: center;
  gap: var(--space-2); min-height: 56px;
  border-bottom: 1px solid var(--color-line);   /* header/body 境界に必ず divider */
  padding: 0 var(--space-3);
}
.sheet-header h2 { font-size: var(--text-lg); font-weight: var(--weight-medium); text-align: center; }
.sheet-body {
  display: grid; gap: var(--space-3);           /* field 間 12 */
  padding: var(--space-4);                      /* 外周 16 */
  padding-bottom: calc(var(--space-4) + env(safe-area-inset-bottom));
}
@media (min-width: 720px) {                     /* デスクトップ = 中央ダイアログ */
  .sheet-overlay { align-items: center; justify-items: center; padding: var(--space-6); }
  .sheet { max-width: 480px; border-radius: var(--radius-card); }
}
```

- **header は閉じる (`X` lucide 20) + タイトル + 右アクション (保存)**。submit/action ボタンは sheet-header 右 or body 末尾 (現行は header 右 `sheet-action`)。
- **sheet 自体は frosted (blur) でよい** (moneylog 質感)。ただしフォーム文字の視認性のため `--color-frost` は不透明度 .72-.75 を保ち、input 内は不透明 frost-2 面に置く ([`form-modal-readability-bp`](../../knowledge/pattern/form-modal-readability-bp.md) の「sheet に過度な透過を入れない」を frost .75 で担保)。
- **3 経路 close 不変**: overlay tap / ESC / X ボタン (現行 Sheet prop 契約踏襲)。
- ボトムシート (モバイル) / 中央ダイアログ (≥720px) の出し分けは上記 media query で固定。

### 3.4 button variant

| variant | 用途 | 視覚 |
|---|---|---|
| **primary** | hero-add / login 主ボタン / 強アクション | bg `--color-text` / 文字 `--color-bg` / `--radius-pill` / min-h 44 / padding `0 var(--space-4)` / `--shadow-soft` |
| **secondary** | soft-button / section追加 / control-mode / sheet-action | bg `--color-frost-2` / 文字 text / `--radius-pill` / min-h 38 / padding `0 var(--space-3)` / `--shadow-soft` |
| **ghost** | icon-only (control-icon / sheet-close / chip-clear) | bg transparent (hover で frost-2) / 丸 or pill / lucide アイコン中央 |
| **danger** | 削除 | bg `color-mix(--color-expense 12%, --color-frost)` / 文字 `--color-expense` / `--radius-pill` / min-h 40 |

全 button に `.press` (押下 scale)。tap target は **min-height ≥ 38px、主要操作 ≥ 44px** (HIG)。

### 3.5 input / textarea

```css
.field { display: grid; gap: var(--space-2); color: var(--color-text); font-weight: var(--weight-medium); }
.field > .field-label { font-size: var(--text-xs); font-weight: var(--weight-medium); color: var(--color-text-muted); }
.field input, .field textarea {
  min-height: 48px;                           /* HIG/MD3 tap target */
  border: 1px solid var(--color-line);
  border-radius: var(--radius-sm);            /* 12 */
  background: var(--color-frost-2);
  padding: 0 var(--space-3);                  /* 12 (textarea は上下も 12) */
  font-size: var(--text-base);                /* 14 */
}
```

- **label は muted (`--color-text-muted`) + xs (12) + medium**、**value (入力文字) は text (primary) + base (14)** ([`form-modal-readability-bp`](../../knowledge/pattern/form-modal-readability-bp.md): label を強く value を弱くしない。label 補助・value 主役)。
- 金額入力は `inputMode="numeric"`、`--font-num` (tabular-nums) で右に揃わずとも数値質感。
- `<select>` は §3.1 で全廃。残す input は date / month / number / text / textarea のみ。

### 3.6 chip

```css
.chip {
  min-height: 32px; display: inline-flex; align-items: center; gap: var(--space-1);
  padding: 0 var(--space-3); border-radius: var(--radius-xs);   /* 8 */
  background: var(--color-frost-2); box-shadow: var(--shadow-soft); color: var(--color-text);
  font-size: var(--text-xs);
}
.chip.is-selected { background: var(--color-frost); box-shadow: var(--shadow-card); }
.chip-dot { width: 8px; height: 8px; border-radius: var(--radius-pill); flex: 0 0 auto; }  /* tag.color */
```

カテゴリ/タグフィルタ chip。tag は `chip-dot` に `tag.color` を inline 適用。選択中は影を 1 段上げ (`--shadow-card`)。

### 3.7 card

```css
.card {
  background: var(--color-frost); border-radius: var(--radius-md);   /* 16 */
  box-shadow: var(--shadow-card);
  -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);
  padding: var(--space-4);                                          /* 16 */
}
.card--hero { border-radius: var(--radius-card); position: relative; overflow: hidden; }  /* 24 + blob */
.card--chip { background: var(--color-frost-2); border-radius: var(--radius-sm); }
```

`--shadow-card` のオフセット 0 影で浮かす。罫線でグループ化しない (薄カード面でグループ化)。hero は背後に blob (§moneylog)。

### 3.8 list row

```css
.row-button, .row-link {
  width: 100%; min-height: 56px; display: flex; align-items: center; gap: var(--space-2);
  border-bottom: 1px solid var(--color-line);   /* 行間 divider は極薄 1 本のみ */
  padding: var(--space-2) var(--space-4);        /* 8 / 16 */
  text-align: left;
}
.row-button:last-child { border-bottom: 0; }
.row-button:hover { background: var(--color-frost-2); }
.row-main { flex: 1; min-width: 0; display: grid; gap: var(--space-0_5); }   /* title と meta 間 2 */
.row-title { font-size: var(--text-md); font-weight: var(--weight-medium); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.row-meta  { font-size: var(--text-xs); color: var(--color-text-muted); }
.row-amount { font-family: var(--font-num); font-variant-numeric: tabular-nums; font-weight: var(--weight-medium); white-space: nowrap; }
```

record / rule / settings 行の共通規格。罫線は `--color-line` の極薄 1 本のみ (高密度テーブル化しない)。未確定行は `.is-unpaid` で muted + `Circle` マーク。

### 3.9 focus-visible リング (全インタラクティブ要素・WCAG 補完)

moneylog は `outline:none` だが WCAG 1.4.11 (非テキスト 3:1) 違反のため **focus-visible リングを補う** ([`form-modal-readability-bp`](../../knowledge/pattern/form-modal-readability-bp.md)):

```css
button:focus-visible, a:focus-visible, input:focus-visible,
textarea:focus-visible, [role="radiogroup"] .segmented__option:focus-visible {
  outline: 2px solid var(--color-move);   /* accent。白/暗背景で 3:1 確保 */
  outline-offset: 2px;
}
.field input:focus-visible {              /* input は border 強調も併用可 */
  border-color: var(--color-move);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-move) 20%, transparent);
}
```

- **`:focus` でなく `:focus-visible`** (マウス操作時にリングを出さない)。
- accent は `--color-move` (#3a86c8 / dark #5aa9e6)。`--color-move` を focus ring の唯一の色とする。
- segmented / chip / fab / control-icon を含む**全インタラクティブ要素**に適用。

---

## 4. 情報階層 & 視覚レイヤー化 (Touri 原則②)

優先度を **size / weight / font / spacing / elevation の 5 軸**で符号化する。色は使わない (意味色のみ)。

**家計簿の優先度マップ → レイヤー割当 (各画面要素を層に固定)**:

| 層 | 要素 | size | weight | spacing | elevation |
|---|---|---|---|---|---|
| **L0 最優先 (隔絶)** | 月末残高 (hero-ending) | `--text-hero` (38) | 500 | 上下 `--space-8`〜`--space-12` で孤立 | hero-card (`--radius-card` + blob) |
| **L1** | 月収支 / 年総計 / 現在残高 | `--text-xl` (22) / sub は md | 500 | hero 内 sub line | card |
| **L2** | record 金額・主テキスト / セクション見出し | `--text-md` (16) | 500 | row gap `--space-2` | card 内 row |
| **L3** | 日付 / カテゴリ / タグ / status / label | `--text-xs` (12) | 400 | meta gap `--space-0_5` | muted 文字 |
| **L4 最低** | キャプション / 軸ラベル / unpaid-mark | `--text-2xs`〜`sm` | 400 | — | faint 文字 |

**原則 (Developer 規律)**:
- L0 (残高) は **`--text-hero` を独占**。他要素に 38px を使わない。上下に `--space-8` 以上の余白で孤立させ「最初に目に入る」状態を作る。
- 同一カード内で L2 と L3 が混在する時、L3 は必ず `--color-text-muted` + 小サイズに落とす (フラットに並べない)。
- elevation (shadow) は意味のある浮上 (card / 選択中 / 浮遊要素) のみ。装飾の影を増やさない。
- グループ化は**罫線でなく薄カード面 + 余白**で行う (高密度テーブル化禁止)。

---

## 5. IA / ルート最短到達 (Touri 原則①)

### 5.1 原則

- **1 画面 + ControlBar mode 切替**を原則とする。タブ / サイドバー / bottom-tab で画面を割らない。
- ルートは **`/` (月/年 mode 統合 Home) + `/settings` + `/login`** の最小構成。月↔年は Home の local state、設定は `/settings` への 1 遷移のみ。**最大深さ 2** (Home → Sheet、または Home → Settings → Sheet)。
- 月↔年 mode はルート遷移でなく `useState` 内切替 (画面再構築しない)。

### 5.2 タスク頻度に応じた動線配置

| タスク | 頻度 | 配置 | タップ数 |
|---|---|---|---|
| 記録追加 | 最頻 | HeroCard の「入力する」ボタン (常時可視) + 右下 FAB (スクロール時) の両建て | 1 |
| 月/年/期間の閲覧切替 | 高 | ControlBar (年月ラベル tap = mode 切替 / ‹› = 期間移動) | 1 |
| タグ/カテゴリで絞る | 中 | chip tap (伸縮フィルタ) | 1 |
| 定期ルール管理 | 中 | Settings 内セクション | 2 |
| カテゴリ/タグ/アンカー設定 | 低 | Settings (⚙ から) | 2-3 |

### 5.3 新機能追加時の指針 (深さを増やさない)

- 新しい表示は**既存 Home の縦 1 カラムに section card を足す**か、**Settings に section を足す**。新ルート / 新タブを作らない。
- 入力は**既存 Sheet 共通コンポーネントに field を足す**。新モーダル種別を増やす時も `Sheet` を使い回す。
- 「設定的な低頻度操作」は Settings へ、「閲覧切替」は ControlBar の mode へ寄せる。

---

## 6. 現状チグハグ → 目標 適用チェックリスト (Developer 実装単位)

以後の全体調整 pass。各 pass は独立に実装可。対象ファイルを明記する。

### Pass ① 全 `<select>` → segmented ボタン群

| 対象ファイル | 箇所 | 置換 |
|---|---|---|
| `client/components/RecordSheet.tsx` | カテゴリ select / タグ select / 確定 checkbox | カテゴリ・タグ = segmented (§3.2 件数分岐) / 確定 = 確定·未確定 segmented |
| `client/components/RuleSheet.tsx` | カテゴリ select / タグ select / 有効 checkbox | 同上 / 有効 = 有効·停止 segmented |
| `client/components/CategorySheet.tsx` | 符号 (signMode) select | 収入·支出·自由 segmented (選択色 income/expense/move) |
| `client/components/TagSheet.tsx` | カテゴリ select | カテゴリ segmented (§3.2 分岐) |
| `client/styles.css` | — | `.segmented` / `.segmented__option` 追加、`.field select` 関連スタイル削除 |

> 新 data-testid: `segment-<field>` (群) / `segment-<field>-<value>` (各ボタン)。例 `segment-paid-paid` / `segment-paid-not` / `segment-sign-income`。カテゴリ/タグは `segment-category-<id>` / `segment-tag-<id>` / `segment-tag-none`。Reviewer はここを根拠に「tap で選択状態が `aria-pressed=true` に変わる」テストを書く。

### Pass ② spacing / radius を全 component で token 化 (チグハグ解消)

| 対象 | 直す内容 |
|---|---|
| `client/styles.css` `@theme` | `--space-0_5` `--space-12` 追加、`--radius-xs:8` 追加、`--radius-sm:15→12` `--radius-md:18→16` `--radius-card:25→24` に正規化 |
| `client/styles.css` 全 rule | ハードコード px (`min-width:80px`→72, `2px`/`9px`/`34px`/`42px`/`58px`/`18px` 等) を §1 token または 4px グリッド値に置換。`chip` radius を 15→`--radius-xs`(8)、`.row-main gap:2px`→`--space-0_5` |
| 各 `*.tsx` | inline style の px 直値 (あれば) を token 化。新規に px / hex を書かない |

> 残す端数: `tag-dot`/`chip-dot` の 8px、`unpaid Circle` 8px、`control-icon`/`fab` の 38/58 は tap target 由来 (38=HIG min・44/58=主要) で許容。それ以外の不規則 px は撲滅。

### Pass ③ 絵文字 / 記号アイコン → lucide-react 全置換

| 対象ファイル | 現状文字 | lucide |
|---|---|---|
| `client/components/ControlBar.tsx` | `‹` `›` `⚙` `‹ 戻る` | `ChevronLeft` `ChevronRight` `Settings` (size 20) / 戻る= `ChevronLeft`+「戻る」 |
| `client/components/HeroCard.tsx` | `✎ 入力する` | `Plus`(20) + 「入力する」 |
| `client/components/Fab.tsx` | `✎` | `Plus`(24) |
| `client/components/Sheet.tsx` | `×` | `X`(20) |
| `client/components/CategoryTagChips.tsx` | `×` (chip-clear) | `X`(16) |
| `client/components/RecordRow.tsx` | `●` (unpaid-mark) | `Circle`(8, fill) |
| `client/components/BundleRow.tsx` | `▾`/`▸` | `ChevronDown` / `ChevronRight` (16) |
| `client/routes/SettingsView.tsx` | `＋追加` ×3 | `Plus`(16) + 「追加」 |
| `package.json` | — | `lucide-react` 追加 |

> data-testid は不変 (アイコン中身のみ差し替え、`control-prev`/`hero-add`/`fab`/`sheet-close`/`chip-clear`/`record-unpaid-mark`/`bundle-row` 等の testid・aria-label は維持)。`record-unpaid-mark` は `paid=false` 時のみ存在の不変条件を保つ。

### Pass ④ type 階層の徹底 (§1.3 / §4)

| 対象 | 内容 |
|---|---|
| `client/index.html` | Open Sans webfont link 追加 (`--font-num`) |
| `client/styles.css` | `--font-num` 追加、金額系 (`.hero-ending` `.row-amount` `.year-summary strong` `.total-card strong`) に `font-family: var(--font-num)` 適用。label を muted+xs、section 見出しを md+medium に統一 (§4 レイヤー表通り) |
| 各 `*.tsx` | フォーム label を `.field-label` (muted xs) に。残高以外で `--text-hero` を使わない |

### Pass ⑤ focus-visible リング補完 (§3.9)

| 対象 | 内容 |
|---|---|
| `client/styles.css` | `:focus`→`:focus-visible` に統一、segmented / chip / fab / control-icon を含む全インタラクティブ要素に accent (move) 2px outline + offset 2px。input は border + ring |

> 現行 styles.css は既に `button:focus-visible` を持つ。本 pass で segmented 新要素への適用と `:focus`(非 visible) 残存箇所の `:focus-visible` 化を確認。

---

## 7. テスト基盤

- **フレームワーク**: Vitest 4 + React Testing Library (jsdom)。`vitest.config.ts` は `fileParallelism:false`。
- **配置**: `tests/client/*.test.tsx` (描画) / `src/**/__tests__` (純関数) / `tests/api/*` (API)。
- **本書由来の主要テストパターン** (Reviewer 指針):
  - **segmented**: 各 segmented (`segment-paid` 等) で初期選択が `aria-pressed=true`、別オプション tap で選択が移動、`<select>` 要素 (`role="combobox"`) が DOM に存在しないこと (select 廃止の回帰防止)。
  - **アイコン**: 絵文字文字 (`✎⚙‹›×●▾▸＋`) が DOM テキストに含まれないこと (lucide 化の回帰防止)。lucide は SVG なので testid / aria-label で操作対象を取得。
  - **token (CSS regex)**: `styles.css` を `fs.readFileSync` し、`--radius-sm:12` `--radius-md:16` `--radius-card:24` `--radius-xs:8` `--space-0_5:2px` 等の正規化値が存在することを assert (mobile-density token-pass パターン準拠)。
  - **focus**: 主要インタラクティブ要素に `:focus-visible` outline が当たる CSS が存在すること (regex)。
  - **既存 data-testid 契約** (`hero-*` `record-*` `control-*` `chip-*` `sheet-*` `segment-*`) は [`20260611-moneylog-faithful-redesign.md`](.designs/20260611-moneylog-faithful-redesign.md) §9/§10 を踏襲。
- **視覚回帰** (任意): chrome-devtools MCP で mobile 375×667 viewport screenshot (Chrome for Testing)。

---

## 8. 不採用案 (再検討ループ防止)

| 案 | 却下理由 |
|---|---|
| **moneylog の 5px グリッド忠実踏襲 (5/10/15/20/25)** | Touri が明示的に「4/8/16 にしたい」+「チグハグを直したい」。5px 系は Tailwind/HIG 標準と非整合でチグハグの温床。8px グリッドに正規化し semantic だけ moneylog から踏襲 (§1.1) |
| **選択肢が増えたら `<select>` に戻す** | Touri の核指摘「入力モーダルが select でなくボタンであるべき」に反する。6+ 件は dropdown でなく `flex-wrap` 折返し segmented で全可視を保つ (§3.2) |
| **PNG + `filter:invert` 継続 / 絵文字アイコン継続** | サイズ/stroke がバラつき任意色着色不可 (Touri「統一感ない」根因)。lucide-react = stroke2/currentColor で統一 + light/dark 自動追従 (§2) |
| **@phosphor-icons/react** | weight 切替が強みだが直近 release が lucide より古い。moneylog の単色 stroke 基調には lucide で十分 (リサーチ B-6) |
| **手動アイコン共通ラッパ / Icon コンポーネント自作** | lucide の named import が既に tree-shaking + size prop を提供。ラッパは二重抽象。直接配置で十分 (§2.4) |
| **色で情報優先度を表す (残高を緑、支出を赤背景 等)** | moneylog は color を意味 (符号) のみに使い優先度は size/weight/font で表す。色を優先度に流用すると意味色と衝突し一貫性が崩れる (§4・リサーチ A-5) |
| **手動 light/dark/auto テーマトグル** | moneylog は `prefers-color-scheme` 一本 + blob 色差替のみ。3 択 UI は moneylog に無い ([`20260611-moneylog-faithful-redesign.md`](.designs/20260611-moneylog-faithful-redesign.md) §14-1 で確定済) |
| **focus ring を出さない (moneylog 通り `outline:none`)** | WCAG 1.4.11 違反。`:focus-visible` + accent 2px で補完 (マウス時は非表示なので moneylog の見た目を損なわない) (§3.9) |
| **外部 UI ライブラリ (MUI/shadcn/Radix) で segmented/sheet を作る** | 素 Tailwind + 自前で frosted/segmented/sheet を表現でき、data-testid 温存しやすい。バンドル増 + 自前との二重化 |
