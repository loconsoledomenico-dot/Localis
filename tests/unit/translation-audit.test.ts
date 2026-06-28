import { describe, it, expect } from 'vitest';
// @ts-expect-error — modulo JS senza tipi
import { countBreaks, looksUntranslated, expectedScriptName } from '../../scripts/translation-audit.mjs';

describe('countBreaks', () => {
  it('conta i tag SSML <break>', () => {
    expect(countBreaks('a <break time="0.8s"/> b <break time="1.2s"/> c')).toBe(2);
    expect(countBreaks('nessuna pausa')).toBe(0);
  });
});

describe('looksUntranslated', () => {
  it('segnala stringa identica alla sorgente', () => {
    expect(looksUntranslated('Ciao mondo come stai', 'Ciao mondo come stai')).toBe(true);
  });
  it('non segnala una traduzione vera', () => {
    expect(looksUntranslated('Ciao mondo come stai', 'Bonjour tout le monde')).toBe(false);
  });
  it('ignora stringhe troppo corte (nomi propri)', () => {
    expect(looksUntranslated('Bari', 'Bari')).toBe(false);
  });
});

describe('expectedScriptName', () => {
  it('sostituisce -it con -fr/-pl', () => {
    expect(expectedScriptName('gargano-nord-it.txt', 'fr')).toBe('gargano-nord-fr.txt');
  });
  it('appende il suffisso ai file senza -it', () => {
    expect(expectedScriptName('porto-bari-guida-fast.txt', 'pl')).toBe('porto-bari-guida-fast-pl.txt');
  });
});
