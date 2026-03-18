import { Injectable, InternalServerErrorException } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class SupportAiService {
  private client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  async reply(message: string): Promise<string> {
    if (!this.client.apiKey) {
      // Sin API key configurada devolvemos un mensaje amable,
      // así el frontend no se rompe.
      return 'Por ahora el asistente inteligente no está disponible. Escríbenos a soporte@velle.app.';
    }
    

    try {
      const completion = await this.client.responses.create({
        model: process.env.OPENAI_MODEL ?? 'gpt-4.1-mini',
        input: `
Eres el asistente de soporte de la app financiera Velle.
Responde en español, breve y claro. Si la pregunta es sobre
funciones que la app aún no tiene, explícalo con transparencia.

Pregunta del usuario: "${message}"
        `.trim(),
      });

      // El SDK nuevo usa una estructura algo compleja; para evitar
      // problemas de tipos en tiempo de compilación, navegamos la
      // respuesta como any y extraemos el primer texto disponible.
      const anyCompletion = completion as any;
      const firstOutput = anyCompletion.output?.[0];
      const firstContent = firstOutput?.content?.[0];
      const text =
        firstContent?.type === 'output_text'
          ? firstContent.text
          : firstContent?.text ??
            'He recibido tu mensaje, un asesor lo revisará en breve.';

      return text;
    } catch (e) {
      throw new InternalServerErrorException('AI chat error');
    }
  }
}

