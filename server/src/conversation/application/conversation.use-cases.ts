import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Page, PaginationDto } from '../../common/pagination.dto';
import { GetOwnedFolder } from '../../folder/application/folder.use-cases';
import { Conversation, type ConversationChanges } from '../domain/conversation';
import {
  CONVERSATION_REPOSITORY,
  type ConversationRepository,
} from '../domain/conversation.repository';
import {
  CONVERSATION_TRANSCRIPT,
  type ConversationTranscript,
  type TranscriptEntry,
} from '../domain/conversation-transcript';

@Injectable()
export class GetConversation {
  constructor(
    @Inject(CONVERSATION_REPOSITORY) private readonly conversations: ConversationRepository,
  ) {}

  async execute(id: string): Promise<Conversation> {
    const conversation = await this.conversations.findById(id);
    if (!conversation) throw new NotFoundException(`Conversation #${id} not found`);
    return conversation;
  }
}

@Injectable()
export class GetOwnedConversation {
  constructor(private readonly get: GetConversation) {}

  async execute(id: string, userId: string): Promise<Conversation> {
    const conversation = await this.get.execute(id);
    if (!conversation.belongsTo(userId)) {
      throw new NotFoundException('Conversation introuvable');
    }
    return conversation;
  }
}

@Injectable()
export class GetReadableConversation {
  constructor(private readonly get: GetConversation) {}

  async execute(id: string, userId: string | undefined): Promise<Conversation> {
    const conversation = await this.get.execute(id);
    if (!conversation.isReadableBy(userId)) {
      throw new BadRequestException('Access denied to this conversation');
    }
    return conversation;
  }
}

@Injectable()
export class StartConversation {
  constructor(
    @Inject(CONVERSATION_REPOSITORY) private readonly conversations: ConversationRepository,
    private readonly ownedFolder: GetOwnedFolder,
  ) {}

  async execute(
    userId: string,
    input: { name: string; isPublic?: boolean; folderId?: string | null },
  ): Promise<Conversation> {
    if (input.folderId) await this.ownedFolder.execute(input.folderId, userId);
    return this.conversations.save(Conversation.start({ ...input, userId }));
  }
}

@Injectable()
export class ListConversations {
  constructor(
    @Inject(CONVERSATION_REPOSITORY) private readonly conversations: ConversationRepository,
  ) {}

  execute(
    userId: string,
    { archived = false, ...pagination }: { archived?: boolean } & PaginationDto = {},
  ): Promise<Page<Conversation>> {
    return this.conversations.listForUser(userId, { archived }, pagination);
  }
}

@Injectable()
export class ListSavedConversations {
  constructor(
    @Inject(CONVERSATION_REPOSITORY) private readonly conversations: ConversationRepository,
  ) {}

  execute(userId: string, pagination: PaginationDto = {}): Promise<Page<Conversation>> {
    return this.conversations.listSavedByUser(userId, pagination);
  }
}

@Injectable()
export class SearchConversations {
  constructor(
    @Inject(CONVERSATION_REPOSITORY) private readonly conversations: ConversationRepository,
  ) {}

  execute(
    userId: string,
    keyword: string,
    pagination: PaginationDto = {},
  ): Promise<Page<Conversation>> {
    return this.conversations.search(userId, keyword, pagination);
  }
}

@Injectable()
export class UpdateConversation {
  constructor(
    @Inject(CONVERSATION_REPOSITORY) private readonly conversations: ConversationRepository,
    private readonly owned: GetOwnedConversation,
    private readonly ownedFolder: GetOwnedFolder,
  ) {}

  async execute(id: string, userId: string, changes: ConversationChanges): Promise<Conversation> {
    const conversation = await this.owned.execute(id, userId);
    if (changes.folderId) await this.ownedFolder.execute(changes.folderId, userId);
    conversation.apply(changes);
    return this.conversations.save(conversation);
  }
}

