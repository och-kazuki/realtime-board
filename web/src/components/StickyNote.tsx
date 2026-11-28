import { type RefObject, useRef } from "react";
import type { Note } from "../notes/notesReducer";
import { NOTE_SIZE, type NotePosition } from "../notes/position";
import { NoteEditor } from "./NoteEditor";
import "./StickyNote.css";
import { useNoteDrag } from "./useNoteDrag";

type StickyNoteProps = {
  readonly note: Note;
  readonly boardRef: RefObject<HTMLElement | null>;
  readonly zIndex: number;
  readonly topZIndex: number;
  readonly isEditing: boolean;
  readonly onMove: (position: NotePosition) => void;
  readonly onDelete: () => void;
  readonly onStartEditing: () => void;
  readonly onConfirmEditing: (text: string) => void;
  readonly onCancelEditing: () => void;
};

export function StickyNote({
  note,
  boardRef,
  zIndex,
  topZIndex,
  isEditing,
  onMove,
  onDelete,
  onStartEditing,
  onConfirmEditing,
  onCancelEditing,
}: StickyNoteProps) {
  const { position, isDragging, dragHandleProps } = useNoteDrag(
    note,
    boardRef,
    onMove,
  );
  const deleteButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <article
      className={isDragging ? "sticky-note is-dragging" : "sticky-note"}
      style={{
        left: position.x,
        top: position.y,
        width: NOTE_SIZE.width,
        height: NOTE_SIZE.height,
        // 編集中とドラッグ中に一番上へ出すのは表示だけにし、状態の重なりの順番は変えない。
        // 重なりの順番は、編集を確定したときと手を離したときにだけ変えるため。
        zIndex: isEditing || isDragging ? topZIndex : zIndex,
      }}
    >
      <div className="sticky-note-header">
        {/* キーボードで付箋を動かす操作は M1 で作らないので、Tab で止まらないようにする */}
        <button
          type="button"
          className="sticky-note-handle"
          aria-label="付箋を動かす"
          tabIndex={-1}
          {...dragHandleProps}
        />
        <button
          ref={deleteButtonRef}
          type="button"
          className="sticky-note-delete"
          aria-label="付箋を削除"
          onClick={onDelete}
        >
          ×
        </button>
      </div>
      {isEditing ? (
        <NoteEditor
          initialText={note.text}
          // 編集中の付箋の削除ボタンでは、編集を確定せずに消す。消す付箋の文字を確定しても
          // 意味がなく、M3 で確定のすぐあとに送る削除が衝突しないようにするため。
          pressWithoutConfirmRef={deleteButtonRef}
          onConfirm={onConfirmEditing}
          onCancel={onCancelEditing}
        />
      ) : (
        <div className="sticky-note-text" onDoubleClick={onStartEditing}>
          {note.text}
        </div>
      )}
    </article>
  );
}
