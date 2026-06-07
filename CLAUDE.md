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

<TODO: 設計確定後にコマンド記載>

### テスト

<TODO: Reviewer がテスト基盤定義後>

### デプロイ

<TODO: appily SKILL 使用、Coolify uuid 取得後追記>

## デプロイ / 外部リソース

- URL: <https://kinketsu-taisaku.appily.run> (予定)
- Coolify app uuid: <TODO: デプロイ時>
- 関連 SKILL: [`appily`](../../.claude/skills/appily/SKILL.md)
- 認証インフラ依存: Magic Link 用 SMTP/メール送信、Google OAuth client (Google Cloud) <TODO: 設定>
- 参考元アプリ (概念): moneylog <https://app.ceez7.com/moneylog/> (ceez7 ログイン要)
