import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { AuthenticatedGuard } from '../../../auth/infrastructure/http/guards/authenticated.guard';
import type { AuthenticatedRequest } from '../../../common/authenticated-request';
import { PaginationDto, type Page } from '../../../common/pagination.dto';
import {
  GetMessage,
  ListMessages,
  SearchInConversation,
  SearchUserMessages,
} from '../../application/message.use-cases';
import { MessageHitResponse, MessageResponse } from './dto/message.response';

@ApiTags('messages')
@Controller('messages')
export class MessageController {
  constructor(
    private readonly list: ListMessages,
    private readonly searchConversation: SearchInConversation,
    private readonly searchAllMessages: SearchUserMessages,
    private readonly getMessage: GetMessage,
  ) {}

  @Get()
  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: "Récupérer les messages d'une conversation" })
  @ApiQuery({ name: 'conversationId', required: true, description: 'ID de la conversation' })
  @ApiResponse({ status: 200, description: 'Liste des messages', type: [MessageResponse] })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async findAll(
    @Request() req: AuthenticatedRequest,
    @Query('conversationId') conversationId: string,
    @Query() pagination: PaginationDto,
  ): Promise<Page<MessageResponse>> {
    const page = await this.list.execute(conversationId, req.user.id, pagination);
    return { ...page, items: page.items.map((item) => MessageResponse.from(item)) };
  }

  @Get('search/all')
  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: "Rechercher dans tous les messages de l'utilisateur" })
  @ApiQuery({ name: 'keyword', required: true, description: 'Mot-clé de recherche' })
  @ApiResponse({ status: 200, type: [MessageHitResponse] })
  async searchAll(
    @Request() req: AuthenticatedRequest,
    @Query() pagination: PaginationDto,
    @Query('keyword') keyword = '',
  ): Promise<Page<MessageHitResponse>> {
    const page = await this.searchAllMessages.execute(req.user.id, keyword, pagination);
    return { ...page, items: page.items.map((item) => MessageHitResponse.fromHit(item)) };
  }

  @Get('search')
  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Rechercher des messages dans une conversation' })
  @ApiQuery({ name: 'keyword', required: true, description: 'Mot-clé de recherche' })
  @ApiQuery({ name: 'conversationId', required: true, description: 'ID de la conversation' })
  @ApiResponse({ status: 200, type: [MessageResponse] })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async search(
    @Request() req: AuthenticatedRequest,
    @Query('keyword') keyword: string,
    @Query('conversationId') conversationId: string,
    @Query() pagination: PaginationDto,
  ): Promise<Page<MessageResponse>> {
    const page = await this.searchConversation.execute(
      conversationId,
      req.user.id,
      keyword,
      pagination,
    );
    return { ...page, items: page.items.map((item) => MessageResponse.from(item)) };
  }

  @Get(':id')
  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Récupérer un message par son ID' })
  @ApiParam({ name: 'id', description: 'ID unique du message' })
  @ApiResponse({ status: 200, type: MessageResponse })
  @ApiResponse({ status: 404, description: 'Message non trouvé' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async findOne(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<MessageResponse> {
    return MessageResponse.from(await this.getMessage.execute(id, req.user.id));
  }
}
