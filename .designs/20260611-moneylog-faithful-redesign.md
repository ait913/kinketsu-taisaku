# 金欠対策 — moneylog 忠実 モバイルファースト 1 画面 再設計 (client のみ)

> **本 doc は [`20260608-ui-cloudflare-redesign.md`](./20260608-ui-cloudflare-redesign.md) を全面 supersede する。**
> CF dashboard 風 (左サイドバー + 4 タブ + 高密度テーブル + ニュートラルグレー + orange) の路線は Touri に「センスがない」と却下された。
> 本 doc が確定する視覚言語・レイアウト・ナビ・コンポーネント構成が `client/` の正となる。CF doc の §3 トークン / §5 レイアウト / §6 画面 / §7 restyle 仕様は**すべて破棄**し、本 doc で置換する。
> CF doc が温存していた一部 data-testid・prop 契約のうち**本 doc で引き継ぐもの**は §10 に明記する (それ以外は本 doc が再定義する)。
>
> 対象: `client/` の見た目・レイアウト・ナビ・画面構造の全面再設計。**データモデル・API・挙動・エラーモデルは一切変えない** ([`20260608-mvp-core.md`](./20260608-mvp-core.md) §1〜§6 が不変の正)。backend (`src/`) は 1 行も触らない。
> デザイン基準 (一次ソース・最重要): [`Muraki/knowledge/pattern/moneylog-design-language.md`](../../../knowledge/pattern/moneylog-design-language.md)

---

## 0. デザイン哲学 (Developer 必読・逸脱禁止)

本 UI は **Touri 自作の家計簿 moneylog の視覚言語をそのまま踏襲**する。moneylog らしさの本質は **塗り・罫線・高密度ではなく**:

> **すりガラス (frosted glass) カード + ぼかしグラデ blob で「光」を置く + grid-rows 伸縮アニメ + 完全 1 画面 + 開いた瞬間に月末残高・入力ボタン・レコードが見える**

である。柔らかいガラス質感・親しみ・最短到達の UX。

### 0.1 CF 路線が却下された経緯 (再検討ループ防止)

[[pattern/moneylog-design-language]] の「反例 / やってはいけない」に記録済み:
- CF dashboard 風の**高密度テーブル + 左サイドバー + 4 タブ**にしたら Touri に「センスがない」と却下された。
- moneylog は**柔らかいガラス質感・1 画面・伸縮アニメ**であり、CF の硬質・高密度・タブ分割とは真逆。
- **データ操作アプリ = 高密度テーブル、と短絡しない**。Touri の家計簿は「必要情報が最初に出る親しみ UI」が正。

→ よって本 doc は CF の全要素 (サイドバー / bottom tab / 4 タブ / data-table / orange アクセント / ニュートラルグレー面 / 小 radius / 細罫線) を**捨てる**。§13 不採用案で各々の却下理由を列挙する。

### 0.2 禁止事項 (混入すると moneylog 質感が壊れる)

- **bottom tab / sidebar を作らない**。タブで画面を割らない。ナビは上部コントロールバーの「月↔年 モード切替 + 期間移動 + 設定」のみ。
- **高密度 data-table を作らない** (CF 路線の遺産)。レコードは frosted card 内の柔らかい行。
- **max-height 方式の開閉アニメを使わない**。開閉/伸縮は必ず `grid-template-rows: 0fr ↔ 1fr` + `.active`。
- **小 radius (2–4px) / 細罫線主体 / 控えめ shadow / orange 単一アクセント / ニュートラルグレー面**を使わない (CF トークン全廃)。
- **重量級グラフライブラリ (Chart.js/Recharts/ECharts) を入れない**。自前 SVG。
- **外部 UI ライブラリ (Chakra/MUI/shadcn/Radix) を入れない**。素 Tailwind v4 `@theme` + 任意 CSS + 自前コンポーネント。

---

## 1. 目的

現行 `client/` は CF dashboard 風 (左サイドバー + 4 タブ + 高密度テーブル) で、Touri が良いと認める moneylog の質感と真逆。これを **moneylog 忠実なモバイルファースト 1 画面 UX** に再設計する。開いた瞬間に「月末残高 + 入力ボタン + 残高推移グラフ + レコード」が縦 1 カラムで見え、上部コントロールバーの月↔年モード切替で年ビューへ。**機能・API・データ・挙動は不変**、見た目・レイアウト・ナビ・画面分割だけを moneylog 調に作り変える。

---

## 2. 変更スコープ (Developer への境界線)

### 2.1 触ってよい (`client/` のみ)

| ファイル | 変更内容 |
|---|---|
| `client/styles.css` | **全面書き換え**。CF トークン (gray/orange/小 radius/細罫線) を全廃し §4 の moneylog トークン (frosted/blob/grid-rows/scale/dark prefers-color-scheme) に置換 |
| `client/router.tsx` | **4 ルート (`/` `/trend` `/recurring` `/settings`) → 2 ルート (`/` = 月/年 mode 統合ホーム, `/settings`)** に再構成 (§6)。`/login` は維持 |
| `client/routes/AppShell.tsx` | sidebar / bottom-tabs を撤去し、認証ガード + `<Outlet/>` のみの薄い shell に。コントロールバーは各ホーム画面が持つ (§7) |
| `client/routes/Home.tsx` (新規) | 月/年 mode を内包する 1 画面ホーム。現行 `MonthView` / `TrendView` / `RecurringView` の表示要素を統合 (§7) |
| `client/routes/SettingsView.tsx` | moneylog 調 frosted に restyle + 定期ルール管理セクションを内包 (現行 RecurringView を設定へ移設、§8) |
| `client/components/*.tsx` | restyle / 構造変更 / 新規追加 (§9)。prop 契約は §9 で再定義 (一部は §10 で現行から引き継ぎ) |
| `client/components/format.ts` | 変更不要 (`yen` フォーマッタはそのまま) |
| `client/lib/useTheme.ts` | **mode 概念を撤去し `prefers-color-scheme` 一本化** (§4.4)。詳細 §4.4。現行 3 択 ThemeToggle は廃止 |
| 新規: `client/components/ControlBar.tsx` `HeroCard.tsx` `TrendLineChart.tsx` `YearBarChart.tsx` `CategoryTagChips.tsx` `RecordList.tsx` `Fab.tsx` | §9 |
| 削除: `client/routes/MonthView.tsx` `TrendView.tsx` `RecurringView.tsx` `components/ThemeToggle.tsx` | Home / Settings に統合 |

### 2.2 絶対に触らない

- `src/` 配下すべて (backend / schema / services / routes API / auth)。データモデル・API・挙動・エラーモデルは [`20260608-mvp-core.md`](./20260608-mvp-core.md) §1〜§6 のまま不変。
- `client/api/*.ts` (`client.ts` / `types.ts` / `auth.ts`) — DTO 型・`api()` fetch ラッパ・`authClient` は不変。
- **API 呼び出し URL・query key・mutation・invalidate 呼び出しは現行のまま不変**。本 doc は呼び出し**箇所 (どのコンポーネントが呼ぶか)** を移動するが、**呼び出し内容 (path / queryKey / body / invalidate 対象キー)** は 1 文字も変えない (§5)。
- backend テスト (`tests/api/*`, `src/**/__tests__/*`) — 本 doc 対象外。UI 再設計は backend に影響しない。

