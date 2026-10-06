import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { toPage } from '../../common/pagination.dto';
import { GetOwnedFolder } from '../../folder/application/folder.use-cases';
import { Conversation } from '../domain/conversation';
import { CONVERSATION_REPOSITORY } from '../domain/conversation.repository';
import { CONVERSATION_TRANSCRIPT } from '../domain/conversation-transcript';
import {
  DeleteConversation,
  GetConversation,
  GetOwnedConversation,
  GetReadableConversation,
  ListConversations,
  OpenSharedConversation,
  RevokeShare,
  SaveSharedConversation,
  ShareConversation,
  StartConversation,
  TitleConversation,
  UpdateConversation,
} from './conversation.use-cases';

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

describe('Conversation use cases', () => {
  const conversations = {
    findById: jest.fn(),
    findByShareLink: jest.fn(),
    listForUser: jest.fn(),
    listSavedByUser: jest.fn(),
    search: jest.fn(),
    ownerPseudoOf: jest.fn(),
    folderInstructionsOf: jest.fn(),
    save: jest.fn((saved: Conversation) => Promise.resolve(saved)),
    touch: jest.fn(),
    remove: jest.fn(),
  };
  const transcript = { read: jest.fn(), copy: jest.fn() };
  const ownedFolder = { execute: jest.fn() };

  let start: StartConversation;
  let list: ListConversations;
  let owned: GetOwnedConversation;
  let readable: GetReadableConversation;
  let update: UpdateConversation;
  let remove: DeleteConversation;
  let share: ShareConversation;
  let revoke: RevokeShare;
  let open: OpenSharedConversation;
  let saveShared: SaveSharedConversation;
  let title: TitleConversation;

  beforeEach(async () => {
    jest.clearAllMocks();
    conversations.findById.mockResolvedValue(conversation());
    conversations.ownerPseudoOf.mockResolvedValue('alice');
    transcript.read.mockResolvedValue([]);

    const module = await Test.createTestingModule({
      providers: [
        GetConversation,
        GetOwnedConversation,
        GetReadableConversation,
        StartConversation,
        ListConversations,
        UpdateConversation,
        DeleteConversation,
        ShareConversation,
        RevokeShare,
        OpenSharedConversation,
        SaveSharedConversation,
        TitleConversation,
        { provide: CONVERSATION_REPOSITORY, useValue: conversations },
        { provide: CONVERSATION_TRANSCRIPT, useValue: transcript },
        { provide: GetOwnedFolder, useValue: ownedFolder },
      ],
    }).compile();

    start = module.get(StartConversation);
    list = module.get(ListConversations);
    owned = module.get(GetOwnedConversation);
    readable = module.get(GetReadableConversation);
    update = module.get(UpdateConversation);
    remove = module.get(DeleteConversation);
    share = module.get(ShareConversation);
    revoke = module.get(RevokeShare);
    open = module.get(OpenSharedConversation);
    saveShared = module.get(SaveSharedConversation);
    title = module.get(TitleConversation);
  });

  describe('StartConversation', () => {
    it('checks the folder belongs to the user before creating anything', async () => {
      ownedFolder.execute.mockRejectedValue(new NotFoundException());

      await expect(start.execute('u1', { name: 'NestJS', folderId: 'f9' })).rejects.toThrow(
        NotFoundException,
      );
      expect(conversations.save).not.toHaveBeenCalled();
    });

    it('never asks about a folder when none is given', async () => {
      await start.execute('u1', { name: 'NestJS' });

      expect(ownedFolder.execute).not.toHaveBeenCalled();
    });
  });

  describe('ListConversations', () => {
    it('hides archived conversations by default', async () => {
      conversations.listForUser.mockResolvedValue(toPage([], 0));

      await list.execute('u1');

      expect(conversations.listForUser).toHaveBeenCalledWith('u1', { archived: false }, {});
    });

    it('lists the archive when asked', async () => {
      conversations.listForUser.mockResolvedValue(toPage([], 0));

      await list.execute('u1', { archived: true, limit: 10 });

      expect(conversations.listForUser).toHaveBeenCalledWith(
        'u1',
        { archived: true },
        { limit: 10 },
      );
    });
  });

  describe('GetOwnedConversation', () => {
    it("hides someone else's conversation behind a 404", async () => {
      await expect(owned.execute('c1', 'u2')).rejects.toThrow(NotFoundException);
    });
  });

  describe('GetReadableConversation', () => {
    it('refuses a private conversation to a stranger', async () => {
      await expect(readable.execute('c1', 'u2')).rejects.toThrow(BadRequestException);
    });

    it('opens a shared conversation to a stranger', async () => {
      conversations.findById.mockResolvedValue(conversation({ shareLink: 'abc' }));

      await expect(readable.execute('c1', 'u2')).resolves.toMatchObject({ id: 'c1' });
    });
  });

  describe('UpdateConversation', () => {
    it('refuses to move a conversation into a folder the user does not own', async () => {
      ownedFolder.execute.mockRejectedValue(new NotFoundException());

      await expect(update.execute('c1', 'u1', { folderId: 'f9' })).rejects.toThrow(
        NotFoundException,
      );
      expect(conversations.save).not.toHaveBeenCalled();
    });

    it('never checks a folder when the conversation leaves it', async () => {
      await update.execute('c1', 'u1', { folderId: null });

      expect(ownedFolder.execute).not.toHaveBeenCalled();
    });
  });

  describe('DeleteConversation', () => {
    it("refuses to delete someone else's conversation", async () => {
      await expect(remove.execute('c1', 'u2')).rejects.toThrow(NotFoundException);
      expect(conversations.remove).not.toHaveBeenCalled();
    });
  });

  describe('ShareConversation', () => {
    it('returns the generated link', async () => {
      const { shareLink } = await share.execute('c1', 'u1');

      expect(shareLink).toMatch(/^[0-9a-f]{16}$/);
    });

    it('keeps an existing link when sharing again', async () => {
      conversations.findById.mockResolvedValue(conversation({ shareLink: 'abc' }));

      await expect(share.execute('c1', 'u1')).resolves.toEqual({ shareLink: 'abc' });
    });
  });

  describe('RevokeShare', () => {
    it('clears the link on the saved conversation', async () => {
      conversations.findById.mockResolvedValue(conversation({ shareLink: 'abc' }));

      await revoke.execute('c1', 'u1');

      expect((conversations.save.mock.calls[0]![0] as Conversation).shareLink).toBeNull();
    });
  });

  describe('OpenSharedConversation', () => {
    it('reports an unknown link', async () => {
      conversations.findByShareLink.mockResolvedValue(null);

      await expect(open.execute('absent')).rejects.toThrow(NotFoundException);
    });

    it('refuses an expired link', async () => {
      conversations.findByShareLink.mockResolvedValue(
        conversation({ shareLink: 'abc', shareExpiresAt: new Date(Date.now() - 1000) }),
      );

      await expect(open.execute('abc')).rejects.toThrow(/expired/);
    });

    it('returns the transcript and the author', async () => {
      conversations.findByShareLink.mockResolvedValue(conversation({ shareLink: 'abc' }));
      transcript.read.mockResolvedValue([{ id: 'm1', content: 'Bonjour' }]);

      const result = await open.execute('abc');

      expect(result.ownerPseudo).toBe('alice');
      expect(result.messages).toHaveLength(1);
    });
  });

  describe('SaveSharedConversation', () => {
    it('refuses a link that points at another conversation', async () => {
      conversations.findByShareLink.mockResolvedValue(conversation({ shareLink: 'abc' }));

      await expect(
        saveShared.execute('u2', { conversationId: 'autre', shareLink: 'abc' }),
      ).rejects.toThrow(BadRequestException);
      expect(transcript.copy).not.toHaveBeenCalled();
    });

    it('refuses to copy from an expired link', async () => {
      conversations.findByShareLink.mockResolvedValue(
        conversation({ shareLink: 'abc', shareExpiresAt: new Date(Date.now() - 1000) }),
      );

      await expect(
        saveShared.execute('u2', { conversationId: 'c1', shareLink: 'abc' }),
      ).rejects.toThrow(/expired/);
    });

    it('copies the conversation then its messages', async () => {
      conversations.findByShareLink.mockResolvedValue(conversation({ shareLink: 'abc' }));
      conversations.save.mockResolvedValue(conversation({ id: 'c2', userId: 'u2' }));

      const copy = await saveShared.execute('u2', { conversationId: 'c1', shareLink: 'abc' });

      expect(copy.id).toBe('c2');
      expect(transcript.copy).toHaveBeenCalledWith('c1', 'c2');
    });
  });

  describe('TitleConversation', () => {
    it('locks the title so it is never replaced again', async () => {
      const existing = conversation();

      await title.execute(existing, 'Un vrai titre');

      expect(existing.name).toBe('Un vrai titre');
      expect(existing.titleLocked).toBe(true);
    });
  });
});
