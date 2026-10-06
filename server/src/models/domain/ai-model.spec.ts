import { DomainError } from '../../common/domain/domain-error';
import { AiModel } from './ai-model';

const input = {
  id: 'webgpu:Llama-3.2-3B-Instruct-q4f16_1-MLC',
  label: '  Llama 3.2 3B  ',
  description: '  Bon compromis  ',
  vramMb: 2264,
  position: 0,
};

describe('AiModel', () => {
  it('trims what the catalogue displays', () => {
    const model = AiModel.create(input);

    expect(model.label).toBe('Llama 3.2 3B');
    expect(model.description).toBe('Bon compromis');
  });

  it('starts enabled at the first revision', () => {
    const model = AiModel.create(input);

    expect(model.enabled).toBe(true);
    expect(model.revision).toBe(1);
  });

  it('refuses an identifier that is not a WebGPU model', () => {
    expect(() => AiModel.create({ ...input, id: 'gemini-pro' })).toThrow(DomainError);
  });

  it('refuses a model that claims to need no memory', () => {
    expect(() => AiModel.create({ ...input, vramMb: 0 })).toThrow(DomainError);
  });

  it('bumps the revision so every browser downloads the weights again', () => {
    const model = AiModel.create(input);

    model.refreshWeights();

    expect(model.revision).toBe(2);
  });

  it('leaves the revision alone for an ordinary change', () => {
    const model = AiModel.create(input);

    model.describeAs({ label: 'Llama 3.2' });

    expect(model.label).toBe('Llama 3.2');
    expect(model.revision).toBe(1);
  });

  it('still refuses an impossible memory requirement when editing', () => {
    const model = AiModel.create(input);

    expect(() => model.describeAs({ vramMb: -1 })).toThrow(DomainError);
  });

  describe('capability profile', () => {
    it('starts without a profile when none is given', () => {
      const model = AiModel.create(input);

      expect(model.strengths).toEqual([]);
      expect(model.limitations).toEqual([]);
      expect(model.parameters).toBeNull();
      expect(model.contextWindow).toBeNull();
      expect(model.lowResource).toBe(false);
    });

    it('drops blank traits rather than showing empty badges', () => {
      const model = AiModel.create({ ...input, strengths: ['  Rapide  ', '   ', ''] });

      expect(model.strengths).toEqual(['Rapide']);
    });

    it('refuses more traits than a reader can take in', () => {
      expect(() =>
        AiModel.create({ ...input, strengths: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] }),
      ).toThrow(DomainError);
    });

    it('refuses a trait too long to fit on a badge', () => {
      expect(() => AiModel.create({ ...input, limitations: ['x'.repeat(81)] })).toThrow(
        DomainError,
      );
    });

    it('refuses a context window that could not exist', () => {
      expect(() => AiModel.create({ ...input, contextWindow: 0 })).toThrow(DomainError);
    });

    it('lets the profile be edited without touching the weights', () => {
      const model = AiModel.create(input);

      model.describeAs({ strengths: ['Mathématiques'], parameters: '  4 milliards  ' });

      expect(model.strengths).toEqual(['Mathématiques']);
      expect(model.parameters).toBe('4 milliards');
      expect(model.revision).toBe(1);
    });

    it('treats a blank size as no size at all', () => {
      const model = AiModel.create({ ...input, parameters: '   ' });

      expect(model.parameters).toBeNull();
    });
  });
});
