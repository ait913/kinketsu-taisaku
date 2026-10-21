---
title: 既知の失敗テスト台帳 (kinketsu-taisaku)
category: gotcha
project: kinketsu-taisaku
tags: [known-failures, vitest, baseline, time-dependent]
created: 2026-10-22
sources:
  - Muraki/CLAUDE.md「ベースライン失敗の台帳」
  - Muraki/sessions/2026-10-22-acd89e01.md
---

## Context

`npm test` (vitest) の基線。2026-10-22 のセキュリティ依存更新 (better-auth 1.6.33 / hono 4.13.13 / @hono/node-server 2.1.5 / nodemailer 10.1.7 / form-data / nanoid) 時に棚卸しして作成。
**更新前の依存 (`git stash` → `npm ci` → `npm test`) でも同じ 5 件が落ちる**ことを確認済 (負のコントロール)。

結果: `Test Files 3 failed | 14 passed (17)` / `Tests 5 failed | 61 passed (66)`。

## What

| テスト | 分類 | 内容 |
|---|---|---|
| `tests/api/recurring-forecast.test.ts` > `POST 201 後 materialize し、endMonth<startMonth は 400 INVALID_RANGE` | 環境依存 (時刻) | ルールを `startMonth: "2026-06"` 系の固定月で作り、生成 record (`2026-06-30`) を期待。実装 `src/services/materialize.ts` と `src/routes/recurring-rules.ts` は `currentMonthJST()` を起点に gap-fill するため、2026-07 以降に実行すると過去月は生成されず `[]` |
| `tests/api/recurring-forecast.test.ts` > `DELETE ?keepRecords は removedRecords を返す` | 環境依存 (時刻) | 同上。生成 record が無いので `removedRecords` が 0 件 |
| `tests/api/records-categories.test.ts` > `生成 record を PATCH すると isManuallyEdited=true にする (§5.4)` | 環境依存 (時刻) | `startMonth: "2026-06"` のルールから生成される record を前提 (`expected undefined to be defined`) |
| `tests/client/Home.test.tsx` > `初期 month で hero-card/record-list を描画し…` | 環境依存 (時刻) | `queryKey: ["month", "2026-07"]` を期待。初期月は実行時の現在月 |
| `tests/client/Home.test.tsx` > `月モードの next/prev は yearMonth を ±1 し…` | 環境依存 (時刻) | 同上 (2026-07 起点のロールオーバーを期待) |

未分類: **0 件**。テスト陳腐化: 0 件。

## Why

テストは 2026-06-08 (`f3b7269`) / 06-11 (`136ff9c`) に書かれ、当時の現在月 (2026-06/07) を固定値で埋めている。実装が現在月を `new Date()` から取るので、月が進むと落ちる。依存更新・ランタイムには依存しない。

## How to apply

- 依存更新などでこの 5 件**だけ**が落ちるなら基線どおり。6 件目が出たら新規の回帰として扱う
- 恒久対応は `vi.useFakeTimers()` + `vi.setSystemTime(new Date("2026-06-15T00:00:00+09:00"))` をこれらのテストの `beforeEach` に入れる (実装側は変えない)。omatase の CI が `TZ=Asia/Tokyo` で時刻依存テストを別系統で回しているのと同じ系統の問題
