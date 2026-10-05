import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, MoreThan, Not, Repository } from 'typeorm';
import { Message } from '../message/entities/message.entity';
import { Conversation } from '../conversation/entities/conversation.entity';
import { User } from '../user/entities/user.entity';
import { AttachmentService } from '../attachment/attachment.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import type { AiAttachment, AiTurn } from './prompt';
import type { EditMessageDto, SendMessageDto } from './dto/chat.dto';

export interface ExchangeContext {
  question: Message;
  history: AiTurn[];
  attachments: AiAttachment[];
  systemInstruction?: string;
}

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message) private readonly messages: Repository<Message>,
    @InjectRepository(Conversation) private readonly conversations: Repository<Conversation>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly attachments: AttachmentService,
    private readonly knowledge: KnowledgeService,
  ) {}

  async prepareSend(userId: string, dto: SendMessageDto) {
    const conversation = await this.ownedConversation(dto.conversationId, userId);
    const question = await this.messages.save(
      this.messages.create({
        conversationId: conversation.id,
        content: dto.content,
        isFromAi: false,
      }),
    );

    if (dto.attachmentIds?.length) {
      try {
        await this.attachments.linkToMessage(dto.attachmentIds, userId, question.id);
      } catch (error) {
        await this.messages.delete(question.id);
        throw error;
      }
    }
    return { conversation, question };
  }

  async prepareRegenerate(userId: string, conversationId: string) {
    const conversation = await this.ownedConversation(conversationId, userId);
    const thread = await this.messages.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });

    const last = thread.at(-1);
    const question = last?.isFromAi ? thread.at(-2) : last;
    if (!question || question.isFromAi) throw new BadRequestException('Rien à régénérer');
    if (last?.isFromAi) await this.messages.remove([last]);

    return { conversation, question };
  }

  async prepareEdit(userId: string, messageId: string, dto: EditMessageDto) {
    const question = await this.messages.findOne({
      where: { id: messageId },
      relations: { conversation: true },
    });
    if (!question || question.conversation.userId !== userId) {
      throw new NotFoundException('Message introuvable');
    }
    if (question.isFromAi)
      throw new BadRequestException("Une réponse de l'IA ne peut pas être modifiée");

    const { conversation, ...rest } = question;
    const edited = await this.messages.save({ ...rest, content: dto.content } as Message);
    const following = await this.messages.find({
      where: {
        conversationId: question.conversationId,
        createdAt: MoreThan(question.createdAt),
        id: Not(question.id),
      },
    });
    if (following.length) await this.messages.remove(following);

    const owned = await this.ownedConversation(conversation.id, userId);
    return { conversation: owned, question: edited };
  }

  async contextFor(
    userId: string,
    conversation: Conversation,
    asked: Message,
    questionEmbedding?: number[],
  ): Promise<ExchangeContext> {
    const question =
      (await this.messages.findOne({
        where: { id: asked.id },
        relations: { attachments: true },
      })) ?? asked;

    const [user, history, attachments] = await Promise.all([
      this.users.findOne({ where: { id: userId } }),
      this.historyBefore(question),
      this.attachments.findForAi(question.id),
    ]);

    return {
      question,
      history,
      attachments,
      systemInstruction: await this.instructionsFor(user, conversation, questionEmbedding),
    };
  }

  async saveReply(conversationId: string, text: string, model: string) {
    const reply = await this.messages.save(
      this.messages.create({ conversationId, content: text, isFromAi: true, model }),
    );
    await this.conversations.update(conversationId, { updatedAt: new Date() });
    return reply;
  }

  async needsTitle(conversation: Conversation) {
    if (conversation.titleLocked) return false;
    const answers = await this.messages.count({
      where: { conversationId: conversation.id, isFromAi: true },
    });
    return answers === 1;
  }

  async applyTitle(conversationId: string, name: string) {
    await this.conversations.update(conversationId, { name, titleLocked: true });
    return name;
  }

  async ownedConversation(id: string, userId: string) {
    const conversation = await this.conversations.findOne({
      where: { id, userId },
      relations: { folder: true },
    });
    if (!conversation) throw new NotFoundException('Conversation introuvable');
    return conversation;
  }

  private async historyBefore(question: Message): Promise<AiTurn[]> {
    const previous = await this.messages.find({
      where: { conversationId: question.conversationId, createdAt: LessThan(question.createdAt) },
      order: { createdAt: 'ASC' },
    });
    return previous
      .filter((message) => message.id !== question.id)
      .map((message) => ({ role: message.isFromAi ? 'model' : 'user', text: message.content }));
  }

  private async instructionsFor(
    user: User | null,
    conversation: Conversation,
    questionEmbedding?: number[],
  ) {
    const excerpts =
      user && questionEmbedding
        ? await this.knowledge.contextFor(user.id, conversation, questionEmbedding)
        : null;
    const parts = [
      user?.customInstructions && `Consignes de l'utilisateur :\n${user.customInstructions}`,
      conversation.folder?.instructions &&
        `Consignes du dossier « ${conversation.folder.name} » :\n${conversation.folder.instructions}`,
      excerpts,
    ].filter(Boolean);
    return parts.length ? parts.join('\n\n') : undefined;
  }
}
