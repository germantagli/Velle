import { Body, Controller, Post } from '@nestjs/common';
import { SupportAiService } from './support-ai.service';
import { AiChatDto } from './dto/ai-chat.dto';

@Controller('support')
export class SupportController {
  constructor(private readonly ai: SupportAiService) {}

  @Post('ai-chat')
  async aiChat(@Body() body: AiChatDto) {
    const reply = await this.ai.reply(body.message);
    return { reply };
  }
}

