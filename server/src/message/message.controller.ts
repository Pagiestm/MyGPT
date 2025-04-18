import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  BadRequestException,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { Session, SessionData } from 'express-session';
import { MessageService } from './message.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { SearchMessagesDto } from './dto/search-message.dto';
import { Message } from './entities/message.entity';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import { ConversationService } from '../conversation/conversation.service';

interface RequestWithUser extends ExpressRequest {
  user: {
    id: string;
    email: string;
    pseudo: string;
  };
  session: Session & Partial<SessionData>;
}

@ApiTags('messages')
@Controller('messages')
export class MessageController {
  constructor(
    private readonly messageService: MessageService,
    private readonly conversationService: ConversationService,
  ) {}

  @Post()
  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  @ApiOperation({
    summary: "Créer un nouveau message et obtenir une réponse de l'IA",
  })
  @ApiResponse({
    status: 201,
    description: 'Message créé avec succès',
    type: Message,
  })
  @ApiResponse({ status: 400, description: 'Requête invalide' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async create(
    @Request() req: RequestWithUser,
    @Body() createMessageDto: CreateMessageDto,
  ): Promise<Message> {
    // Vérifier que l'utilisateur a accès à la conversation
    const conversation = await this.conversationService.findOne(
      createMessageDto.conversationId,
    );
    if (conversation.userId !== req.user.id && !conversation.isPublic) {
      throw new BadRequestException(
        'You do not have access to this conversation',
      );
    }

    return this.messageService.create(createMessageDto);
  }

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
    @Request() req: RequestWithUser,
    @Query('conversationId') conversationId: string,
  ): Promise<Message[]> {
    // Vérifier que l'utilisateur a accès à la conversation
    const conversation = await this.conversationService.findOne(conversationId);
    if (
      conversation.userId !== req.user.id &&
      !conversation.isPublic &&
      !conversation.shareLink
    ) {
      throw new BadRequestException(
        'You do not have access to this conversation',
      );
    }

    return this.messageService.findAll(conversationId);
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
    @Request() req: RequestWithUser,
    @Query('keyword') keyword: string,
    @Query('conversationId') conversationId: string,
  ): Promise<Message[]> {
    // Vérifier que l'utilisateur a accès à la conversation
    const conversation = await this.conversationService.findOne(conversationId);
    if (
      conversation.userId !== req.user.id &&
      !conversation.isPublic &&
      !conversation.shareLink
    ) {
      throw new BadRequestException(
        'You do not have access to this conversation',
      );
    }

    const searchDto: SearchMessagesDto = {
      keyword,
      conversationId,
    };

    return this.messageService.searchInConversation(searchDto);
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
  async findOne(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<Message> {
    const message = await this.messageService.findOne(id);

    // Vérifier que l'utilisateur a accès à la conversation de ce message
    const conversation = await this.conversationService.findOne(
      message.conversationId,
    );
    if (
      conversation.userId !== req.user.id &&
      !conversation.isPublic &&
      !conversation.shareLink
    ) {
      throw new BadRequestException('You do not have access to this message');
    }

    return message;
  }

  @Patch(':id')
  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  @ApiOperation({
    summary: "Mettre à jour un message et regénérer la réponse de l'IA",
  })
  @ApiParam({ name: 'id', description: 'ID unique du message' })
  @ApiQuery({
    name: 'regenerateAi',
    required: false,
    description: "Indique s'il faut regénérer la réponse de l'IA",
    type: Boolean,
  })
  @ApiResponse({
    status: 200,
    description: 'Message mis à jour',
    type: Message,
  })
  @ApiResponse({ status: 404, description: 'Message non trouvé' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async update(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateMessageDto: UpdateMessageDto,
    @Query('regenerateAi') regenerateAi?: boolean,
  ): Promise<Message> {
    const message = await this.messageService.findOne(id);

    // Vérifier que l'utilisateur a accès à la conversation de ce message
    const conversation = await this.conversationService.findOne(
      message.conversationId,
    );
    if (conversation.userId !== req.user.id) {
      throw new BadRequestException(
        'You can only edit messages in your own conversations',
      );
    }

    return this.messageService.update(
      id,
      updateMessageDto,
      regenerateAi === true,
    );
  }

  @Delete(':id')
  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  @HttpCode(204)
  @ApiOperation({ summary: 'Supprimer un message' })
  @ApiParam({ name: 'id', description: 'ID unique du message' })
  @ApiResponse({ status: 204, description: 'Message supprimé' })
  @ApiResponse({ status: 404, description: 'Message non trouvé' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async remove(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<void> {
    const message = await this.messageService.findOne(id);

    // Vérifier que l'utilisateur a accès à la conversation de ce message
    const conversation = await this.conversationService.findOne(
      message.conversationId,
    );
    if (conversation.userId !== req.user.id) {
      throw new BadRequestException(
        'You can only delete messages in your own conversations',
      );
    }

    return this.messageService.remove(id);
  }
}
