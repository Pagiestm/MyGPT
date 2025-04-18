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
import { ConversationService } from './conversation.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { ShareConversationDto } from './dto/share-conversation.dto';
import { SearchConversationDto } from './dto/search-conversation.dto';
import { Conversation } from './entities/conversation.entity';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';

interface RequestWithUser extends ExpressRequest {
  user: {
    id: string;
    email: string;
    pseudo: string;
  };
  session: Session & Partial<SessionData>;
}

@ApiTags('conversations')
@Controller('conversations')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Post()
  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Créer une nouvelle conversation' })
  @ApiResponse({
    status: 201,
    description: 'Conversation créée avec succès',
    type: Conversation,
  })
  @ApiResponse({ status: 400, description: 'Requête invalide' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async create(
    @Request() req: RequestWithUser,
    @Body() createConversationDto: CreateConversationDto,
  ): Promise<Conversation> {
    // Utiliser l'ID utilisateur de la session
    createConversationDto.userId = req.user.id;
    return this.conversationService.create(createConversationDto);
  }

  @Get()
  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Récupérer toutes les conversations' })
  @ApiResponse({
    status: 200,
    description: 'Liste des conversations',
    type: [Conversation],
  })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async findAll(@Request() req: RequestWithUser): Promise<Conversation[]> {
    return this.conversationService.findAll(req.user.id);
  }

  @Get('search')
  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Rechercher des conversations par mot-clé' })
  @ApiQuery({
    name: 'keyword',
    required: true,
    description: 'Mot-clé de recherche',
  })
  @ApiResponse({
    status: 200,
    description: 'Résultats de la recherche',
    type: [Conversation],
  })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async search(
    @Request() req: RequestWithUser,
    @Query('keyword') keyword: string,
  ): Promise<Conversation[]> {
    const searchDto: SearchConversationDto = {
      keyword,
      userId: req.user.id,
    };
    return this.conversationService.search(searchDto);
  }

  @Get('shared/:shareLink')
  @ApiOperation({ summary: 'Accéder à une conversation partagée via son lien' })
  @ApiParam({ name: 'shareLink', description: 'Lien de partage unique' })
  @ApiResponse({
    status: 200,
    description: 'Conversation partagée',
    type: Conversation,
  })
  @ApiResponse({ status: 404, description: 'Conversation non trouvée' })
  @ApiResponse({ status: 400, description: 'Lien de partage expiré' })
  async findByShareLink(
    @Param('shareLink') shareLink: string,
  ): Promise<Conversation> {
    return this.conversationService.findByShareLink(shareLink);
  }

  @Get(':id')
  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Récupérer une conversation par son ID' })
  @ApiParam({ name: 'id', description: 'ID unique de la conversation' })
  @ApiResponse({
    status: 200,
    description: 'Conversation trouvée',
    type: Conversation,
  })
  @ApiResponse({ status: 404, description: 'Conversation non trouvée' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async findOne(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<Conversation> {
    const conversation = await this.conversationService.findOne(id);

    // Vérifier que l'utilisateur a accès à cette conversation
    if (conversation.userId !== req.user.id && !conversation.isPublic) {
      throw new BadRequestException('Access denied to this conversation');
    }

    return conversation;
  }

  @Patch(':id')
  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Mettre à jour une conversation' })
  @ApiParam({ name: 'id', description: 'ID unique de la conversation' })
  @ApiResponse({
    status: 200,
    description: 'Conversation mise à jour',
    type: Conversation,
  })
  @ApiResponse({ status: 404, description: 'Conversation non trouvée' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async update(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateConversationDto: UpdateConversationDto,
  ): Promise<Conversation> {
    const conversation = await this.conversationService.findOne(id);

    // Vérifier que l'utilisateur est le propriétaire de la conversation
    if (conversation.userId !== req.user.id) {
      throw new BadRequestException(
        'You can only update your own conversations',
      );
    }

    return this.conversationService.update(id, updateConversationDto);
  }

  @Delete(':id')
  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  @HttpCode(204)
  @ApiOperation({ summary: 'Supprimer une conversation' })
  @ApiParam({ name: 'id', description: 'ID unique de la conversation' })
  @ApiResponse({ status: 204, description: 'Conversation supprimée' })
  @ApiResponse({ status: 404, description: 'Conversation non trouvée' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async remove(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<void> {
    const conversation = await this.conversationService.findOne(id);

    // Vérifier que l'utilisateur est le propriétaire de la conversation
    if (conversation.userId !== req.user.id) {
      throw new BadRequestException(
        'You can only delete your own conversations',
      );
    }

    return this.conversationService.remove(id);
  }

  @Post(':id/share')
  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Partager une conversation' })
  @ApiParam({ name: 'id', description: 'ID unique de la conversation' })
  @ApiResponse({
    status: 200,
    description: 'Lien de partage généré',
    schema: { properties: { shareLink: { type: 'string' } } },
  })
  @ApiResponse({ status: 404, description: 'Conversation non trouvée' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async shareConversation(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() shareDto: ShareConversationDto,
  ): Promise<{ shareLink: string }> {
    const conversation = await this.conversationService.findOne(id);

    // Vérifier que l'utilisateur est le propriétaire de la conversation
    if (conversation.userId !== req.user.id) {
      throw new BadRequestException(
        'You can only share your own conversations',
      );
    }

    return this.conversationService.shareConversation(id, shareDto);
  }

  @Delete(':id/share')
  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  @HttpCode(204)
  @ApiOperation({ summary: "Révoquer le partage d'une conversation" })
  @ApiParam({ name: 'id', description: 'ID unique de la conversation' })
  @ApiResponse({ status: 204, description: 'Partage révoqué' })
  @ApiResponse({ status: 404, description: 'Conversation non trouvée' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async revokeShare(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<void> {
    const conversation = await this.conversationService.findOne(id);

    // Vérifier que l'utilisateur est le propriétaire de la conversation
    if (conversation.userId !== req.user.id) {
      throw new BadRequestException(
        'You can only manage sharing of your own conversations',
      );
    }

    return this.conversationService.revokeShare(id);
  }
}
