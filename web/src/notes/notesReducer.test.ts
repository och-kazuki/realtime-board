import { describe, expect, test } from "vitest";
import { type Note, notesReducer } from "./notesReducer";

// 凍結しておくと、状態の関数が元の一覧や付箋を書き換えたときにテストが失敗する。
function buildNote(id: string, fields: Partial<Omit<Note, "id">> = {}): Note {
  return Object.freeze({ id, text: "", x: 0, y: 0, ...fields });
}

function buildNotes(...notes: Note[]): readonly Note[] {
  return Object.freeze(notes);
}

function idsOf(notes: readonly Note[]): string[] {
  return notes.map((note) => note.id);
}

describe("付箋の追加", () => {
  test("文字が空の付箋を、渡した位置に置いて一覧の最後に加える", () => {
    const notes = buildNotes(buildNote("a"));

    const result = notesReducer(notes, {
      type: "noteCreated",
      id: "b",
      x: 100,
      y: 200,
    });

    expect(result).toEqual([
      buildNote("a"),
      { id: "b", text: "", x: 100, y: 200 },
    ]);
  });

  test("ボードの範囲の外の位置は、ボードの端に収めて加える", () => {
    const result = notesReducer(buildNotes(), {
      type: "noteCreated",
      id: "a",
      x: -10,
      y: 9999,
    });

    expect(result).toEqual([{ id: "a", text: "", x: 0, y: 1800 }]);
  });

  test("位置が数でないときは、何も変えない", () => {
    const notes = buildNotes(buildNote("a"));

    const result = notesReducer(notes, {
      type: "noteCreated",
      id: "b",
      x: Number.NaN,
      y: 0,
    });

    expect(result).toBe(notes);
  });

  test("同じ id の付箋がすでにあるときは、何も変えない", () => {
    const notes = buildNotes(buildNote("a", { text: "元の文字" }));

    const result = notesReducer(notes, {
      type: "noteCreated",
      id: "a",
      x: 0,
      y: 0,
    });

    expect(result).toBe(notes);
  });
});

describe("付箋の移動", () => {
  test("付箋をその位置に動かし、一覧の最後（一番上）に移す", () => {
    const notes = buildNotes(buildNote("a"), buildNote("b"));

    const result = notesReducer(notes, {
      type: "noteMoved",
      id: "a",
      x: 300,
      y: 400,
    });

    expect(idsOf(result)).toEqual(["b", "a"]);
    expect(result[1]).toEqual(buildNote("a", { x: 300, y: 400 }));
  });

  test("ボードの範囲の外へ動かしても、ボードの端で止める", () => {
    const notes = buildNotes(buildNote("a", { x: 100, y: 100 }));

    const result = notesReducer(notes, {
      type: "noteMoved",
      id: "a",
      x: 5000,
      y: -300,
    });

    expect(result).toEqual([buildNote("a", { x: 2800, y: 0 })]);
  });

  test("今と同じ位置への移動でも、一覧の最後に移す", () => {
    const notes = buildNotes(buildNote("a", { x: 10, y: 20 }), buildNote("b"));

    const result = notesReducer(notes, {
      type: "noteMoved",
      id: "a",
      x: 10,
      y: 20,
    });

    expect(idsOf(result)).toEqual(["b", "a"]);
  });

  test("一覧にない id を指定したときは、何も変えない", () => {
    const notes = buildNotes(buildNote("a"));

    const result = notesReducer(notes, {
      type: "noteMoved",
      id: "unknown",
      x: 10,
      y: 20,
    });

    expect(result).toBe(notes);
  });

  test("位置が数でないときは、何も変えない", () => {
    const notes = buildNotes(buildNote("a"), buildNote("b"));

    const result = notesReducer(notes, {
      type: "noteMoved",
      id: "a",
      x: 0,
      y: Number.POSITIVE_INFINITY,
    });

    expect(result).toBe(notes);
  });
});

describe("付箋の文字の変更", () => {
  test("付箋の文字を変え、一覧の最後（一番上）に移す", () => {
    const notes = buildNotes(buildNote("a"), buildNote("b"));

    const result = notesReducer(notes, {
      type: "noteTextUpdated",
      id: "a",
      text: "買い物\n牛乳",
    });

    expect(idsOf(result)).toEqual(["b", "a"]);
    expect(result[1]).toEqual(buildNote("a", { text: "買い物\n牛乳" }));
  });

  test("ちょうど200字の文字には変えられる", () => {
    const notes = buildNotes(buildNote("a"));
    const text = "あ".repeat(200);

    const result = notesReducer(notes, {
      type: "noteTextUpdated",
      id: "a",
      text,
    });

    expect(result).toEqual([buildNote("a", { text })]);
  });

  test("200字を超える文字への変更では、何も変えない", () => {
    const notes = buildNotes(buildNote("a", { text: "元の文字" }));

    const result = notesReducer(notes, {
      type: "noteTextUpdated",
      id: "a",
      text: "あ".repeat(201),
    });

    expect(result).toBe(notes);
  });

  test("一覧にない id を指定したときは、何も変えない", () => {
    const notes = buildNotes(buildNote("a"));

    const result = notesReducer(notes, {
      type: "noteTextUpdated",
      id: "unknown",
      text: "新しい文字",
    });

    expect(result).toBe(notes);
  });
});

describe("付箋の削除", () => {
  test("その付箋だけを除き、ほかの付箋の順番は変えない", () => {
    const notes = buildNotes(buildNote("a"), buildNote("b"), buildNote("c"));

    const result = notesReducer(notes, { type: "noteDeleted", id: "b" });

    expect(idsOf(result)).toEqual(["a", "c"]);
  });

  test("一覧にない id を指定したときは、何も変えない", () => {
    const notes = buildNotes(buildNote("a"));

    const result = notesReducer(notes, { type: "noteDeleted", id: "unknown" });

    expect(result).toBe(notes);
  });
});
