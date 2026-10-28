// Nombres/códigos de idioma para las 3 llamadas de IA que viven en api/
// (breakdown-task.js, companion-response.js, quick-capture.js). Vive en
// src/ a propósito, NO en api/ — cada archivo dentro de api/ cuenta como
// una función serverless separada en el plan Hobby de Vercel (12 máximo,
// ver la nota en api/breakdown-task.js), así que un helper compartido tiene
// que vivir fuera de esa carpeta para no gastar ese límite.
//
// El navegador manda el idioma que la paciente eligió en la app (ver
// src/i18n.js) en el campo "language" de cada body — nunca se detecta del
// texto que escribió/dictó, porque alguien puede escribir en español
// aunque haya elegido inglés como idioma de la app (o viceversa), y la
// respuesta de la IA siempre debe salir en el idioma de la app, no en el
// del mensaje de entrada.
export const SUPPORTED_AI_LANGUAGES = ["es", "en", "fr", "pt"];

const AI_LANGUAGE_NAMES = {
  es: "español de México",
  en: "English",
  fr: "français",
  pt: "português do Brasil",
};

// Código corto que espera el campo "language" de la API de transcripción
// de OpenAI (Whisper) — mismos 4 códigos que ya usa src/i18n.js.
const WHISPER_LANGUAGE_CODES = {
  es: "es",
  en: "en",
  fr: "fr",
  pt: "pt",
};

export function resolveAiLanguage(language) {
  return SUPPORTED_AI_LANGUAGES.includes(language) ? language : "es";
}

export function aiLanguageName(language) {
  return AI_LANGUAGE_NAMES[resolveAiLanguage(language)];
}

export function whisperLanguageCode(language) {
  return WHISPER_LANGUAGE_CODES[resolveAiLanguage(language)];
}

// Frase que se agrega al final de cada prompt de sistema (que sigue
// redactado en español — son instrucciones para el modelo, nunca texto que
// vea la paciente) para reforzar en qué idioma debe salir la respuesta,
// sin importar el idioma del texto de entrada ni el del resto del prompt.
export function languageDirective(language) {
  return ` Responde siempre en ${aiLanguageName(language)}, sin importar en qué idioma esté el texto que te dieron.`;
}

