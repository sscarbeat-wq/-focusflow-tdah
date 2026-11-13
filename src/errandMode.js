// errandMode.js — Lógica pura de "Modo Salida" (13 de noviembre de 2026).
//
// Para qué existe: en TDAH la memoria de trabajo suelta la lista mental al
// primer distractor del camino ("íbamos por líquido de lentes y gasolina,
// regresamos con gasolina y pan"). Esta herramienta saca la lista de la
// cabeza: la persona la dicta ANTES de salir y la app la sostiene — en
// pantalla, en la bandeja de notificaciones y con avisos mientras falte algo.
//
// Sin React ni JSX a propósito: este mismo archivo lo importa el cron de
// api/send-reminders.js (?check=errands), igual que scheduleBlocks.js.
//
// Estado (se guarda dentro de progress.data, como todo lo demás):
//   { errands: [Trip], archive: [Trip] }
// Trip: { id, items: [Item], createdAt (ISO), completedAt, active }
// Item: { id, text, icon, checked, checkedAt }

export const DEFAULT_ERRAND_STATE = { errands: [], archive: [] };

const MAX_ITEMS_PER_TRIP = 12;
const MAX_ITEM_LENGTH = 80;
const MAX_ARCHIVE = 10;

let seq = 0;
function uid(prefix) {
  seq += 1;
  return `${prefix}_${Date.now().toString(36)}_${seq}_${Math.random().toString(36).slice(2, 6)}`;
}

// Tolerante a datos viejos o corruptos: siempre regresa la forma esperada.
export function normalizeErrandState(state) {
  const s = state && typeof state === "object" ? state : {};
  return {
    errands: Array.isArray(s.errands) ? s.errands : [],
    archive: Array.isArray(s.archive) ? s.archive : [],
  };
}

// ---- Ícono según lo que dice el mandado ----
const ICON_RULES = [
  [/lente|óptica|optica|contact lens|lentille|lunette/, "👓"],
  [/gasolin|gasoliner|tanque|di[eé]sel|\bfuel\b|\bgas\b|\bessence\b|abastecer|posto/, "⛽"],
  [/farmacia|pharmac|medicin|medicament|receta|remédio|remedio|pastilla/, "💊"],
  [/\bpan\b|panader|bolillo|\bbread\b|baker|\bpain\b|boulanger|\bpão\b|padaria/, "🥖"],
  [/tortilla/, "🫓"],
  [/\bagua\b|garraf[oó]n|\bwater\b|\beau\b/, "💧"],
  [/banco|\bbank|cajero|\batm\b|banque/, "🏦"],
  [/doctor|dentista|consulta|hospital|cl[ií]nica|laboratorio|an[aá]lisis/, "🏥"],
  [/recoger|pick up|buscar a|escuela|school|guarder[ií]a/, "🎒"],
  [/paquete|paqueter[ií]a|correo|package|\bmail\b|env[ií]o|colis|encomenda/, "📦"],
  [/tintorer[ií]a|lavander[ií]a|dry clean|laundry|pressing/, "👔"],
  [/llave|cerrajer|\bkeys?\b|locksmith/, "🔑"],
  [/veterinar|croquetas|\bvet\b|mascota|\bpet\b/, "🐾"],
  [/caf[eé]|coffee/, "☕"],
  [/pagar|\bpago\b|recibo|tr[aá]mite|\bpay\b|\bbill\b|factura/, "🧾"],
  [/ferreter[ií]a|tlapaler[ií]a|hardware/, "🔧"],
  [/papeler[ií]a|copias|imprimir|stationery|\bprint/, "🖨️"],
  [/super|mercado|tienda|despensa|grocer|\bshop|courses|compras/, "🛒"],
  [/comprar|\bbuy\b|acheter/, "🛍️"],
];

export function pickErrandIcon(text) {
  const t = String(text || "").toLowerCase();
  for (const [pattern, icon] of ICON_RULES) {
    if (pattern.test(t)) return icon;
  }
  return "📌";
}

