# WhatsApp Localis — design

**Data:** 2026-06-23
**Stato:** approvato in brainstorming, pronto per piano implementativo

## Obiettivo

Creare la presenza WhatsApp di Localis su **due binari separati**:

- **Binario A — Viaggiatori (B2C):** un Canale WhatsApp pubblico in broadcast per annunciare guide nuove, articoli blog e offerte/codici. **EN-first** (coerente col gruppo FB "Puglia for Travellers").
- **Binario B — Partner (B2B):** WhatsApp Business app per gestire i partner 1-a-1 e in broadcast: locandine digitali, QR + statement, onboarding, reminder. **Manuale**, messaggi **IT-primario** (i partner sono attività pugliesi).

Nessuna automazione via API. Il sistema si aggancia all'infrastruttura partner esistente, non la duplica.

## Vincoli e decisioni

- **Manuale**, niente WhatsApp Business API / invii automatici.
- **Due binari distinti**: Canale pubblico (1-way) + Business app (1-a-1/broadcast).
- Canale pubblico **EN-first**; messaggi partner **IT-primario** con varianti EN/DE per ospiti/partner internazionali.
- Locandine disegnate a mano da Luigi (regola progetto: no autogen Canva). Il sistema **ospita** le locandine finite e **fornisce il copy** IT/EN/DE + QR + foto, non le genera.
- Numero WhatsApp Business: dettaglio operativo da chiudere dopo, non blocca l'implementazione.
- Niente pagina `/p/{slug}/kit` (scartata). Niente tocchi a checkout o aree partner.

## Architettura

### Binario A — Canale pubblico viaggiatori
- Canale WhatsApp "Localis · Puglia" (broadcast, EN-first).
- Crescita follower tramite **link-invito sul sito**: footer (IT + `en/` + `de/` in parallelo) ed eventuale badge a fine pagina guida (opzionale, fase 2).
- Contenuti: annuncio guida nuova, annuncio articolo blog, offerta/codice stagionale.

### Binario B — WhatsApp Business app (partner)
- App WhatsApp Business sul numero aziendale (numero TBD, non bloccante).
- **Lista broadcast** "Partner Localis".
- **Etichette**: `attivo`, `in trattativa`, `scaduto`.
- Uso manuale: invio locandina digitale del partner, QR dedicato + link statement, kit di onboarding, reminder periodici.

### Repo — `marketing/whatsapp/` (fonte unica versionata)

```
marketing/whatsapp/
  README.md              # playbook: setup account, cadenza pubblicazione, etichette, regole
  templates/             # messaggi pronti, versionati
    onboarding_it.txt          # IT-primario (partner pugliesi)
    onboarding_en.txt
    onboarding_de.txt
    annuncio-guida_en.txt      # EN-first (Canale pubblico)
    annuncio-guida_it.txt
    annuncio-guida_de.txt
    reminder-statement_it.txt  # partner, IT
    offerta-viaggiatori_en.txt # Canale pubblico, EN-first
    offerta-viaggiatori_it.txt
    offerta-viaggiatori_de.txt
  locandine/             # locandine digitali finite (disegnate a mano), per partner
    {slug}-it.png|pdf
    {slug}-en.png|pdf
    {slug}-de.png|pdf
```

Si aggancia a:
- QR esistenti in `marketing/qr-codes/{slug}.png`
- `statement_token` nelle schede `src/content/partners/{slug}.mdx`
- `marketing/partners-registry.md`

## Componenti da realizzare

1. **`marketing/whatsapp/README.md`** — playbook operativo:
   - setup Canale pubblico + WhatsApp Business app
   - come si crea/aggiorna la lista broadcast e le etichette
   - cadenza pubblicazione Canale (es. a ogni guida/articolo + offerte stagionali)
   - regola: copy dai template, locandine da `locandine/`, QR da `qr-codes/`
   - placeholder numero WhatsApp Business (da compilare quando deciso)

2. **Template messaggi** (`marketing/whatsapp/templates/`) — testi pronti con placeholder (`{display_name}`, `{guida}`, `{link}`, `{statement_token}`, `{qr}`):
   - onboarding partner IT/EN/DE
   - annuncio guida nuova EN/IT/DE (Canale pubblico)
   - reminder statement IT (partner)
   - offerta viaggiatori EN/IT/DE (Canale pubblico)

3. **Cartella locandine** (`marketing/whatsapp/locandine/`) — inizialmente vuota con `.gitkeep` + nota; popolata da Luigi con i file finiti.

4. **Link-invito Canale sul sito** — footer in parallelo IT / `en/` / `de/`. URL Canale come variabile/placeholder finché il Canale non è creato. Push solo su richiesta esplicita.

## Cosa è esplicitamente fuori scope (YAGNI)

- WhatsApp Business API e invii automatici.
- Pagina `/p/{slug}/kit`.
- Autogen locandine.
- Modifiche a checkout / aree partner / Stripe.
- Badge a fine pagina guida (eventuale fase 2, non in questo spec).

## Criteri di successo

- Esiste `marketing/whatsapp/` con README-playbook, template IT/EN/DE per i 4 casi d'uso, cartella locandine.
- Luigi può: creare il Canale e la lista broadcast seguendo il README; copiare un messaggio dai template e inviarlo; trovare QR + statement di ogni partner senza cercarli altrove.
- Link-invito al Canale pronto per il footer IT/EN/DE (attivabile quando il Canale esiste).
- `pnpm check` pulito dopo l'eventuale modifica al footer.
