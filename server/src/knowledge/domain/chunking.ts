const TARGET = 1200;
const OVERLAP = 200;

export function chunkText(raw: string, target = TARGET, overlap = OVERLAP): string[] {
  const text = raw.replace(/\r\n/g, '\n').trim();
  if (!text) return [];

  const blocks = text.split(/\n{2,}/).flatMap((block) => splitLong(block.trim(), target));
  const chunks: string[] = [];
  let current = '';

  for (const block of blocks) {
    if (!block) continue;
    if (current && current.length + block.length + 2 > target) {
      chunks.push(current);
      current = overlap > 0 ? current.slice(-overlap).trimStart() : '';
    }
    current = current ? `${current}\n\n${block}` : block;
  }
  if (current.trim()) chunks.push(current);
  return chunks;
}

function splitLong(block: string, target: number): string[] {
  if (block.length <= target) return [block];
  const pieces: string[] = [];
  for (let index = 0; index < block.length; index += target) {
    pieces.push(block.slice(index, index + target));
  }
  return pieces;
}
