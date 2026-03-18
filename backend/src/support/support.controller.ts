import { Body, Controller, Get, Post } from '@nestjs/common';
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

  /** GET: comprueba si OPENAI_API_KEY está definida en el servidor (sin mostrar el valor). */
  @Get('ai-ready')
  aiReady() {
    return {openaiConfigured: this.ai.isOpenAiConfigured()};
  }

  /** Diagnóstico: nombres de env que contienen "openai" y longitud de clave (sin valor). */
  @Get('ai-env-debug')
  aiEnvDebug() {
    return this.ai.aiEnvDebug();
  }
}

