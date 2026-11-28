import { act, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { NoteEditor } from "./NoteEditor";

function renderEditor(
  initialText: string,
  {
    onOtherButtonPointerDown = vi.fn(),
  }: { onOtherButtonPointerDown?: () => void } = {},
) {
  const onConfirm = vi.fn<(text: string) => void>();
  const onCancel = vi.fn<() => void>();
  const pressWithoutConfirmRef = createRef<HTMLButtonElement>();
  render(
    <>
      <button type="button" onPointerDown={onOtherButtonPointerDown}>
        ほかのボタン
      </button>
      <button ref={pressWithoutConfirmRef} type="button">
        確定しないボタン
      </button>
      <NoteEditor
        initialText={initialText}
        pressWithoutConfirmRef={pressWithoutConfirmRef}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    </>,
  );
  return {
    input: screen.getByRole<HTMLTextAreaElement>("textbox"),
    onConfirm,
    onCancel,
  };
}

describe("編集の始まり", () => {
  test("入力欄にカーソルが入り、文字の最後に置かれる", () => {
    const { input } = renderEditor("買い物");

    expect(input).toHaveFocus();
    expect(input).toHaveProperty("selectionStart", 3);
    expect(input).toHaveProperty("selectionEnd", 3);
  });
});

describe("編集の確定", () => {
  test("Ctrl+Enter で、入力した文字で確定する", async () => {
    const user = userEvent.setup();
    const { onConfirm } = renderEditor("買い物");

    await user.keyboard("\n牛乳{Control>}{Enter}{/Control}");

    expect(onConfirm).toHaveBeenCalledExactlyOnceWith("買い物\n牛乳");
  });

  test("⌘+Enter でも確定する", async () => {
    const user = userEvent.setup();
    const { onConfirm } = renderEditor("");

    await user.keyboard("メモ{Meta>}{Enter}{/Meta}");

    expect(onConfirm).toHaveBeenCalledExactlyOnceWith("メモ");
  });

  test("Enter だけでは確定せず、改行を入力する", async () => {
    const user = userEvent.setup();
    const { input, onConfirm } = renderEditor("買い物");

    await user.keyboard("{Enter}");

    expect(onConfirm).not.toHaveBeenCalled();
    expect(input).toHaveValue("買い物\n");
  });

  test("入力欄の外でマウスのボタンを押すと、入力した文字で確定する", async () => {
    const user = userEvent.setup();
    const { onConfirm } = renderEditor("");

    await user.keyboard("メモ");
    await user.click(screen.getByRole("button", { name: "ほかのボタン" }));

    expect(onConfirm).toHaveBeenCalledExactlyOnceWith("メモ");
  });

  test("入力欄の外を押したときは、押したものの操作より先に確定する", async () => {
    const user = userEvent.setup();
    const calls: string[] = [];
    const { onConfirm } = renderEditor("", {
      onOtherButtonPointerDown: () => {
        calls.push("ほかのボタン");
      },
    });
    onConfirm.mockImplementation(() => {
      calls.push("確定");
    });

    await user.click(screen.getByRole("button", { name: "ほかのボタン" }));

    expect(calls).toEqual(["確定", "ほかのボタン"]);
  });

  test("確定しない要素として渡されたものを押したときは、入力欄の外でも確定しない", async () => {
    const user = userEvent.setup();
    const { onConfirm } = renderEditor("買い物");

    await user.click(screen.getByRole("button", { name: "確定しないボタン" }));

    expect(onConfirm).not.toHaveBeenCalled();
  });

  test("入力欄の中でマウスのボタンを押しても、確定しない", async () => {
    const user = userEvent.setup();
    const { input, onConfirm } = renderEditor("買い物");

    await user.click(input);

    expect(onConfirm).not.toHaveBeenCalled();
  });

  test("入力欄からフォーカスが外れただけでは、確定も取り消しもしない", () => {
    const { input, onConfirm, onCancel } = renderEditor("買い物");

    act(() => {
      input.blur();
    });

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });
});

describe("編集の取り消し", () => {
  test("Esc で取り消す", async () => {
    const user = userEvent.setup();
    const { onConfirm, onCancel } = renderEditor("買い物");

    await user.keyboard("牛乳{Escape}");

    expect(onCancel).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});

// user-event は日本語の変換を再現できないので、変換中を示す isComposing を付けたキーを直接送る。
test("日本語の変換中の Ctrl+Enter と Esc では、確定も取り消しもしない", () => {
  const { input, onConfirm, onCancel } = renderEditor("買い物");

  fireEvent.keyDown(input, { key: "Enter", ctrlKey: true, isComposing: true });
  fireEvent.keyDown(input, { key: "Escape", isComposing: true });

  expect(onConfirm).not.toHaveBeenCalled();
  expect(onCancel).not.toHaveBeenCalled();
});

describe("文字数の上限", () => {
  test("入力欄の下に、今の文字数と上限を表示する", async () => {
    const user = userEvent.setup();
    const { input } = renderEditor("買い物");

    expect(input).toHaveAccessibleDescription("3 / 200");

    await user.keyboard("👍");

    expect(input).toHaveAccessibleDescription("4 / 200");
  });

  test("文字数の表示を押しても、確定しない", async () => {
    const user = userEvent.setup();
    const { onConfirm } = renderEditor("買い物");

    await user.click(screen.getByText("3 / 200"));

    expect(onConfirm).not.toHaveBeenCalled();
  });

  test("200字に達しているときに末尾へ入力した字は入らない", async () => {
    const user = userEvent.setup();
    const full = "あ".repeat(200);
    const { input } = renderEditor(full);

    await user.keyboard("い");

    expect(input).toHaveValue(full);
    expect(input).toHaveProperty("selectionStart", 200);
  });

  test("200字に達しているときに途中へ入力した字も入らず、カーソルも動かない", async () => {
    const user = userEvent.setup();
    const full = "あ".repeat(200);
    const { input } = renderEditor(full);
    act(() => {
      input.setSelectionRange(100, 100);
    });

    await user.keyboard("い");

    expect(input).toHaveValue(full);
    expect(input).toHaveProperty("selectionStart", 100);
  });

  test("貼り付けで上限を超えるときは、収まる分だけが入り、カーソルは入った字の直後に来る", async () => {
    const user = userEvent.setup();
    const { input } = renderEditor("あ".repeat(195));
    act(() => {
      input.setSelectionRange(100, 100);
    });

    await user.paste("0123456789");

    expect(input).toHaveValue("あ".repeat(100) + "01234" + "あ".repeat(95));
    expect(input).toHaveProperty("selectionStart", 105);
  });

  // user-event は日本語の変換を再現できないので、変換の始まりと終わりのイベントを直接送る。
  test("日本語の変換中は制限せず、変換を確定したときに収まる分だけを入れる", () => {
    const { input } = renderEditor("あ".repeat(198));

    fireEvent.compositionStart(input);
    fireEvent.change(input, {
      target: { value: "あ".repeat(198) + "漢字変換" },
    });

    expect(input).toHaveValue("あ".repeat(198) + "漢字変換");

    fireEvent.compositionEnd(input);

    expect(input).toHaveValue("あ".repeat(198) + "漢字");
    expect(input).toHaveProperty("selectionStart", 200);
  });
});
