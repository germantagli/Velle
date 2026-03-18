import { Module } from '@nestjs/common';
import { SupportController } from './support.controller';
import { SupportAiService } from './support-ai.service';

@Module({
  controllers: [SupportController],
  providers: [SupportAiService],
})
export class SupportModule {}

