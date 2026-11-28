import { useRef, useState } from "react";
import "./App.css";
import { BoardSurface } from "./components/BoardSurface";
import { calculateNotePositionAtCenter } from "./notes/position";
import { useBoard } from "./notes/useBoard";

export function App() {
  const { notes, createNote, moveNote, updateNoteText, deleteNote } =
    useBoard();
  const viewportRef = useRef<HTMLElement>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  function createNoteAtViewCenter() {
    const viewport = viewportRef.current;
    if (viewport === null) {
      return;
    }
    // ボードを領域の左上に余白なしで置いているので、スクロールの位置がそのまま、
    // 見えている範囲の左上のボードの上での位置になる。領域に余白を足すときは、ここも直す。
    const id = createNote(
      calculateNotePositionAtCenter({
        left: viewport.scrollLeft,
        top: viewport.scrollTop,
        width: viewport.clientWidth,
        height: viewport.clientHeight,
      }),
    );
    setEditingNoteId(id);
  }

  function confirmEditing(id: string, text: string) {
    updateNoteText(id, text);
    setEditingNoteId(null);
  }

  function cancelEditing() {
    setEditingNoteId(null);
  }

  function deleteNoteAndEndEditing(id: string) {
    deleteNote(id);
    if (id === editingNoteId) {
      setEditingNoteId(null);
    }
  }

  return (
    <div className="app">
      <header className="top-bar">
        <h1 className="app-name">リアルタイム共有ボード</h1>
        <button
          type="button"
          className="add-note-button"
          onClick={createNoteAtViewCenter}
        >
          付箋を追加
        </button>
      </header>
      <main ref={viewportRef} className="board-viewport">
        <BoardSurface
          notes={notes}
          editingNoteId={editingNoteId}
          onMoveNote={moveNote}
          onDeleteNote={deleteNoteAndEndEditing}
          onStartEditing={setEditingNoteId}
          onConfirmEditing={confirmEditing}
          onCancelEditing={cancelEditing}
        />
      </main>
    </div>
  );
}
