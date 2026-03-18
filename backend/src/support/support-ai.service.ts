import { Injectable, InternalServerErrorException } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class SupportAiService {
  private client: OpenAI | null = null;

  private getClient(): OpenAI | null {
    const key = process.env.OPENAI_API_KEY?.trim();
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
        model: process.env.OPENAI_MODEL ?? 'gpt-4.1-mini',
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
}
