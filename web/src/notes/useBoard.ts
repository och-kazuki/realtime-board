import { useReducer } from "react";
import { type Note, notesReducer } from "./notesReducer";
import { type NotePosition, toPositionOnBoard } from "./position";

export type Board = {
  readonly notes: readonly Note[];
  readonly createNote: (position: NotePosition) => string;
  readonly moveNote: (id: string, position: NotePosition) => void;
  readonly updateNoteText: (id: string, text: string) => void;
  readonly deleteNote: (id: string) => void;
};

const initialNotes: readonly Note[] = [];

// 画面の部品は付箋について、このフックだけを使い、状態の関数を直接使わない。
// M2 ではこのフックの中身だけをサーバーとの通信に替え、画面の部品を変えずに済ませるため。
export function useBoard(): Board {
  const [notes, dispatch] = useReducer(notesReducer, initialNotes);

  function findNote(id: string): Note | undefined {
    return notes.find((note) => note.id === id);
  }

  function createNote(position: NotePosition): string {
    // crypto.randomUUID() は HTTPS か localhost で開いたときにしか使えない
    // （https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID ）。
    // M1 は localhost で開くので足りるが、HTTP でほかのパソコンから開くときは使えない。
    const id = crypto.randomUUID();
    dispatch({ type: "noteCreated", id, ...position });
    return id;
  }

  // 今と同じ位置や同じ文字なら、状態の関数に渡さない。渡すと付箋が一番上に移り、
  // つまみを押しただけのときや文字を変えずに確定したときにも重なりの順番が変わるため。
  function moveNote(id: string, requested: NotePosition): void {
    const note = findNote(id);
    const position = toPositionOnBoard(requested);
    if (note === undefined || position === null) {
      return;
    }
    if (note.x === position.x && note.y === position.y) {
      return;
    }
    dispatch({ type: "noteMoved", id, ...position });
  }

  function updateNoteText(id: string, text: string): void {
    const note = findNote(id);
    if (note === undefined || note.text === text) {
      return;
    }
    dispatch({ type: "noteTextUpdated", id, text });
  }

  function deleteNote(id: string): void {
    dispatch({ type: "noteDeleted", id });
  }

  return { notes, createNote, moveNote, updateNoteText, deleteNote };
}
