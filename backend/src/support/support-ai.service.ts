import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class SupportAiService {
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

  /** Prueba todas las fuentes habituales (Railway, .env, nombres mal escritos). */
  private readOpenAiKey(): string | undefined {
    const candidates = [
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

  async reply(message: string): Promise<string> {
    const client = this.getClient();
    if (!client) {
      return 'Por ahora el asistente inteligente no está disponible. Escríbenos a soporte@velle.app.';
    }

    try {
      const completion = await client.responses.create({
        model:
          this.config.get<string>('OPENAI_MODEL') ??
          process.env.OPENAI_MODEL ??
          'gpt-4.1-mini',
        input: `
Eres el asistente de soporte de la app financiera Velle.
Responde en español, breve y claro. Si la pregunta es sobre
funciones que la app aún no tiene, explícalo con transparencia.

Pregunta del usuario: "${message}"
        `.trim(),
      });

      const anyCompletion = completion as any;
      const firstOutput = anyCompletion.output?.[0];
      const firstContent = firstOutput?.content?.[0];
      const text =
        firstContent?.type === 'output_text'
          ? firstContent.text
          : firstContent?.text ??
            'He recibido tu mensaje, un asesor lo revisará en breve.';

      return text;
    } catch {
      throw new InternalServerErrorException('AI chat error');
    }
  }

  isOpenAiConfigured(): boolean {
    return !!this.readOpenAiKey();
  }

  /** Diagnóstico: qué variables OPENAI ve el proceso (sin exponer secretos). */
  aiEnvDebug(): {
    envKeysMatchingOpenai: string[];
    openaiApiKeyLength: number;
    fromConfigLength: number;
  } {
    const envKeysMatchingOpenai = Object.keys(process.env).filter(k =>
      /openai/i.test(k),
    );
    const fromProcess = this.normalizeKey(process.env.OPENAI_API_KEY);
    const fromConfig = this.normalizeKey(
      this.config.get<string>('OPENAI_API_KEY'),
    );
    return {
      envKeysMatchingOpenai,
      openaiApiKeyLength: fromProcess?.length ?? 0,
      fromConfigLength: fromConfig?.length ?? 0,
    };
  }
}
