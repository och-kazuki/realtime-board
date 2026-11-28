import {
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  useEffect,
  useState,
} from "react";
import type { Note } from "../notes/notesReducer";
import { type NotePosition, toPositionOnBoard } from "../notes/position";

type Point = {
  readonly x: number;
  readonly y: number;
};

type Drag = {
  readonly pointerId: number;
  // つまみを押した点が、付箋の左上の角からどれだけ離れているか
  readonly grabOffset: Point;
  // 画面の上でのマウスの最後の位置。スクロールしたときに、付箋の位置を求め直すのに使う
  readonly lastPointer: Point;
  readonly position: NotePosition;
};

export type NoteDrag = {
  readonly position: NotePosition;
  readonly isDragging: boolean;
  readonly dragHandleProps: {
    readonly onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
    readonly onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
    readonly onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
    readonly onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => void;
  };
};

// ドラッグ中の位置は表示だけに使い、付箋の状態は手を離したときにだけ変える（ADR-015）。
export function useNoteDrag(
  note: Note,
  boardRef: RefObject<HTMLElement | null>,
  onMove: (position: NotePosition) => void,
): NoteDrag {
  const [drag, setDrag] = useState<Drag | null>(null);

  useEffect(() => {
    if (drag === null) {
      return;
    }
    const currentDrag = drag;
    function cancelOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDrag(null);
      }
    }
    // スクロールではマウスが動かないので pointermove が届かない。スクロールの通知は
    // 親へ伝わらないため、キャプチャの段階で window に届くうちに受け取る。
    function followScroll() {
      const board = boardRef.current;
      if (board === null) {
        return;
      }
      const position = positionUnderPointer(
        board,
        currentDrag.lastPointer,
        currentDrag.grabOffset,
      );
      if (position !== null) {
        setDrag({ ...currentDrag, position });
      }
    }
    window.addEventListener("keydown", cancelOnEscape);
    window.addEventListener("scroll", followScroll, true);
    return () => {
      window.removeEventListener("keydown", cancelOnEscape);
      window.removeEventListener("scroll", followScroll, true);
    };
  }, [drag, boardRef]);

  function startDrag(event: ReactPointerEvent<HTMLElement>) {
    const board = boardRef.current;
    if (event.button !== 0 || drag !== null || board === null) {
      return;
    }
    const pointer = { x: event.clientX, y: event.clientY };
    const grabPoint = toBoardPoint(board, pointer);
    // マウスがつまみの外へ出ても、手を離すまでの通知をつまみが受け取れるようにする。
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({
      pointerId: event.pointerId,
      grabOffset: { x: grabPoint.x - note.x, y: grabPoint.y - note.y },
      lastPointer: pointer,
      position: { x: note.x, y: note.y },
    });
  }

  function followPointer(event: ReactPointerEvent<HTMLElement>) {
    const board = boardRef.current;
    if (drag === null || event.pointerId !== drag.pointerId || board === null) {
      return;
    }
    const pointer = { x: event.clientX, y: event.clientY };
    setDrag({
      ...drag,
      lastPointer: pointer,
      position:
        positionUnderPointer(board, pointer, drag.grabOffset) ?? drag.position,
    });
  }

  function finishDrag(event: ReactPointerEvent<HTMLElement>) {
    const board = boardRef.current;
    if (drag === null || event.pointerId !== drag.pointerId || board === null) {
      return;
    }
    const pointer = { x: event.clientX, y: event.clientY };
    setDrag(null);
    onMove(
      positionUnderPointer(board, pointer, drag.grabOffset) ?? drag.position,
    );
  }

  function cancelDrag(event: ReactPointerEvent<HTMLElement>) {
    if (drag === null || event.pointerId !== drag.pointerId) {
      return;
    }
    setDrag(null);
  }

  return {
    position: drag?.position ?? { x: note.x, y: note.y },
    isDragging: drag !== null,
    dragHandleProps: {
      onPointerDown: startDrag,
      onPointerMove: followPointer,
      onPointerUp: finishDrag,
      onPointerCancel: cancelDrag,
    },
  };
}

// ボードの左上からの位置に直す。ボードの要素の画面の上での位置は、スクロールした分だけ
// ずれるので、スクロールの量を別に足さなくてよい。
function toBoardPoint(board: HTMLElement, pointer: Point): Point {
  const rect = board.getBoundingClientRect();
  return { x: pointer.x - rect.left, y: pointer.y - rect.top };
}

function positionUnderPointer(
  board: HTMLElement,
  pointer: Point,
  grabOffset: Point,
): NotePosition | null {
  const point = toBoardPoint(board, pointer);
  return toPositionOnBoard({
    x: point.x - grabOffset.x,
    y: point.y - grabOffset.y,
  });
}
