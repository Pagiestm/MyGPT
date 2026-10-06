import { ApiProperty } from '@nestjs/swagger';
import { MessageResponse } from '../../../../message/infrastructure/http/dto/message.response';
import type { PreparedExchange, PromptMessage } from '../../../application/prompt.builder';

export class ExchangeResponse {
  @ApiProperty({ type: MessageResponse })
  question: MessageResponse;

  @ApiProperty({ description: 'Prompt à exécuter dans le navigateur' })
  messages: PromptMessage[];

  static from(exchange: PreparedExchange): ExchangeResponse {
    return {
      question: MessageResponse.from(exchange.question),
      messages: exchange.messages,
    };
  }
}
