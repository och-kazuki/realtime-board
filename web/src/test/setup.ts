import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Vitest の globals を有効にしていないので、Testing Library はテストのあとに
// 描いた画面を自動では片付けない。片付けないと、前のテストの要素が次のテストに残る。
afterEach(() => {
  cleanup();
});

// jsdom には setPointerCapture がないので、ドラッグのテストのために何もしないものを置く。
// ポインターを捕まえたあとの通知の行き先は、テストではつまみに直接送って再現する。
if (!("setPointerCapture" in Element.prototype)) {
  Object.defineProperty(Element.prototype, "setPointerCapture", {
    value: () => undefined,
  });
}
