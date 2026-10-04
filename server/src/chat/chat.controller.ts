import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import type { AuthenticatedRequest } from '../common/authenticated-request';
import { AI_ADAPTER, type IAiAdapter } from '../infrastructure/adapters/ai-adapter';
import { ChatService, type ChatEvent } from './chat.service';
import { EditMessageDto, RegenerateDto, SendMessageDto } from './dto/chat.dto';

@ApiTags('chat')
@ApiCookieAuth()
@UseGuards(AuthenticatedGuard)
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    @Inject(AI_ADAPTER) private readonly ai: IAiAdapter,
  ) {}

  @Get('models')
  @ApiOperation({ summary: "Modèles d'IA disponibles" })
  models() {
    return { models: this.ai.models, defaultModel: this.ai.defaultModel };
  }

  @Post('messages')
  @ApiOperation({ summary: 'Envoyer une question et recevoir la réponse en flux (SSE)' })
  @ApiProduces('text/event-stream')
  send(@Request() req: AuthenticatedRequest, @Res() res: Response, @Body() dto: SendMessageDto) {
    return this.stream(res, (signal) => this.chatService.send(req.user.id, dto, signal));
  }

  @Post('conversations/:id/regenerate')
  @ApiOperation({ summary: 'Régénérer la dernière réponse (SSE)' })
  @ApiProduces('text/event-stream')
  regenerate(
    @Request() req: AuthenticatedRequest,
    @Res() res: Response,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RegenerateDto,
  ) {
    return this.stream(res, (signal) =>
      this.chatService.regenerate(req.user.id, id, dto.model, signal),
    );
  }

  @Post('messages/:id/edit')
  @ApiOperation({ summary: 'Modifier une question et régénérer la suite (SSE)' })
  @ApiProduces('text/event-stream')
  edit(
    @Request() req: AuthenticatedRequest,
    @Res() res: Response,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EditMessageDto,
  ) {
    return this.stream(res, (signal) => this.chatService.edit(req.user.id, id, dto, signal));
  }

  private async stream(
    res: Response,
    start: (signal: AbortSignal) => Promise<AsyncGenerator<ChatEvent>>,
  ) {
    // Le client qui ferme la connexion (bouton « Arrêter ») interrompt la génération
    const controller = new AbortController();
    res.on('close', () => {
      if (!res.writableEnded) controller.abort();
    });

    // Les erreurs de validation remontent avant l'ouverture du flux, en réponse HTTP classique
    const events = await start(controller.signal);

    res.status(200).set({
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders();

    for await (const event of events) {
      if (!res.writableEnded && !controller.signal.aborted) {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }
    }
    res.end();
  }
}
