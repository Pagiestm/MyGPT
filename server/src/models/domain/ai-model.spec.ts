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
});
