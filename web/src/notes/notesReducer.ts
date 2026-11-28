import { toPositionOnBoard } from "./position";
import { exceedsNoteTextLimit } from "./text";

export type Note = {
  readonly id: string;
  readonly text: string;
  readonly x: number;
  readonly y: number;
};

export type NotesAction =
  | { type: "noteCreated"; id: string; x: number; y: number }
  | { type: "noteMoved"; id: string; x: number; y: number }
  | { type: "noteTextUpdated"; id: string; text: string }
  | { type: "noteDeleted"; id: string };

// 同じ位置への移動や同じ文字への変更も、ここでは弾かずに反映する。
// M2 ではサーバーから届いた操作をそのまま反映し、重なりの順番をサーバーと
// そろえるため。同じ値の操作を作らないようにするのは、呼び出す側の役目。
export function notesReducer(
  notes: readonly Note[],
  action: NotesAction,
): readonly Note[] {
  switch (action.type) {
    case "noteCreated": {
      if (notes.some((note) => note.id === action.id)) {
        return notes;
      }
      const position = toPositionOnBoard({ x: action.x, y: action.y });
      if (position === null) {
        return notes;
      }
      return [...notes, { id: action.id, text: "", ...position }];
    }
    case "noteMoved": {
      const position = toPositionOnBoard({ x: action.x, y: action.y });
      if (position === null) {
        return notes;
      }
      return updateAndBringToFront(notes, action.id, (note) => ({
        ...note,
        ...position,
      }));
    }
    case "noteTextUpdated": {
      if (exceedsNoteTextLimit(action.text)) {
        return notes;
      }
      return updateAndBringToFront(notes, action.id, (note) => ({
        ...note,
        text: action.text,
      }));
    }
    case "noteDeleted": {
      if (!notes.some((note) => note.id === action.id)) {
        return notes;
      }
      return notes.filter((note) => note.id !== action.id);
    }
  }
}

function updateAndBringToFront(
  notes: readonly Note[],
  id: string,
  update: (note: Note) => Note,
): readonly Note[] {
  const target = notes.find((note) => note.id === id);
  if (target === undefined) {
    return notes;
  }
  return [...notes.filter((note) => note.id !== id), update(target)];
}
