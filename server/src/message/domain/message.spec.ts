import { DomainError } from '../../common/domain/domain-error';
import { Message } from './message';

describe('Message', () => {
  it('records a question as coming from the user', () => {
    const question = Message.ask('c1', 'Comment ça marche ?');

    expect(question.isFromAi).toBe(false);
    expect(question.model).toBeNull();
  });

  it('records an answer with the model that produced it', () => {
    const answer = Message.answer('c1', 'Comme ceci.', 'webgpu:Qwen3.5-2B-q4f16_1-MLC');

    expect(answer.isFromAi).toBe(true);
    expect(answer.model).toBe('webgpu:Qwen3.5-2B-q4f16_1-MLC');
  });

  it('lets a question be rewritten', () => {
    const question = Message.ask('c1', 'Et en Java ?');

    question.rewrite('Et en Python ?');

    expect(question.content).toBe('Et en Python ?');
  });

  it('refuses to rewrite an answer from the AI', () => {
    const answer = Message.answer('c1', 'Comme ceci.', 'webgpu:x');

    expect(() => answer.rewrite('Autre chose')).toThrow(DomainError);
  });

  it('turns into the role the model expects', () => {
    expect(Message.ask('c1', 'Salut').asTurn()).toEqual({ role: 'user', text: 'Salut' });
    expect(Message.answer('c1', 'Bonjour', 'webgpu:x').asTurn()).toEqual({
      role: 'model',
      text: 'Bonjour',
    });
  });
});
