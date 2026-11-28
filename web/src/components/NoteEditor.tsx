import {
  type ChangeEvent,
  type KeyboardEvent,
  type RefObject,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import {
  countCodePoints,
  NOTE_TEXT_LIMIT,
  truncateInsertionToLimit,
} from "../notes/text";
import "./NoteEditor.css";

type NoteEditorProps = {
  readonly initialText: string;
  // 入力欄の外でも、ここを押したときは確定しない
  readonly pressWithoutConfirmRef: RefObject<HTMLElement | null>;
  readonly onConfirm: (text: string) => void;
  readonly onCancel: () => void;
};

export function NoteEditor({
  initialText,
  pressWithoutConfirmRef,
  onConfirm,
  onCancel,
}: NoteEditorProps) {
  const [draft, setDraft] = useState(initialText);
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // 日本語の変換中だけ、変換を始める前の文字を持つ。変換中でなければ null。
  const textBeforeCompositionRef = useRef<string | null>(null);
  const counterId = useId();

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea === null) {
      return;
    }
    textarea.focus();
    const end = textarea.value.length;
    textarea.setSelectionRange(end, end);
  }, []);

  // 押したものの操作より先に確定するため、押したものより先に届くキャプチャの段階で受け取る。
  // フォーカスが外れたとき（blur）には確定しない。ウィンドウやタブを切り替えただけで
  // 編集が終わらないようにするため。
  useEffect(() => {
    function confirmOnPressOutside(event: PointerEvent) {
      if (
        isInside(containerRef, event.target) ||
        isInside(pressWithoutConfirmRef, event.target)
      ) {
        return;
      }
      onConfirm(draft);
    }
    document.addEventListener("pointerdown", confirmOnPressOutside, true);
    return () => {
      document.removeEventListener("pointerdown", confirmOnPressOutside, true);
    };
  }, [draft, onConfirm, pressWithoutConfirmRef]);

  function confirmOrCancelByKey(event: KeyboardEvent<HTMLTextAreaElement>) {
    // 日本語の変換中のキーは変換の操作なので、確定にも取り消しにも使わない。
    if (event.nativeEvent.isComposing) {
      return;
    }
    // OS を見分けずに、Ctrl と ⌘ のどちらとの組み合わせでも確定する。
    // OS の見分けに使える navigator.platform は非推奨のため。
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      onConfirm(draft);
      return;
    }
    if (event.key === "Escape") {
      onCancel();
    }
  }

  // 入力欄の maxLength は使わない。UTF-16 の単位で数えるので、絵文字を2字と数えてしまうため。
  function updateDraftWithinLimit(
    textarea: HTMLTextAreaElement,
    previous: string,
  ) {
    const limited = truncateInsertionToLimit(
      previous,
      textarea.value,
      textarea.selectionEnd,
    );
    // 切り詰めた値を React に入れるだけだと、React が入力欄の値を書き換えたときに
    // カーソルが末尾へ動く。そのため、入力欄の値とカーソルをここで先にそろえておく。
    if (limited.text !== textarea.value) {
      textarea.value = limited.text;
      textarea.setSelectionRange(limited.caret, limited.caret);
    }
    setDraft(limited.text);
  }

  function updateDraft(event: ChangeEvent<HTMLTextAreaElement>) {
    // 変換中は制限しない。変換の途中の文字を切り詰めると、変換をやり直せなくなるため。
    if (textBeforeCompositionRef.current !== null) {
      setDraft(event.target.value);
      return;
    }
    updateDraftWithinLimit(event.target, draft);
  }

  return (
    <div ref={containerRef} className="note-editor">
      <textarea
        ref={textareaRef}
        className="note-editor-input"
        aria-label="付箋の文字"
        aria-describedby={counterId}
        value={draft}
        onChange={updateDraft}
        onKeyDown={confirmOrCancelByKey}
        onCompositionStart={() => {
          textBeforeCompositionRef.current = draft;
        }}
        onCompositionEnd={(event) => {
          const previous = textBeforeCompositionRef.current ?? draft;
          textBeforeCompositionRef.current = null;
          updateDraftWithinLimit(event.currentTarget, previous);
        }}
      />
      <div id={counterId} className="note-editor-counter">
        {countCodePoints(draft)} / {NOTE_TEXT_LIMIT}
      </div>
    </div>
  );
}

function isInside(
  ref: RefObject<HTMLElement | null>,
  target: EventTarget | null,
): boolean {
  return target instanceof Node && ref.current?.contains(target) === true;
}
