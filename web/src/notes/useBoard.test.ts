import { act, renderHook } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import type { NotePosition } from "./position";
import { type Board, useBoard } from "./useBoard";

function renderBoard(): { readonly current: Board } {
  return renderHook(() => useBoard()).result;
}

function createNoteOn(
  board: { readonly current: Board },
  position: NotePosition,
): string {
  let id = "";
  act(() => {
    id = board.current.createNote(position);
  });
  return id;
}

function idsOf(board: { readonly current: Board }): string[] {
  return board.current.notes.map((note) => note.id);
}

describe("付箋の追加", () => {
  test("文字が空の付箋を渡した位置に加え、作った id を返す", () => {
    const board = renderBoard();

    const id = createNoteOn(board, { x: 100, y: 200 });

    expect(board.current.notes).toEqual([{ id, text: "", x: 100, y: 200 }]);
  });

  test("追加するたびに、違う id を作る", () => {
    const board = renderBoard();

    const first = createNoteOn(board, { x: 0, y: 0 });
    const second = createNoteOn(board, { x: 0, y: 0 });

    expect(first).not.toBe(second);
    expect(idsOf(board)).toEqual([first, second]);
  });
});

describe("付箋の移動", () => {
  test("付箋をその位置に動かし、一番上に移す", () => {
    const board = renderBoard();
    const a = createNoteOn(board, { x: 0, y: 0 });
    const b = createNoteOn(board, { x: 0, y: 0 });

    act(() => {
      board.current.moveNote(a, { x: 300, y: 400 });
    });

    expect(idsOf(board)).toEqual([b, a]);
    expect(board.current.notes[1]).toMatchObject({ x: 300, y: 400 });
  });

  test("今と同じ位置なら、重なりの順番も含めて何も変えない", () => {
    const board = renderBoard();
    const a = createNoteOn(board, { x: 10, y: 20 });
    createNoteOn(board, { x: 0, y: 0 });
    const before = board.current.notes;

    act(() => {
      board.current.moveNote(a, { x: 10, y: 20 });
    });

    expect(board.current.notes).toBe(before);
  });

  test("ボードの端に収めたあとの位置が今と同じなら、何も変えない", () => {
    const board = renderBoard();
    const a = createNoteOn(board, { x: 2800, y: 1800 });
    createNoteOn(board, { x: 0, y: 0 });
    const before = board.current.notes;

    act(() => {
      board.current.moveNote(a, { x: 3500, y: 1800.4 });
    });

    expect(board.current.notes).toBe(before);
  });
});

describe("付箋の文字の変更", () => {
  test("付箋の文字を変え、一番上に移す", () => {
    const board = renderBoard();
    const a = createNoteOn(board, { x: 0, y: 0 });
    const b = createNoteOn(board, { x: 0, y: 0 });

    act(() => {
      board.current.updateNoteText(a, "買い物\n牛乳");
    });

    expect(idsOf(board)).toEqual([b, a]);
    expect(board.current.notes[1]).toMatchObject({ text: "買い物\n牛乳" });
  });

  test("今と同じ文字なら、重なりの順番も含めて何も変えない", () => {
    const board = renderBoard();
    const a = createNoteOn(board, { x: 0, y: 0 });
    createNoteOn(board, { x: 0, y: 0 });
    act(() => {
      board.current.updateNoteText(a, "メモ");
    });
    const before = board.current.notes;

    act(() => {
      board.current.updateNoteText(a, "メモ");
    });

    expect(board.current.notes).toBe(before);
  });
});

describe("付箋の削除", () => {
  test("その付箋だけを除く", () => {
    const board = renderBoard();
    const a = createNoteOn(board, { x: 0, y: 0 });
    const b = createNoteOn(board, { x: 0, y: 0 });

    act(() => {
      board.current.deleteNote(a);
    });

    expect(idsOf(board)).toEqual([b]);
  });
});
