# Partner QR Canonical URLs

Questi sono gli URL canonici da usare per i QR partner che devono alimentare il report QR-only.

Regole:
- `utm_source` deve essere identico allo slug partner.
- `utm_medium` deve restare sempre `qr`.
- `utm_content` distingue il supporto fisico.
- `utm_campaign` va usato solo quando serve una campagna o finestra temporale specifica.

## Partner attivi

### Residence Bluemarine
- Slug: `bluemarine-lido-sole`
- Landing: `https://localis.guide/p/bluemarine-lido-sole/`
- QR canonico base: `https://localis.guide/p/bluemarine-lido-sole/?utm_source=bluemarine-lido-sole&utm_medium=qr&utm_content=poster`
- Variante camere: `https://localis.guide/p/bluemarine-lido-sole/?utm_source=bluemarine-lido-sole&utm_medium=qr&utm_content=camera`

### Il Giardino
- Slug: `giardino-lido-sole`
- Landing: `https://localis.guide/p/giardino-lido-sole/`
- QR canonico base: `https://localis.guide/p/giardino-lido-sole/?utm_source=giardino-lido-sole&utm_medium=qr&utm_content=poster`
- Variante camere: `https://localis.guide/p/giardino-lido-sole/?utm_source=giardino-lido-sole&utm_medium=qr&utm_content=camera`

### London Bar
- Slug: `london-bar`
- Landing: `https://localis.guide/p/london-bar/`
- QR bancone: `https://localis.guide/p/london-bar/?utm_source=london-bar&utm_medium=qr&utm_content=bancone`
- QR tavolini: `https://localis.guide/p/london-bar/?utm_source=london-bar&utm_medium=qr&utm_content=tavolino`

### London B&B
- Slug: `london-bar-bb`
- Landing: `https://localis.guide/p/london-bar-bb/`
- QR canonico base: `https://localis.guide/p/london-bar-bb/?utm_source=london-bar-bb&utm_medium=qr&utm_content=camera`
- Se vuoi distinguere le strutture:
- `https://localis.guide/p/london-bar-bb/?utm_source=london-bar-bb&utm_medium=qr&utm_content=principe152`
- `https://localis.guide/p/london-bar-bb/?utm_source=london-bar-bb&utm_medium=qr&utm_content=le-chicche-di-carola`
- `https://localis.guide/p/london-bar-bb/?utm_source=london-bar-bb&utm_medium=qr&utm_content=marchese124`

### Paesaggi
- Slug: `paesaggi`
- Landing: `https://localis.guide/p/paesaggi/`
- QR vetrina: `https://localis.guide/p/paesaggi/?utm_source=paesaggi&utm_medium=qr&utm_content=vetrina`

## Da non usare nel report QR-only

### Template non attivo
- `example-hotel-bari` è un template con `status: paused`, quindi non va usato per QR reali.

### Partner senza QR reale
- `infopoint-bari` non deve essere trattato come QR partner reale nei tab QR-only.

## Check rapido prima di stampare

- Scansiona il QR.
- Verifica che l'URL finale contenga `utm_source=<slug>` e `utm_medium=qr`.
- Verifica che lo slug esista in `src/content/partners/*.mdx`.
- Se vuoi leggere il dettaglio per supporto fisico, usa un `utm_content` diverso per ogni QR stampato.
