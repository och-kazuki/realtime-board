import {
  fireEvent,
  getDefaultNormalizer,
  render,
  screen,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import type { Note } from "../notes/notesReducer";
import { StickyNote } from "./StickyNote";

function buildNote(fields: Partial<Note> = {}): Note {
  return { id: "a", text: "", x: 0, y: 0, ...fields };
}

function renderStickyNote(
  note: Note,
  {
    zIndex = 0,
    topZIndex = 99,
    isEditing = false,
    onStartEditing = vi.fn<() => void>(),
  } = {},
) {
  const onDelete = vi.fn<() => void>();
  const onConfirmEditing = vi.fn<(text: string) => void>();
  render(
    <StickyNote
      note={note}
      boardRef={{ current: document.createElement("div") }}
      zIndex={zIndex}
      topZIndex={topZIndex}
      isEditing={isEditing}
      onMove={vi.fn()}
      onDelete={onDelete}
      onStartEditing={onStartEditing}
      onConfirmEditing={onConfirmEditing}
      onCancelEditing={vi.fn()}
    />,
  );
  return { onDelete, onConfirmEditing };
}

describe("付箋の表示", () => {
  test("付箋を、その位置に、渡した z-index で表示する", () => {
    renderStickyNote(buildNote({ x: 100, y: 200 }), { zIndex: 3 });

    expect(screen.getByRole("article")).toHaveStyle({
      left: "100px",
      top: "200px",
      zIndex: "3",
    });
  });

  test("HTML のタグを含む文字も、HTML として解釈せずに文字のまま表示する", () => {
    const text = "<b>太字</b><script>alert(1)</script>";

    renderStickyNote(buildNote({ text }));

    const article = screen.getByRole("article");
    expect(article).toHaveTextContent(text);
    expect(article.querySelector("b, script")).toBeNull();
  });

  test("改行を含む文字は、改行を残したまま、改行を表示するスタイルで表示する", () => {
    const text = "買い物\n牛乳";

    renderStickyNote(buildNote({ text }));

    // 既定では連続する空白と改行を1つの空白にまとめて探すので、まとめずに探す。
    const textElement = screen.getByText(text, {
      normalizer: getDefaultNormalizer({ collapseWhitespace: false }),
    });
    expect(textElement).toHaveStyle({ whiteSpace: "pre-wrap" });
  });
});

test("付箋の文字をダブルクリックすると、編集を始める", async () => {
  const user = userEvent.setup();
  const onStartEditing = vi.fn<() => void>();
  renderStickyNote(buildNote({ text: "買い物" }), { onStartEditing });

  await user.dblClick(screen.getByText("買い物"));

  expect(onStartEditing).toHaveBeenCalledOnce();
});

test("ドラッグ中の付箋は、その間だけ一番上に表示する", () => {
  renderStickyNote(buildNote(), { zIndex: 0, topZIndex: 5 });
  const handle = screen.getByRole("button", { name: "付箋を動かす" });

  fireEvent.pointerDown(handle, { button: 0, pointerId: 1 });

  expect(screen.getByRole("article")).toHaveStyle({ zIndex: "5" });

  fireEvent.pointerUp(handle, { pointerId: 1 });

  expect(screen.getByRole("article")).toHaveStyle({ zIndex: "0" });
});

describe("付箋の削除", () => {
  test("削除ボタンを押すと、付箋の削除を伝える", async () => {
    const user = userEvent.setup();
    const { onDelete } = renderStickyNote(buildNote({ text: "買い物" }));

    await user.click(screen.getByRole("button", { name: "付箋を削除" }));

    expect(onDelete).toHaveBeenCalledOnce();
  });

  test("編集中の付箋の削除ボタンを押したときは、編集を確定せずに削除を伝える", async () => {
    const user = userEvent.setup();
    const { onDelete, onConfirmEditing } = renderStickyNote(
      buildNote({ text: "買い物" }),
      { isEditing: true },
    );

    await user.keyboard("と掃除");
    await user.click(screen.getByRole("button", { name: "付箋を削除" }));

    expect(onConfirmEditing).not.toHaveBeenCalled();
    expect(onDelete).toHaveBeenCalledOnce();
  });
});
