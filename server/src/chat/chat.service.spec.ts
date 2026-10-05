import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ChatService } from './chat.service';
import { Message } from '../message/entities/message.entity';
import { Conversation } from '../conversation/entities/conversation.entity';
import { User } from '../user/entities/user.entity';
import { AttachmentService } from '../attachment/attachment.service';
import { KnowledgeService } from '../knowledge/knowledge.service';

const at = (seconds: number) => new Date(Date.UTC(2026, 0, 1, 0, 0, seconds));

const conversation = (overrides: Partial<Conversation> = {}) =>
  ({
    id: 'c1',
    name: 'Nouvelle conversation',
    userId: 'u1',
    titleLocked: false,
    folderId: null,
    folder: null,
    ...overrides,
  }) as Conversation;

const message = (overrides: Partial<Message>) =>
  ({ conversationId: 'c1', isFromAi: false, attachments: [], ...overrides }) as Message;

const vector = Array.from({ length: 768 }, () => 0.1);

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
  const knowledge = { contextFor: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    saved = [];
    users.findOne.mockResolvedValue({ id: 'u1', customInstructions: null });
    conversations.findOne.mockResolvedValue(conversation());
    attachments.findForAi.mockResolvedValue([]);
    knowledge.contextFor.mockResolvedValue(null);
    messages.find.mockResolvedValue([]);
    messages.findOne.mockImplementation(({ where }: { where: { id: string } }) =>
      Promise.resolve(saved.find((m) => m.id === where.id) ?? null),
    );
    messages.count.mockResolvedValue(1);

    const module = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: getRepositoryToken(Message), useValue: messages },
        { provide: getRepositoryToken(Conversation), useValue: conversations },
        { provide: getRepositoryToken(User), useValue: users },
        { provide: AttachmentService, useValue: attachments },
        { provide: KnowledgeService, useValue: knowledge },
      ],
    }).compile();
    service = module.get(ChatService);
  });

  describe('prepareSend', () => {
    it('saves the question before anything else', async () => {
      const { question } = await service.prepareSend('u1', {
        conversationId: 'c1',
        content: 'Salut',
      });

      expect(question).toMatchObject({ content: 'Salut', isFromAi: false });
      expect(attachments.linkToMessage).not.toHaveBeenCalled();
    });

    it('links the attachments to the question', async () => {
      await service.prepareSend('u1', {
        conversationId: 'c1',
        content: 'Salut',
        attachmentIds: ['a1'],
      });

      expect(attachments.linkToMessage).toHaveBeenCalledWith(['a1'], 'u1', 'm10');
    });

    it('removes the question when a file is rejected', async () => {
      attachments.linkToMessage.mockRejectedValue(new BadRequestException('Fichier introuvable'));

      await expect(
        service.prepareSend('u1', {
          conversationId: 'c1',
          content: 'Salut',
          attachmentIds: ['a1'],
        }),
      ).rejects.toThrow(BadRequestException);
      expect(messages.delete).toHaveBeenCalledWith('m10');
    });

    it('refuses a conversation that belongs to someone else', async () => {
      conversations.findOne.mockResolvedValue(null);

      await expect(
        service.prepareSend('u1', { conversationId: 'c1', content: 'Salut' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('prepareRegenerate', () => {
    it('drops the last answer and replays the question before it', async () => {
      const question = message({ id: 'm1', content: 'Salut', createdAt: at(1) });
      const answer = message({ id: 'm2', isFromAi: true, createdAt: at(2) });
      messages.find.mockResolvedValue([question, answer]);

      const result = await service.prepareRegenerate('u1', 'c1');

      expect(messages.remove).toHaveBeenCalledWith([answer]);
      expect(result.question).toBe(question);
    });

    it('replays the last question when no answer followed it', async () => {
      const question = message({ id: 'm1', content: 'Salut', createdAt: at(1) });
      messages.find.mockResolvedValue([question]);

      const result = await service.prepareRegenerate('u1', 'c1');

      expect(messages.remove).not.toHaveBeenCalled();
      expect(result.question).toBe(question);
    });

    it('refuses an empty conversation', async () => {
      messages.find.mockResolvedValue([]);

      await expect(service.prepareRegenerate('u1', 'c1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('prepareEdit', () => {
    it('rewrites the question and deletes everything after it', async () => {
      const question = message({
        id: 'm1',
        content: 'Salut',
        createdAt: at(1),
        conversation: conversation(),
      });
      const following = [message({ id: 'm2', isFromAi: true, createdAt: at(2) })];
      messages.findOne.mockResolvedValue(question);
      messages.find.mockResolvedValue(following);

      const result = await service.prepareEdit('u1', 'm1', { content: 'Bonjour' });

      expect(result.question.content).toBe('Bonjour');
      expect(messages.remove).toHaveBeenCalledWith(following);
    });

    it('refuses to edit an answer from the model', async () => {
      messages.findOne.mockResolvedValue(
        message({ id: 'm2', isFromAi: true, conversation: conversation() }),
      );

      await expect(service.prepareEdit('u1', 'm2', { content: 'x' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('refuses a message that belongs to someone else', async () => {
      messages.findOne.mockResolvedValue(
        message({ id: 'm1', conversation: conversation({ userId: 'u2' }) }),
      );

      await expect(service.prepareEdit('u1', 'm1', { content: 'x' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('contextFor', () => {
    const question = message({ id: 'm5', content: 'Et en Python ?', createdAt: at(50) });

    it('keeps the history in order and translates the roles', async () => {
      messages.findOne.mockResolvedValue(question);
      messages.find.mockResolvedValue([
        message({ id: 'm1', content: 'Salut', createdAt: at(1) }),
        message({ id: 'm2', content: 'Bonjour', isFromAi: true, createdAt: at(2) }),
      ]);

      const context = await service.contextFor('u1', conversation(), question);

      expect(context.history).toEqual([
        { role: 'user', text: 'Salut' },
        { role: 'model', text: 'Bonjour' },
      ]);
    });

    it("joins the user's and the folder's instructions", async () => {
      users.findOne.mockResolvedValue({ id: 'u1', customInstructions: 'Sois concis' });
      messages.findOne.mockResolvedValue(question);

      const context = await service.contextFor(
        'u1',
        conversation({ folder: { name: 'Cours', instructions: 'Explique simplement' } as never }),
        question,
      );

      expect(context.systemInstruction).toContain('Sois concis');
      expect(context.systemInstruction).toContain('Explique simplement');
    });

    it('leaves the instructions empty when there is nothing to say', async () => {
      messages.findOne.mockResolvedValue(question);

      const context = await service.contextFor('u1', conversation(), question);

      expect(context.systemInstruction).toBeUndefined();
    });

    it('searches the documents only when the browser sent a vector', async () => {
      messages.findOne.mockResolvedValue(question);
      knowledge.contextFor.mockResolvedValue('Extrait pertinent');

      const without = await service.contextFor('u1', conversation(), question);
      expect(knowledge.contextFor).not.toHaveBeenCalled();
      expect(without.systemInstruction).toBeUndefined();

      const withVector = await service.contextFor('u1', conversation(), question, vector);
      expect(knowledge.contextFor).toHaveBeenCalledWith('u1', expect.anything(), vector);
      expect(withVector.systemInstruction).toContain('Extrait pertinent');
    });
  });

  describe('saving the answer', () => {
    it('stores the reply and bumps the conversation', async () => {
      const reply = await service.saveReply('c1', 'Bonjour', 'webgpu:Llama-3.2-3B');

      expect(reply).toMatchObject({
        content: 'Bonjour',
        isFromAi: true,
        model: 'webgpu:Llama-3.2-3B',
      });
      expect(conversations.update).toHaveBeenCalledWith('c1', { updatedAt: expect.any(Date) });
    });

    it('asks for a title after the very first answer only', async () => {
      expect(await service.needsTitle(conversation())).toBe(true);

      messages.count.mockResolvedValue(2);
      expect(await service.needsTitle(conversation())).toBe(false);
    });

    it('never renames a conversation whose title is locked', async () => {
      expect(await service.needsTitle(conversation({ titleLocked: true }))).toBe(false);
      expect(messages.count).not.toHaveBeenCalled();
    });

    it('locks the title it applies', async () => {
      expect(await service.applyTitle('c1', 'Salutations')).toBe('Salutations');
      expect(conversations.update).toHaveBeenCalledWith('c1', {
        name: 'Salutations',
        titleLocked: true,
      });
    });
  });
});
