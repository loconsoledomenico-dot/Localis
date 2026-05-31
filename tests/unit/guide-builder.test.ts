import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const guideBuilderPath = resolve(process.cwd(), 'src/components/GuideBuilder.astro');

describe('GuideBuilder builder copy', () => {
  it('contains the approved Italian header copy and compact duration metadata', () => {
    const source = readFileSync(guideBuilderPath, 'utf8');

    expect(source).toContain('Scegli le tue storie.');
    expect(source).toContain('Crea il tuo itinerario ideale. Lo sconto si applica automaticamente nel carrello.');
    expect(source).toContain('Durata media di ogni guida: 30 minuti | Disponibile in:');
    expect(source).toContain('builder-card-duration');
    expect(source).toContain('durationLabel');
  });

  it('does not keep the old Italian builder explanation copy', () => {
    const source = readFileSync(guideBuilderPath, 'utf8');

    expect(source).not.toContain('meno paghi.');
    expect(source).not.toContain('Scegli le guide che vuoi. Lo sconto si applica da solo.');
    expect(source).not.toContain('Pack 6 diventa Intera Zona solo quando scegli tutte e 6 le guide della stessa area.');
    expect(source).not.toContain('Tris e Sestina combinano guide di zone diverse. Zona completa include tutte le 6 guide di una sola area.');
  });
});
