import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  LinkAttachmentsToMessage,
  ListAttachmentsForAi,
} from '../../attachment/application/attachment.use-cases';
import type { Conversation } from '../../conversation/domain/conversation';
import {
  GetFolderGuidance,
  GetOwnedConversation,
  TitleConversation,
  TouchConversation,
} from '../../conversation/application/conversation.use-cases';
import { RetrieveContext } from '../../knowledge/application/knowledge.use-cases';
import { Message } from '../../message/domain/message';
import {
  MESSAGE_REPOSITORY,
  type MessageRepository,
} from '../../message/domain/message.repository';
import { GetUser } from '../../user/application/user.use-cases';
import { extractPdfText, isPdf } from '../../common/pdf/pdf-text';
import { isBrowserModel, type AiAttachment, type AiTurn } from '../domain/prompt';

async function readable(file: {
  name: string;
  mimeType: string;
  data: Buffer;
}): Promise<AiAttachment> {
  if (!isPdf(file.mimeType)) return file;

  const text = await extractPdfText(file.data).catch(() => '');
  return text.trim() ? { name: file.name, mimeType: 'text/plain', data: Buffer.from(text) } : file;
}

export interface ExchangeContext {
  question: Message;
  history: AiTurn[];
  attachments: AiAttachment[];
  systemInstruction?: string;
}

export function assertBrowserModel(model: string): string {
  if (!isBrowserModel(model)) {
    throw new BadRequestException(
      'Modèle inconnu : seuls les modèles exécutés dans le navigateur sont pris en charge',
    );
  }
  return model;
}

@Injectable()
export class PrepareSend {
  constructor(
    @Inject(MESSAGE_REPOSITORY) private readonly messages: MessageRepository,
    private readonly owned: GetOwnedConversation,
    private readonly link: LinkAttachmentsToMessage,
  ) {}

  async execute(
    userId: string,
    input: { conversationId: string; content: string; attachmentIds?: string[] },
  ): Promise<{ conversation: Conversation; question: Message }> {
    const conversation = await this.owned.execute(input.conversationId, userId);
    const question = await this.messages.save(Message.ask(conversation.id, input.content));

    if (input.attachmentIds?.length) {
      try {
        await this.link.execute(input.attachmentIds, userId, question.id);
      } catch (error) {
        await this.messages.remove([question.id]);
        throw error;
      }
    }
    return { conversation, question };
  }
}

@Injectable()
export class PrepareRegenerate {
  constructor(
    @Inject(MESSAGE_REPOSITORY) private readonly messages: MessageRepository,
    private readonly owned: GetOwnedConversation,
  ) {}

  async execute(
    userId: string,
    conversationId: string,
  ): Promise<{ conversation: Conversation; question: Message }> {
    const conversation = await this.owned.execute(conversationId, userId);
    const thread = await this.messages.findThread(conversationId);

    const last = thread.at(-1);
    const question = last?.isFromAi ? thread.at(-2) : last;
    if (!question || question.isFromAi) throw new BadRequestException('Rien à régénérer');
    if (last?.isFromAi) await this.messages.remove([last.id]);

    return { conversation, question };
  }
}

@Injectable()
export class PrepareEdit {
  constructor(
    @Inject(MESSAGE_REPOSITORY) private readonly messages: MessageRepository,
    private readonly owned: GetOwnedConversation,
  ) {}

  async execute(
    userId: string,
    messageId: string,
    content: string,
  ): Promise<{ conversation: Conversation; question: Message }> {
    const question = await this.messages.findById(messageId);
    if (!question) throw new NotFoundException('Message introuvable');

    const conversation = await this.owned.execute(question.conversationId, userId).catch(() => {
      throw new NotFoundException('Message introuvable');
    });

    question.rewrite(content);
    const edited = await this.messages.save(question);

    const following = await this.messages.findAfter(
      question.conversationId,
      question.createdAt,
      question.id,
    );
    await this.messages.remove(following.map((message) => message.id));

    return { conversation, question: edited };
  }
}

@Injectable()
export class BuildExchangeContext {
  constructor(
    @Inject(MESSAGE_REPOSITORY) private readonly messages: MessageRepository,
    private readonly getUser: GetUser,
    private readonly attachments: ListAttachmentsForAi,
    private readonly guidance: GetFolderGuidance,
    private readonly knowledge: RetrieveContext,
  ) {}

  async execute(
    userId: string,
    conversation: Conversation,
    asked: Message,
    questionEmbedding?: number[],
  ): Promise<ExchangeContext> {
    const [question, user, previous, files, folder] = await Promise.all([
      this.messages.findById(asked.id),
      this.getUser.execute(userId),
      this.messages.findBefore(asked.conversationId, asked.createdAt, asked.id),
      this.attachments.execute(asked.id),
      this.guidance.execute(conversation.id),
    ]);

    const excerpts = questionEmbedding
      ? await this.knowledge.execute(userId, conversation.folderId, questionEmbedding)
      : null;

    const parts = [
      user.customInstructions && `Consignes de l'utilisateur :\n${user.customInstructions}`,
      folder?.instructions && `Consignes du dossier « ${folder.name} » :\n${folder.instructions}`,
      excerpts,
    ].filter(Boolean);

    return {
      question: question ?? asked,
      history: previous.map((message) => message.asTurn()),
      attachments: await Promise.all(files.map((file) => readable(file))),
      systemInstruction: parts.length ? parts.join('\n\n') : undefined,
    };
  }
}

@Injectable()
export class SaveReply {
  constructor(
    @Inject(MESSAGE_REPOSITORY) private readonly messages: MessageRepository,
    private readonly owned: GetOwnedConversation,
    private readonly touch: TouchConversation,
  ) {}

  async execute(
    userId: string,
    conversationId: string,
    content: string,
    model: string,
  ): Promise<{ message: Message; needsTitle: boolean }> {
    assertBrowserModel(model);
    const conversation = await this.owned.execute(conversationId, userId);
    const message = await this.messages.save(Message.answer(conversation.id, content, model));
    await this.touch.execute(conversation.id);

    const answers = await this.messages.countAnswers(conversation.id);
    return { message, needsTitle: !conversation.titleLocked && answers === 1 };
  }
}

@Injectable()
export class SaveTitle {
  constructor(
    private readonly owned: GetOwnedConversation,
    private readonly title: TitleConversation,
  ) {}

  async execute(userId: string, conversationId: string, name: string): Promise<{ name: string }> {
    const conversation = await this.owned.execute(conversationId, userId);
    return { name: await this.title.execute(conversation, name.trim()) };
  }
}
