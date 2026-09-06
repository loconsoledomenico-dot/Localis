/**
 * Piccola astrazione KV su Upstash Redis, con fallback in memoria.
 *
 * Le funzioni serverless sono effimere e girano su piu' istanze insieme:
 * una `Map` a livello di modulo non tiene stato condiviso (si azzera a ogni
 * cold start e non e' visibile alle altre istanze). Qui lo stato vive su
 * Redis, e la memoria resta solo per `astro dev` e per i test, dove le
 * variabili d'ambiente non ci sono.
 *
 * Usato per stato che deve sopravvivere ai cold start: contatori rate-limit,
 * consumi mensili, revoca JWT, entitlements.
 *
 * ATTENZIONE al fallback. Nella versione Netlify un errore a runtime faceva
 * ripiegare in memoria in silenzio: un entitlement scritto cosi' sparisce al
 * cold start successivo e il cliente che ha pagato resta fuori, senza che
 * niente lo segnali. Qui il fallback vale SOLO quando Redis non e'
 * configurato (dev, test). Se e' configurato e fallisce, l'errore sale: un
 * webhook Stripe che va in errore viene ritentato, un successo finto no.
 */
import { Redis } from '@upstash/redis';

const memory = new Map<string, string>();

// Vercel Marketplace inietta KV_REST_API_*; Upstash diretto usa UPSTASH_*.
function credentials(): { url: string; token: string } | null {
  const env = process.env;
  const url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
  const token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

let client: Redis | null | undefined;
function redis(): Redis | null {
  if (client !== undefined) return client;
  const creds = credentials();
  // automaticDeserialization: false — il client Upstash altrimenti fa
  // JSON.parse da solo in lettura, e qui i valori SONO gia' stringhe JSON:
  // tornerebbe un oggetto, String() lo renderebbe '[object Object]' e il
  // JSON.parse successivo fallirebbe restituendo null. Cioe' un cliente
  // pagante senza accesso, senza un errore visibile.
  client = creds ? new Redis({ url: creds.url, token: creds.token, automaticDeserialization: false }) : null;
  return client;
}

const k = (name: string, key: string) => `${name}:${key}`;

export async function kvGet(name: string, key: string): Promise<string | null> {
  const r = redis();
  if (!r) return memory.get(k(name, key)) ?? null;
  const value = await r.get<string>(k(name, key));
  return value == null ? null : String(value);
}

export async function kvSet(name: string, key: string, value: string): Promise<void> {
  const r = redis();
  if (!r) {
    memory.set(k(name, key), value);
    return;
  }
  await r.set(k(name, key), value);
}

export async function kvGetJSON<T>(name: string, key: string): Promise<T | null> {
  const raw = await kvGet(name, key);
  if (raw == null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function kvSetJSON(name: string, key: string, value: unknown): Promise<void> {
  await kvSet(name, key, JSON.stringify(value));
}

/**
 * Incremento atomico dentro una mappa (un documento per giorno, un campo per
 * partner o percorso). Sostituisce il ciclo leggi-modifica-riscrivi con ETag
 * che serviva su Blobs: qui due richieste contemporanee non si sovrascrivono
 * piu', ci pensa Redis.
 */
export async function kvHIncrBy(name: string, key: string, field: string, by = 1): Promise<void> {
  const r = redis();
  if (!r) {
    const mapKey = k(name, key);
    const rec = JSON.parse(memory.get(mapKey) || '{}') as Record<string, number>;
    rec[field] = (rec[field] || 0) + by;
    memory.set(mapKey, JSON.stringify(rec));
    return;
  }
  await r.hincrby(k(name, key), field, by);
}

export async function kvHGetAll(name: string, key: string): Promise<Record<string, number>> {
  const r = redis();
  if (!r) return JSON.parse(memory.get(k(name, key)) || '{}') as Record<string, number>;
  // Con automaticDeserialization disattivata, hgetall torna l'array piatto
  // [campo, valore, campo, valore, ...] invece di un oggetto. Va ricomposto
  // a mano: passarci sopra con Object.entries darebbe gli indici numerici.
  const raw = await r.hgetall(k(name, key));
  if (!raw) return {};
  const out: Record<string, number> = {};
  if (Array.isArray(raw)) {
    for (let i = 0; i + 1 < raw.length; i += 2) out[String(raw[i])] = Number(raw[i + 1]);
  } else {
    for (const [f, v] of Object.entries(raw as Record<string, unknown>)) out[f] = Number(v);
  }
  return out;
}

/** Solo per i test: svuota il fallback in memoria. */
export function _resetKvMemory(): void {
  memory.clear();
}
