export const NOTE_TEXT_LIMIT = 200;

// text.length は使わない。UTF-16 の単位で数えるので一部の絵文字を2字と数え、
// Go のサーバーが数える文字数（rune の数）と合わなくなるため。
export function countCodePoints(text: string): number {
  return Array.from(text).length;
}

export function exceedsNoteTextLimit(text: string): boolean {
  return countCodePoints(text) > NOTE_TEXT_LIMIT;
}

export type TextWithCaret = {
  readonly text: string;
  readonly caret: number;
};

export function truncateInsertionToLimit(
  previous: string,
  next: string,
  caretAfterInput: number,
): TextWithCaret {
  if (!exceedsNoteTextLimit(next)) {
    return { text: next, caret: caretAfterInput };
  }

  // カーソルより後ろは、入力の前からあった文字のはず。そうでなければ、どこに入ったかを
  // 求められないので、入力を受け付けない。
  const suffix = next.slice(caretAfterInput);
  if (!previous.endsWith(suffix)) {
    return {
      text: previous,
      caret: Math.min(caretAfterInput, previous.length),
    };
  }

  const insertionStart = findInsertionStart(
    previous,
    next,
    Math.min(caretAfterInput, previous.length - suffix.length),
  );
  const prefix = next.slice(0, insertionStart);
  const insertion = next.slice(insertionStart, caretAfterInput);
  const room =
    NOTE_TEXT_LIMIT - countCodePoints(prefix) - countCodePoints(suffix);
  const fittedInsertion = Array.from(insertion)
    .slice(0, Math.max(room, 0))
    .join("");

  return {
    text: prefix + fittedInsertion + suffix,
    caret: prefix.length + fittedInsertion.length,
  };
}

function findInsertionStart(
  previous: string,
  next: string,
  maxStart: number,
): number {
  let start = 0;
  while (start < maxStart && previous[start] === next[start]) {
    start += 1;
  }
  // 絵文字のように UTF-16 で2単位になる字の、1単位目までが同じだったときは、
  // その字の前まで戻る。字の途中で分けると、切り詰めたときに字が壊れるため。
  if (start > 0 && isHighSurrogate(next.charCodeAt(start - 1))) {
    start -= 1;
  }
  return start;
}

function isHighSurrogate(charCode: number): boolean {
  return charCode >= 0xd800 && charCode <= 0xdbff;
}
