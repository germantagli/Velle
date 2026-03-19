/**
 * Misma base que backend `FAQ_BY_LOCALE`: respuestas locales sin red ni IA.
 * Mantener alineado con `velle-app-knowledge.ts` al cambiar contenido.
 */
export type LocalSupportLocale = 'es' | 'en' | 'it' | 'pt';

export const LOCAL_SUPPORT_FAQ: Record<
  LocalSupportLocale,
  {question: string; answer: string}[]
> = {
  es: [
    {
      question: '¿Qué es Velle?',
      answer:
        'Velle es una app financiera para organizar y entender mejor tu dinero. Las funciones exactas pueden variar según la versión; revisa las pantallas de la app.',
    },
    {
      question: '¿Cómo creo cuenta o inicio sesión?',
      answer:
        'Usa la opción de registro o inicio de sesión en la pantalla principal de la app. Si olvidaste la contraseña, usa recuperación si está disponible o escribe a soporte@velle.app.',
    },
    {
      question: '¿Es segura la app?',
      answer:
        'Velle sigue buenas prácticas de seguridad. No compartas códigos ni contraseñas con nadie. Para incidencias de seguridad, contacta soporte de inmediato.',
    },
    {
      question: '¿Cómo contacto con soporte humano?',
      answer:
        'Puedes escribir a soporte@velle.app o usar WhatsApp desde la pantalla de soporte de la app.',
    },
    {
      question: '¿El asistente da consejos financieros?',
      answer:
        'No. El asistente solo orienta sobre el uso de la app Velle. Para decisiones de inversión o fiscalidad, consulta a un profesional.',
    },
  ],
  en: [
    {
      question: 'What is Velle?',
      answer:
        'Velle is a financial app to organize and understand your money better. Exact features may vary by version; check the app screens.',
    },
    {
      question: 'How do I sign up or log in?',
      answer:
        'Use sign up or log in on the app home screen. If you forgot your password, use recovery if available or email soporte@velle.app.',
    },
    {
      question: 'Is the app secure?',
      answer:
        'Velle follows security best practices. Never share codes or passwords. For security incidents, contact support immediately.',
    },
    {
      question: 'How do I reach human support?',
      answer:
        'Email soporte@velle.app or use WhatsApp from the app support screen.',
    },
    {
      question: 'Does the assistant give financial advice?',
      answer:
        'No. The assistant only helps with using the Velle app. For investment or tax decisions, consult a professional.',
    },
  ],
  it: [
    {
      question: "Cos'è Velle?",
      answer:
        "Velle è un'app finanziaria per organizzare e capire meglio i tuoi soldi. Le funzioni possono variare in base alla versione; controlla le schermate dell'app.",
    },
    {
      question: 'Come creo un account o accedo?',
      answer:
        "Usa registrazione o accesso dalla schermata principale. Se hai dimenticato la password, usa il recupero se disponibile o scrivi a soporte@velle.app.",
    },
    {
      question: "L'app è sicura?",
      answer:
        'Velle segue buone pratiche di sicurezza. Non condividere codici o password. Per problemi di sicurezza, contatta subito il supporto.',
    },
    {
      question: 'Come contatto il supporto umano?',
      answer:
        'Scrivi a soporte@velle.app o usa WhatsApp dalla schermata supporto dell’app.',
    },
    {
      question: "L'assistente dà consigli finanziari?",
      answer:
        "No. L'assistente aiuta solo sull'uso dell'app Velle. Per investimenti o fiscalità, consulta un professionista.",
    },
  ],
  pt: [
    {
      question: 'O que é a Velle?',
      answer:
        'A Velle é um app financeiro para organizar e entender melhor seu dinheiro. As funções podem variar conforme a versão; veja as telas do app.',
    },
    {
      question: 'Como crio conta ou faço login?',
      answer:
        'Use cadastro ou login na tela inicial. Se esqueceu a senha, use a recuperação se existir ou escreva a soporte@velle.app.',
    },
    {
      question: 'O app é seguro?',
      answer:
        'A Velle segue boas práticas de segurança. Não compartilhe códigos ou senhas. Para incidentes de segurança, contacte o suporte.',
    },
    {
      question: 'Como falo com suporte humano?',
      answer:
        'Escreva a soporte@velle.app ou use o WhatsApp na tela de suporte do app.',
    },
    {
      question: 'O assistente dá conselhos financeiros?',
      answer:
        'Não. O assistente só ajuda no uso do app Velle. Para investimentos ou impostos, consulte um profissional.',
    },
  ],
};

export function normalizeLocalLocale(lang?: string): LocalSupportLocale {
  const base = (lang || 'es').split(/[-_]/)[0]!.toLowerCase();
  if (base === 'es' || base === 'en' || base === 'it' || base === 'pt') {
    return base;
  }
  return 'en';
}

export function getLocalFaqItems(locale: LocalSupportLocale) {
  return LOCAL_SUPPORT_FAQ[locale];
}

/** Respuesta por texto libre: coincide con preguntas frecuentes (sin IA). */
export function matchLocalFaqAnswer(
  locale: LocalSupportLocale,
  userText: string,
): string | null {
  const items = getLocalFaqItems(locale);
  const t = userText.trim().toLowerCase();
  if (!t) {
    return null;
  }

  for (const {question, answer} of items) {
    if (question.trim().toLowerCase() === t) {
      return answer;
    }
  }

  const words = t.split(/[\s?.!,;:]+/).filter(w => w.length > 2);
  let best: {answer: string; score: number} | null = null;

  for (const {question, answer} of items) {
    const q = question.toLowerCase();
    let score = 0;
    for (const w of words) {
      if (q.includes(w)) {
        score += 2;
      }
    }
    if (t.length >= 4 && (q.includes(t) || t.includes(q.slice(0, Math.min(24, q.length))))) {
      score += 4;
    }
    if (score > (best?.score ?? 0)) {
      best = {answer, score};
    }
  }

  if (best && best.score >= 2) {
    return best.answer;
  }
  return null;
}
