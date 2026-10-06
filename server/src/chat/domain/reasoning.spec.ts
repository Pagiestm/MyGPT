import { createReasoningFilter, stripReasoning } from './reasoning';

function stream(text: string, size: number) {
  const filter = createReasoningFilter();
  let output = '';
  for (let index = 0; index < text.length; index += size) {
    output += filter.push(text.slice(index, index + size));
  }
  return output + filter.flush();
}

describe('stripReasoning', () => {
  it('leaves an ordinary answer untouched', () => {
    expect(stripReasoning('Bonjour, comment allez-vous ?')).toBe('Bonjour, comment allez-vous ?');
  });

  it('removes a reasoning block and keeps the answer', () => {
    expect(stripReasoning('<think>Le visiteur dit bonjour.</think>Bonjour !')).toBe('Bonjour !');
  });

  it('removes several blocks', () => {
    expect(stripReasoning('<think>un</think>A<think>deux</think>B')).toBe('AB');
  });

  it('drops a block that is never closed', () => {
    expect(stripReasoning('<think>Le modèle a été coupé en pleine réflexion')).toBe('');
  });

  it('keeps text that merely mentions the tag name', () => {
    expect(stripReasoning('Le mot think désigne la pensée')).toBe('Le mot think désigne la pensée');
  });

  it('handles a block spanning the whole output', () => {
    expect(stripReasoning('<think>tout</think>')).toBe('');
  });
});

describe('createReasoningFilter', () => {
  const cases = [
    ['<think>réflexion</think>La réponse', 'La réponse'],
    ['Avant<think>milieu</think>après', 'Avantaprès'],
    ['<think>a</think>X<think>b</think>Y', 'XY'],
    ['Aucune balise ici', 'Aucune balise ici'],
  ] as const;

  it.each([1, 2, 3, 5, 7, 8, 13, 1000])('rebuilds the answer with chunks of %i', (size) => {
    for (const [input, expected] of cases) {
      expect(stream(input, size)).toBe(expected);
    }
  });

  it('never emits a partial tag while waiting for the rest', () => {
    const filter = createReasoningFilter();
    expect(filter.push('Bonjour<thi')).toBe('Bonjour');
    expect(filter.push('nk>caché</think> !')).toBe(' !');
  });

  it('releases a held-back fragment that turns out not to be a tag', () => {
    const filter = createReasoningFilter();
    expect(filter.push('A<thi')).toBe('A');
    expect(`${filter.push('nking')}${filter.flush()}`).toBe('<thinking');
  });
});
