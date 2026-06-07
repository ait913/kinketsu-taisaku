# 金欠対策 (kinketsu-taisaku) — プロジェクト固有メモ

親規約: [Muraki/CLAUDE.md](../../CLAUDE.md)

## プロジェクト要約

サブスク・クレカ・給料日などの**定期的な収入/支出を登録して、未来の出費を管理・コントロールする家計簿アプリ**。ceez7 の自作家計簿 moneylog の**概念**(確定/未確定 + 着地予測 + カテゴリ⊃タグ)を継承しつつ、**定期レコード**と**残高推移の可視化**を足してモダンに新規構築。ユーザーは Touri 本人 (永続アカウント)。

moneylog からは**概念のみ**継承。元のバニラ HTML/CSS/JS の実装慣習・単一エンドポイント API 設計は引き継がない (モダンに作り直す)。

## 主要ドキュメント

- 設計書: `.designs/<YYYYMMDD>-<feature-slug>.md` (Architect が作成)
- プロジェクト固有ナレッジ: `.knowledge/<topic>.md`
- 設計前リサーチ: [`Muraki/projects/_pre/research-moneylog-successor-20260608.md`](../_pre/research-moneylog-successor-20260608.md)
- moneylog 概念抽出: [`Muraki/knowledge/pattern/touri-design-philosophy.md`](../../knowledge/pattern/touri-design-philosophy.md)

## 技術スタック

(omatase-demo と同一スタックで整合。Researcher が 2026-06-08 に現行バージョン確認済み)

- Frontend: Vite + React + TypeScript + Tailwind + TanStack Query
- Backend: Hono + Drizzle ORM
- DB: SQLite (better-sqlite3)
- 認証: better-auth (Magic Link + Google OAuth、永続アカウント、Cookie session)
- ホスティング: appily レーン (Coolify)

## 継承する moneylog 概念 (データ/挙動の核)

- **record は単一 shape** に統一 (確定/未確定フラグ + date + 金額 + category/tag + 概要)
- **paid (確定/未確定)**: 未確定 = 予定。未確定を積むと「月末着地残高」を予測
- **balance 2 系列**: `現在残高`(確定のみ) と `月末着地残高`(未確定込み)
- **カテゴリ ⊃ タグ の 2 階層、どちらもユーザーが任意個追加可**
- **カテゴリは `signMode` (income/expense/free) で符号強制を明示**。初回シードで「収入」=income(符号強制+)・「支出」=expense(符号強制−) を投入、それ以外(移動/カスタム)は free(符号フリー)。id 値には依存しない (マルチユーザー安全)
- **概要でまとめる (bundle)**: 同概要レコードの集約表示
- 月ビュー / 年ビュー / 設定 / record・category・tag の入力モーダル

## 今回足す新機能

- **定期レコード**: サブスク/クレカ/給料を「毎月X日 + 金額 + category/tag」の月次ルールで登録 → 未来の未確定レコードを materialize 生成 (RRULE は使わない)。クレカは月固定出費扱い (買い物単位の請求サイクルは作らない)
- **残高推移の折れ線グラフ**: 月ビューに残高推移を可視化
- **多月先までの未来出費コントロール**: `月末残高[N] = 月末残高[N-1] + 月N収支`、初期残高アンカーを持つ

## 規約・やらないこと

- moneylog のバニラ実装・単一 endpoint control ディスクリミネータ API を**コピーしない** (概念のみ継承、API はモダンに設計)
- RRULE (RFC5545) を導入しない (要件は FREQ=MONTHLY 単一、外部カレンダー互換不要)
- クレカの請求サイクル (利用→翌月引き落とし) をモデル化しない (月固定出費扱い)
- 既存 moneylog データのインポートはしない (新規スタート)
- `&&` を Bash で使わない (グローバルフックでブロック)

## 主要ワークフロー

### dev 起動

```
npm install
cp .env.example .env   # 値を埋める (BETTER_AUTH_*, GOOGLE_*, SMTP_*)
npm run db:migrate     # ローカル SQLite に schema 適用 (本番は起動時 auto-migrate)
npm run dev            # concurrently: server tsx(:8080) + vite client(:5173)
```
client `http://localhost:5173` → `/api` は :8080 へ proxy。

### テスト

```
npx vitest run         # Vitest 4。tests/ (API/描画) + src/**/__tests__ (純関数)。32件
```
`vitest.config.ts` は `fileParallelism:false` (test DB が DATABASE_URL グローバル上書きのため並列不可)。

### デプロイ (appily / Coolify)

main へ push 後、Coolify API で deploy をキック (auto-deploy webhook 未設定):
```
curl -sS -H "Authorization: Bearer $COOLIFY_API_TOKEN" \
  "$COOLIFY_API_BASE/deploy?uuid=s4b61u855k6uqazep1brr00z&force=false"
```
- 単一コンテナ (Dockerfile)。Hono が API + 静的 client (`SERVE_STATIC=1`) を :8080 で配信。起動時に drizzle migration 自動適用。
- **新規/再作成時は必ず `is_force_https_enabled=false` + `redirect:both`**。それでも全パス 307 self-loop なら **fqdn 削除→redeploy(404確認)→戻し→redeploy** で Traefik label 再生成 ([[gotcha/coolify-traefik-stale-label-loop]])。今回これで復旧。

## デプロイ / 外部リソース

- URL: <https://kinketsu-taisaku.appily.run> (本番稼働中)
- GitHub: <https://github.com/ait913/kinketsu-taisaku> (public)
- Coolify app uuid: `s4b61u855k6uqazep1brr00z` / project `nkaqu9lx6xewvzsvkadnmjcf` (Touri) / server `gr24emlhaecs4tfw0f4gzoct` (localhost)
- 永続ストレージ: named volume `kinketsu-data` → `/app/data` (SQLite `DATABASE_URL=/app/data/kinketsu.db`)
- env (Coolify 設定済): BETTER_AUTH_URL/SECRET, GOOGLE_CLIENT_ID/SECRET, RESEND via SMTP (SMTP_HOST=smtp.resend.com / USER=resend / PASS=Resend APIキー / FROM="金欠対策 <noreply@appily.run>"), SERVE_STATIC=1, PORT=8080, ALLOWED_ORIGINS
- 認証: Google OAuth = E2E 配線確認済 (accounts.google.com 到達)。Magic Link = Resend SMTP 経由。**From の appily.run が Resend 検証済みである必要あり** (未検証なら onboarding@resend.dev へ差し替え)
- 関連 SKILL: [`appily`](../../.claude/skills/appily/SKILL.md)
- 参考元アプリ (概念): moneylog <https://app.ceez7.com/moneylog/> (ceez7 ログイン要)
