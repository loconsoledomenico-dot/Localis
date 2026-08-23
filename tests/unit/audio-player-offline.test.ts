import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Un cliente (22/08) ha segnalato che il download offline "non funzionava":
// saveOffline usciva in silenzio quando il service worker non controllava
// ancora la pagina — cioe' proprio alla prima apertura di un link di accesso,
// che e' il caso normale. Nessun errore, nessuna barra: il pulsante sembrava
// morto.
const source = readFileSync(new URL('../../src/components/AudioPlayer.astro', import.meta.url), 'utf8');

const saveOffline = source.slice(
  source.indexOf('async function saveOffline'),
  source.indexOf('function initPlayer'),
);

describe('download offline', () => {
  it('saveOffline non esce piu\u2019 in silenzio senza controller', () => {
    expect(saveOffline).not.toMatch(/if \(!navigator\.serviceWorker\?\.controller\) return;/);
  });

  it('aspetta che il service worker prenda il controllo', () => {
    expect(source).toContain('function waitForController');
    expect(saveOffline).toContain('await waitForController()');
  });

  it('mostra lo stato di attesa prima di aspettare', () => {
    const beforeWait = saveOffline.slice(0, saveOffline.indexOf('await waitForController()'));
    expect(beforeWait).toContain("setOfflineState(p, 'downloading')");
  });

  it('segnala l\u2019errore invece di non fare nulla', () => {
    const afterWait = saveOffline.slice(saveOffline.indexOf('await waitForController()'));
    expect(afterWait).toMatch(/if \(!controller\)[\s\S]{0,80}setOfflineState\(p, 'interrupted'\)/);
  });

  it('usa il controller ottenuto per mandare il messaggio', () => {
    expect(saveOffline).toContain("controller.postMessage({");
    expect(saveOffline).not.toContain('navigator.serviceWorker.controller.postMessage');
  });

  it('waitForController ha un timeout e ripulisce il listener', () => {
    const fn = source.slice(source.indexOf('function waitForController'), source.indexOf('async function saveOffline'));
    expect(fn).toContain('setTimeout');
    expect(fn).toContain("removeEventListener('controllerchange'");
    expect(fn).toContain("addEventListener('controllerchange'");
  });
});
