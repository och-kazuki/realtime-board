export const BOARD_SIZE = { width: 3000, height: 2000 } as const;
export const NOTE_SIZE = { width: 200, height: 200 } as const;

export type NotePosition = {
  x: number;
  y: number;
};

const MAX_X = BOARD_SIZE.width - NOTE_SIZE.width;
const MAX_Y = BOARD_SIZE.height - NOTE_SIZE.height;

// 数でない位置は端に寄せずに null を返す。Infinity まで端に寄せると、
// 誤った操作が「端までの移動」として通ってしまうため。
export function toPositionOnBoard(
  requested: NotePosition,
): NotePosition | null {
  if (!Number.isFinite(requested.x) || !Number.isFinite(requested.y)) {
    return null;
  }
  return {
    x: clamp(Math.round(requested.x), 0, MAX_X),
    y: clamp(Math.round(requested.y), 0, MAX_Y),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// ボードのうち画面に見えている範囲。位置はボードの左上から測る。
export type VisibleArea = {
  left: number;
  top: number;
  width: number;
  height: number;
};

// 端に収めるのと整数にするのは、置くときに状態の関数がする。
export function calculateNotePositionAtCenter(area: VisibleArea): NotePosition {
  return {
    x: area.left + area.width / 2 - NOTE_SIZE.width / 2,
    y: area.top + area.height / 2 - NOTE_SIZE.height / 2,
  };
}
