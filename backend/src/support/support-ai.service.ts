import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class SupportAiService {
  private readonly logger = new Logger(SupportAiService.name);
  private client: OpenAI | null = null;

  constructor(private readonly config: ConfigService) {}

  private normalizeKey(raw: string | undefined): string | undefined {
    if (raw == null || typeof raw !== 'string') {
      return undefined;
    }
    let key = raw.trim();
    if (
      (key.startsWith('"') && key.endsWith('"')) ||
      (key.startsWith("'") && key.endsWith("'"))
    ) {
      key = key.slice(1, -1).trim();
    }
    return key.length > 0 ? key : undefined;
  }

  private readOpenAiKey(): string | undefined {
    const candidates = [
      this.config.get<string>('VELLE_OPENAI_API_KEY'),
      process.env.VELLE_OPENAI_API_KEY,
      this.config.get<string>('OPENAI_API_KEY'),
      process.env.OPENAI_API_KEY,
      process.env['OPENAI API KEY'],
      process.env.OPENAI_KEY,
    ];
    for (const raw of candidates) {
      const key = this.normalizeKey(raw);
      if (key) {
        return key;
      }
    }
    return undefined;
  }

  private getClient(): OpenAI | null {
    const key = this.readOpenAiKey();
    if (!key) {
      return null;
    }
    if (!this.client) {
      this.client = new OpenAI({ apiKey: key });
    }
    return this.client;
  }

  private getModel(): string {
    const m =
      this.config.get<string>('OPENAI_MODEL')?.trim() ||
      process.env.OPENAI_MODEL?.trim();
    if (m && m.length > 0) {
      return m;
    }
    return 'gpt-4o-mini';
  }

  async reply(message: string): Promise<string> {
    const client = this.getClient();
    if (!client) {
      return 'Por ahora el asistente inteligente no está disponible. Escríbenos a soporte@velle.app.';
    }

    const model = this.getModel();
    const systemPrompt = `Eres el asistente de soporte de la app financiera Velle.
Responde en español, breve y claro. Si la pregunta es sobre funciones que la app aún no tiene, explícalo con transparencia.`;

    try {
      const completion = await client.chat.completions.create({
        model,
        messages: [
          {role: 'system', content: systemPrompt},
          {role: 'user', content: message},
        ],
        max_tokens: 800,
      });

      const text = completion.choices[0]?.message?.content?.trim();
      if (!text) {
        this.logger.warn('OpenAI returned empty content');
        return 'No pude generar una respuesta. Inténtalo de nuevo o escríbenos a soporte@velle.app.';
      }
      return text;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`OpenAI chat failed (model=${model}): ${msg}`);
      throw new InternalServerErrorException('AI chat error');
    }
  }

  isOpenAiConfigured(): boolean {
    return !!this.readOpenAiKey();
  }

  aiEnvDebug(): {
    envKeysMatchingOpenai: string[];
    openaiApiKeyLength: number;
    velleOpenaiApiKeyLength: number;
    fromConfigLength: number;
  } {
    const envKeysMatchingOpenai = Object.keys(process.env).filter(k =>
      /openai/i.test(k),
    );
    const fromProcess = this.normalizeKey(process.env.OPENAI_API_KEY);
    const fromVelle = this.normalizeKey(process.env.VELLE_OPENAI_API_KEY);
    const fromConfig = this.normalizeKey(
      this.config.get<string>('OPENAI_API_KEY'),
    );
    return {
      envKeysMatchingOpenai,
      openaiApiKeyLength: fromProcess?.length ?? 0,
      velleOpenaiApiKeyLength: fromVelle?.length ?? 0,
      fromConfigLength: fromConfig?.length ?? 0,
    };
  }
}
