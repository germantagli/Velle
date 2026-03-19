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
    {
      question: '¿Cómo hago una transferencia a otro usuario?',
      answer:
        'Ve a la pestaña Transferencias (o Inicio → Transferir). Elige enviar a un contacto, busca a la persona por nombre, email o teléfono, ingresa el monto en USDT y confirma. Asegúrate de tener saldo suficiente.',
    },
    {
      question: '¿Cómo transfiero o retiro hacia Estados Unidos (EE. UU.)?',
      answer:
        'En Inicio usa la opción de retiro o envío a EE. UU. (icono bandera 🇺🇸). Sigue los pasos en pantalla: datos del destino, monto y confirmación. Los requisitos pueden variar; si algo falla, escribe a soporte@velle.app.',
    },
    {
      question: '¿Cómo agrego bolívares (VES) a mi cuenta?',
      answer:
        'En Inicio pulsa Agregar VES, indica el monto y completa el pago móvil con la referencia que te indica la app. El abono puede tardar unos minutos en reflejarse.',
    },
    {
      question: '¿Cómo convierto entre USDT y bolívares?',
      answer:
        'En Inicio entra en Convertir: elige la dirección del cambio (USDT ↔ VES), el monto y confirma. Revisa el tipo de cambio mostrado antes de aceptar.',
    },
    {
      question: '¿Dónde veo el historial de mis movimientos?',
      answer:
        'En Inicio hay un enlace al historial de transacciones, o usa la pestaña Historial del menú inferior. Ahí verás transferencias, recargas y otros movimientos.',
    },
    {
      question: '¿Cómo cambio mi contraseña?',
      answer:
        'Perfil → Seguridad → Cambiar contraseña. Si aún no definiste contraseña, la misma pantalla te permite crearla. Si no recuerdas la actual, usa recuperar acceso desde el inicio de sesión.',
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
    {
      question: 'How do I transfer to another Velle user?',
      answer:
        'Open the Transfers tab (or Home → Transfer). Choose send to a contact, find the person by name, email or phone, enter the USDT amount and confirm. You need enough balance.',
    },
    {
      question: 'How do I send or withdraw to the United States?',
      answer:
        'On Home use the USA withdrawal/send option (🇺🇸). Follow the on-screen steps: destination details, amount and confirm. If something fails, email soporte@velle.app.',
    },
    {
      question: 'How do I add bolivars (VES) to my balance?',
      answer:
        'On Home tap Add VES, enter the amount and complete mobile payment with the reference shown in the app. It may take a few minutes to appear.',
    },
    {
      question: 'How do I convert between USDT and bolivars?',
      answer:
        'On Home open Convert, pick the direction (USDT ↔ VES), amount and confirm. Check the rate shown before accepting.',
    },
    {
      question: 'Where is my transaction history?',
      answer:
        'From Home use the link to transaction history, or open the History tab in the bottom menu.',
    },
    {
      question: 'How do I change my password?',
      answer:
        'Profile → Security → Change password. If you never set one, you can create it there. If you forgot it, use recovery from the login screen.',
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
    {
      question: 'Come trasferisco a un altro utente Velle?',
      answer:
        "Vai al tab Trasferimenti (o Home → Trasferisci). Scegli invio a contatto, cerca la persona per nome, email o telefono, importo in USDT e conferma. Serve saldo sufficiente.",
    },
    {
      question: 'Come invio o prelevo verso gli Stati Uniti?',
      answer:
        "In Home usa l'opzione prelievo/invio USA (🇺🇸). Segui i passaggi: dati destinazione, importo e conferma. Per problemi scrivi a soporte@velle.app.",
    },
    {
      question: 'Come aggiungo bolívares (VES)?',
      answer:
        "In Home tocca Aggiungi VES, importo e paga con mobile payment usando il riferimento mostrato. L'accredito può richiedere alcuni minuti.",
    },
    {
      question: 'Come converto tra USDT e bolívares?',
      answer:
        "In Home apri Converti, scegli direzione USDT ↔ VES, importo e conferma. Controlla il tasso prima di accettare.",
    },
    {
      question: 'Dove vedo lo storico delle transazioni?',
      answer:
        "Da Home il link allo storico, oppure il tab Cronologia nel menu in basso.",
    },
    {
      question: 'Come cambio la password?',
      answer:
        'Profilo → Sicurezza → Cambia password. Se non l’hai mai impostata, puoi crearla lì. Se l’hai dimenticata, usa il recupero dal login.',
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
    {
      question: 'Como transfiro para outro usuário Velle?',
      answer:
        'Vá em Transferências (ou Início → Transferir). Envie a um contato, busque por nome, email ou telefone, valor em USDT e confirme. Precisa de saldo.',
    },
    {
      question: 'Como envio ou saco para os Estados Unidos?',
      answer:
        'No Início use a opção de saque/envio EUA (🇺🇸). Siga os passos: dados do destino, valor e confirmação. Dúvidas: soporte@velle.app.',
    },
    {
      question: 'Como adiciono bolívares (VES)?',
      answer:
        'No Início toque Adicionar VES, valor e pague com pagamento móvel usando a referência do app. Pode levar alguns minutos.',
    },
    {
      question: 'Como converto entre USDT e bolívares?',
      answer:
        'No Início abra Converter, escolha USDT ↔ VES, valor e confirme. Veja a cotação antes de aceitar.',
    },
    {
      question: 'Onde vejo o histórico de transações?',
      answer:
        'No Início há link para o histórico, ou use a aba Histórico no menu inferior.',
    },
    {
      question: 'Como altero minha senha?',
      answer:
        'Perfil → Segurança → Alterar senha. Se ainda não definiu senha, pode criar aí. Esqueceu? Use recuperação no login.',
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
