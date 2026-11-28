import { describe, expect, test } from "vitest";
import {
  countCodePoints,
  exceedsNoteTextLimit,
  truncateInsertionToLimit,
} from "./text";

describe("countCodePoints", () => {
  test("英数字と日本語は、1文字を1字と数える", () => {
    expect(countCodePoints("ab1あい")).toBe(5);
  });

  test("改行も1字と数える", () => {
    expect(countCodePoints("買い物\n牛乳")).toBe(6);
  });

  test("UTF-16 では2単位になる絵文字も、1字と数える", () => {
    expect("👍".length).toBe(2);
    expect(countCodePoints("👍")).toBe(1);
  });

  test("肌の色を変えた絵文字は、見た目は1文字でも2字と数える", () => {
    expect(countCodePoints("👍🏽")).toBe(2);
  });
});

describe("exceedsNoteTextLimit", () => {
  test("ちょうど200字は、上限を超えていない", () => {
    expect(exceedsNoteTextLimit("あ".repeat(200))).toBe(false);
  });

  test("201字は、上限を超えている", () => {
    expect(exceedsNoteTextLimit("あ".repeat(201))).toBe(true);
  });

  // 199字の日本語と絵文字1つで、UTF-16 では201単位になるが、字数は200字になる。
  test("UTF-16 の単位で200を超えても、字数が200字なら上限を超えていない", () => {
    const text = "あ".repeat(199) + "👍";
    expect(text.length).toBe(201);
    expect(exceedsNoteTextLimit(text)).toBe(false);
  });
});

describe("truncateInsertionToLimit", () => {
  const full = "あ".repeat(200);

  test("上限を超えない入力は、そのまま返す", () => {
    expect(truncateInsertionToLimit("買い物", "買い物と", 4)).toEqual({
      text: "買い物と",
      caret: 4,
    });
  });

  test("200字に達しているときに末尾へ入力した字は入れず、カーソルも動かさない", () => {
    expect(truncateInsertionToLimit(full, full + "い", 201)).toEqual({
      text: full,
      caret: 200,
    });
  });

  test("200字に達しているときに途中へ入力した字も入れない", () => {
    const next = "あ".repeat(100) + "い" + "あ".repeat(100);

    expect(truncateInsertionToLimit(full, next, 101)).toEqual({
      text: full,
      caret: 100,
    });
  });

  test("貼り付けで上限を超えるときは、収まる分だけ入れ、カーソルを入れた字の直後に置く", () => {
    const previous = "あ".repeat(195);
    const next = "あ".repeat(100) + "0123456789" + "あ".repeat(95);

    expect(truncateInsertionToLimit(previous, next, 110)).toEqual({
      text: "あ".repeat(100) + "01234" + "あ".repeat(95),
      caret: 105,
    });
  });

  test("選択した範囲を置き換える貼り付けは、選択した範囲を除いた残りに収まる分だけ入れる", () => {
    // 200字のうち、先頭から10字目のあとの「いいい」を選んで、10字を貼り付ける。
    const previous = "あ".repeat(10) + "いいい" + "あ".repeat(187);
    const next = "あ".repeat(10) + "0123456789" + "あ".repeat(187);

    expect(truncateInsertionToLimit(previous, next, 20)).toEqual({
      text: "あ".repeat(10) + "012" + "あ".repeat(187),
      caret: 13,
    });
  });

  test("絵文字は、字の途中で切らずに、収まる字数で切り詰める", () => {
    const previous = "あ".repeat(198);

    // 👍 は UTF-16 では2単位なので、2字分のカーソルは 198 + 4 になる。
    expect(
      truncateInsertionToLimit(previous, previous + "👍👍👍", 204),
    ).toEqual({ text: previous + "👍👍", caret: 202 });
  });

  // 👍 と 👎 は、UTF-16 の1単位目が同じなので、前から比べると字の途中までが一致する。
  test("選択した絵文字を別の絵文字の貼り付けで置き換えても、絵文字を壊さない", () => {
    const previous = "あ".repeat(199) + "👍";
    const next = "あ".repeat(199) + "👎👎";

    expect(truncateInsertionToLimit(previous, next, 203)).toEqual({
      text: "あ".repeat(199) + "👎",
      caret: 201,
    });
  });

  test("カーソルより後ろの字が入力の前と違うときは、入力を受け付けない", () => {
    expect(truncateInsertionToLimit(full, "い" + full, 0)).toEqual({
      text: full,
      caret: 0,
    });
  });
});