> Developer は backend を 1 行も変更しない。本 doc に backend 記述が無いのは意図的。

---

## 3. moneylog 視覚言語の要約 (一次ソース実測値)

[[pattern/moneylog-design-language]] より (§4 で具体 CSS 化):

```
背景      : #fafafa (light) / #181818 (dark)
文字      : #1e1e1e (rgb 30,30,30)
フォント   : "Noto Sans JP", "Hiragino Sans", Yu Gothic, 游ゴシック
base 文字  : 12px (密度高め)。残高など主役数値は特大 38px / weight 500
カード     : frosted = rgba(255,255,255,0.75) / radius 15-25px / box-shadow 0 0 8-10px rgba(20,20,20,.04-.1)
hero blob : linear-gradient(#03d9ff,#07fa62) を blur(40px) opacity.7 で frosted card 背後に。dark は #ff0303→#0747fa
transition: 0.3-0.5s ease 既定
開閉伸縮   : grid-template-rows 0fr↔1fr + .active (max-height 禁止)
押下      : transform: scale(1.02-1.1)
1 画面    : タブで割らない。コントロールバー (年月ラベル tap で 年↔月 / ‹ › 期間移動 / ⚙ 設定)
```

---

## 4. デザイントークン (`client/styles.css`)

現行 `styles.css` を**全面置換**する。Tailwind v4 (`@import "tailwindcss"` + `@theme`) + 任意 CSS。webfont は Noto Sans JP を Google Fonts から読む (現行は不読込。下記 §4.1)。

### 4.1 webfont (Noto Sans JP)

`client/index.html` の `<head>` (Developer 確認: 既存 index.html に追記) に:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet">
```
> index.html が無ければ Vite の既定 `index.html` を編集。font の差し替えは moneylog 質感の核 (Noto Sans JP weight 500 の特大残高が肝)。

### 4.2 `@theme` (Tailwind v4 トークン)

CF の gray 10 段 / orange / 小 radius を**全削除**し、以下で置換:

```css
@import "tailwindcss";

@theme {
  /* ===== surfaces (light = 既定) ===== */
  --color-bg: #fafafa;                       /* page 背景 */
  --color-text: #1e1e1e;                     /* 文字 rgb(30,30,30) */
  --color-text-muted: rgba(30,30,30,.5);     /* 未確定・補助 */
  --color-text-faint: rgba(30,30,30,.32);    /* キャプション */
  --color-frost: rgba(255,255,255,.75);      /* frosted card 面 */
  --color-frost-2: rgba(255,255,255,.55);    /* chip / 2 次面 */
  --color-line: rgba(30,30,30,.08);          /* 極薄 divider (罫線は最小限) */
  --color-overlay: rgba(20,20,20,.45);       /* sheet overlay */

  /* ===== semantic (収入/支出。moneylog は彩度低め) ===== */
  --color-income: #07a86b;                   /* 収入 (緑系。blob の green に呼応) */
  --color-expense: #e0556b;                  /* 支出 (赤系) */
  --color-move:   #3a86c8;                   /* 移動 / 中立 (青系) */

  /* ===== blob (hero グラデ。light = cyan→green) ===== */
  --blob-from: #03d9ff;
  --blob-to:   #07fa62;
  --blob-opacity: .7;

  /* ===== typography ===== */
  --font-sans: "Noto Sans JP", "Hiragino Sans", "Yu Gothic", "游ゴシック", sans-serif;
  --text-2xs: 11px; --text-xs: 12px; --text-sm: 13px; --text-base: 14px;
  --text-md: 16px; --text-lg: 18px; --text-xl: 22px; --text-hero: 38px;
  --weight-normal: 400; --weight-medium: 500; --weight-bold: 700;

  /* ===== radius (moneylog は大きい) ===== */
  --radius-card: 25px;   /* hero / 主要カード */
  --radius-md: 18px;     /* セクションカード */
  --radius-sm: 15px;     /* chip / 小カード / ボタン */
  --radius-pill: 9999px;

  /* ===== shadow (極薄ふわっと) ===== */
  --shadow-card: 0 0 10px rgba(20,20,20,.06);
  --shadow-soft: 0 0 8px rgba(20,20,20,.04);
  --shadow-pop: 0 0 24px rgba(20,20,20,.14);

  /* ===== spacing ===== */
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px; --space-6: 24px; --space-8: 32px;

  /* ===== motion ===== */
  --ease: cubic-bezier(.4,0,.2,1);
  --dur: .4s;          /* 既定 transition (0.3-0.5s 帯の中央) */

  /* ===== layout ===== */
  --shell-max: 520px;  /* デスクトップでも 1 カラムを中央に (ダッシュボード化しない) */
}
```

### 4.3 base / body / 1 カラム shell

```css
* { box-sizing: border-box; }
html { color-scheme: light dark; }
body {
  margin: 0;
  font-family: var(--font-sans);
  font-size: var(--text-base);
  line-height: 1.5;
  color: var(--color-text);
  background: var(--color-bg);
  -webkit-font-smoothing: antialiased;
}
button, input, select { font: inherit; color: inherit; }
button { cursor: pointer; background: none; border: 0; }

/* 1 カラム中央 (モバイル first。デスクトップも同じ幅を中央に置く) */
.shell {
  width: 100%;
  max-width: var(--shell-max);
  margin: 0 auto;
  padding: var(--space-3) var(--space-3) calc(96px + env(safe-area-inset-bottom));
  /* 下 padding = FAB + safe-area の逃げ */
  display: grid;
  gap: var(--space-3);
}

/* ===== frosted card (核トークン) ===== */
.card {
  background: var(--color-frost);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  padding: var(--space-4);
}
.card--hero { border-radius: var(--radius-card); position: relative; overflow: hidden; }
.card--chip { background: var(--color-frost-2); border-radius: var(--radius-sm); }

/* ===== blob (hero 背後の発光) ===== */
.hero-blob {
  position: absolute;
  top: 40px; left: 50%; transform: translateX(-50%);
  width: 200px; height: 90px;
  filter: blur(40px);
  opacity: var(--blob-opacity);
  background: linear-gradient(var(--blob-from), var(--blob-to));
  pointer-events: none;
  z-index: 0;
}
.card--hero > * { position: relative; z-index: 1; }  /* 中身を blob の上へ */

/* ===== grid-rows 伸縮 (max-height 禁止。これが唯一の開閉手段) ===== */
.collapsible {
  display: grid;
  grid-template-rows: 0fr;
  overflow: hidden;
  transition: grid-template-rows var(--dur) var(--ease);
}
.collapsible.active { grid-template-rows: 1fr; }
.collapsible > * { overflow: hidden; min-height: 0; }

/* ===== scale press (押下フィードバック) ===== */
.press { transition: transform var(--dur) var(--ease); }
.press:active { transform: scale(1.04); }
.press--lg:active { transform: scale(1.08); }

