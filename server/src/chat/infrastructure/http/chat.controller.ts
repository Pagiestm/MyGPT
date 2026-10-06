import { Body, Controller, Param, ParseUUIDPipe, Post, Request, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticatedGuard } from '../../../auth/infrastructure/http/guards/authenticated.guard';
import type { AuthenticatedRequest } from '../../../common/http/authenticated-request';
import { MessageResponse } from '../../../message/infrastructure/http/dto/message.response';
import {
  assertBrowserModel,
  PrepareEdit,
  PrepareRegenerate,
  PrepareSend,
  SaveReply,
  SaveTitle,
} from '../../application/chat.use-cases';
import { BuildPrompt } from '../../application/prompt.builder';
import { EditMessageDto, RegenerateDto, SendMessageDto } from './dto/chat.dto';
import { SaveReplyDto, SaveTitleDto } from './dto/local-chat.dto';
import { ExchangeResponse } from './dto/exchange.response';

@ApiTags('chat')
@ApiCookieAuth()
@UseGuards(AuthenticatedGuard)
@Controller('chat')
export class ChatController {
  constructor(
    private readonly send: PrepareSend,
    private readonly regenerateExchange: PrepareRegenerate,
    private readonly editExchange: PrepareEdit,
    private readonly prompt: BuildPrompt,
    private readonly saveReply: SaveReply,
    private readonly saveTitle: SaveTitle,
  ) {}

  @Post('messages')
  @ApiOperation({ summary: 'Enregistrer une question et recevoir le prompt à exécuter' })
  @ApiResponse({ status: 201, type: ExchangeResponse })
  async prepare(
    @Request() req: AuthenticatedRequest,
    @Body() dto: SendMessageDto,
  ): Promise<ExchangeResponse> {
    assertBrowserModel(dto.model ?? '');
    const { conversation, question } = await this.send.execute(req.user.id, dto);
    return ExchangeResponse.from(
      await this.prompt.execute(req.user.id, conversation, question, dto.questionEmbedding),
    );
  }

  @Post('conversations/:id/regenerate')
  @ApiOperation({ summary: 'Effacer la dernière réponse et rejouer la question' })
  @ApiResponse({ status: 201, type: ExchangeResponse })
  async regenerate(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RegenerateDto,
  ): Promise<ExchangeResponse> {
    assertBrowserModel(dto.model ?? '');
    const { conversation, question } = await this.regenerateExchange.execute(req.user.id, id);
    return ExchangeResponse.from(
      await this.prompt.execute(req.user.id, conversation, question, dto.questionEmbedding),
    );
  }

  @Post('messages/:id/edit')
  @ApiOperation({ summary: 'Modifier une question et préparer la suite' })
  @ApiResponse({ status: 201, type: ExchangeResponse })
  async edit(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EditMessageDto,
  ): Promise<ExchangeResponse> {
    assertBrowserModel(dto.model ?? '');
    const { conversation, question } = await this.editExchange.execute(
      req.user.id,
      id,
      dto.content,
    );
    return ExchangeResponse.from(
      await this.prompt.execute(req.user.id, conversation, question, dto.questionEmbedding),
    );
  }

  @Post('replies')
  @ApiOperation({ summary: 'Enregistrer la réponse produite par le navigateur' })
  async reply(@Request() req: AuthenticatedRequest, @Body() dto: SaveReplyDto) {
    const { message, needsTitle } = await this.saveReply.execute(
      req.user.id,
      dto.conversationId,
      dto.content,
      dto.model,
    );
    return { message: MessageResponse.from(message), needsTitle };
  }

  @Post('titles')
  @ApiOperation({ summary: 'Enregistrer le titre produit par le navigateur' })
  title(@Request() req: AuthenticatedRequest, @Body() dto: SaveTitleDto) {
    return this.saveTitle.execute(req.user.id, dto.conversationId, dto.name);
  }
}
