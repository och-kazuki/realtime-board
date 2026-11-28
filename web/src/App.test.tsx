import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import { App } from "./App";

// jsdom は画面の配置を計算しないので、スクロールの位置と見えている大きさは
// いつも 0 になる。テストでは要素にその値を持たせて、ブラウザでの状態を再現する。
function scrollViewport(
  viewport: HTMLElement,
  metrics: {
    scrollLeft: number;
    scrollTop: number;
    clientWidth: number;
    clientHeight: number;
  },
): void {
  for (const [name, value] of Object.entries(metrics)) {
    Object.defineProperty(viewport, name, { value, configurable: true });
  }
}

function deleteButtonOf(text: string): HTMLElement {
  const article = screen.getByText(text).closest("article");
  if (article === null) {
    throw new Error(`「${text}」の付箋が見つからない`);
  }
  return within(article).getByRole("button", { name: "付箋を削除" });
}

async function addNoteWithText(user: UserEvent, text: string): Promise<void> {
  await user.click(screen.getByRole("button", { name: "付箋を追加" }));
  await user.keyboard(`${text}{Control>}{Enter}{/Control}`);
}

test("開くとアプリの名前が見出しとして表示される", () => {
  render(<App />);

  expect(
    screen.getByRole("heading", { name: "リアルタイム共有ボード" }),
  ).toBeInTheDocument();
});

test("開くと、付箋のない空のボードが表示される", () => {
  render(<App />);

  expect(screen.getByRole("main")).toBeInTheDocument();
  expect(screen.queryAllByRole("article")).toEqual([]);
});

describe("付箋の追加", () => {
  test("「付箋を追加」を押すと、文字が空の付箋が1枚増える", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "付箋を追加" }));

    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getByRole("textbox", { name: "付箋の文字" })).toHaveValue("");
  });

  test("追加した付箋の入力欄にカーソルが入り、そのまま文字を入力できる", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "付箋を追加" }));
    await user.keyboard("メモ");

    const input = screen.getByRole("textbox", { name: "付箋の文字" });
    expect(input).toHaveFocus();
    expect(input).toHaveValue("メモ");
  });

  test("付箋は、その真ん中が見えている範囲の真ん中に来るように置く", async () => {
    const user = userEvent.setup();
    render(<App />);
    scrollViewport(screen.getByRole("main"), {
      scrollLeft: 1500,
      scrollTop: 800,
      clientWidth: 1000,
      clientHeight: 600,
    });

    await user.click(screen.getByRole("button", { name: "付箋を追加" }));

    // 見えている範囲の真ん中は (2000, 1100)。付箋の左上の角は、そこから 100 ずつ戻る。
    expect(screen.getByRole("article")).toHaveStyle({
      left: "1900px",
      top: "1000px",
    });
  });
});

describe("付箋の編集", () => {
  test("文字をダブルクリックして編集し、確定すると、付箋の文字が変わる", async () => {
    const user = userEvent.setup();
    render(<App />);
    await addNoteWithText(user, "買い物");

    await user.dblClick(screen.getByText("買い物"));
    await user.keyboard("\n牛乳{Control>}{Enter}{/Control}");

    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getByRole("article")).toHaveTextContent("買い物 牛乳");
  });

  test("編集を取り消すと、編集を始める前の文字に戻る", async () => {
    const user = userEvent.setup();
    render(<App />);
    await addNoteWithText(user, "買い物");

    await user.dblClick(screen.getByText("買い物"));
    await user.keyboard("と掃除{Escape}");

    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getByText("買い物")).toBeInTheDocument();
    expect(screen.queryByText("買い物と掃除")).toBeNull();
  });

  test("編集中に「付箋を追加」を押すと、今の編集を確定してから、新しい付箋の編集を始める", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "付箋を追加" }));
    await user.keyboard("1枚目");

    await user.click(screen.getByRole("button", { name: "付箋を追加" }));

    expect(screen.getByText("1枚目")).toBeInTheDocument();
    const input = screen.getByRole("textbox", { name: "付箋の文字" });
    expect(input).toHaveFocus();
    expect(input).toHaveValue("");
  });
});

describe("付箋の移動", () => {
  test("つまみをドラッグして手を離すと、付箋がその位置に残る", async () => {
    const user = userEvent.setup();
    render(<App />);
    // jsdom では見えている範囲の大きさが 0 なので、付箋はボードの左上 (0, 0) に置かれる。
    await addNoteWithText(user, "メモ");
    const handle = screen.getByRole("button", { name: "付箋を動かす" });

    fireEvent.pointerDown(handle, {
      button: 0,
      pointerId: 1,
      clientX: 10,
      clientY: 10,
    });
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: 310, clientY: 210 });
    fireEvent.pointerUp(handle, { pointerId: 1, clientX: 310, clientY: 210 });

    expect(screen.getByRole("article")).toHaveStyle({
      left: "300px",
      top: "200px",
    });
  });
});

describe("付箋の削除", () => {
  test("削除ボタンを押すと、その付箋だけが消える", async () => {
    const user = userEvent.setup();
    render(<App />);
    await addNoteWithText(user, "1枚目");
    await addNoteWithText(user, "2枚目");

    await user.click(deleteButtonOf("1枚目"));

    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.queryByText("1枚目")).toBeNull();
    expect(screen.getByText("2枚目")).toBeInTheDocument();
  });

  test("編集中にほかの付箋の削除ボタンを押すと、今の編集を確定してから、その付箋を消す", async () => {
    const user = userEvent.setup();
    render(<App />);
    await addNoteWithText(user, "消す付箋");
    await user.click(screen.getByRole("button", { name: "付箋を追加" }));
    await user.keyboard("編集中");

    await user.click(deleteButtonOf("消す付箋"));

    expect(screen.queryByText("消す付箋")).toBeNull();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getByText("編集中")).toBeInTheDocument();
  });
});