/* ===== transition 既定 ===== */
a, button, .card { transition: background var(--dur) var(--ease), box-shadow var(--dur) var(--ease), color var(--dur) var(--ease); }

/* ===== 金額符号色 ===== */
.income  { color: var(--color-income); }
.expense { color: var(--color-expense); }
.move    { color: var(--color-move); }
.amount  { font-variant-numeric: tabular-nums; font-weight: var(--weight-medium); white-space: nowrap; }

/* ===== 未確定 muted ===== */
.is-unpaid { color: var(--color-text-muted); }
```

### 4.4 dark (prefers-color-scheme 一本化)

> **判断 (Touri 承認事項 §14-1)**: 現行は `useTheme` (light/dark/auto 3 択 + localStorage + data-theme + matchMedia 監視) だが、moneylog は **`@media (prefers-color-scheme:dark)` で blob 色を差し替えるだけ**の OS 追従単純方式。Touri 確定方針も「dark は `prefers-color-scheme` で blob を赤→青」。よって **手動 3 択トグル・`useTheme` フック・`ThemeToggle` コンポーネント・`data-theme` 属性・localStorage 永続を全廃**し、CSS の `@media (prefers-color-scheme:dark)` 一本にする。テーマ切替 UI は画面から消す (moneylog にも無い)。

```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #181818;
    --color-text: #f2f2f2;
    --color-text-muted: rgba(242,242,242,.5);
    --color-text-faint: rgba(242,242,242,.32);
    --color-frost: rgba(40,40,40,.72);
    --color-frost-2: rgba(40,40,40,.5);
    --color-line: rgba(242,242,242,.1);
    --blob-from: #ff0303;          /* dark は赤→青 */
    --blob-to:   #0747fa;
    --blob-opacity: 1;
    --color-income: #2ad08f;
    --color-expense: #ff8095;
    --color-move:   #5aa9e6;
    --shadow-card: 0 0 10px rgba(0,0,0,.5);
    --shadow-soft: 0 0 8px rgba(0,0,0,.4);
    --shadow-pop:  0 0 24px rgba(0,0,0,.6);
  }
}
```
> `:root` の CSS 変数は Tailwind v4 `@theme` が `:root` に出力するため、`@media` 内で `:root` を再宣言して上書きする (data-theme は使わない)。

### 4.5 トークン適用の原則 (Developer 規律)

- 色・radius・shadow は**必ず CSS 変数経由**。ハードコード hex を新規に書かない (現行 CF gray/orange hex は全削除)。
- カード面は `.card` (frosted)。罫線は `--color-line` の極薄 divider に限定 (CF の細罫線多用は禁止)。
- 開閉は**必ず `.collapsible` (grid-rows)**。`max-height` トランジションを書かない。
- 押下要素には `.press`。
- 主役残高は `--text-hero` (38px) `--weight-medium` (500)。見出しに 38px を乱用しない (残高だけ)。

---

## 5. データ / API 不変の明記 (backend 触らない)

本再設計は **client の表示・配置のみ**。API・query key・DTO・mutation・invalidate は現行のまま。コンポーネント移動に伴い「どこで呼ぶか」は変わるが、「何を呼ぶか」は不変。

### 5.1 query key (不変。現行 client の値をそのまま使う)

| queryKey | endpoint | 使用画面 (再設計後) |
|---|---|---|
| `["month", yearMonth]` | `GET /api/months/:yearMonth` | Home 月モード (HeroCard / TrendLineChart / 統合情報 / CategoryTagChips / RecordList) |
| `["trend", yearMonth]` | `GET /api/trend/:yearMonth` | Home 月モード (TrendLineChart) |
| `["forecast", ym, months]` | `GET /api/forecast?from=&months=` | (年モードでは未使用。将来用に残す。月モードでも不使用) |
| `["years", year]` | `GET /api/years/:year` | Home 年モード (YearBarChart / 年統合 / タグ別) ※**新規 query key**。下記注 |
| `["categories"]` | `GET /api/categories` | Home / Settings |
| `["tags"]` | `GET /api/tags` | Home / Settings |
| `["recurring-rules"]` | `GET /api/recurring-rules` | Settings (定期管理) |
| `["settings"]` | `GET /api/settings` | Settings |
| `["anchor"]` | `GET /api/anchor` | Settings |
| `["records"]` | (invalidate 対象キーとしてのみ) | mutation 後の invalidate |

> **`["years", year]` は新規 query key**。現行 client には年ビューが無く `/api/years/:year` を呼んでいない。endpoint 自体は MVP §4.7 で実装済み (`YearData`)。client 側に query を新設するのは「新しい API を作る」ことではない (backend 不変)。invalidate 対象には含めない (年データは月 mutation で自動的に stale になるが、現行同様 `["month"]` invalidate と並べて任意で `["years"]` も invalidate してよい。Developer は **mutation の onSuccess に `["years"]` invalidate を追加してよいが必須ではない** — Touri 承認事項 §14-4)。

### 5.2 mutation / invalidate (不変)

現行各ビューの mutation (records POST/PATCH/DELETE, categories, tags, anchor PUT, settings PATCH, recurring-rules POST/PATCH/DELETE) と `invalidateQueries` 呼び出しは**そのまま移送**する。invalidate 対象キー集合 (`["records"]` `["month"]` `["trend"]` `["forecast"]` `["categories"]` `["tags"]` `["recurring-rules"]` `["settings"]` `["anchor"]`) を増減しない (§14-4 の `["years"]` 追加を除く)。

### 5.3 タグフィルタは client 側 (API 追加なし)

CategoryTagChips のタグフィルタ (§9.5) は **`["month", yearMonth]` の取得済みデータを client 側で絞る**。新規 API・query を作らない。
- chip 一覧 = `monthData.byTag` (各 `{ tagId, all, paidOnly }`) を `tags` query で `name`/`color` 解決して表示。
- chip tap → そのタグの合計 = 当該 `byTag` 要素の `all` (移動含む符号付き合計)。
- フィルタ後のレコード = `monthData.records.filter(r => r.tagId === selectedTagId)`。
- カテゴリ chip も同様に `monthData.byCategory` + `r.categoryId === selectedCategoryId`。

> `monthData.byTag` / `byCategory` は `/api/months/:yearMonth` が既に返す (backend `src/routes/months.ts` で `groupTotals` 済み、確認済み)。現行 MonthView の local `MonthData` 型がこれらを読んでいないだけなので、**client の型に `byTag`/`byCategory`/`totals.incomeConfirmed`/`expenseConfirmed`/`endingBalanceConfirmed` を追加で読む** (DTO 自体は backend が返している既存フィールド。型追加であって API 変更ではない)。

---

## 6. 画面構造とナビ (1 画面 + 月/年 mode)

### 6.1 ルーティング (TanStack Router、4 ルート → 2 ルート)

`client/router.tsx` を再構成:

```ts
const rootRoute   = createRootRoute({ component: AppShell });
const indexRoute  = createRoute({ getParentRoute: () => rootRoute, path: "/",        component: Home });
const loginRoute  = createRoute({ getParentRoute: () => rootRoute, path: "/login",    component: Login });
const settingsRoute = createRoute({ getParentRoute: () => rootRoute, path: "/settings", component: SettingsView });
export const router = createRouter({ routeTree: rootRoute.addChildren([indexRoute, loginRoute, settingsRoute]) });
```

- `/trend` `/recurring` ルートは**削除**。推移グラフは Home 月モードに内包 (§7.3)、定期管理は Settings に内包 (§8.2)。
- `/settings` は残す (⚙ から全画面遷移。§8)。

### 6.2 AppShell (薄い shell に)

`AppShell.tsx` は sidebar / bottom-tabs を**撤去**し、認証ガード + `.shell` ラッパ + `<Outlet/>` のみ:

```tsx
export function AppShell() {
  const session = authClient.useSession();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isLogin = pathname === "/login";
  useMemo(() => { /* 認証ガード: 現行ロジックそのまま */ }, [session.isPending, session.data, isLogin, navigate]);
  if (session.isPending) return <main className="shell"><p>読み込み中</p></main>;
  if (isLogin) return <Outlet />;
  return <main className="shell"><Outlet /></main>;
}
```
> 認証ガード (`!session.data && !isLogin → /login` / `session.data && isLogin → /`) は現行ロジックを変えない。sidebar / bottom-tabs / ThemeToggle / ログアウトボタンは shell から消える。**ログアウトは Settings 画面に移す** (§8.3)。

### 6.3 ナビ (コントロールバー集約)

ナビは Home / Settings の上部 **ControlBar** に集約 (§9.1)。月↔年 mode は **Home の local state** (`useState<"month"|"year">`)。ルート遷移ではない (1 画面内切替)。`⚙` だけ `/settings` へ `navigate`。

---

## 7. Home 画面 (月モード / 年モード 統合)

`client/routes/Home.tsx` (新規)。`const [mode, setMode] = useState<"month"|"year">("month")` で月/年を切替。縦 1 カラム。

### 7.1 月モード レイアウト (縦、上から)

```
┌──────────────────────────────────┐
│ [2026年6月] ‹ ›            ⚙      │  ① ControlBar (年月 tap→年mode / ‹›前後月 / ⚙設定)
├──────────────────────────────────┤
│ ╭────── card--hero (frosted) ───╮ │  ② HeroCard
│ │   (背後に blob 発光)           │ │
│ │   月末に残っている残高          │ │     ラベル (小)
│ │   ¥ 98,200                    │ │     特大 38px/500 = endingBalanceForecast
│ │   現在 ¥123,456  収支 +¥1,200  │ │     currentBalance / (income+expense)
│ │   [ ✎ 入力する ]               │ │     常時表示の入力ボタン (.press--lg)
│ ╰───────────────────────────────╯ │
├──────────────────────────────────┤
│ ╭── card (月統合情報) ──────────╮ │  ③ 収入 / 支出 / 移動 の合計
│ │ 収入 +¥250,000  支出 -¥151,800 │ │
│ │ 移動 ±¥0                       │ │
│ ╰───────────────────────────────╯ │
├──────────────────────────────────┤
│ ╭── card (残高推移グラフ) ───────╮ │  ④ TrendLineChart (月統合情報の直下=月画面内)
│ │  確定線 ━━  着地予測線 ┈┈      │ │     /api/trend/:ym 日次累積 + 今日縦線
│ ╰───────────────────────────────╯ │
├──────────────────────────────────┤
│  [食費]  [給料]  [Netflix] …      │  ⑤ CategoryTagChips (tap で伸縮フィルタ)
│  ╭ choice header (選択中のみ) ──╮ │     選択中: タグ色 + 合計 + ×
├──────────────────────────────────┤
│ ╭── card (レコード一覧) ────────╮ │  ⑥ RecordList (未確定/確定/bundle group)
│ │ ● 6/27 Netflix   -¥1,490 予定  │ │
│ │   6/25 給料     +¥250,000 確定 │ │
│ ╰───────────────────────────────╯ │
└──────────────────────────────────┘
                              ( ✎ )    ⑦ FAB (右下固定。スクロール時の追加導線)
