export function insertAtCursor(el, text) {
  if (!el) return null;
  const start = el.selectionStart ?? el.value.length;
  const end = el.selectionEnd ?? el.value.length;
  const value = el.value.slice(0, start) + text + el.value.slice(end);
  const cursor = start + text.length;
  return { value, selectionStart: cursor, selectionEnd: cursor };
}

export function wrapSelection(el, before, after = before) {
  if (!el) return null;
  const start = el.selectionStart ?? el.value.length;
  const end = el.selectionEnd ?? el.value.length;
  const selected = el.value.slice(start, end);
  const value = el.value.slice(0, start) + before + selected + after + el.value.slice(end);
  return {
    value,
    selectionStart: start + before.length,
    selectionEnd: start + before.length + selected.length,
  };
}

export function prefixLines(el, prefixFn) {
  if (!el) return null;
  const start = el.selectionStart ?? 0;
  const end = el.selectionEnd ?? el.value.length;
  const lineStart = el.value.lastIndexOf('\n', start - 1) + 1;
  let lineEnd = el.value.indexOf('\n', end);
  if (lineEnd === -1) lineEnd = el.value.length;

  const before = el.value.slice(0, lineStart);
  const segment = el.value.slice(lineStart, lineEnd);
  const after = el.value.slice(lineEnd);

  const newSegment = segment
    .split('\n')
    .map((line, i) => prefixFn(line, i))
    .join('\n');

  return {
    value: before + newSegment + after,
    selectionStart: lineStart,
    selectionEnd: lineStart + newSegment.length,
  };
}

export function applyToField(el, setValue, result) {
  if (!result) return;
  setValue(result.value);
  requestAnimationFrame(() => {
    el.focus();
    el.setSelectionRange(result.selectionStart, result.selectionEnd);
  });
}
