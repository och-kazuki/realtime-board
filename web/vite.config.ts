import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    // 既定では CSS ファイルを読み込まず、改行を表示するスタイルのように
    // CSS ファイルで付けるものをテストで確かめられないため。
    css: true,
  },
});
