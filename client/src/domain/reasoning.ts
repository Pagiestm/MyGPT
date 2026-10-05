const OPEN = '<think>';
const CLOSE = '</think>';
const MAX_PARTIAL = Math.max(OPEN.length, CLOSE.length) - 1;

function openingPrefixLength(text: string): number {
  for (let length = Math.min(MAX_PARTIAL, text.length); length > 0; length--) {
    const suffix = text.slice(-length);
    if (OPEN.startsWith(suffix) || CLOSE.startsWith(suffix)) return length;
  }
  return 0;
}

export function createReasoningFilter() {
  let inside = false;
  let pending = '';

  const flush = () => {
    const rest = inside ? '' : pending;
    pending = '';
    inside = false;
    return rest;
  };

  const push = (chunk: string) => {
    pending += chunk;
    let output = '';

    for (;;) {
      if (inside) {
        const end = pending.indexOf(CLOSE);
        if (end === -1) {
          pending = pending.slice(-MAX_PARTIAL);
          return output;
        }
        pending = pending.slice(end + CLOSE.length);
        inside = false;
        continue;
      }

      const start = pending.indexOf(OPEN);
      if (start === -1) {
        const keep = openingPrefixLength(pending);
        output += pending.slice(0, pending.length - keep);
        pending = pending.slice(pending.length - keep);
        return output;
      }
      output += pending.slice(0, start);
      pending = pending.slice(start + OPEN.length);
      inside = true;
    }
  };

  return { push, flush };
}

export function stripReasoning(text: string): string {
  const filter = createReasoningFilter();
  return `${filter.push(text)}${filter.flush()}`.trim();
}
