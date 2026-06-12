# Partner QR Canonical URLs

Questi sono gli URL canonici da usare per i QR partner che devono alimentare il report QR-only.
**Dal 2026-06-12 i QR puntano alla landing partner `/p/<slug>/`** (ripristino): il visitatore vede
l'offerta della sua zona col copy del partner, e l'attribuzione è doppia — cookie impostato
server-side dal middleware (funziona anche sui browser che bloccano i cookie JS) + `partnerId`
nel payload del checkout.

Regole:
- `utm_source` deve essere identico allo slug partner.
- `utm_medium` deve restare sempre `qr`.
- `utm_content` distingue il supporto fisico.
- `utm_campaign` va usato solo quando serve una campagna o finestra temporale specifica.

## Partner attivi

### Residence Bluemarine
- Slug: `bluemarine-lido-sole`
- QR canonico base: `https://localis.guide/p/bluemarine-lido-sole/?utm_source=bluemarine-lido-sole&utm_medium=qr&utm_content=poster`
- Variante camere: `https://localis.guide/p/bluemarine-lido-sole/?utm_source=bluemarine-lido-sole&utm_medium=qr&utm_content=camera`

### Il Giardino
- Slug: `giardino-lido-sole`
- QR canonico base: `https://localis.guide/p/giardino-lido-sole/?utm_source=giardino-lido-sole&utm_medium=qr&utm_content=poster`
- Variante camere: `https://localis.guide/p/giardino-lido-sole/?utm_source=giardino-lido-sole&utm_medium=qr&utm_content=camera`

### London Bar
- Slug: `london-bar`
- QR bancone: `https://localis.guide/p/london-bar/?utm_source=london-bar&utm_medium=qr&utm_content=bancone`
- QR tavolini: `https://localis.guide/p/london-bar/?utm_source=london-bar&utm_medium=qr&utm_content=tavolino`

### London B&B
- Slug: `london-bar-bb`
- QR canonico base: `https://localis.guide/p/london-bar-bb/?utm_source=london-bar-bb&utm_medium=qr&utm_content=camera`
- Se vuoi distinguere le strutture:
- `https://localis.guide/p/london-bar-bb/?utm_source=london-bar-bb&utm_medium=qr&utm_content=principe152`
- `https://localis.guide/p/london-bar-bb/?utm_source=london-bar-bb&utm_medium=qr&utm_content=le-chicche-di-carola`
- `https://localis.guide/p/london-bar-bb/?utm_source=london-bar-bb&utm_medium=qr&utm_content=marchese124`

### Paesaggi
- Slug: `paesaggi`
- QR vetrina: `https://localis.guide/p/paesaggi/?utm_source=paesaggi&utm_medium=qr&utm_content=vetrina`

### InfoPoint Turistico Bari
- Slug: `infopoint-bari`
- QR canonico base: `https://localis.guide/p/infopoint-bari/?utm_source=infopoint-bari&utm_medium=qr&utm_content=desk`

### Casale Madre
- Slug: `casale-madre-ostuni`
- QR canonico base: `https://localis.guide/p/casale-madre-ostuni/?utm_source=casale-madre-ostuni&utm_medium=qr&utm_content=camera`

### Mare in casa - Dimora Luxury
- Slug: `mare-in-casa-polignano`
- QR canonico base: `https://localis.guide/p/mare-in-casa-polignano/?utm_source=mare-in-casa-polignano&utm_medium=qr&utm_content=camera`

## QR già stampati con il vecchio schema

I QR stampati prima del 2026-06-12 che puntano a `https://localis.guide/?p=<slug>&...`
**continuano a funzionare**: la home imposta comunque il cookie di attribuzione.
Semplicemente non mostrano la landing partner. Alla prossima ristampa usare gli URL canonici qui sopra.

## Da non usare nel report QR-only

### Template non attivo
- `example-hotel-bari` è un template con `status: paused`, quindi non va usato per QR reali.

## Check rapido prima di stampare

- Scansiona il QR.
- Verifica che l'URL finale apra `/p/<slug>/` e contenga `utm_source=<slug>` e `utm_medium=qr`.
- Verifica che lo slug esista in `src/content/partners/*.mdx` con `status: active`.
- Se vuoi leggere il dettaglio per supporto fisico, usa un `utm_content` diverso per ogni QR stampato.