// ---- Texto dictado o escrito → lista de mandados ----
// "Voy a salir a comprar líquido de lentes, cargar gasolina y pasar por pan"
//   → ["Comprar líquido de lentes", "Cargar gasolina", "Pasar por pan"]
const LEAD_IN =
  /^(?:(?:hoy|ahorita|al rato|oye|bueno|ok|pues)\s+)*(?:(?:voy|vamos|vas|iba|íbamos)\s+a\s+(?:salir|ir)\s+a|(?:voy|vamos)\s+a|(?:tengo|tenemos|hay)\s+que(?:\s+(?:salir|ir)\s+a)?|necesito|necesitamos|debo|quiero|(?:salir|ir)\s+a|recu[eé]rdame(?:\s+que)?|i(?:'m| am)\s+going\s+to|i\s+(?:need|have|want)\s+to|we\s+(?:need|have)\s+to|je\s+dois|il\s+faut|nous\s+devons|preciso(?:\s+de)?|tenho\s+que|vou)\s+/i;

const CONNECTORS =
  /\s*(?:[,;.\n]+|\s+(?:y|e|and|et)\s+(?:luego|despu[eé]s|tambi[eé]n|then|also|puis|depois)\s+|\s+(?:luego|despu[eé]s|tambi[eé]n|then|also|puis|depois)\s+|\s+(?:y|e|and|et)\s+)\s*/i;

export function parseErrandText(raw) {
  if (typeof raw !== "string") return [];
  const text = raw.replace(/\s+/g, " ").trim().replace(LEAD_IN, "");
  if (!text) return [];

  const seen = new Set();
  const items = [];
  for (const piece of text.split(CONNECTORS)) {
    let name = String(piece || "")
      .trim()
      .replace(/^(?:(?:y|e|and|et|luego|despu[eé]s|tambi[eé]n|then|also|puis|depois)\s+)+/i, "") // ", también recoger..." → "recoger..."
      .replace(/^(?:a|de|to)\s+/i, "") // "...y a cargar gasolina" → "cargar gasolina"
      .replace(/^[\s,.\-–—¿?¡!]+|[\s,.\-–—¿?¡!]+$/g, "")
      .slice(0, MAX_ITEM_LENGTH);
    if (name.length < 2) continue;
    name = name.charAt(0).toUpperCase() + name.slice(1);
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({ id: uid("it"), text: name, icon: pickErrandIcon(name), checked: false, checkedAt: null });
    if (items.length >= MAX_ITEMS_PER_TRIP) break;
  }
  return items;
}

// ---- Consultas ----
export function activeTrip(state) {
  return normalizeErrandState(state).errands.find((trip) => trip && trip.active) || null;
}
export function pendingItems(trip) {
  return trip && Array.isArray(trip.items) ? trip.items.filter((it) => !it.checked) : [];
}
export function allChecked(trip) {
  return !!trip && Array.isArray(trip.items) && trip.items.length > 0 && trip.items.every((it) => it.checked);
}
export function tripProgress(trip) {
  if (!trip || !Array.isArray(trip.items) || trip.items.length === 0) return 0;
  return trip.items.filter((it) => it.checked).length / trip.items.length;
}

// ---- Acciones (todas regresan un estado nuevo) ----

// Agrega mandados a la salida activa; si no hay ninguna, la crea. Una sola
// salida activa a la vez — dos listas abiertas serían otra cosa que recordar.
export function addErrands(state, items, now = new Date()) {
  const s = normalizeErrandState(state);
  const incoming = (items || []).filter((it) => it && it.text);
  if (incoming.length === 0) return s;
  const current = s.errands.find((trip) => trip.active);
  if (!current) {
    const trip = {
      id: uid("trip"),
      items: incoming.slice(0, MAX_ITEMS_PER_TRIP),
      createdAt: now.toISOString(),
      completedAt: null,
      active: true,
    };
    return { ...s, errands: [trip] };
  }
  const have = new Set(current.items.map((it) => it.text.toLowerCase()));
  const fresh = incoming.filter((it) => !have.has(it.text.toLowerCase()));
  const merged = [...current.items, ...fresh].slice(0, MAX_ITEMS_PER_TRIP);
  return { ...s, errands: s.errands.map((trip) => (trip.id === current.id ? { ...trip, items: merged } : trip)) };
}

export function toggleErrandItem(state, tripId, itemId, now = new Date()) {
  const s = normalizeErrandState(state);
  return {
    ...s,
    errands: s.errands.map((trip) =>
      trip.id !== tripId
        ? trip
        : {
            ...trip,
            items: trip.items.map((it) =>
              it.id !== itemId ? it : { ...it, checked: !it.checked, checkedAt: it.checked ? null : now.toISOString() }
            ),
          }
    ),
  };
}

// Quitar el último mandado que quedaba cierra la salida (lista vacía = nada
// que sostener), sin archivarla ni dar puntos.
export function removeErrandItem(state, tripId, itemId) {
  const s = normalizeErrandState(state);
  return {
    ...s,
    errands: s.errands
      .map((trip) => (trip.id !== tripId ? trip : { ...trip, items: trip.items.filter((it) => it.id !== itemId) }))
      .filter((trip) => trip.items.length > 0),
  };
}

export function completeTrip(state, tripId, now = new Date()) {
  const s = normalizeErrandState(state);
  const trip = s.errands.find((x) => x.id === tripId);
  if (!trip) return s;
  return {
    errands: s.errands.filter((x) => x.id !== tripId),
    archive: [{ ...trip, active: false, completedAt: now.toISOString() }, ...s.archive].slice(0, MAX_ARCHIVE),
  };
}

export function cancelTrip(state, tripId) {
  const s = normalizeErrandState(state);
  return { ...s, errands: s.errands.filter((x) => x.id !== tripId) };
}

// ---- Avisos ----
// Misma etiqueta para el aviso que pone la app y para el push del servidor:
// así uno reemplaza al otro en la bandeja en vez de amontonarse.
export const ERRAND_NOTIFICATION_TAG = "anro-mandados";

// Texto del aviso (español por defecto — el cron solo manda en español,
// igual que el resto de api/send-reminders.js; la app pasa sus traducciones).
export function errandNotificationContent(trip, strings = {}) {
  const pending = pendingItems(trip);
  if (pending.length === 0) return null;
  const n = pending.length;
  const title = strings.title
    ? strings.title(n)
    : `🚗 Te ${n === 1 ? "falta" : "faltan"} ${n} mandado${n === 1 ? "" : "s"}`;
  const list = pending.map((it) => `${it.icon} ${it.text}`).join(" · ");
  const suffix = strings.suffix || "Antes de regresar, revisa tu lista.";
  return { title, body: `${list}\n${suffix}`, tag: ERRAND_NOTIFICATION_TAG };
}

// ¿Le toca aviso a esta salida en ESTA corrida del cron de 15 minutos?
// Primer aviso entre los 15 y 30 minutos de haber armado la lista y luego
// cada 30 minutos, hasta 3 horas. Pasado ese tiempo ya no se insiste: una
// lista vieja que sigue sonando es ruido, y el ruido enseña a ignorar.
// Se calcula solo con createdAt para no tener que escribir nada en la base.
export const ERRAND_REMINDER_MAX_MIN = 180;
export function errandReminderDue(trip, nowMs = Date.now()) {
  if (!trip || !trip.active || pendingItems(trip).length === 0) return false;
  const created = Date.parse(trip.createdAt);
  if (Number.isNaN(created)) return false;
  const elapsedMin = (nowMs - created) / 60000;
  if (elapsedMin < 15 || elapsedMin >= ERRAND_REMINDER_MAX_MIN) return false;
  return Math.floor(elapsedMin / 15) % 2 === 1;
}
