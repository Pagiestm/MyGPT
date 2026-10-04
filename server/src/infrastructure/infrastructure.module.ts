import { Module } from '@nestjs/common';
import { GeminiAiAdapter } from './adapters/GeminiAiAdapter';
import { AI_ADAPTER } from './adapters/ai-adapter';

@Module({
  providers: [{ provide: AI_ADAPTER, useClass: GeminiAiAdapter }],
  exports: [AI_ADAPTER],
})
export class InfrastructureModule {}
