import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { _resetKvMemory, kvHGetAll, kvHIncrBy } from '../../src/lib/kv';

// Il contatore scansioni viveva su Netlify Blobs, che non ha incremento
// atomico: due richieste contemporanee leggevano lo stesso valore e la
// seconda sovrascriveva la prima, perdendo la scansione. Si rimediava con
// scritture condizionali su ETag e un ciclo di tentativi.
//
// Con Redis l'incremento e' atomico e quel ciclo non serve piu'. Questo test
// resta a guardia della proprieta' che conta — nessun conteggio perso —
// perche' e' facile tornare per sbaglio a un leggi-modifica-riscrivi.
describe('contatore scansioni', () => {
  beforeEach(() => _resetKvMemory());

  it('non perde conteggi con incrementi concorrenti', async () => {
    const N = 50;
    await Promise.all(Array.from({ length: N }, () => kvHIncrBy('scan-counts', '2026-09-06', 'tenace-petrol-cagnano')));

    const rec = await kvHGetAll('scan-counts', '2026-09-06');
    expect(rec['tenace-petrol-cagnano']).toBe(N);
  });

  it('tiene i partner separati nello stesso giorno', async () => {
    await kvHIncrBy('scan-counts', '2026-09-06', 'giardino-lido-sole');
    await kvHIncrBy('scan-counts', '2026-09-06', 'giardino-lido-sole');
    await kvHIncrBy('scan-counts', '2026-09-06', 'london-bar');

    expect(await kvHGetAll('scan-counts', '2026-09-06')).toEqual({
      'giardino-lido-sole': 2,
      'london-bar': 1,
    });
  });

  it('il middleware usa l incremento atomico, non leggi-modifica-riscrivi', () => {
    const src = readFileSync('src/middleware.ts', 'utf8');
    expect(src).toContain('kvHIncrBy');
    expect(src).not.toContain('kvSetJSON');
  });
});
