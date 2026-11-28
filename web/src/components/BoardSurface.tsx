import { useRef } from "react";
import type { Note } from "../notes/notesReducer";
import { BOARD_SIZE, type NotePosition } from "../notes/position";
import "./BoardSurface.css";
import { StickyNote } from "./StickyNote";

type BoardSurfaceProps = {
  readonly notes: readonly Note[];
  readonly editingNoteId: string | null;
  readonly onMoveNote: (id: string, position: NotePosition) => void;
  readonly onDeleteNote: (id: string) => void;
  readonly onStartEditing: (id: string) => void;
  readonly onConfirmEditing: (id: string, text: string) => void;
  readonly onCancelEditing: () => void;
};

export function BoardSurface({
  notes,
  editingNoteId,
  onMoveNote,
  onDeleteNote,
  onStartEditing,
  onConfirmEditing,
  onCancelEditing,
}: BoardSurfaceProps) {
  const boardRef = useRef<HTMLDivElement>(null);

  // 要素は重なりの順番では並べず、id の順で固定する。重なりの順番が変わるたびに
  // 並べ替えると要素が動き、入力欄のフォーカスが外れたり、ドラッグが途中で切れたりするため。
  const stackedNotesInIdOrder = notes
    .map((note, stackIndex) => ({ note, stackIndex }))
    .sort((a, b) => a.note.id.localeCompare(b.note.id));

  return (
    <div
      ref={boardRef}
      className="board-surface"
      style={{ width: BOARD_SIZE.width, height: BOARD_SIZE.height }}
    >
      {stackedNotesInIdOrder.map(({ note, stackIndex }) => (
        <StickyNote
          key={note.id}
          note={note}
          boardRef={boardRef}
          zIndex={stackIndex}
          topZIndex={notes.length}
          isEditing={note.id === editingNoteId}
          onMove={(position) => {
            onMoveNote(note.id, position);
          }}
          onDelete={() => {
            onDeleteNote(note.id);
          }}
          onStartEditing={() => {
            onStartEditing(note.id);
          }}
          onConfirmEditing={(text) => {
            onConfirmEditing(note.id, text);
          }}
          onCancelEditing={onCancelEditing}
        />
      ))}
    </div>
  );
}
