import { Body, Controller, Param, ParseUUIDPipe, Post, Request, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import type { AuthenticatedRequest } from '../common/authenticated-request';
import { ChatService } from './chat.service';
import { PromptService } from './prompt.service';
import { EditMessageDto, RegenerateDto, SendMessageDto } from './dto/chat.dto';
import { SaveReplyDto, SaveTitleDto } from './dto/local-chat.dto';

@ApiTags('chat')
@ApiCookieAuth()
@UseGuards(AuthenticatedGuard)
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly prompts: PromptService,
  ) {}

  @Post('messages')
  @ApiOperation({ summary: 'Enregistrer une question et recevoir le prompt à exécuter' })
  async prepare(@Request() req: AuthenticatedRequest, @Body() dto: SendMessageDto) {
    this.prompts.assertBrowserModel(dto.model ?? '');
    const { conversation, question } = await this.chatService.prepareSend(req.user.id, dto);
    return this.prompts.toExchange(req.user.id, conversation, question, dto.questionEmbedding);
  }

  @Post('conversations/:id/regenerate')
  @ApiOperation({ summary: 'Effacer la dernière réponse et rejouer la question' })
  async regenerate(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RegenerateDto,
  ) {
    this.prompts.assertBrowserModel(dto.model ?? '');
    const { conversation, question } = await this.chatService.prepareRegenerate(req.user.id, id);
    return this.prompts.toExchange(req.user.id, conversation, question, dto.questionEmbedding);
  }

  @Post('messages/:id/edit')
  @ApiOperation({ summary: 'Modifier une question et préparer la suite' })
  async edit(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EditMessageDto,
  ) {
    this.prompts.assertBrowserModel(dto.model ?? '');
    const { conversation, question } = await this.chatService.prepareEdit(req.user.id, id, dto);
    return this.prompts.toExchange(req.user.id, conversation, question, dto.questionEmbedding);
  }

  @Post('replies')
  @ApiOperation({ summary: 'Enregistrer la réponse produite par le navigateur' })
  reply(@Request() req: AuthenticatedRequest, @Body() dto: SaveReplyDto) {
    return this.prompts.saveReply(req.user.id, dto.conversationId, dto.content, dto.model);
  }

  @Post('titles')
  @ApiOperation({ summary: 'Enregistrer le titre produit par le navigateur' })
  title(@Request() req: AuthenticatedRequest, @Body() dto: SaveTitleDto) {
    return this.prompts.saveTitle(req.user.id, dto.conversationId, dto.name);
  }
}
