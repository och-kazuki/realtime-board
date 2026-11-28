import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import type { Note } from "../notes/notesReducer";
import type { NotePosition } from "../notes/position";
import { BoardSurface } from "./BoardSurface";

function buildNote(id: string): Note {
  return { id, text: `付箋${id}`, x: 0, y: 0 };
}

function renderBoardSurface(
  notes: readonly Note[],
  editingNoteId: string | null = null,
) {
  const onMoveNote = vi.fn<(id: string, position: NotePosition) => void>();
  render(
    <BoardSurface
      notes={notes}
      editingNoteId={editingNoteId}
      onMoveNote={onMoveNote}
      onDeleteNote={vi.fn()}
      onStartEditing={vi.fn()}
      onConfirmEditing={vi.fn()}
      onCancelEditing={vi.fn()}
    />,
  );
  return { onMoveNote };
}

test("付箋の要素は id の順に並べ、一覧の後ろの付箋ほど大きい z-index で表示する", () => {
  // 一覧の並びは重なりの順番で、最後の a が一番上。
  renderBoardSurface([buildNote("b"), buildNote("c"), buildNote("a")]);

  expect(
    screen.getAllByText(/^付箋/).map((element) => element.textContent),
  ).toEqual(["付箋a", "付箋b", "付箋c"]);
  expect(
    screen.getAllByRole("article").map((article) => article.style.zIndex),
  ).toEqual(["2", "0", "1"]);
});

test("編集中の付箋は、一覧のどこにあっても一番上に表示する", () => {
  // 一覧の最初の a は一番下にあるが、編集中なので一番上に出す。
  renderBoardSurface([buildNote("a"), buildNote("b"), buildNote("c")], "a");

  const articles = screen.getAllByRole("article");
  expect(articles.map((article) => article.style.zIndex)).toEqual([
    "3",
    "1",
    "2",
  ]);
});

// jsdom は画面の配置を計算しないので、ボードの要素の画面の上での位置はいつも (0, 0) になる。
// そのため、ここではマウスの画面の上での位置が、そのままボードの上での位置になる。
describe("付箋のドラッグ", () => {
  function pressHandle() {
    const handle = screen.getByRole("button", { name: "付箋を動かす" });
    // 付箋の左上の角 (100, 100) から右に 50、下に 10 の所をつかむ。
    fireEvent.pointerDown(handle, {
      button: 0,
      pointerId: 1,
      clientX: 150,
      clientY: 110,
    });
    return handle;
  }

  test("つまみをドラッグすると付箋がマウスについて動き、手を離したときにだけ移動を伝える", () => {
    const { onMoveNote } = renderBoardSurface([
      { id: "a", text: "", x: 100, y: 100 },
    ]);

    const handle = pressHandle();
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: 450, clientY: 310 });

    expect(screen.getByRole("article")).toHaveStyle({
      left: "400px",
      top: "300px",
    });
    expect(onMoveNote).not.toHaveBeenCalled();

    fireEvent.pointerUp(handle, { pointerId: 1, clientX: 450, clientY: 310 });

    expect(onMoveNote).toHaveBeenCalledExactlyOnceWith("a", { x: 400, y: 300 });
  });

  test("ボードの端より外へ動かしても、付箋は端で止まる", () => {
    renderBoardSurface([{ id: "a", text: "", x: 100, y: 100 }]);

    const handle = pressHandle();
    fireEvent.pointerMove(handle, {
      pointerId: 1,
      clientX: -500,
      clientY: 9999,
    });

    expect(screen.getByRole("article")).toHaveStyle({
      left: "0px",
      top: "1800px",
    });
  });

  test("ドラッグ中に Esc を押すと、元の位置に戻り、移動を伝えない", () => {
    const { onMoveNote } = renderBoardSurface([
      { id: "a", text: "", x: 100, y: 100 },
    ]);

    const handle = pressHandle();
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: 450, clientY: 310 });
    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.pointerUp(handle, { pointerId: 1, clientX: 450, clientY: 310 });

    expect(screen.getByRole("article")).toHaveStyle({
      left: "100px",
      top: "100px",
    });
    expect(onMoveNote).not.toHaveBeenCalled();
  });

  test("ブラウザがポインターの操作を取り消したときも、元の位置に戻り、移動を伝えない", () => {
    const { onMoveNote } = renderBoardSurface([
      { id: "a", text: "", x: 100, y: 100 },
    ]);

    const handle = pressHandle();
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: 450, clientY: 310 });
    fireEvent.pointerCancel(handle, { pointerId: 1 });

    expect(screen.getByRole("article")).toHaveStyle({
      left: "100px",
      top: "100px",
    });
    expect(onMoveNote).not.toHaveBeenCalled();
  });

  test("左ボタン以外で押したときは、ドラッグを始めない", () => {
    const { onMoveNote } = renderBoardSurface([
      { id: "a", text: "", x: 100, y: 100 },
    ]);
    const handle = screen.getByRole("button", { name: "付箋を動かす" });

    fireEvent.pointerDown(handle, {
      button: 2,
      pointerId: 1,
      clientX: 150,
      clientY: 110,
    });
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: 450, clientY: 310 });
    fireEvent.pointerUp(handle, { pointerId: 1, clientX: 450, clientY: 310 });

    expect(screen.getByRole("article")).toHaveStyle({ left: "100px" });
    expect(onMoveNote).not.toHaveBeenCalled();
  });

  test("ドラッグ中にボードがスクロールしても、付箋はマウスについて動く", () => {
    renderBoardSurface([{ id: "a", text: "", x: 100, y: 100 }]);
    const article = screen.getByRole("article");
    const board = article.parentElement as HTMLElement;

    pressHandle();
    // 右へ 200、下へ 50 スクロールすると、ボードの要素は画面の上で左上へずれる。
    board.getBoundingClientRect = () => new DOMRect(-200, -50, 3000, 2000);
    fireEvent.scroll(window);

    expect(article).toHaveStyle({ left: "300px", top: "150px" });
  });
});
