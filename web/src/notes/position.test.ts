import { describe, expect, test } from "vitest";
import { calculateNotePositionAtCenter, toPositionOnBoard } from "./position";

describe("toPositionOnBoard", () => {
  test("ボードの範囲の中にある整数の位置は、そのまま返す", () => {
    expect(toPositionOnBoard({ x: 120, y: 340 })).toEqual({ x: 120, y: 340 });
  });

  test("小数の位置は、四捨五入して整数にする", () => {
    expect(toPositionOnBoard({ x: 10.4, y: 10.5 })).toEqual({ x: 10, y: 11 });
  });

  test("左端と上端より外の位置は、0 に収める", () => {
    expect(toPositionOnBoard({ x: -50, y: -0.4 })).toEqual({ x: 0, y: 0 });
  });

  // ボードは 3000×2000、付箋は 200×200 なので、付箋の左上の角が
  // 置ける一番右は 3000 - 200、一番下は 2000 - 200 になる。
  test("右端と下端より外の位置は、付箋がボードに収まる一番端に収める", () => {
    expect(toPositionOnBoard({ x: 2801, y: 5000 })).toEqual({
      x: 2800,
      y: 1800,
    });
  });

  test("ちょうど一番端の位置は、そのまま返す", () => {
    expect(toPositionOnBoard({ x: 2800, y: 1800 })).toEqual({
      x: 2800,
      y: 1800,
    });
  });

  test.each([
    { x: Number.NaN, y: 0 },
    { x: 0, y: Number.POSITIVE_INFINITY },
    { x: Number.NEGATIVE_INFINITY, y: 0 },
  ])("数でない値を含む位置 %o には、null を返す", (requested) => {
    expect(toPositionOnBoard(requested)).toBeNull();
  });
});

describe("calculateNotePositionAtCenter", () => {
  test("付箋の真ん中が、見えている範囲の真ん中に来る位置を返す", () => {
    // 範囲の真ん中は (500, 300)。付箋の左上の角は、そこから付箋の半分の 100 ずつ戻る。
    expect(
      calculateNotePositionAtCenter({
        left: 0,
        top: 0,
        width: 1000,
        height: 600,
      }),
    ).toEqual({ x: 400, y: 200 });
  });

  test("スクロールした分だけ、ボードの左上から離れた位置を返す", () => {
    expect(
      calculateNotePositionAtCenter({
        left: 1500,
        top: 800,
        width: 1000,
        height: 600,
      }),
    ).toEqual({ x: 1900, y: 1000 });
  });
});
