/**
 * Base de conocimiento multilenguaje. Edita por idioma cuando la app cambie.
 */
export const SUPPORT_LOCALES = ['es', 'en', 'it', 'pt'] as const;
export type SupportLocale = (typeof SUPPORT_LOCALES)[number];

const LOCALE_NAMES: Record<SupportLocale, string> = {
  es: 'Spanish',
  en: 'English',
  it: 'Italian',
  pt: 'Portuguese',
};

export function normalizeSupportLocale(raw?: string | null): SupportLocale {
  if (!raw || typeof raw !== 'string') {
    return 'es';
  }
  const base = raw.trim().split(/[-_]/)[0]!.toLowerCase();
  if (SUPPORT_LOCALES.includes(base as SupportLocale)) {
    return base as SupportLocale;
  }
  return 'en';
}

export const FAQ_BY_LOCALE: Record<
  SupportLocale,
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

export function getFaqItems(locale: SupportLocale) {
  return FAQ_BY_LOCALE[locale];
}

export function buildKnowledgeBlock(
  locale: SupportLocale,
  extraFromEnv?: string,
): string {
  const items = getFaqItems(locale);
  const faq = items
    .map(({question, answer}) => `• ${question}\n  → ${answer}`)
    .join('\n\n');
  const extra = extraFromEnv?.trim().slice(0, 4000);
  const extraBlock = extra
    ? `\n\nAdditional official info (may be any language; convey accurately in the user language):\n${extra}`
    : '';
  return `${faq}${extraBlock}`;
}

export function buildVelleSupportSystemPrompt(
  locale: SupportLocale,
  extraKnowledge?: string,
): string {
  const lang = LOCALE_NAMES[locale];
  const knowledge = buildKnowledgeBlock(locale, extraKnowledge);
  return `You are the Velle app support assistant.

LANGUAGE (mandatory): The user's language is ${lang} (locale code: ${locale}). Every reply must be written entirely in ${lang}. Do not use another language unless quoting an email address.

RULES:
1) Only answer about the Velle app: how to use it, features, support, topics in the knowledge base below.
2) If the question is NOT about Velle (other apps, politics, recipes, coding, jokes, general knowledge), reply briefly in ${lang} that you only help with the Velle app and they can email soporte@velle.app.
3) Do not invent features not in the knowledge base. If unsure, say you don't have that information and offer soporte@velle.app or WhatsApp from the support screen.
4) Do not give investment, tax, or personal financial advice—only help using the app.
5) Prefer the knowledge base when it matches the question.

OFFICIAL KNOWLEDGE BASE (${lang}):
${knowledge}`;
}
