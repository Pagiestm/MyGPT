import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { MessageService } from './message.service';
import { Message } from './entities/message.entity';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import { ConversationService } from '../conversation/conversation.service';
import type { AuthenticatedRequest } from '../common/authenticated-request';
import { PaginationDto, toPage, type Page } from '../common/pagination.dto';

@ApiTags('messages')
@Controller('messages')
export class MessageController {
  constructor(
    private readonly messageService: MessageService,
    private readonly conversationService: ConversationService,
  ) {}

  @Get()
  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: "Récupérer les messages d'une conversation" })
  @ApiQuery({
    name: 'conversationId',
    required: true,
    description: 'ID de la conversation',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des messages',
    type: [Message],
  })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async findAll(
    @Request() req: AuthenticatedRequest,
    @Query('conversationId') conversationId: string,
    @Query() pagination: PaginationDto,
  ): Promise<Page<Message>> {
    const conversation = await this.conversationService.findOne(conversationId);
    if (conversation.userId !== req.user.id && !conversation.isPublic && !conversation.shareLink) {
      throw new BadRequestException('You do not have access to this conversation');
    }

    return this.messageService.findAll(conversationId, pagination);
  }

  @Get('search/all')
  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: "Rechercher dans tous les messages de l'utilisateur" })
  @ApiQuery({ name: 'keyword', required: true, description: 'Mot-clé de recherche' })
  @ApiResponse({ status: 200, description: 'Messages trouvés (20 au plus)', type: [Message] })
  searchAll(
    @Request() req: AuthenticatedRequest,
    @Query() pagination: PaginationDto,
    @Query('keyword') keyword = '',
  ): Promise<Page<Message>> | Page<Message> {
    const trimmed = keyword.trim();
    if (trimmed.length < 2) return toPage([], 0, pagination);
    return this.messageService.searchForUser(req.user.id, trimmed, pagination);
  }

  @Get('search')
  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Rechercher des messages dans une conversation' })
  @ApiQuery({
    name: 'keyword',
    required: true,
    description: 'Mot-clé de recherche',
  })
  @ApiQuery({
    name: 'conversationId',
    required: true,
    description: 'ID de la conversation',
  })
  @ApiResponse({
    status: 200,
    description: 'Résultats de la recherche',
    type: [Message],
  })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async search(
    @Request() req: AuthenticatedRequest,
    @Query('keyword') keyword: string,
    @Query('conversationId') conversationId: string,
    @Query() pagination: PaginationDto,
  ): Promise<Page<Message>> {
    const conversation = await this.conversationService.findOne(conversationId);
    if (conversation.userId !== req.user.id && !conversation.isPublic && !conversation.shareLink) {
      throw new BadRequestException('You do not have access to this conversation');
    }

    return this.messageService.searchInConversation({ keyword, conversationId, ...pagination });
  }

  @Get(':id')
  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Récupérer un message par son ID' })
  @ApiParam({ name: 'id', description: 'ID unique du message' })
  @ApiResponse({
    status: 200,
    description: 'Message trouvé',
    type: Message,
  })
  @ApiResponse({ status: 404, description: 'Message non trouvé' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async findOne(@Request() req: AuthenticatedRequest, @Param('id') id: string): Promise<Message> {
    const message = await this.messageService.findOne(id);

    const conversation = await this.conversationService.findOne(message.conversationId);
    if (conversation.userId !== req.user.id && !conversation.isPublic && !conversation.shareLink) {
      throw new BadRequestException('You do not have access to this message');
    }

    return message;
  }
}
