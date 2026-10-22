// Tout l'affichage se fait à l'heure de Paris, côté serveur, pour que le
// rendu soit identique quel que soit le fuseau de la machine.
export const TZ = "Europe/Paris";

const fmt = (opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, ...opts });

const dowFmt = fmt({ weekday: "short" });
const dayFmt = fmt({ day: "2-digit" });
const monthFmt = fmt({ month: "short" });
const timeFmt = fmt({ hour: "2-digit", minute: "2-digit" });
const longFmt = fmt({ weekday: "long", day: "numeric", month: "long" });
const keyFmt = fmt({ year: "numeric", month: "2-digit", day: "2-digit" });
const monthYearFmt = fmt({ month: "long", year: "numeric" });

const clean = (s: string) => s.replace(".", "");

/** « 2026-10-24 » à Paris : sert à comparer des jours. */
export const dayKey = (d: Date) => keyFmt.format(d).split("/").reverse().join("-");

export const isToday = (iso: string, now = new Date()) => dayKey(new Date(iso)) === dayKey(now);

/** Morceaux pour la souche du ticket : « sam » / « 24 » / « oct ». */
export function stubParts(iso: string) {
  const d = new Date(iso);
  return { dow: clean(dowFmt.format(d)), day: dayFmt.format(d), month: clean(monthFmt.format(d)) };
}

/** « 20:30 » */
export const formatTime = (iso: string) => timeFmt.format(new Date(iso));

/** « samedi 24 octobre » */
export const formatLongDate = (iso: string) => longFmt.format(new Date(iso));

/** « Sam · 20:30 » */
export function formatShort(iso: string) {
  const dow = clean(dowFmt.format(new Date(iso)));
  return `${dow.charAt(0).toUpperCase()}${dow.slice(1)} · ${formatTime(iso)}`;
}

/** « octobre 2026 » */
export const formatMonthYear = (iso: string) => monthYearFmt.format(new Date(iso));

export const formatEuros = (cents: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);

/** Décalage (en minutes) entre l'heure de Paris et UTC à un instant donné. */
function parisOffsetMinutes(at: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(at);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
  return Math.round((asUtc - at.getTime()) / 60000);
}

/** « 2026-10-24 » + « 20:30 » saisis à Paris → ISO UTC. */
export function parisToIso(date: string, time: string) {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  const first = guess - parisOffsetMinutes(new Date(guess)) * 60000;
  // Second passage pour les jours de changement d'heure.
  const exact = guess - parisOffsetMinutes(new Date(first)) * 60000;
  return new Date(exact).toISOString();
}

/** ISO UTC → { date: « 2026-10-24 », time: « 20:30 » } à Paris, pour pré-remplir un formulaire. */
export function isoToParis(iso: string) {
  const d = new Date(iso);
  return { date: dayKey(d), time: formatTime(iso) };
}
