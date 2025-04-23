import { Module } from '@nestjs/common';
import { GeminiAiAdapter } from './adapters/GeminiAiAdapter';

@Module({
  providers: [
    {
      provide: 'IAiAdapter',
      useClass: GeminiAiAdapter,
    },
  ],
  exports: ['IAiAdapter'],
})
export class InfrastructureModule {}
