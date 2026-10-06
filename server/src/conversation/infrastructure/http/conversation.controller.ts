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
import { AuthenticatedGuard } from '../../../auth/infrastructure/http/guards/authenticated.guard';
import type { AuthenticatedRequest } from '../../../common/authenticated-request';
import { PaginationDto, type Page } from '../../../common/pagination.dto';
import {
  DeleteConversation,
  GetReadableConversation,
  ListConversations,
  ListSavedConversations,
  OpenSharedConversation,
  RevokeShare,
  SaveSharedConversation,
  SearchConversations,
  ShareConversation,
  StartConversation,
  UpdateConversation,
} from '../../application/conversation.use-cases';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { ShareConversationDto } from './dto/share-conversation.dto';
import { SaveSharedConversationDto } from './dto/saveShared-conversation.dto';
import { ConversationResponse, SharedConversationResponse } from './dto/conversation.response';

@ApiTags('conversations')
@Controller('conversations')
export class ConversationController {
  constructor(
    private readonly start: StartConversation,
    private readonly list: ListConversations,
    private readonly listSaved: ListSavedConversations,
    private readonly searchConversations: SearchConversations,
    private readonly openShared: OpenSharedConversation,
    private readonly saveShared: SaveSharedConversation,
    private readonly readable: GetReadableConversation,
    private readonly updateConversation: UpdateConversation,
    private readonly deleteConversation: DeleteConversation,
    private readonly shareConversation: ShareConversation,
    private readonly revoke: RevokeShare,
  ) {}

  @Post()
  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Créer une nouvelle conversation' })
  @ApiResponse({ status: 201, type: ConversationResponse })
  @ApiResponse({ status: 400, description: 'Requête invalide' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateConversationDto,
  ): Promise<ConversationResponse> {
    return ConversationResponse.from(await this.start.execute(req.user.id, dto));
  }

  @Get()
  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Récupérer toutes les conversations' })
  @ApiResponse({ status: 200, type: [ConversationResponse] })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiQuery({
    name: 'archived',
    required: false,
    description: 'true pour lister les conversations archivées',
  })
  async findAll(
    @Request() req: AuthenticatedRequest,
    @Query() pagination: PaginationDto,
    @Query('archived') archived?: string,
  ): Promise<Page<ConversationResponse>> {
    const page = await this.list.execute(req.user.id, {
      archived: archived === 'true',
      ...pagination,
    });
    return { ...page, items: page.items.map((item) => ConversationResponse.from(item)) };
  }

  @Get('search')
  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Rechercher des conversations par mot-clé' })
  @ApiQuery({ name: 'keyword', required: true, description: 'Mot-clé de recherche' })
  @ApiResponse({ status: 200, type: [ConversationResponse] })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async search(
    @Request() req: AuthenticatedRequest,
    @Query('keyword') keyword: string,
    @Query() pagination: PaginationDto,
  ): Promise<Page<ConversationResponse>> {
    const page = await this.searchConversations.execute(req.user.id, keyword, pagination);
    return { ...page, items: page.items.map((item) => ConversationResponse.from(item)) };
  }

  @Get('saved')
  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: "Récupérer les conversations sauvegardées par l'utilisateur" })
  @ApiResponse({ status: 200, type: [ConversationResponse] })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async getSavedConversations(
    @Request() req: AuthenticatedRequest,
    @Query() pagination: PaginationDto,
  ): Promise<Page<ConversationResponse>> {
    const page = await this.listSaved.execute(req.user.id, pagination);
    return { ...page, items: page.items.map((item) => ConversationResponse.from(item)) };
  }

  @Post('save-shared')
  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Sauvegarder une conversation partagée dans sa liste personnelle' })
  @ApiResponse({ status: 201, type: ConversationResponse })
  @ApiResponse({ status: 400, description: 'Requête invalide' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async saveSharedConversation(
    @Request() req: AuthenticatedRequest,
    @Body() dto: SaveSharedConversationDto,
  ): Promise<ConversationResponse> {
    return ConversationResponse.from(await this.saveShared.execute(req.user.id, dto));
  }

  @Get('shared/:shareLink')
  @ApiOperation({ summary: 'Accéder à une conversation partagée via son lien' })
  @ApiParam({ name: 'shareLink', description: 'Lien de partage unique' })
  @ApiResponse({ status: 200, type: SharedConversationResponse })
  @ApiResponse({ status: 404, description: 'Conversation non trouvée' })
  @ApiResponse({ status: 400, description: 'Lien de partage expiré' })
  async findByShareLink(
    @Param('shareLink') shareLink: string,
  ): Promise<SharedConversationResponse> {
    const { conversation, messages, ownerPseudo } = await this.openShared.execute(shareLink);
    return SharedConversationResponse.fromShared(conversation, messages, ownerPseudo);
  }

  @Get(':id')
  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Récupérer une conversation par son ID' })
  @ApiParam({ name: 'id', description: 'ID unique de la conversation' })
  @ApiResponse({ status: 200, type: ConversationResponse })
  @ApiResponse({ status: 404, description: 'Conversation non trouvée' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async findOne(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<ConversationResponse> {
    return ConversationResponse.from(await this.readable.execute(id, req.user.id));
  }

  @Patch(':id')
  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Mettre à jour une conversation' })
  @ApiParam({ name: 'id', description: 'ID unique de la conversation' })
  @ApiResponse({ status: 200, type: ConversationResponse })
  @ApiResponse({ status: 404, description: 'Conversation non trouvée' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async update(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateConversationDto,
  ): Promise<ConversationResponse> {
    return ConversationResponse.from(await this.updateConversation.execute(id, req.user.id, dto));
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
  remove(@Request() req: AuthenticatedRequest, @Param('id') id: string): Promise<void> {
    return this.deleteConversation.execute(id, req.user.id);
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
  share(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: ShareConversationDto,
  ): Promise<{ shareLink: string }> {
    return this.shareConversation.execute(id, req.user.id, dto.expiresAt);
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
  revokeShare(@Request() req: AuthenticatedRequest, @Param('id') id: string): Promise<void> {
    return this.revoke.execute(id, req.user.id);
  }
}
