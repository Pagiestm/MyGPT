import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, MoreThan, Not, Repository } from 'typeorm';
import { Message } from '../message/entities/message.entity';
import { Conversation } from '../conversation/entities/conversation.entity';
import { User } from '../user/entities/user.entity';
import { AttachmentService } from '../attachment/attachment.service';
import { AI_ADAPTER, type AiTurn, type IAiAdapter } from '../infrastructure/adapters/ai-adapter';
import type { EditMessageDto, SendMessageDto } from './dto/chat.dto';

export type ChatEvent =
  | { type: 'user'; message: Message }
  | { type: 'delta'; text: string }
  | { type: 'done'; message: Message }
  | { type: 'title'; conversationId: string; name: string }
  | { type: 'error'; message: string };

const AI_ERROR = "Désolé, je n'ai pas pu générer de réponse. Vous pouvez réessayer.";

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(Message) private readonly messages: Repository<Message>,
    @InjectRepository(Conversation) private readonly conversations: Repository<Conversation>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly attachments: AttachmentService,
    @Inject(AI_ADAPTER) private readonly ai: IAiAdapter,
  ) {}

  // Les vérifications ont lieu avant le premier événement : une erreur devient une réponse HTTP classique
  async send(userId: string, dto: SendMessageDto, signal?: AbortSignal) {
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

    return this.exchange(userId, conversation, question, dto.model, signal, true);
  }

  async regenerate(userId: string, conversationId: string, model?: string, signal?: AbortSignal) {
    const conversation = await this.ownedConversation(conversationId, userId);
    const thread = await this.messages.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });

    const last = thread.at(-1);
    const question = last?.isFromAi ? thread.at(-2) : last;
    if (!question || question.isFromAi) throw new BadRequestException('Rien à régénérer');
    if (last?.isFromAi) await this.messages.remove([last]);

    return this.exchange(userId, conversation, question, model, signal, false);
  }

  async edit(userId: string, messageId: string, dto: EditMessageDto, signal?: AbortSignal) {
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
    // Dates à la microseconde en base, à la milliseconde en JS : la question doit être exclue explicitement
    const following = await this.messages.find({
      where: {
        conversationId: question.conversationId,
        createdAt: MoreThan(question.createdAt),
        id: Not(question.id),
      },
    });
    if (following.length) await this.messages.remove(following);

    const owned = await this.ownedConversation(conversation.id, userId);
    return this.exchange(userId, owned, edited, dto.model, signal, true);
  }

  private async *exchange(
    userId: string,
    conversation: Conversation,
    asked: Message,
    requestedModel: string | undefined,
    signal: AbortSignal | undefined,
    announceQuestion: boolean,
  ): AsyncGenerator<ChatEvent> {
    const question =
      (await this.messages.findOne({
        where: { id: asked.id },
        relations: { attachments: true },
      })) ?? asked;
    if (announceQuestion) yield { type: 'user', message: question };

    const user = await this.users.findOne({ where: { id: userId } });
    const model = this.ai.resolveModel(requestedModel ?? user?.preferredModel);
    const [history, files] = await Promise.all([
      this.historyBefore(question),
      this.attachments.findForAi(question.id),
    ]);

    let text = '';
    let failed = false;
    try {
      const stream = this.ai.streamResponse({
        prompt: question.content,
        history,
        attachments: files,
        model,
        systemInstruction: this.instructionsFor(user, conversation),
        signal,
      });
      for await (const chunk of stream) {
        text += chunk;
        yield { type: 'delta', text: chunk };
      }
    } catch (error) {
      if (!signal?.aborted) {
        this.logger.error(`Réponse de l'IA impossible : ${(error as Error).message}`);
        failed = true;
      }
    }

    // Arrêtée par l'utilisateur ou interrompue : on garde ce qui a déjà été écrit
    if (text) {
      const reply = await this.messages.save(
        this.messages.create({
          conversationId: conversation.id,
          content: text,
          isFromAi: true,
          model,
        }),
      );
      await this.conversations.update(conversation.id, { updatedAt: new Date() });
      yield { type: 'done', message: reply };
    }
    if (failed) {
      yield { type: 'error', message: AI_ERROR };
      return;
    }

    if (text && !signal?.aborted && !conversation.titleLocked) {
      const answers = await this.messages.count({
        where: { conversationId: conversation.id, isFromAi: true },
      });
      if (answers === 1) {
        const name = await this.ai.generateTitle(question.content, text);
        if (name) {
          // Titre définitif : une régénération ne le remplace pas
          await this.conversations.update(conversation.id, { name, titleLocked: true });
          yield { type: 'title', conversationId: conversation.id, name };
        }
      }
    }
  }

  private async ownedConversation(id: string, userId: string) {
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

  private instructionsFor(user: User | null, conversation: Conversation) {
    const parts = [
      user?.customInstructions && `Consignes de l'utilisateur :\n${user.customInstructions}`,
      conversation.folder?.instructions &&
        `Consignes du dossier « ${conversation.folder.name} » :\n${conversation.folder.instructions}`,
    ].filter(Boolean);
    return parts.length ? parts.join('\n\n') : undefined;
  }
}