@Injectable()
export class DeleteConversation {
  constructor(
    @Inject(CONVERSATION_REPOSITORY) private readonly conversations: ConversationRepository,
    private readonly owned: GetOwnedConversation,
  ) {}

  async execute(id: string, userId: string): Promise<void> {
    const conversation = await this.owned.execute(id, userId);
    await this.conversations.remove(conversation.id);
  }
}

@Injectable()
export class ShareConversation {
  constructor(
    @Inject(CONVERSATION_REPOSITORY) private readonly conversations: ConversationRepository,
    private readonly owned: GetOwnedConversation,
  ) {}

  async execute(id: string, userId: string, expiresAt?: string): Promise<{ shareLink: string }> {
    const conversation = await this.owned.execute(id, userId);
    conversation.share(expiresAt);
    const saved = await this.conversations.save(conversation);
    return { shareLink: saved.shareLink };
  }
}

@Injectable()
export class RevokeShare {
  constructor(
    @Inject(CONVERSATION_REPOSITORY) private readonly conversations: ConversationRepository,
    private readonly owned: GetOwnedConversation,
  ) {}

  async execute(id: string, userId: string): Promise<void> {
    const conversation = await this.owned.execute(id, userId);
    conversation.revokeShare();
    await this.conversations.save(conversation);
  }
}

@Injectable()
export class OpenSharedConversation {
  constructor(
    @Inject(CONVERSATION_REPOSITORY) private readonly conversations: ConversationRepository,
    @Inject(CONVERSATION_TRANSCRIPT) private readonly transcript: ConversationTranscript,
  ) {}

  async execute(shareLink: string): Promise<{
    conversation: Conversation;
    ownerPseudo: string;
    messages: TranscriptEntry[];
  }> {
    const conversation = await this.conversations.findByShareLink(shareLink);
    if (!conversation) throw new NotFoundException('Shared conversation not found');
    if (!conversation.isShared()) throw new BadRequestException('This share link has expired');

    const [ownerPseudo, messages] = await Promise.all([
      this.conversations.ownerPseudoOf(conversation.id),
      this.transcript.read(conversation.id),
    ]);
    return { conversation, ownerPseudo: ownerPseudo ?? '', messages };
  }
}

@Injectable()
export class SaveSharedConversation {
  constructor(
    @Inject(CONVERSATION_REPOSITORY) private readonly conversations: ConversationRepository,
    @Inject(CONVERSATION_TRANSCRIPT) private readonly transcript: ConversationTranscript,
  ) {}

  async execute(
    userId: string,
    input: { conversationId: string; shareLink: string; newName?: string },
  ): Promise<Conversation> {
    const shared = await this.conversations.findByShareLink(input.shareLink);
    if (!shared || shared.id !== input.conversationId) {
      throw new BadRequestException('Invalid shared conversation or share link');
    }
    if (!shared.isShared()) throw new BadRequestException('This share link has expired');

    const copy = await this.conversations.save(shared.copyFor(userId, input.newName));
    await this.transcript.copy(shared.id, copy.id);
    return copy;
  }
}

@Injectable()
export class TitleConversation {
  constructor(
    @Inject(CONVERSATION_REPOSITORY) private readonly conversations: ConversationRepository,
  ) {}

  async execute(conversation: Conversation, name: string): Promise<string> {
    conversation.titleAutomatically(name);
    await this.conversations.save(conversation);
    return conversation.name;
  }
}

@Injectable()
export class TouchConversation {
  constructor(
    @Inject(CONVERSATION_REPOSITORY) private readonly conversations: ConversationRepository,
  ) {}

  execute(id: string): Promise<void> {
    return this.conversations.touch(id);
  }
}

@Injectable()
export class GetFolderGuidance {
  constructor(
    @Inject(CONVERSATION_REPOSITORY) private readonly conversations: ConversationRepository,
  ) {}

  execute(conversationId: string) {
    return this.conversations.folderInstructionsOf(conversationId);
  }
}
