import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    // backend テストは process.env.DATABASE_URL をグローバル上書きして src/db に接続するため、
    // 複数テストファイルを並列実行すると同一プロセス内で env と SQLite 接続が競合し timeout する。
    // テストファイル間は直列に走らせる (設計 §8.2 の DB 切替方式の制約)。
    fileParallelism: false,
  },
});
