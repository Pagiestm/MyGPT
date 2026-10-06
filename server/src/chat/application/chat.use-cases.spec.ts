import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  LinkAttachmentsToMessage,
  ListAttachmentsForAi,
} from '../../attachment/application/attachment.use-cases';
import {
  GetFolderGuidance,
  GetOwnedConversation,
  TitleConversation,
  TouchConversation,
} from '../../conversation/application/conversation.use-cases';
import { Conversation } from '../../conversation/domain/conversation';
import { RetrieveContext } from '../../knowledge/application/knowledge.use-cases';
import { Message } from '../../message/domain/message';
import { MESSAGE_REPOSITORY } from '../../message/domain/message.repository';
import { GetUser } from '../../user/application/user.use-cases';
import { User } from '../../user/domain/user';
import { UserRole } from '../../user/domain/user-role.enum';
import {
  assertBrowserModel,
  BuildExchangeContext,
  PrepareEdit,
  PrepareRegenerate,
  PrepareSend,
  SaveReply,
  SaveTitle,
} from './chat.use-cases';

const MODEL = 'webgpu:Qwen3.5-2B-q4f16_1-MLC';

const conversation = (overrides: Partial<Parameters<typeof Conversation.rehydrate>[0]> = {}) =>
  Conversation.rehydrate({
    id: 'c1',
    name: 'NestJS',
    userId: 'u1',
    sharedFrom: null,
    isPublic: false,
    shareLink: null,
    shareExpiresAt: null,
    pinned: false,
    archived: false,
    titleLocked: false,
    folderId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

const stored = (overrides: Partial<Parameters<typeof Message.rehydrate>[0]> = {}) =>
  Message.rehydrate({
    id: 'm1',
    conversationId: 'c1',
    content: 'Bonjour',
    isFromAi: false,
    model: null,
    attachments: [],
    createdAt: new Date('2026-01-01T10:00:00Z'),
    updatedAt: new Date('2026-01-01T10:00:00Z'),
    ...overrides,
  });

const account = (overrides: Partial<Parameters<typeof User.rehydrate>[0]> = {}) =>
  User.rehydrate({
    id: 'u1',
    email: 'alice@example.com',
    pseudo: 'alice',
    passwordHash: 'hashed',
    googleId: null,
    role: UserRole.User,
    customInstructions: null,
    preferredModel: null,
    createdAt: new Date(),
    ...overrides,
  });

describe('Chat use cases', () => {
  const messages = {
    findById: jest.fn(),
    findThread: jest.fn(),
    findBefore: jest.fn(),
    findAfter: jest.fn(),
    countAnswers: jest.fn(),
    save: jest.fn((saved: Message) => Promise.resolve(saved)),
    remove: jest.fn(),
  };
  const owned = { execute: jest.fn() };
  const link = { execute: jest.fn() };
  const attachments = { execute: jest.fn() };
  const getUser = { execute: jest.fn() };
  const guidance = { execute: jest.fn() };
  const knowledge = { execute: jest.fn() };
  const touch = { execute: jest.fn() };
  const title = { execute: jest.fn() };

  let send: PrepareSend;
  let regenerate: PrepareRegenerate;
  let edit: PrepareEdit;
  let context: BuildExchangeContext;
  let reply: SaveReply;
  let saveTitle: SaveTitle;

  beforeEach(async () => {
    jest.clearAllMocks();
    messages.save.mockImplementation((saved: Message) => Promise.resolve(saved));
    owned.execute.mockResolvedValue(conversation());
    messages.findById.mockResolvedValue(stored());
    messages.findBefore.mockResolvedValue([]);
    messages.findAfter.mockResolvedValue([]);
    messages.countAnswers.mockResolvedValue(1);
    attachments.execute.mockResolvedValue([]);
    getUser.execute.mockResolvedValue(account());
    guidance.execute.mockResolvedValue(null);
    knowledge.execute.mockResolvedValue(null);
    title.execute.mockResolvedValue('Un titre');

    const module = await Test.createTestingModule({
      providers: [
        PrepareSend,
        PrepareRegenerate,
        PrepareEdit,
        BuildExchangeContext,
        SaveReply,
        SaveTitle,
        { provide: MESSAGE_REPOSITORY, useValue: messages },
        { provide: GetOwnedConversation, useValue: owned },
        { provide: LinkAttachmentsToMessage, useValue: link },
        { provide: ListAttachmentsForAi, useValue: attachments },
        { provide: GetUser, useValue: getUser },
        { provide: GetFolderGuidance, useValue: guidance },
        { provide: RetrieveContext, useValue: knowledge },
        { provide: TouchConversation, useValue: touch },
        { provide: TitleConversation, useValue: title },
      ],
    }).compile();

    send = module.get(PrepareSend);
    regenerate = module.get(PrepareRegenerate);
    edit = module.get(PrepareEdit);
    context = module.get(BuildExchangeContext);
    reply = module.get(SaveReply);
    saveTitle = module.get(SaveTitle);
  });

  describe('assertBrowserModel', () => {
    it('accepts a model that runs in the browser', () => {
      expect(assertBrowserModel(MODEL)).toBe(MODEL);
    });

    it('refuses anything that would run elsewhere', () => {
      expect(() => assertBrowserModel('gemini-3.8-flash')).toThrow(BadRequestException);
      expect(() => assertBrowserModel('')).toThrow(BadRequestException);
    });
  });

  describe('PrepareSend', () => {
    it('records the question for the owner of the conversation', async () => {
      const { question } = await send.execute('u1', { conversationId: 'c1', content: 'Salut' });

      expect(question.isFromAi).toBe(false);
      expect(link.execute).not.toHaveBeenCalled();
    });

    it('removes the question again when its files cannot be linked', async () => {
      link.execute.mockRejectedValue(new BadRequestException('Fichier introuvable'));
      messages.save.mockResolvedValue(stored({ id: 'm9' }));

      await expect(
        send.execute('u1', { conversationId: 'c1', content: 'Salut', attachmentIds: ['a1'] }),
      ).rejects.toThrow(BadRequestException);
      expect(messages.remove).toHaveBeenCalledWith(['m9']);
    });
  });

  describe('PrepareRegenerate', () => {
    it('drops the last answer and replays the question before it', async () => {
      const question = stored({ id: 'm1' });
      const answer = stored({ id: 'm2', isFromAi: true, model: MODEL });
      messages.findThread.mockResolvedValue([question, answer]);

      const result = await regenerate.execute('u1', 'c1');

      expect(result.question.id).toBe('m1');
      expect(messages.remove).toHaveBeenCalledWith(['m2']);
    });

    it('replays the last question when no answer followed it', async () => {
      messages.findThread.mockResolvedValue([stored({ id: 'm1' })]);

      const result = await regenerate.execute('u1', 'c1');

      expect(result.question.id).toBe('m1');
      expect(messages.remove).not.toHaveBeenCalled();
    });

    it('refuses to regenerate an empty conversation', async () => {
      messages.findThread.mockResolvedValue([]);

      await expect(regenerate.execute('u1', 'c1')).rejects.toThrow('Rien à régénérer');
    });
  });

  describe('PrepareEdit', () => {
    it('reports an unknown message', async () => {
      messages.findById.mockResolvedValue(null);

      await expect(edit.execute('u1', 'absent', 'Autre')).rejects.toThrow(NotFoundException);
    });

    it("hides someone else's message behind a 404", async () => {
      owned.execute.mockRejectedValue(new NotFoundException());

      await expect(edit.execute('u2', 'm1', 'Autre')).rejects.toThrow(NotFoundException);
    });

    it('refuses to edit an answer from the AI', async () => {
      messages.findById.mockResolvedValue(stored({ isFromAi: true, model: MODEL }));

      await expect(edit.execute('u1', 'm1', 'Autre')).rejects.toThrow(
        "Une réponse de l'IA ne peut pas être modifiée",
      );
    });

    it('erases everything that came after the edited question', async () => {
      messages.findAfter.mockResolvedValue([stored({ id: 'm2' }), stored({ id: 'm3' })]);

      const result = await edit.execute('u1', 'm1', 'Et en Python ?');

      expect(result.question.content).toBe('Et en Python ?');
      expect(messages.remove).toHaveBeenCalledWith(['m2', 'm3']);
    });
  });

  describe('BuildExchangeContext', () => {
    it('leaves the prompt without instructions when there are none', async () => {
      const result = await context.execute('u1', conversation(), stored());

      expect(result.systemInstruction).toBeUndefined();
    });

    it("stacks the user's instructions, the folder's and the documents", async () => {
      getUser.execute.mockResolvedValue(account({ customInstructions: 'Sois concis' }));
      guidance.execute.mockResolvedValue({ name: 'Cours', instructions: 'Comme à un étudiant' });
      knowledge.execute.mockResolvedValue('Extraits');

      const result = await context.execute('u1', conversation({ folderId: 'f1' }), stored(), [0.1]);

      expect(result.systemInstruction).toContain('Sois concis');
      expect(result.systemInstruction).toContain('Cours');
      expect(result.systemInstruction).toContain('Extraits');
    });

    it('never searches the documents without a question vector', async () => {
      await context.execute('u1', conversation(), stored());

      expect(knowledge.execute).not.toHaveBeenCalled();
    });

    it('scopes the document search to the folder of the conversation', async () => {
      await context.execute('u1', conversation({ folderId: 'f1' }), stored(), [0.1]);

      expect(knowledge.execute).toHaveBeenCalledWith('u1', 'f1', [0.1]);
    });

    it('turns the earlier messages into the turns the model expects', async () => {
      messages.findBefore.mockResolvedValue([
        stored({ id: 'm0', content: 'Salut' }),
        stored({ id: 'm0b', content: 'Bonjour', isFromAi: true, model: MODEL }),
      ]);

      const result = await context.execute('u1', conversation(), stored());

      expect(result.history).toEqual([
        { role: 'user', text: 'Salut' },
        { role: 'model', text: 'Bonjour' },
      ]);
    });
  });

  describe('SaveReply', () => {
    it('refuses a model that does not run in the browser', async () => {
      await expect(reply.execute('u1', 'c1', 'Réponse', 'gemini-3.8-flash')).rejects.toThrow(
        BadRequestException,
      );
      expect(messages.save).not.toHaveBeenCalled();
    });

    it('asks for a title after the very first answer', async () => {
      const result = await reply.execute('u1', 'c1', 'Réponse', MODEL);

      expect(result.needsTitle).toBe(true);
      expect(touch.execute).toHaveBeenCalledWith('c1');
    });

    it('never asks for a title again later in the conversation', async () => {
      messages.countAnswers.mockResolvedValue(2);

      await expect(reply.execute('u1', 'c1', 'Réponse', MODEL)).resolves.toMatchObject({
        needsTitle: false,
      });
    });

    it('never replaces a title the user chose', async () => {
      owned.execute.mockResolvedValue(conversation({ titleLocked: true }));

      await expect(reply.execute('u1', 'c1', 'Réponse', MODEL)).resolves.toMatchObject({
        needsTitle: false,
      });
    });
  });

  describe('SaveTitle', () => {
    it('trims the title produced by the browser', async () => {
      await saveTitle.execute('u1', 'c1', '  Un titre  ');

      expect(title.execute).toHaveBeenCalledWith(expect.anything(), 'Un titre');
    });
  });
});