```

### 7.2 ① ControlBar / ② HeroCard / ③ 月統合情報

- ① `<ControlBar mode="month" .../>` (§9.1)。
- ② `<HeroCard .../>` (§9.2): `endingBalanceForecast` を特大、`currentBalance` (null なら非表示) と収支 (`incomeForecast + expenseForecast`) を補助、`✎ 入力する` ボタン (`onAddRecord`)。データは `["month", yearMonth]`。
- ③ 月統合情報 card: `totals.incomeForecast` (収入) / `totals.expenseForecast` (支出、負値) / 移動 (`byCategory` で signMode=free カテゴリの合計、または `endingBalanceForecast - currentBalance - 収支` ではなく **`monthData.byCategory` のうち income/expense 以外の合計**)。移動算出は §9 で確定 (下記)。

> **移動合計の算出 (曖昧排除)**: 移動 = `Σ byCategory[c].all for c where category(c).signMode === "free"`。`categories` query で各 categoryId の `signMode` を解決し、`free` のものの `all` を合算。`income`/`expense` の signMode は収入/支出枠で集計済みなので二重計上しない。free カテゴリが無ければ移動 = 0 (移動行は `±¥0` 表示、非表示にしない)。

### 7.3 ④ TrendLineChart (月画面内・月統合情報の直下)

- `<TrendLineChart yearMonth={yearMonth} />` (§9.3)。`["trend", yearMonth]` の `points` を確定線 (confirmed, 実線) + 着地予測線 (forecast, 破線) の 2 series で自前 SVG 描画。今日に縦点線。
- frosted `.card` 内。凡例「確定 ━ / 着地予測 ┈」。
- **配置確定 (Touri 指示・moneylog 準拠)**: **②HeroCard → ③月統合情報(収入/支出/移動) → ④TrendLineChart → ⑤CategoryTagChips** の順。残高推移は「月統合情報の下」に置く (moneylog の縦並びに合わせる)。

### 7.4 年モード レイアウト

ControlBar の年月ラベル tap で `mode="year"` に切替。

```
┌──────────────────────────────────┐
│ [2026年] ‹ ›              ⚙      │  ControlBar (mode="year": 年ラベル tap→月mode / ‹›前後年)
├──────────────────────────────────┤
│ ╭── card (年統合) ──────────────╮ │  総収支 (年 income+expense 合計)
│ │ 総収支 +¥420,000              │ │
│ ╰───────────────────────────────╯ │
├──────────────────────────────────┤
│ ╭── card (月別 棒グラフ) ───────╮ │  YearBarChart (自前 SVG)
│ │ ▁▃▅▂▆▃▁▄▇▅▃▂  1〜12月         │ │  /api/years/:year の月別 income/expense/endingBalance
│ ╰───────────────────────────────╯ │
├──────────────────────────────────┤
│ ╭── card (タグ別集計) ──────────╮ │  byTag 一覧 (年合計)
│ │ 食費 -¥48,000 / 給料 +¥3,000k  │ │
│ ╰───────────────────────────────╯ │
└──────────────────────────────────┘
```

- データは `["years", year]` (§5.1)。`YearData = { year, months[12], byCategory[], byTag[] }`。
- 年統合 (総収支): `Σ months[i].incomeForecast + months[i].expenseForecast` (12 ヶ月の forecast 収支合計)。
- 月別棒グラフ: `<YearBarChart months={yearData.months} />` (§9.4)。各月 `endingBalanceForecast` を棒高に、`incomeForecast`/`expenseForecast` を色で。確定/予測の表現は §9.4。
- タグ別集計: `yearData.byTag` を `tags` query で解決して `name + yen(all)` リスト。

---

## 8. Settings 画面 (`/settings`)

`SettingsView.tsx` を moneylog 調 frosted に restyle + **定期ルール管理を内包** (RecurringView を移設)。⚙ から全画面遷移。

### 8.1 構成 (縦 1 カラム、frosted card セクション)

```
┌──────────────────────────────────┐
│ ‹ 戻る          設定              │  ControlBar (settings variant: ‹戻る で / へ navigate)
├──────────────────────────────────┤
│ ╭ card: 定期ルール ──── [＋追加] ╮ │  ① 定期管理 (現行 RecurringView を移設)
│ │  給料   毎月25日 +¥250,000      │ │
│ │  Netflix 毎月27日  -¥1,490      │ │     行 tap → RuleSheet
│ ╰───────────────────────────────╯ │
│ ╭ card: カテゴリ管理 ── [＋追加] ╮ │  ② category (現行維持)
│ ╭ card: タグ管理 ───── [＋追加] ╮ │  ③ tag (現行維持。色 swatch)
│ ╭ card: 初期残高アンカー ───────╮ │  ④ anchor (balance + asOf)
│ ╭ card: 予測期間 ───────────────╮ │  ⑤ materializeMonths スライダ
│ ╭ card: アカウント ─────────────╮ │  ⑥ email 表示 + ログアウト
└──────────────────────────────────┘
```

### 8.2 定期ルール管理 (RecurringView を移設)

- 現行 `RecurringView.tsx` のロジック (rules query / saveRule / deleteRule / RuleSheet / confirmDelete) を **Settings の 1 セクションとして移送**。query key `["recurring-rules"]`・mutation・invalidate は不変。
- 表示は frosted card 内の柔らかい行 (data-table 化しない)。各 rule: `label / 毎月X日 / signedAmount (符号色) / category·tag / 停止中バッジ`。active=false は `.is-unpaid` muted。
- `[＋追加]` → RuleSheet (新規)。行 tap → RuleSheet (編集/削除)。RuleSheet の delete は keepRecords confirm (現行維持)。

### 8.3 その他セクション (現行維持 + restyle)

- ② カテゴリ ③ タグ ④ アンカー ⑤ 予測期間: 現行 SettingsView のロジック・mutation・invalidate を保持し frosted restyle。
- ⑥ **アカウント**: `session.data.user.email` 表示 + ログアウトボタン (`authClient.signOut()`)。AppShell から移設。
- 削除時 `STILL_IN_USE` トースト文言「○件で使用中のため削除できません」は現行ロジック維持 (§9.8 toast)。

---

## 9. コンポーネント prop 契約 (描画テスト根拠)

[[gotcha/design-must-specify-component-prop-contract-for-render-tests]] 準拠。Reviewer が描画テストを書く対象は prop 契約を確定。data-testid は §10 と一致させる。

### 9.1 ControlBar

```ts
type ControlBarProps = {
  variant: "month" | "year" | "settings";
  // month/year:
  label?: string;                       // "2026年6月" / "2026年"
  onPrev?: () => void;                   // ‹
  onNext?: () => void;                   // ›
  onToggleMode?: () => void;            // 年月ラベル tap (month⇄year)
  onSettings?: () => void;              // ⚙ → /settings
  // settings:
  onBack?: () => void;                  // ‹ 戻る → /
};
```
- 表示: `data-testid="control-bar"`。
- month/year: `[label]`(button, tap=`onToggleMode`, `.press`) + `‹`(`onPrev`) + `›`(`onNext`) + `⚙`(`onSettings`)。`data-testid="control-prev"/"control-next"/"control-mode"/"control-settings"`。
- settings: `‹ 戻る`(`onBack`, `data-testid="control-back"`) + 「設定」見出し。
- frosted は付けず透明 (画面トップに溶け込む)。sticky top でもよい (Developer 判断、scroll 追従推奨)。

### 9.2 HeroCard

```ts
type HeroCardProps = {
  endingBalanceForecast: number;        // 特大 38px = 月末に残っている残高
  currentBalance: number | null;        // null のとき「現在」行非表示
  netForecast: number;                  // 当月収支 = incomeForecast + expenseForecast
  onAddRecord: () => void;              // ✎ 入力する
};
```
- `data-testid="hero-card"`。`.card.card--hero` + `<span class="hero-blob"/>`。
- 月末残高: `data-testid="hero-ending"`、`yen(endingBalanceForecast)`、`--text-hero`/`--weight-medium`。
- 現在残高: `currentBalance!==null` のとき `data-testid="hero-current"` を描画、`yen(currentBalance)`。null なら非描画 (CF doc の summary-current 不変条件を継承)。
- 収支: `data-testid="hero-net"`、`yen(netForecast)`、符号色 (`netForecast>=0` → income / else expense)。
- 入力ボタン: `data-testid="hero-add"`、`.press--lg`、tap=`onAddRecord`。

### 9.3 TrendLineChart

自前 SVG。現行 `LineChart.tsx` を**内部流用**してよい (prop 契約は不変、§10)。`TrendLineChart` は薄い wrapper:

```ts
type TrendLineChartProps = { yearMonth: string };
// 内部: useQuery(["trend", yearMonth]) → LineChart に confirmed/forecast 2 series を渡す
```
- 内部の `<LineChart>` の **prop 契約・data-testid (`line-chart`) ・series id (`"confirmed"`/`"forecast"`)・`<polyline data-series-id>`・null 点分割は §10 で不変**。
- 色は moneylog 調に: confirmed = `var(--color-text)` (実線太)、forecast = `var(--color-income)` 破線 (or `--color-move`)。`todayIndex` で縦点線。frosted `.card` 内 + 凡例 `data-testid="chart-legend"`。
- ローディング/空 (points 無し): card 内 muted プレースホルダ。

### 9.4 YearBarChart (新規・自前 SVG)

```ts
type YearBarChartProps = {
  months: { yearMonth: string; endingBalanceForecast: number; endingBalanceConfirmed: number;
            incomeForecast: number; expenseForecast: number }[];   // 12 件 (YearData.months)
};
```
- `data-testid="year-bar-chart"`、`<svg>` viewBox。各月 1 本の棒 (`<rect data-month={yearMonth}>`)。
- 棒高 = `endingBalanceForecast` を min/max スケール (LineChart 同様 padding 10%、DOM 寸法非依存・props 数値のみ)。
- 色: その月の収支 (`incomeForecast + expenseForecast`) が `>=0` → income 色、`<0` → expense 色。確定済み月 (`endingBalanceConfirmed` が forecast と一致 = 全確定) は実塗り、予測月は半透明 (opacity .6) で区別。
- x ラベル = `1`〜`12` 月 (`yearMonth.slice(5)`)。

### 9.5 CategoryTagChips (伸縮フィルタ)

```ts
type ChipFilterTarget = { kind: "tag"; tagId: number } | { kind: "category"; categoryId: number } | null;
type CategoryTagChipsProps = {
  byTag: { tagId: number; all: number; paidOnly: number }[];
  byCategory: { categoryId: number; all: number; paidOnly: number }[];
  tags: TagDTO[];
  categories: CategoryDTO[];
  selected: ChipFilterTarget;
  onSelect: (target: ChipFilterTarget) => void;   // 同一 chip 再 tap で null (解除)
};
```
- `data-testid="category-tag-chips"`。各 chip = `data-testid="chip-tag-<tagId>"` / `chip-category-<categoryId>`、`.card--chip.press`。chip ラベル = `tag.name` (色 dot = `tag.color`) / `category.name`。
- chip tap → `onSelect`。同一 chip 再 tap → `onSelect(null)` (解除)。
- **選択中 (`selected !== null`)**: chip 群の下に **choice header** (`data-testid="chip-choice"`) を `.collapsible.active` で伸縮表示。中身 = タグ/カテゴリ色のバー + 名前 + 合計 (`yen(対象 byTag/byCategory.all)`) + `×` (`data-testid="chip-clear"`, tap=`onSelect(null)`)。
- 非選択時 choice header は `.collapsible` (非 active = grid-rows 0fr で畳む)。
- **フィルタの実適用は親 (Home) が行う** (§9.6 RecordList に絞ったレコードを渡す)。chip は選択 state の通知のみ。

### 9.6 RecordList (グループ + collapsible)

```ts
type RecordGroupKey = "unpaid" | "paid" | "bundle";
type RecordListProps = {
  records: RecordDTO[];                 // 親が selected フィルタ適用済みで渡す
  bundles: BundleDTO[];
  tags: TagDTO[];
  categories: CategoryDTO[];
  bundleOn: boolean;                    // bundle 概要表示トグル
  expandedBundle: string | null;
  onToggleBundle: (description: string) => void;
  onEditRecord: (recordId: number) => void;
};
```
- `data-testid="record-list"`。frosted `.card`。
- **グルーピング順**: ① 未確定 (`paid===false`) group → ② 確定 (`paid===true`) group → ③ bundle group (`bundleOn` 時)。各 group 見出しは muted 小ラベル (「予定」「確定」)。
- `bundleOn===true`: §現行 MonthView と同じく、`bundles` を `<BundleRow>` (collapsible 展開、§10 不変) で束ね、bundle に含まれる record は通常リストから除外。`bundleOn===false`: 全 record を未確定/確定 group でフラット表示。
- 各 record 行 = `<RecordRow>` (§10 prop 契約不変、`record-row`/`record-amount`/`record-unpaid-mark`)。
- 空 (`records.length===0` かつ bundle も無し): `data-testid="empty-records"`、muted「この月の記録はまだありません」。
- bundle 展開は `BundleRow` 内 `children` を `.collapsible.active` で伸縮 (max-height 禁止)。

### 9.7 Fab

```ts
type FabProps = { onClick: () => void };
```
- `data-testid="fab"`、右下固定 (`.fab`)、`.press--lg`、`✎` アイコン。月モードのみ表示 (年/設定では非表示 — Home が `mode==="month"` のとき描画)。HeroCard の入力ボタンと両建て (Touri 承認済)。

### 9.8 toast (notice)

- 現行各ビューの `<p className="notice error" data-testid="toast">{message}</p>` を維持。frosted 調 restyle (左色バー = 符号色 or expense)。`data-testid="toast"` 不変。

### 9.9 各 Sheet (frosted restyle)

- `Sheet` (基底) / `RecordSheet` / `RuleSheet` / `CategorySheet` / `TagSheet`: **prop 契約・data-testid・3 経路 close は §10 で不変**。CSS のみ moneylog 調 (frosted panel・radius-card・モバイルはボトムシート `align-items:end`・blur overlay)。
- フォーム視認性は [[pattern/form-modal-readability-bp]] 準拠 (label medium、divider、input min-h 48、focus ring)。

---

## 10. data-testid 体系と既存テスト棚卸し

本再設計は**構造を大きく変える**ため、新 testid 体系を定義する。Reviewer は client テストを**作り直す前提**でよい。backend テスト (API/純関数) は backend 不変ゆえ全維持。

### 10.1 不変で引き継ぐ data-testid + prop 契約 (現行コンポーネント流用)

以下は現行コンポーネントをそのまま使い回す (CSS のみ restyle)。Reviewer は既存テストの該当分を**ほぼそのまま再利用可**:

| data-testid | コンポーネント | 不変条件 |
|---|---|---|
| `record-row` / `record-amount` / `record-unpaid-mark` | `RecordRow` | prop `{ record, tag, category, onClick }` 不変。`record-unpaid-mark` は `paid=false` のときのみ存在。`onClick(record.id)` |
| `bundle-row` | `BundleRow` | prop `{ bundle, expanded, onToggle, children }` 不変。テキスト `${description} (${count})` |
| `line-chart` | `LineChart` | prop `{ series, xLabels, height, todayIndex }` 不変。series id (`"confirmed"`/`"forecast"`)・`<polyline data-series-id>`・null 点分割 |
| `sheet-overlay` / `sheet` / `sheet-close` / `sheet-action` | `Sheet` | prop `SheetProps` 不変。3 経路 close (overlay/ESC/×) |

### 10.2 新規 data-testid

| data-testid | コンポーネント |
|---|---|
| `control-bar` / `control-prev` / `control-next` / `control-mode` / `control-settings` / `control-back` | ControlBar |
| `hero-card` / `hero-ending` / `hero-current` / `hero-net` / `hero-add` | HeroCard |
| `chart-legend` | TrendLineChart (現行 TrendView の testid を踏襲) |
| `year-bar-chart` | YearBarChart |
| `category-tag-chips` / `chip-tag-<id>` / `chip-category-<id>` / `chip-choice` / `chip-clear` | CategoryTagChips |
| `record-list` / `empty-records` | RecordList |
| `fab` | Fab |
| `toast` | notice (現行踏襲) |
| `settings-logout` | Settings アカウント (旧 logout-button 相当) |

### 10.3 廃止する data-testid / コンポーネント (現行テスト要更新・削除)

| 廃止 testid / 要素 | 理由 | 関連既存テスト |
|---|---|---|
| `summary-current` / `summary-forecast` (`SummaryCard`) | SummaryCard 廃止。残高は HeroCard に統合 (`hero-current`/`hero-ending`) | `tests/client/SummaryCard.test.tsx`・`components.test.tsx` の SummaryCard describe → **HeroCard 用に書き直し** (currentBalance=null で `hero-current` 非存在 の不変条件は HeroCard に継承) |
| `sidebar` / `bottom-tabs` / `nav-month` / `nav-trend` / `nav-recurring` / `nav-settings` | sidebar/bottom-tab 廃止。ナビは ControlBar mode 切替に | `tests/client/AppShell.test.tsx` → **削除 or ControlBar テストに置換** |
| `theme-toggle` (`ThemeToggle`) | 手動テーマ切替廃止 (prefers-color-scheme 一本化、§4.4) | `tests/client/ThemeToggle.test.tsx` / `useTheme.test.ts` → **削除** (`useTheme`/`resolveTheme`/`applyTheme` も廃止) |
| `empty-rules` (RecurringView) | RecurringView 廃止。定期は Settings に移設 | `tests/client/EmptyStates.test.tsx` の empty-rules → **Settings 定期セクションの空状態 testid (`empty-rules` を Settings で再付与可) に置換** |

### 10.4 既存 client テストファイル棚卸し一覧 (Reviewer 指針)

| ファイル | 扱い |
|---|---|
| `tests/client/components.test.tsx` | RecordRow / BundleRow / LineChart / Sheet describe = **そのまま再利用可** (§10.1)。SummaryCard describe = **HeroCard 用に書き直し** |
| `tests/client/SummaryCard.test.tsx` | **書き直し** → HeroCard (`hero-ending` 常在 / `hero-current` は currentBalance!==null 時のみ / `hero-net` 符号色) |
| `tests/client/AppShell.test.tsx` | **削除 or 置換** (sidebar/bottom-tabs/nav-* 廃止)。代替: ControlBar の mode 切替・期間移動テスト |
| `tests/client/ThemeToggle.test.tsx` | **削除** (テーマ切替 UI 廃止) |
| `tests/client/useTheme.test.ts` | **削除** (`useTheme`/`resolveTheme`/`applyTheme` 廃止) |
| `tests/client/EmptyStates.test.tsx` | empty-records = **RecordList で再付与** (mock data shape は §11.5 で確定 → 現行 skip 解消可)。empty-rules = Settings 定期セクションへ移設 |
| `tests/api/*` `src/**/__tests__/*` | **全維持** (backend 不変) |

> 既存 32 件のうち RecordRow/BundleRow/LineChart/Sheet の描画テストは prop 契約不変ゆえ継続。SummaryCard/AppShell/ThemeToggle/useTheme/EmptyStates 系は本再設計で構造が変わるため Reviewer が §11 の挙動仕様から再生成する。

---

## 11. 挙動仕様 (Reviewer テスト根拠・曖昧排除)

「○○のとき△△」を網羅。Reviewer はここからテストを書く。

### 11.1 月↔年 mode 切替 (ControlBar)

- 正常系: Home 初期 `mode==="month"` のとき HeroCard (`hero-card`) と RecordList (`record-list`) と TrendLineChart が描画される。`year-bar-chart` は非描画。
- 正常系: ControlBar の `control-mode` (年月ラベル) を tap すると `mode==="year"` になり、`year-bar-chart` が描画、`hero-card` が非描画になる。
- 正常系: 年モードで `control-mode` (年ラベル) を再 tap すると `mode==="month"` に戻る。
- 正常系: 月モードのラベルは `"YYYY年M月"` 形 (例 `2026年6月`)、年モードは `"YYYY年"` 形。
- 正常系: `control-settings` (⚙) tap で `/settings` へ navigate。

### 11.2 期間移動 (‹ ›)

- 正常系: 月モードで `control-next` tap → 翌月の yearMonth で `["month", 翌月]` を取得する (state の yearMonth が +1 月)。`control-prev` で前月。
- 正常系: 年モードで `control-next` tap → 翌年で `["years", 翌年]`。`control-prev` で前年。
- 境界: 12 月で `control-next` → 翌年 1 月 (yearMonth ロールオーバー)。1 月で `control-prev` → 前年 12 月。

### 11.3 タグ chip 伸縮フィルタ (CategoryTagChips + RecordList)

- 正常系: `byTag` に N 件あれば chip が N 個 (`chip-tag-<id>`)、`byCategory` の分も chip 描画。
- 正常系: `chip-tag-5` tap → `selected = { kind:"tag", tagId:5 }`。RecordList の `records` は `tagId===5` のレコードのみ (該当のみ表示)。
- 正常系: 選択中は `chip-choice` が `.collapsible.active` で表示され、タグ色バー + 名前 + 合計 (`yen(byTag.find(tagId=5).all)`) + `chip-clear` を含む。
- 正常系: 同じ `chip-tag-5` を再 tap → `selected = null` (解除)、RecordList は全レコードに戻り `chip-choice` は畳む (非 active)。
- 正常系: `chip-clear` tap → `selected = null` (解除)。
- 正常系: カテゴリ chip (`chip-category-2`) tap → `categoryId===2` で絞る。
- 異常系: 該当タグのレコードが 0 件のとき RecordList は `empty-records` を表示 (フィルタ結果空)。
- 不変条件: フィルタは client 側のみ。新規 fetch を発火しない (`["month"]` の取得済みデータを絞るだけ)。

### 11.4 trend / bar データ算出 (既存 API 形)

- trend: `["trend", ym]` の `points[]` を confirmed (実線) / forecast (破線) の 2 series で `<LineChart>` に渡す。confirmed が `null` の点 (未来日) で polyline が分割される (LineChart の null 分割不変)。今日 = confirmed が初めて null になる手前の index に縦点線 (`todayIndex`)。
- year bar: `["years", year]` の `months[12]` を `YearBarChart` に渡す。各月の棒高 = `endingBalanceForecast`、色 = `incomeForecast+expenseForecast` の符号、確定月は実塗り・予測月は半透明。
- 不変条件: いずれも DOM 寸法非依存 (props 数値のみで viewBox 計算) → jsdom で描画テスト可能。

### 11.5 HeroCard / 残高表示

- 正常系: `hero-ending` は常に `yen(endingBalanceForecast)` を表示。
- 正常系: `currentBalance!==null` のとき `hero-current` を表示 (`yen(currentBalance)`)。`currentBalance===null` (今日が当該月外) のとき `hero-current` 非存在。
- 正常系: `hero-net` は `yen(netForecast)`、`netForecast>=0` で income 色 class、`<0` で expense 色 class。
- 正常系: `hero-add` tap で `onAddRecord` 発火 → RecordSheet (新規) open。
- 空状態テスト用 mock data shape (現行 EmptyStates の skip 解消): `["month", ym]` は `{ currentBalance:null, endingBalanceForecast:0, totals:{incomeForecast:0,expenseForecast:0,incomeConfirmed:0,expenseConfirmed:0}, byCategory:[], byTag:[], records:[], bundles:[], endingBalanceConfirmed:0 }`。この shape で Home が落ちずに `empty-records` を描画できること (Reviewer mock 契約)。

### 11.6 符号色 / 未確定 muted / bundle / 空状態

- 符号色: record 金額は `signedAmount>=0` で income 色、`<0` で expense 色 (RecordRow 不変)。HeroCard 収支・月統合・年棒も同則。
- 未確定 muted: `paid===false` の record 行は `.is-unpaid` (muted)、`record-unpaid-mark` (●) を持つ。確定行は持たない。
- bundle: `bundleOn===true` かつ 2 件以上同 description → `bundle-row` テキスト `${description} (${count})`、tap で `.collapsible.active` 展開し配下 record を表示。1 件のものは bundle 化されず通常行。`bundleOn===false` で bundle 行は出ない。
- 空状態 (月): records 0 件 → `empty-records`。
- 空状態 (定期 in Settings): rules 0 件 → `empty-rules` (Settings 定期セクション)。

### 11.7 Sheet 3 経路 close (不変)

- overlay tap / ESC / × の 3 経路で `onDismiss`。`dismissConfirm` があれば true のときのみ close (現行 Sheet 不変)。

### 11.8 Settings

- 正常系: `control-back` (‹ 戻る) tap で `/` へ navigate。
- 正常系: 定期セクションで `[＋追加]` tap → RuleSheet (新規) open。rule 行 tap → RuleSheet (編集) open。
- 正常系: category/tag/anchor/materializeMonths の保存は現行 mutation・invalidate を発火 (query key 不変)。
- 正常系: `settings-logout` tap で `authClient.signOut()`。
- 異常系: category/tag 削除で `STILL_IN_USE` → `toast` に「○件で使用中のため削除できません」(現行文言不変)。

---

## 12. レスポンシブ

- **モバイル first**。`.shell` は `max-width: var(--shell-max)` (520px) を `margin: 0 auto` で中央寄せ。
- **デスクトップは同じ 1 カラムを中央に置く**だけ (横余白)。**ダッシュボード化しない / サイドバーを出さない / カラムを増やさない**。
- viewport `viewport-fit=cover` 維持 (safe-area)。FAB / Sheet ボトムシートは safe-area-inset を尊重。
- グラフ (TrendLineChart / YearBarChart) は `width:100%` で `.shell` 幅に追従 (viewBox スケール)。
- Sheet: モバイル = ボトムシート (`align-items:end`、上 radius のみ)、デスクトップ = 中央寄せ frosted ダイアログ (任意。Developer 判断で moneylog 風にモバイルと同じボトムシートでも可。**3 経路 close は不変**)。

> デスクトップで横を使い切る CF 路線は §13 で却下。moneylog は「スマホで作った 1 カラムをそのまま大画面の中央に置く」。

---

## 13. 不採用案 (再検討ループ防止)

| 案 | 却下理由 |
|---|---|
| **CF dashboard 路線 (左サイドバー + トップバー + 高密度 data-table + orange + ニュートラルグレー + 小 radius + 細罫線)** | Touri に「センスがない」と却下済 ([[pattern/moneylog-design-language]] 反例)。moneylog は柔らかいガラス質感・1 画面・伸縮アニメで CF と真逆。`20260608-ui-cloudflare-redesign.md` を本 doc が全面 supersede |
| **bottom tab (4 タブ)** | タブで画面を割る = moneylog 中核思想「開いた瞬間に必要情報が全部見える 1 画面」に反する。ナビは ControlBar の月↔年 mode 切替 + 期間移動 + ⚙ に集約 |
| **left sidebar** | デスクトップ専用 nav。moneylog はモバイル 1 カラムをそのまま大画面中央に置く。サイドバーは家計簿の親しみ UX を壊す |
| **高密度テーブル (`<table>` / grid 擬似テーブル)** | データ操作アプリ=高密度テーブルの短絡 (Touri 明示却下)。レコードは frosted card 内の柔らかい行で「必要情報が最初に出る親しみ」を保つ |
| **max-height 開閉アニメ** | 中身可変 (レコード件数不定) で破綻する。`grid-template-rows: 0fr↔1fr` なら JS 計測なしで滑らか ([[pattern/moneylog-design-language]]) |
| **重量級グラフライブラリ (Chart.js/Recharts/ECharts)** | 2 系列折れ線 + 12 本棒に数百 KB は過大。moneylog も自前 graph。自前 SVG (LineChart/YearBarChart) なら描画テストも DOM 寸法非依存。MVP §9 でも却下済 |
| **手動テーマ 3 択トグル (light/dark/auto + localStorage + data-theme)** | moneylog は `prefers-color-scheme` で blob 色を差し替えるだけの OS 追従。3 択 UI は moneylog に無く、Touri 方針も prefers-color-scheme。`useTheme`/`ThemeToggle` を全廃 (§4.4) |
| **推移を別タブ/別画面に分離** | Touri 方針「残高推移グラフは統合情報の直下=月画面内」。1 画面で残高ヒーロー直後にグラフを見せる |
| **外部 UI ライブラリ (Chakra/MUI/shadcn/Radix)** | 素 Tailwind v4 `@theme` + 自前で frosted/blob/grid-rows を表現でき、data-testid 温存もしやすい。バンドル増 + 自前 Sheet/Chart との二重化 |
| **デスクトップで横幅を使い切る (multi-column)** | moneylog は 1 カラム中央。横を埋めるとダッシュボード化し質感が壊れる (CF 路線の再来) |

---

## 14. Touri が承認すべき判断点

1. **テーマ機構の単純化**: 手動 light/dark/auto 3 択トグル (`useTheme`/`ThemeToggle`/`data-theme`/localStorage) を**全廃**し、`@media (prefers-color-scheme:dark)` 一本化 (blob 色を赤→青に差し替えるだけ)。テーマ切替 UI は画面から消える。moneylog 忠実 + Touri 方針通りだが、CF doc で作った 3 択機構を捨てる判断。
2. **画面統合とルート削減**: `/` `/trend` `/recurring` `/settings` の 4 ルートを **`/` (月/年 mode 統合 Home) + `/settings` (定期管理を内包)** の 2 ルートに削減。推移は Home 月モード内、定期は Settings 内へ移設。
3. **SummaryCard → HeroCard 置換**: メトリクスカード 4 枚を廃止し、moneylog の特大残高ヒーロー (月末残高 38px + 現在残高 + 収支 + 入力ボタン) に統合。`summary-*` testid 廃止、`hero-*` に。
4. **`["years", year]` query 新設**: 年モードのため client に `/api/years/:year` query を追加 (backend は既存・不変)。mutation 後の `["years"]` invalidate 追加は任意 (Developer 判断可)。
5. **FAB と HeroCard 入力ボタンの両建て**: 月モードで右下 FAB + ヒーロー内「✎ 入力する」を両方出す (Touri 既に承認済、確認のみ)。
6. **Noto Sans JP webfont 読込追加**: `index.html` に Google Fonts link。moneylog の特大残高 weight 500 質感の核。
7. **既存 client テストの作り直し前提**: SummaryCard/AppShell/ThemeToggle/useTheme/EmptyStates 系テストは構造変更で再生成 (§10.4)。RecordRow/BundleRow/LineChart/Sheet と backend テストは維持。
