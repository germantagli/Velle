import {IsNotEmpty, IsOptional, IsString, MaxLength} from 'class-validator';

export class AiChatDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(8000)
  message: string;

  /** Idioma de la app: es, en, it, pt (ej. desde i18n). */
  @IsOptional()
  @IsString()
  @MaxLength(12)
  locale?: string;
}

