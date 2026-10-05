import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ChatService, type ExchangeContext } from './chat.service';
import { PromptService } from './prompt.service';
import type { Conversation } from '../conversation/entities/conversation.entity';
import type { Message } from '../message/entities/message.entity';

const conversation = { id: 'c1', userId: 'u1' } as Conversation;
const question = { id: 'm1', conversationId: 'c1', content: 'Bonjour' } as Message;

const context = (overrides: Partial<ExchangeContext> = {}): ExchangeContext => ({
  question,
  history: [],
  attachments: [],
  ...overrides,
});

describe('PromptService', () => {
  let service: PromptService;

  const chat = {
    ownedConversation: jest.fn(),
    contextFor: jest.fn(),
    saveReply: jest.fn(),
    needsTitle: jest.fn(),
    applyTitle: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    chat.ownedConversation.mockResolvedValue(conversation);
    chat.contextFor.mockResolvedValue(context());
    chat.saveReply.mockResolvedValue({ id: 'm2', isFromAi: true } as Message);
    chat.needsTitle.mockResolvedValue(false);
    chat.applyTitle.mockImplementation((_id: string, name: string) => Promise.resolve(name));

    const module = await Test.createTestingModule({
      providers: [PromptService, { provide: ChatService, useValue: chat }],
    }).compile();
    service = module.get(PromptService);
  });

  describe('assertBrowserModel', () => {
    it('accepts a browser model', () => {
      const model = 'webgpu:Llama-3.2-3B-Instruct-q4f16_1-MLC';
      expect(service.assertBrowserModel(model)).toBe(model);
    });

    it.each(['ollama:llama3.1:8b', 'gemini-3.8-flash', ''])('rejects « %s »', (model) => {
      expect(() => service.assertBrowserModel(model)).toThrow(BadRequestException);
    });
  });

  describe('toExchange', () => {
    it('puts the system instruction first and translates « model » into « assistant »', async () => {
      chat.contextFor.mockResolvedValue(
        context({
          systemInstruction: 'Réponds en français',
          history: [
            { role: 'user', text: 'Salut' },
            { role: 'model', text: 'Bonjour !' },
          ],
        }),
      );

      const { messages } = await service.toExchange('u1', conversation, question);

      expect(messages).toEqual([
        { role: 'system', content: 'Réponds en français' },
        { role: 'user', content: 'Salut' },
        { role: 'assistant', content: 'Bonjour !' },
        { role: 'user', content: 'Bonjour' },
      ]);
    });

    it('omits the system message when there is no instruction', async () => {
      const { messages } = await service.toExchange('u1', conversation, question);

      expect(messages).toEqual([{ role: 'user', content: 'Bonjour' }]);
    });

    it('inlines text files and flags what the model cannot read', async () => {
      chat.contextFor.mockResolvedValue(
        context({
          attachments: [
            { name: 'schema.png', mimeType: 'image/png', data: Buffer.from('img') },
            { name: 'notes.txt', mimeType: 'text/plain', data: Buffer.from('du texte') },
          ],
        }),
      );

      const { messages } = await service.toExchange('u1', conversation, question);
      const last = messages.at(-1)!;

      expect(last.content).toContain('non lisible');
      expect(last.content).toContain('notes.txt');
      expect(last.content).toContain('du texte');
      expect(last.content.endsWith('Bonjour')).toBe(true);
    });
  });

  describe('saveReply', () => {
    it('saves the answer and reports whether a title is still missing', async () => {
      chat.needsTitle.mockResolvedValue(true);

      const result = await service.saveReply('u1', 'c1', 'Salut !', 'webgpu:Llama-3.2-3B');

      expect(chat.saveReply).toHaveBeenCalledWith('c1', 'Salut !', 'webgpu:Llama-3.2-3B');
      expect(result.needsTitle).toBe(true);
    });

    it('refuses a model the browser cannot run', async () => {
      await expect(service.saveReply('u1', 'c1', 'Salut !', 'gemini-3.8-flash')).rejects.toThrow(
        BadRequestException,
      );
      expect(chat.saveReply).not.toHaveBeenCalled();
    });

    it('checks ownership of the conversation before writing', async () => {
      chat.ownedConversation.mockRejectedValue(new Error('Conversation introuvable'));

      await expect(
        service.saveReply('u1', 'c1', 'Salut !', 'webgpu:Llama-3.2-3B'),
      ).rejects.toThrow();
      expect(chat.saveReply).not.toHaveBeenCalled();
    });
  });

  describe('saveTitle', () => {
    it('trims the title and locks it', async () => {
      expect(await service.saveTitle('u1', 'c1', '  Déployer avec Docker  ')).toEqual({
        name: 'Déployer avec Docker',
      });
      expect(chat.applyTitle).toHaveBeenCalledWith('c1', 'Déployer avec Docker');
    });
  });
});
