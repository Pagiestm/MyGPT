import { chunkText } from './chunking';

describe('chunkText', () => {
  it('returns nothing for an empty document', () => {
    expect(chunkText('   \n\n  ')).toEqual([]);
  });

  it('keeps a short document in a single chunk', () => {
    expect(chunkText('Un paragraphe.\n\nUn autre.')).toEqual(['Un paragraphe.\n\nUn autre.']);
  });

  it('splits on paragraph boundaries once the target is exceeded', () => {
    const paragraph = 'a'.repeat(80);
    const chunks = chunkText(Array(10).fill(paragraph).join('\n\n'), 200, 20);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.includes(paragraph))).toBe(true);
  });

  it('carries the end of a chunk over to the next one', () => {
    const chunks = chunkText(
      `${'a'.repeat(80)}\n\n${'b'.repeat(80)}\n\n${'c'.repeat(80)}`,
      180,
      30,
    );

    expect(chunks).toHaveLength(2);
    expect(chunks[1]!.startsWith('b'.repeat(30))).toBe(true);
    expect(chunks[1]).toContain('c'.repeat(80));
  });

  it('cuts a paragraph longer than the target', () => {
    const chunks = chunkText('x'.repeat(500), 200, 0);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.length <= 200)).toBe(true);
  });
});
