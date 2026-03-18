import type {SupportLocale} from './velle-app-knowledge';

/** Respuestas sin LLM (clave ausente, cuota, error vacío). */
export const SUPPORT_USER_MESSAGES: Record<
  SupportLocale,
  {
    noAssistant: string;
    emptyReply: string;
    quotaExceeded: string;
  }
> = {
  es: {
    noAssistant:
      'Por ahora el asistente inteligente no está disponible. Escríbenos a soporte@velle.app.',
    emptyReply:
      'No pude generar una respuesta. Inténtalo de nuevo o escríbenos a soporte@velle.app.',
    quotaExceeded:
      'El asistente no está disponible ahora por límite del servicio. Escríbenos a soporte@velle.app o por WhatsApp.',
  },
  en: {
    noAssistant:
      'The smart assistant is not available right now. Email us at soporte@velle.app.',
    emptyReply:
      'Could not generate a reply. Try again or email soporte@velle.app.',
    quotaExceeded:
      'The assistant is unavailable due to service limits. Email soporte@velle.app or use WhatsApp.',
  },
  it: {
    noAssistant:
      "L'assistente intelligente non è disponibile. Scrivi a soporte@velle.app.",
    emptyReply:
      'Non sono riuscito a generare una risposta. Riprova o scrivi a soporte@velle.app.',
    quotaExceeded:
      "L'assistente non è disponibile per limiti del servizio. Scrivi a soporte@velle.app o usa WhatsApp.",
  },
  pt: {
    noAssistant:
      'O assistente inteligente não está disponível. Escreva a soporte@velle.app.',
    emptyReply:
      'Não foi possível gerar uma resposta. Tente de novo ou escreva a soporte@velle.app.',
    quotaExceeded:
      'O assistente não está disponível por limite do serviço. Escreva a soporte@velle.app ou use WhatsApp.',
  },
};

export function userMessage(
  locale: SupportLocale,
  key: keyof (typeof SUPPORT_USER_MESSAGES)['es'],
): string {
  return SUPPORT_USER_MESSAGES[locale][key];
}
