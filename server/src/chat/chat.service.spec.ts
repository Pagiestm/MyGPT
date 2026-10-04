import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ChatService, type ChatEvent } from './chat.service';
import { Message } from '../message/entities/message.entity';
import { Conversation } from '../conversation/entities/conversation.entity';
import { User } from '../user/entities/user.entity';
import { AttachmentService } from '../attachment/attachment.service';
import { AI_ADAPTER, type AiRequest } from '../infrastructure/adapters/ai-adapter';

const at = (seconds: number) => new Date(Date.UTC(2026, 0, 1, 0, 0, seconds));

const conversation = (overrides: Partial<Conversation> = {}) =>
  ({
    id: 'c1',
    name: 'Nouvelle conversation',
    userId: 'u1',
    titleLocked: false,
    folder: null,
    ...overrides,
  }) as Conversation;

const message = (overrides: Partial<Message>) =>
  ({ conversationId: 'c1', isFromAi: false, attachments: [], ...overrides }) as Message;

async function collect(stream: AsyncGenerator<ChatEvent>) {
  const events: ChatEvent[] = [];
  for await (const event of stream) events.push(event);
  return events;
}

async function* answer(...chunks: string[]) {
  for (const chunk of chunks) yield chunk;
}

describe('ChatService', () => {
  let service: ChatService;
  let saved: Message[];

  const messages = {
    create: jest.fn((data: Partial<Message>) => data),
    save: jest.fn((data: Partial<Message>) => {
      const entity = { id: `m${saved.length + 10}`, createdAt: at(50), ...data } as Message;
      saved.push(entity);
      return Promise.resolve(entity);
    }),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };
  const conversations = { findOne: jest.fn(), update: jest.fn() };
  const users = { findOne: jest.fn() };
  const attachments = { linkToMessage: jest.fn(), findForAi: jest.fn() };
  const ai = {
    models: [],
    defaultModel: 'gemini-3.8-flash',
    resolveModel: jest.fn((model?: string | null) => model ?? 'gemini-3.8-flash'),
    streamResponse: jest.fn(),
    generateTitle: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    saved = [];
    users.findOne.mockResolvedValue({ id: 'u1', customInstructions: null, preferredModel: null });
    conversations.findOne.mockResolvedValue(conversation());
    attachments.findForAi.mockResolvedValue([]);
    messages.find.mockResolvedValue([]);
    messages.findOne.mockImplementation(({ where }: { where: { id: string } }) =>
      Promise.resolve(saved.find((m) => m.id === where.id) ?? null),
    );
    messages.count.mockResolvedValue(1);
    ai.streamResponse.mockImplementation(() => answer('Bon', 'jour'));
    ai.generateTitle.mockResolvedValue(null);

    const module = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: getRepositoryToken(Message), useValue: messages },
        { provide: getRepositoryToken(Conversation), useValue: conversations },
        { provide: getRepositoryToken(User), useValue: users },
        { provide: AttachmentService, useValue: attachments },
        { provide: AI_ADAPTER, useValue: ai },
      ],
    }).compile();
    service = module.get(ChatService);
  });

  const lastRequest = () => ai.streamResponse.mock.calls.at(-1)![0] as AiRequest;

  describe('send', () => {
    it('saves the question, streams the answer and saves it', async () => {
      const events = await collect(
        await service.send('u1', { conversationId: 'c1', content: 'Salut' }),
      );

      expect(events.map((event) => event.type)).toEqual(['user', 'delta', 'delta', 'done']);
      expect(saved[0]).toMatchObject({ content: 'Salut', isFromAi: false });
      expect(saved[1]).toMatchObject({
        content: 'Bonjour',
        isFromAi: true,
        model: 'gemini-3.8-flash',
      });
      expect(conversations.update).toHaveBeenCalledWith('c1', { updatedAt: expect.any(Date) });
    });

    it("refuses a conversation that is not the user's", async () => {
      conversations.findOne.mockResolvedValue(null);

      await expect(service.send('u2', { conversationId: 'c1', content: 'Salut' })).rejects.toThrow(
        NotFoundException,
      );
      expect(messages.save).not.toHaveBeenCalled();
    });

    it('sends the previous messages as history, without the current question', async () => {
      messages.find.mockResolvedValue([
        message({ id: 'old1', content: 'Bonjour', createdAt: at(1) }),
        message({ id: 'old2', content: 'Salut !', isFromAi: true, createdAt: at(2) }),
      ]);

      await collect(await service.send('u1', { conversationId: 'c1', content: 'Et ensuite ?' }));

      expect(lastRequest().prompt).toBe('Et ensuite ?');
      expect(lastRequest().history).toEqual([
        { role: 'user', text: 'Bonjour' },
        { role: 'model', text: 'Salut !' },
      ]);
    });

    it('combines user and folder instructions as system instruction', async () => {
      users.findOne.mockResolvedValue({ id: 'u1', customInstructions: 'Sois concis' });
      conversations.findOne.mockResolvedValue(
        conversation({ folder: { name: 'Anglais', instructions: 'Réponds en anglais' } as never }),
      );

      await collect(await service.send('u1', { conversationId: 'c1', content: 'Salut' }));

      expect(lastRequest().systemInstruction).toContain('Sois concis');
      expect(lastRequest().systemInstruction).toContain('Réponds en anglais');
    });

    it("uses the requested model, otherwise the user's preferred model", async () => {
      users.findOne.mockResolvedValue({ id: 'u1', preferredModel: 'gemini-pro-latest' });

      await collect(await service.send('u1', { conversationId: 'c1', content: 'A' }));
      expect(ai.resolveModel).toHaveBeenLastCalledWith('gemini-pro-latest');

      await collect(
        await service.send('u1', {
          conversationId: 'c1',
          content: 'B',
          model: 'gemini-flash-lite-latest',
        }),
      );
      expect(ai.resolveModel).toHaveBeenLastCalledWith('gemini-flash-lite-latest');
    });

    it('links the attached files and sends them to the AI', async () => {
      const file = { name: 'a.png', mimeType: 'image/png', data: Buffer.from('x') };
      attachments.findForAi.mockResolvedValue([file]);

      await collect(
        await service.send('u1', {
          conversationId: 'c1',
          content: 'Regarde',
          attachmentIds: ['a1'],
        }),
      );

      expect(attachments.linkToMessage).toHaveBeenCalledWith(['a1'], 'u1', saved[0].id);
      expect(lastRequest().attachments).toEqual([file]);
    });

    it('removes the question if its files cannot be attached', async () => {
      attachments.linkToMessage.mockRejectedValue(new BadRequestException('Fichier introuvable'));

      await expect(
        service.send('u1', { conversationId: 'c1', content: 'Regarde', attachmentIds: ['a9'] }),
      ).rejects.toThrow(BadRequestException);
      expect(messages.delete).toHaveBeenCalledWith(saved[0].id);
    });

    it('keeps the partial answer when the user stops the generation', async () => {
      const controller = new AbortController();
      ai.streamResponse.mockImplementation(async function* () {
        yield 'Début de réponse';
        controller.abort();
        throw new Error('aborted');
      });

      const events = await collect(
        await service.send('u1', { conversationId: 'c1', content: 'Long' }, controller.signal),
      );

      expect(saved[1]).toMatchObject({ content: 'Début de réponse', isFromAi: true });
      expect(events.at(-1)).toMatchObject({ type: 'done' });
      expect(ai.generateTitle).not.toHaveBeenCalled();
    });

    it('reports an AI failure without saving an empty answer', async () => {
      ai.streamResponse.mockImplementation(async function* () {
        yield* [];
        throw new Error('Gemini indisponible');
      });

      const events = await collect(
        await service.send('u1', { conversationId: 'c1', content: 'A' }),
      );

      expect(events.at(-1)).toEqual({
        type: 'error',
        message: expect.stringContaining('réessayer'),
      });
      expect(saved).toHaveLength(1);
    });
  });

  describe('automatic title', () => {
    it('names the conversation after its first answer', async () => {
      ai.generateTitle.mockResolvedValue('Salutations');

      const events = await collect(
        await service.send('u1', { conversationId: 'c1', content: 'Salut' }),
      );

      expect(ai.generateTitle).toHaveBeenCalledWith('Salut', 'Bonjour');
      expect(conversations.update).toHaveBeenCalledWith('c1', {
        name: 'Salutations',
        titleLocked: true,
      });
      expect(events.at(-1)).toEqual({ type: 'title', conversationId: 'c1', name: 'Salutations' });
    });

    it('keeps a title chosen by the user', async () => {
      conversations.findOne.mockResolvedValue(conversation({ titleLocked: true }));

      await collect(await service.send('u1', { conversationId: 'c1', content: 'Salut' }));

      expect(ai.generateTitle).not.toHaveBeenCalled();
    });

    it('does not rename after later answers', async () => {
      messages.count.mockResolvedValue(3);

      await collect(await service.send('u1', { conversationId: 'c1', content: 'Encore' }));

      expect(ai.generateTitle).not.toHaveBeenCalled();
    });
  });

  describe('regenerate', () => {
    it('replaces the last answer with a new one', async () => {
      const question = message({ id: 'q', content: 'Question', createdAt: at(1) });
      const oldAnswer = message({ id: 'r', content: 'Vieille', isFromAi: true, createdAt: at(2) });
      messages.find.mockResolvedValueOnce([question, oldAnswer]).mockResolvedValue([]);

      const events = await collect(await service.regenerate('u1', 'c1'));

      expect(messages.remove).toHaveBeenCalledWith([oldAnswer]);
      expect(lastRequest().prompt).toBe('Question');
      expect(events.map((event) => event.type)).toEqual(['delta', 'delta', 'done']);
    });

    it('answers a question left without answer (after an error)', async () => {
      messages.find
        .mockResolvedValueOnce([message({ id: 'q', content: 'Sans réponse', createdAt: at(1) })])
        .mockResolvedValue([]);

      await collect(await service.regenerate('u1', 'c1'));

      expect(messages.remove).not.toHaveBeenCalled();
      expect(lastRequest().prompt).toBe('Sans réponse');
    });

    it('refuses an empty conversation', async () => {
      messages.find.mockResolvedValue([]);

      await expect(service.regenerate('u1', 'c1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('edit', () => {
    it('updates the question, drops what followed and answers again', async () => {
      const question = message({ id: 'q', content: 'Avant', createdAt: at(1) });
      const later = [message({ id: 'r', isFromAi: true, createdAt: at(2) })];
      messages.findOne.mockResolvedValueOnce({ ...question, conversation: conversation() });
      messages.find.mockResolvedValueOnce(later).mockResolvedValue([]);

      const events = await collect(await service.edit('u1', 'q', { content: 'Après' }));

      expect(messages.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'q', content: 'Après' }),
      );
      expect(messages.remove).toHaveBeenCalledWith(later);
      // PostgreSQL stocke les dates à la microseconde, JavaScript à la milliseconde :
      // sans exclure la question elle-même, elle serait comptée parmi les messages suivants
      expect(messages.find).toHaveBeenCalledWith({
        where: { conversationId: 'c1', createdAt: expect.anything(), id: expect.anything() },
      });
      expect(lastRequest().prompt).toBe('Après');
      expect(events[0]).toMatchObject({ type: 'user' });
    });

    it('refuses to edit an AI answer', async () => {
      messages.findOne.mockResolvedValueOnce(
        message({ id: 'r', isFromAi: true, conversation: conversation() }),
      );

      await expect(service.edit('u1', 'r', { content: 'X' })).rejects.toThrow(BadRequestException);
    });

    it("refuses to edit someone else's message", async () => {
      messages.findOne.mockResolvedValueOnce(
        message({ id: 'q', conversation: conversation({ userId: 'u9' }) }),
      );

      await expect(service.edit('u1', 'q', { content: 'X' })).rejects.toThrow(NotFoundException);
    });
  });
});
