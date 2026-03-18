import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI, {APIError} from 'openai';
import {
  buildVelleSupportSystemPrompt,
  type SupportLocale,
} from './velle-app-knowledge';
import {userMessage} from './support-user-messages';

const FALLBACK_CHAT_MODEL = 'gpt-4o-mini';

@Injectable()
export class SupportAiService {
  private readonly logger = new Logger(SupportAiService.name);
  private client: OpenAI | null = null;
  private clientSig = '';

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

  /** Claves de proyecto (sk-proj-...) suelen exigir ID de proyecto en la API. */
  private readOpenAiProject(): string | undefined {
    const candidates = [
      this.config.get<string>('VELLE_OPENAI_PROJECT_ID'),
      process.env.VELLE_OPENAI_PROJECT_ID,
      this.config.get<string>('OPENAI_PROJECT_ID'),
      process.env.OPENAI_PROJECT_ID,
    ];
    for (const raw of candidates) {
      const p = this.normalizeKey(raw);
      if (p) {
        return p;
      }
    }
    return undefined;
  }

  private getClient(): OpenAI | null {
    const key = this.readOpenAiKey();
    if (!key) {
      return null;
    }
    const project = this.readOpenAiProject();
    const sig = `${key.length}|${project ?? ''}`;
    if (!this.client || this.clientSig !== sig) {
      this.client = new OpenAI({
        apiKey: key,
        ...(project ? {project} : {}),
      });
      this.clientSig = sig;
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
    return FALLBACK_CHAT_MODEL;
  }

  private formatOpenAiErr(err: unknown): string {
    if (err instanceof APIError) {
      const body = err.error as {message?: string} | undefined;
      const inner =
        body && typeof body.message === 'string' ? body.message : undefined;
      return [
        err.status != null ? `HTTP ${err.status}` : '',
        inner || err.message,
        err.code ? `code=${err.code}` : '',
      ]
        .filter(Boolean)
        .join(' | ');
    }
    return err instanceof Error ? err.message : String(err);
  }

  private isModelNotFound(err: unknown): boolean {
    if (!(err instanceof APIError)) {
      return false;
    }
    if (err.status === 404) {
      return true;
    }
    const msg = this.formatOpenAiErr(err).toLowerCase();
    return (
      msg.includes('model') &&
      (msg.includes('not found') ||
        msg.includes('does not exist') ||
        msg.includes('invalid'))
    );
  }

  private async chatOnce(
    client: OpenAI,
    model: string,
    systemPrompt: string,
    userMessage: string,
  ): Promise<string> {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        {role: 'system', content: systemPrompt},
        {role: 'user', content: userMessage},
      ],
      max_tokens: 800,
    });
    return completion.choices[0]?.message?.content?.trim() ?? '';
  }

  async reply(message: string, locale: SupportLocale = 'es'): Promise<string> {
    const client = this.getClient();
    if (!client) {
      return userMessage(locale, 'noAssistant');
    }

    let model = this.getModel();
    const extraKnowledge =
      this.config.get<string>('SUPPORT_AI_EXTRA_KNOWLEDGE') ??
      process.env.SUPPORT_AI_EXTRA_KNOWLEDGE;
    const systemPrompt = buildVelleSupportSystemPrompt(
      locale,
      extraKnowledge,
    );

    const debug =
      process.env.SUPPORT_AI_DEBUG_ERRORS === '1' ||
      process.env.SUPPORT_AI_DEBUG_ERRORS === 'true';

    try {
      let text: string;
      try {
        text = await this.chatOnce(client, model, systemPrompt, message);
      } catch (first: unknown) {
        if (
          model !== FALLBACK_CHAT_MODEL &&
          this.isModelNotFound(first)
        ) {
          this.logger.warn(
            `Model "${model}" failed, retrying with ${FALLBACK_CHAT_MODEL}`,
          );
          model = FALLBACK_CHAT_MODEL;
          text = await this.chatOnce(
            client,
            model,
            systemPrompt,
            message,
          );
        } else {
          throw first;
        }
      }

      if (!text) {
        this.logger.warn('OpenAI returned empty content');
        return userMessage(locale, 'emptyReply');
      }
      return text;
    } catch (err: unknown) {
      const detail = this.formatOpenAiErr(err);

      if (err instanceof APIError && err.status === 429) {
        this.logger.warn(
          `OpenAI quota/rate limit (model=${model}): ${detail}`,
        );
        return userMessage(locale, 'quotaExceeded');
      }

      this.logger.error(`OpenAI chat failed (model=${model}): ${detail}`);

      const key = this.readOpenAiKey();
      const needsProject =
        key?.startsWith('sk-proj-') && !this.readOpenAiProject();

      if (debug) {
        throw new HttpException(
          {
            message: 'AI chat error',
            hint: detail.slice(0, 500),
            openaiProjectConfigured: !!this.readOpenAiProject(),
            tip: needsProject
              ? 'Clave sk-proj-: añade OPENAI_PROJECT_ID o VELLE_OPENAI_PROJECT_ID en Railway (ID del proyecto en OpenAI Platform).'
              : undefined,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
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
    openaiProjectIdLength: number;
    keyLooksLikeProjectKey: boolean;
  } {
    const envKeysMatchingOpenai = Object.keys(process.env).filter(k =>
      /openai/i.test(k),
    );
    const key = this.readOpenAiKey();
    const fromProcess = this.normalizeKey(process.env.OPENAI_API_KEY);
    const fromVelle = this.normalizeKey(process.env.VELLE_OPENAI_API_KEY);
    const fromConfig = this.normalizeKey(
      this.config.get<string>('OPENAI_API_KEY'),
    );
    const proj = this.readOpenAiProject();
    return {
      envKeysMatchingOpenai,
      openaiApiKeyLength: fromProcess?.length ?? 0,
      velleOpenaiApiKeyLength: fromVelle?.length ?? 0,
      fromConfigLength: fromConfig?.length ?? 0,
      openaiProjectIdLength: proj?.length ?? 0,
      keyLooksLikeProjectKey: key?.startsWith('sk-proj-') ?? false,
    };
  }
}