// Mensajes de error que SÍ llegan a verse en la app (límite mensual
// alcanzado, falla de la IA, nota de voz vacía) — a diferencia de los
// mensajes de validación de body/método, que nunca pasan de un request mal
// formado y el navegador nunca manda. Estos van directo en el JSON de
// respuesta (nunca pasan por un prompt de IA), así que necesitan su propia
// traducción fija en los 4 idiomas, no una instrucción para el modelo.
const AI_ERROR_MESSAGES = {
  es: {
    breakdownLimit: (limit) =>
      `Llegaste al límite de ${limit} desgloses con IA este mes. Mientras tanto puedes seguir usando el desglosador manual, aquí mismo.`,
    breakdownFailed: "No se pudo desglosar la tarea con IA. Intenta de nuevo en un momento.",
    messageToneLimit: (limit) => `Llegaste al límite de ${limit} usos de ayuda con mensajes este mes.`,
    messageToneFailed: "No se pudo procesar el mensaje con IA.",
    companionLimit: (limit) => `Llegaste al límite de ${limit} respuestas de apoyo con IA este mes.`,
    companionFailed: "No se pudo generar una respuesta con IA.",
    quickCaptureLimit: (limit) => `Llegaste al límite de ${limit} capturas rápidas con IA este mes.`,
    quickCaptureEmpty: "No se entendió ninguna palabra. Intenta de nuevo.",
    quickCaptureFailed: "No se pudo procesar la nota. Intenta de nuevo en un momento.",
    brainDumpLimit: (limit) => `Llegaste al límite de ${limit} descargas mentales con IA este mes.`,
    brainDumpEmpty: "No se entendió ninguna palabra. Intenta de nuevo.",
    brainDumpFailed: "No se pudo separar lo que escribiste. Intenta de nuevo en un momento.",
  },
  en: {
    breakdownLimit: (limit) =>
      `You've reached the limit of ${limit} AI breakdowns this month. In the meantime you can keep using the manual breakdown tool right here.`,
    breakdownFailed: "Couldn't break down the task with AI. Try again in a moment.",
    messageToneLimit: (limit) => `You've reached the limit of ${limit} uses of message help this month.`,
    messageToneFailed: "Couldn't process the message with AI.",
    companionLimit: (limit) => `You've reached the limit of ${limit} AI support replies this month.`,
    companionFailed: "Couldn't generate a reply with AI.",
    quickCaptureLimit: (limit) => `You've reached the limit of ${limit} AI quick captures this month.`,
    quickCaptureEmpty: "Nothing was understood. Try again.",
    quickCaptureFailed: "Couldn't process the note. Try again in a moment.",
    brainDumpLimit: (limit) => `You've reached the limit of ${limit} AI brain dumps this month.`,
    brainDumpEmpty: "Nothing was understood. Try again.",
    brainDumpFailed: "Couldn't split up what you wrote. Try again in a moment.",
  },
  fr: {
    breakdownLimit: (limit) =>
      `Tu as atteint la limite de ${limit} découpages avec IA ce mois-ci. En attendant, tu peux continuer à utiliser le découpage manuel, ici même.`,
    breakdownFailed: "Impossible de découper la tâche avec l'IA. Réessaie dans un instant.",
    messageToneLimit: (limit) => `Tu as atteint la limite de ${limit} utilisations de l'aide aux messages ce mois-ci.`,
    messageToneFailed: "Impossible de traiter le message avec l'IA.",
    companionLimit: (limit) => `Tu as atteint la limite de ${limit} réponses de soutien avec IA ce mois-ci.`,
    companionFailed: "Impossible de générer une réponse avec l'IA.",
    quickCaptureLimit: (limit) => `Tu as atteint la limite de ${limit} captures rapides avec IA ce mois-ci.`,
    quickCaptureEmpty: "Rien n'a été compris. Réessaie.",
    quickCaptureFailed: "Impossible de traiter la note. Réessaie dans un instant.",
    brainDumpLimit: (limit) => `Tu as atteint la limite de ${limit} décharges mentales avec IA ce mois-ci.`,
    brainDumpEmpty: "Rien n'a été compris. Réessaie.",
    brainDumpFailed: "Impossible de séparer ce que tu as écrit. Réessaie dans un instant.",
  },
  pt: {
    breakdownLimit: (limit) =>
      `Você atingiu o limite de ${limit} desmembramentos com IA este mês. Enquanto isso, você pode continuar usando o desmembrador manual, aqui mesmo.`,
    breakdownFailed: "Não foi possível desmembrar a tarefa com IA. Tente de novo em um momento.",
    messageToneLimit: (limit) => `Você atingiu o limite de ${limit} usos de ajuda com mensagens este mês.`,
    messageToneFailed: "Não foi possível processar a mensagem com IA.",
    companionLimit: (limit) => `Você atingiu o limite de ${limit} respostas de apoio com IA este mês.`,
    companionFailed: "Não foi possível gerar uma resposta com IA.",
    quickCaptureLimit: (limit) => `Você atingiu o limite de ${limit} capturas rápidas com IA este mês.`,
    quickCaptureEmpty: "Nada foi entendido. Tente de novo.",
    quickCaptureFailed: "Não foi possível processar a nota. Tente de novo em um momento.",
    brainDumpLimit: (limit) => `Você atingiu o limite de ${limit} descargas mentais com IA este mês.`,
    brainDumpEmpty: "Nada foi entendido. Tente de novo.",
    brainDumpFailed: "Não foi possível separar o que você escreveu. Tente de novo em um momento.",
  },
};

export function aiErrorMessages(language) {
  return AI_ERROR_MESSAGES[resolveAiLanguage(language)];
}
