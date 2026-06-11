from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, Image, KeepTogether
)
from PIL import Image as PILImage
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os

OUTPUT = os.path.join(os.path.dirname(__file__), "BusinessPlan-Localis-NIDI.pdf")

# ── Colori brand ──────────────────────────────────────────────────────────────
BLUE_DARK  = colors.HexColor("#1a3a5c")
BLUE_MID   = colors.HexColor("#2563eb")
BLUE_LIGHT = colors.HexColor("#dbeafe")
GRAY_LIGHT = colors.HexColor("#f1f5f9")
GRAY_MID   = colors.HexColor("#64748b")
WHITE      = colors.white
BLACK      = colors.HexColor("#1e293b")

# ── Stili ─────────────────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

def s(name, **kw):
    return ParagraphStyle(name, **kw)

COVER_TITLE = s("CoverTitle",
    fontSize=28, leading=34, textColor=WHITE,
    fontName="Helvetica-Bold", alignment=TA_LEFT, spaceAfter=6)

COVER_SUB = s("CoverSub",
    fontSize=13, leading=18, textColor=colors.HexColor("#bfdbfe"),
    fontName="Helvetica", alignment=TA_LEFT, spaceAfter=4)

COVER_LABEL = s("CoverLabel",
    fontSize=10, leading=14, textColor=colors.HexColor("#93c5fd"),
    fontName="Helvetica", alignment=TA_LEFT)

H1 = s("H1",
    fontSize=15, leading=20, textColor=BLUE_DARK,
    fontName="Helvetica-Bold", spaceBefore=18, spaceAfter=6,
    borderPad=0, keepWithNext=1)

H2 = s("H2",
    fontSize=11, leading=15, textColor=BLUE_MID,
    fontName="Helvetica-Bold", spaceBefore=12, spaceAfter=4,
    keepWithNext=1)

BODY = s("Body",
    fontSize=10, leading=16, textColor=BLACK,
    fontName="Helvetica", alignment=TA_JUSTIFY, spaceAfter=5)

BODY_SMALL = s("BodySmall",
    fontSize=8.5, leading=13, textColor=GRAY_MID,
    fontName="Helvetica", alignment=TA_LEFT)

BULLET = s("Bullet",
    fontSize=10, leading=15, textColor=BLACK,
    fontName="Helvetica", leftIndent=14, spaceAfter=3,
    bulletIndent=4)

HIGHLIGHT = s("Highlight",
    fontSize=10, leading=15, textColor=BLUE_DARK,
    fontName="Helvetica-Bold", alignment=TA_LEFT,
    backColor=BLUE_LIGHT, borderPad=6, spaceAfter=6)

FOOTER_STYLE = s("Footer",
    fontSize=7.5, leading=10, textColor=GRAY_MID,
    fontName="Helvetica", alignment=TA_CENTER)

# ── Helper ────────────────────────────────────────────────────────────────────
W = A4[0] - 4*cm  # larghezza utile

def hr(color=BLUE_MID, thickness=0.5):
    return HRFlowable(width="100%", thickness=thickness, color=color, spaceAfter=6, spaceBefore=2)

def tbl(data, col_widths, style_cmds=None):
    base = [
        ("FONTNAME",    (0,0), (-1,0),  "Helvetica-Bold"),
        ("FONTSIZE",    (0,0), (-1,-1), 8.5),
        ("LEADING",     (0,0), (-1,-1), 12),
        ("BACKGROUND",  (0,0), (-1,0),  BLUE_DARK),
        ("TEXTCOLOR",   (0,0), (-1,0),  WHITE),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [WHITE, GRAY_LIGHT]),
        ("GRID",        (0,0), (-1,-1), 0.3, colors.HexColor("#cbd5e1")),
        ("VALIGN",      (0,0), (-1,-1), "MIDDLE"),
        ("TOPPADDING",  (0,0), (-1,-1), 5),
        ("BOTTOMPADDING",(0,0),(-1,-1), 5),
        ("LEFTPADDING", (0,0), (-1,-1), 6),
    ]
    if style_cmds:
        base += style_cmds
    t = Table(data, colWidths=col_widths)
    t.setStyle(TableStyle(base))
    return t

def bp(text):
    return Paragraph(f"• &nbsp; {text}", BULLET)

# ── Pagina di copertina ───────────────────────────────────────────────────────
def cover_page():
    elems = []

    # Rettangolo di sfondo — simulato con tabella colorata
    cover_data = [[""]]
    cover_tbl = Table(cover_data, colWidths=[W], rowHeights=[3.2*cm])
    cover_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), BLUE_DARK),
        ("GRID", (0,0), (-1,-1), 0, BLUE_DARK),
    ]))
    elems.append(cover_tbl)
    elems.append(Spacer(1, 0.4*cm))

    elems.append(Paragraph("LOCALIS", COVER_TITLE))
    elems.append(Paragraph("Audio Guide Turistiche della Puglia", COVER_SUB))
    elems.append(Spacer(1, 0.3*cm))
    elems.append(Paragraph("BUSINESS PLAN", s("bp2",
        fontSize=20, leading=26, textColor=BLUE_MID,
        fontName="Helvetica-Bold", alignment=TA_LEFT)))
    elems.append(Spacer(1, 0.2*cm))
    elems.append(Paragraph("Domanda di agevolazione — Bando NIDI Regione Puglia", COVER_LABEL))
    elems.append(Spacer(1, 1.2*cm))

    # Box dati richiedente
    info_data = [
        ["Richiedente", "Loconsole Domenico"],
        ["Forma giuridica", "Ditta Individuale"],
        ["Sede operativa", "Bari (BA) — Puglia"],
        ["Settore", "Turismo digitale / Impresa culturale e creativa"],
        ["Investimento richiesto", "€ 50.000"],
        ["Agevolazione NIDI totale", "€ 60.000  (€25K fondo perduto + €25K tasso zero + €10K gestione)"],
        ["Data", "Giugno 2026"],
    ]
    info_tbl = Table(info_data, colWidths=[5.2*cm, W - 5.2*cm])
    info_tbl.setStyle(TableStyle([
        ("FONTNAME",  (0,0), (0,-1), "Helvetica-Bold"),
        ("FONTNAME",  (1,0), (1,-1), "Helvetica"),
        ("FONTSIZE",  (0,0), (-1,-1), 9),
        ("LEADING",   (0,0), (-1,-1), 14),
        ("TEXTCOLOR", (0,0), (0,-1), BLUE_DARK),
        ("TEXTCOLOR", (1,0), (1,-1), BLACK),
        ("ROWBACKGROUNDS", (0,0), (-1,-1), [WHITE, GRAY_LIGHT]),
        ("GRID", (0,0), (-1,-1), 0.3, colors.HexColor("#cbd5e1")),
        ("TOPPADDING",    (0,0), (-1,-1), 6),
        ("BOTTOMPADDING", (0,0), (-1,-1), 6),
        ("LEFTPADDING",   (0,0), (-1,-1), 8),
    ]))
    elems.append(info_tbl)
    elems.append(Spacer(1, 1*cm))

    elems.append(hr(BLUE_MID, 1))
    elems.append(Paragraph(
        "localis.guide  |  info@localis.guide  |  Bari, Puglia",
        s("ft", fontSize=8, textColor=GRAY_MID, fontName="Helvetica", alignment=TA_CENTER)
    ))

    elems.append(PageBreak())
    return elems

# ── Sezioni ───────────────────────────────────────────────────────────────────
def section_1():
    elems = [
        Paragraph("1. SINTESI DELL'IDEA IMPRENDITORIALE", H1), hr(),
        Paragraph(
            "Localis è una piattaforma digitale di audio guide turistiche per la Puglia, fruibili via "
            "smartphone senza app aggiuntive, disponibili in italiano, inglese e tedesco. Il prodotto "
            "accompagna il turista nella scoperta di borghi, siti storici e paesaggi pugliesi attraverso "
            "narrazioni originali scritte e supervisionate da esperti del territorio, "
            "restituite con tecnologia vocale AI ad alta fedeltà.", BODY),
        Paragraph(
            "Il modello è interamente digitale: nessun magazzino, nessun personale fisso. La distribuzione "
            "avviene tramite QR code posizionati nei punti di accoglienza turistica — hotel, ristoranti, "
            "B&B, musei, infopoint. Il turista scansiona, acquista e ascolta in totale autonomia.", BODY),
        Paragraph(
            "<b>Posizionamento strategico — controtendenza al turismo di massa.</b> "
            "Mentre la concorrenza concentra l'offerta sulle mete già sature (Alberobello, "
            "Polignano, Ostuni nei circuiti mainstream), Localis punta deliberatamente sui "
            "luoghi trascurati: borghi della Daunia, entroterra del Gargano, Valle d'Itria "
            "profonda, Puglia rurale e medievale. "
            "Questo posizionamento intercetta una domanda crescente di turismo lento, "
            "esperienziale e autentico — un segmento che i grandi operatori non servono "
            "perché non scala con il loro modello, ma che scala perfettamente con il nostro.", BODY),
        Spacer(1, 0.3*cm),
        Paragraph("Prodotto sviluppato e live alla data della domanda:", H2),
    ]
    items = [
        "6 guide Bari: Bari Vecchia, Porto Vecchio, Basilica San Nicola, Tre Teatri, Bari a Tavola, Bari Sotterranea",
        "6 guide Valle d'Itria: Alberobello, Locorotondo, Martina Franca, Ostuni, Cisternino, Fasano",
        "6 guide Gargano: Vieste, Isole Tremiti, Sacro Monte, Saline di Margherita, Gargano Nord, Paesi del Gargano",
        "1 guida Matera — prima espansione fuori Puglia, avviata giugno 2026",
        "19 guide pubblicate in totale — catalogo completato in tutte le 3 zone Puglia principali",
        "Versioni multilingue IT / EN / DE su tutte le guide",
        "Sito web attivo: localis.guide — player integrato, nessuna app da scaricare",
        "Rete partner: 8 strutture attive in 4 zone (Bari, Gargano, Valle d'Itria, Polignano a Mare)",
    ]
    for i in items:
        elems.append(bp(i))
    return elems

def section_2():
    elems = [
        PageBreak(),
        Paragraph("2. PROFILO DEL RICHIEDENTE", H1), hr(),
        Paragraph(
            "<b>Loconsole Domenico</b>, nato a Bari, 59 anni, residente a Bari. Disoccupato.", BODY),
        Paragraph(
            "Conoscenza profonda e vissuta del territorio pugliese — non quella enciclopedica di un "
            "ricercatore, ma quella di chi ha percorso i vicoli di Bari Vecchia, frequentato i "
            "masseri della Daunia, conosciuto le storie di famiglia legate a San Nicola e al porto. "
            "Ha collaborato attivamente allo sviluppo di tutti i contenuti della piattaforma: "
            "ideazione dei percorsi narrativi, supervisione e validazione dei testi, consulenza "
            "sulla veridicità storica e culturale dei contenuti. "
            "La sua voce è la fonte sorgente dei contenuti audio in italiano — garanzia di autenticità "
            "che nessun competitor esterno può replicare.", BODY),
        Paragraph(
            "<b>Perché è la persona giusta per questo progetto:</b> "
            "Localis non è un prodotto che si costruisce da un ufficio. Richiede conoscenza "
            "diretta di luoghi, storie locali, accesso informale a operatori del territorio — "
            "relazioni che si costruiscono in decenni, non in mesi. "
            "Il profilo di Domenico combina radicamento territoriale, disponibilità di tempo "
            "pieno e motivazione personale forte: le condizioni ideali per costruire un'impresa "
            "culturale autentica.", BODY),
    ]
    return elems

def section_3():
    elems = [
        PageBreak(),
        Paragraph("3. ANALISI DI MERCATO", H1), hr(),
        Paragraph("Mercato di riferimento", H2),
        Paragraph(
            "La Puglia registra oltre <b>15 milioni di presenze turistiche annue</b> (dati Regione Puglia 2024), "
            "con crescita costante negli ultimi 5 anni. Le aree coperte da Localis — Bari, Valle d'Itria e "
            "Gargano — concentrano oltre il 60% dei flussi regionali.", BODY),
        Paragraph(
            "Il turismo culturale è il segmento in maggior crescita: il 68% dei turisti dichiara di cercare "
            "esperienze autentiche e immersive (ENIT 2024). I turisti stranieri — in particolare tedeschi, "
            "britannici e nordeuropei — sono abituati a pagare per audio guide digitali, pratica consolidata "
            "in mercati come Germania, Olanda e Scandinavia.", BODY),
        Spacer(1, 0.2*cm),
        Paragraph("Il turismo lento e i borghi minori — un mercato in espansione ignorato dai competitor", H2),
        Paragraph(
            "Il turismo di prossimità e il cosiddetto <b>turismo lento</b> sono cresciuti del 34% in Italia "
            "tra il 2021 e il 2024 (dati Istat/Unioncamere). Il viaggiatore contemporaneo — soprattutto "
            "quello straniero con reddito medio-alto — cerca sempre meno la meta famosa e sempre più "
            "l'esperienza inaspettata: il borgo che non c'è su TripAdvisor, la storia che non si trova "
            "su Wikipedia, la voce di qualcuno che ci vive davvero.", BODY),
        Paragraph(
            "La Puglia dispone di un patrimonio enorme in questo segmento: la <b>Daunia</b> con i suoi "
            "borghi medievali (Lucera, Troia, Bovino, Orsara di Puglia), le <b>gravine murgiane</b>, "
            "i paesi dell'entroterra garganico, la Puglia rurale quasi del tutto assente dall'offerta "
            "turistica digitale. Nessun operatore di audio guide copre questo territorio. "
            "Localis lo fa già — ed è l'unico a farlo in tre lingue.", BODY),
        Paragraph(
            "Questo crea un <b>vantaggio di primo entrante</b> difficile da replicare: chi arriverà dopo "
            "dovrà costruire da zero le relazioni con gli operatori locali, la conoscenza del territorio "
            "e la credibilità necessaria per raccontarlo con autenticità.", BODY),
        Spacer(1, 0.2*cm),
        Paragraph("Analisi competitiva", H2),
    ]
    comp_data = [
        ["Competitor", "Prodotto", "Limite vs Localis"],
        ["Audioguide museali", "Dispositivi fisici a noleggio", "Solo in loco · costo alto · limitati"],
        ["Rick Steves Audio", "App generica gratuita", "Nessuna voce locale · Puglia non coperta"],
        ["GPSmyCity", "Guide GPS generiche", "No autenticità · no narrazione originale"],
        ["Guide Touring/TCI", "Cartaceo", "Non immersivo · non aggiornabile"],
    ]
    elems.append(tbl(comp_data, [4.5*cm, 4.5*cm, W-9*cm]))
    elems.append(Spacer(1, 0.2*cm))
    vantaggi = [Paragraph("Vantaggi competitivi di Localis", H2)]
    for v in [
        "Narrazioni scritte da esperti locali del territorio, voci AI ad alta fedeltà — non sintesi generica",
        "Multilingue nativo (IT/EN/DE) — unico nel segmento Puglia profonda e borghi minori",
        "Nessuna app da scaricare: accesso immediato via browser + QR code",
        "Copertura esclusiva di borghi minori, Daunia e aree interne — assenti su tutti i competitor",
        "Vantaggio di primo entrante: relazioni territoriali e credibilità non replicabili rapidamente",
        "Modello distributivo capillare con revenue share 25% per i partner — incentivo reale all'esposizione",
        "Canale istituzionale attivo: InfoPoint Turistico ufficiale di Bari (giu. 2026)",
    ]:
        vantaggi.append(bp(v))
    elems.append(KeepTogether(vantaggi))
    return elems

def section_4():
    elems = [
        PageBreak(),
        Paragraph("4. PIANO OPERATIVO", H1), hr(),
    ]
    fasi = [
        ("✓ Fase 1 — Avvio (COMPLETATA — aprile/giugno 2026)", [
            "Costituzione ditta individuale e apertura P.IVA (da completare con fondi NIDI)",
            "19 guide prodotte e live: Bari (6), Valle d'Itria (6), Gargano (6), Matera (1)",
            "Sistema pagamento Stripe integrato e player mobile ottimizzato su localis.guide",
            "Rete QR attiva: 8 partner in 4 zone (Bari, Gargano, Valle d'Itria, Polignano a Mare)",
            "InfoPoint Turistico ufficiale di Bari attivato (Piazza del Ferrarese 29) — giugno 2026",
        ]),
        ("Fase 2 — Consolidamento (mesi 1–12 da finanziamento)", [
            "Espansione rete partner a 50 strutture: Lecce/Salento, Polignano, Ostuni, Alberobello",
            "Lancio zona Lecce/Salento (6 nuove guide in produzione)",
            "Inserimento su piattaforme di distribuzione turistica (Viator, GetYourGuide)",
            "Accordi con agenzie di viaggio incoming pugliesi (target: 5 agenzie anno 1)",
            "Versione francese (FR) delle guide Bari e Valle d'Itria",
        ]),
        ("Fase 3 — Espansione (mesi 13–36)", [
            "Copertura Salento: Lecce, Otranto, Gallipoli, Castro — 6 nuove guide",
            "Daunia: Lucera, Troia, Bovino, Orsara di Puglia — borghi medievali meno noti al turismo di massa",
            "Perle nascoste pugliesi: Gravina in Puglia, Pietramontecorvino, Roseto Valfortore, Faeto",
            "Partnership con Puglia Promozione / Agenzia del Turismo Regionale",
            "Modello B2B: licenza contenuti a musei, comuni, parchi nazionali",
            "Estensione Basilicata: da Matera verso Pollino e Lucania interna",
        ]),
    ]
    for titolo, punti in fasi:
        elems.append(Paragraph(titolo, H2))
        for p in punti:
            elems.append(bp(p))
    return elems

def section_5():
    elems = [
        PageBreak(),
        Paragraph("5. PIANO DEGLI INVESTIMENTI — € 50.000", H1), hr(),
    ]
    inv_data = [
        ["Voce di Spesa", "Importo", "Descrizione"],
        ["Attrezzatura tecnica",       "€ 4.500",  "Laptop pro, hard disk NAS, microfoni studio, interfaccia audio"],
        ["Sviluppo piattaforma",       "€ 18.000", "Evoluzione scalabile: area utente, portale B2B, infrastruttura cloud, API Viator/GetYourGuide — sviluppatore freelance 12 mesi"],
        ["Produzione contenuti audio", "€ 8.500",  "12 nuove guide (Lecce/Salento + Daunia): voci, regia, post-produzione, traduzione DE/EN"],
        ["Marketing digitale",         "€ 10.000", "Google Ads + Meta Ads + SEO (12 mesi) — geo-targetizzato turisti in Puglia"],
        ["Materiale fisico",           "€ 4.000",  "QR code (totem, cartoline, supporti), brochure IT/EN/DE"],
        ["Consulenze professionali",   "€ 3.000",  "Commercialista (avvio + 1° anno), consulenza legale GDPR/diritti d'autore"],
        ["Spese di avvio",             "€ 1.500",  "Iscrizione CCIAA, software gestionale, apertura conto dedicato"],
        ["Riserva operativa",          "€ 500",    "Imprevisti"],
        ["TOTALE",                     "€ 50.000", ""],
    ]
    extra_style = [
        ("FONTNAME",   (0,-1), (-1,-1), "Helvetica-Bold"),
        ("BACKGROUND", (0,-1), (-1,-1), BLUE_LIGHT),
        ("TEXTCOLOR",  (0,-1), (-1,-1), BLUE_DARK),
    ]
    elems.append(KeepTogether([
        tbl(inv_data, [4.2*cm, 2.2*cm, W-6.4*cm], extra_style),
        Spacer(1, 0.3*cm),
    ]))
    elems.append(Paragraph("Nota sulla voce «Sviluppo piattaforma»", H2))
    elems.append(Paragraph(
        "La versione attuale di localis.guide — player audio integrato, sistema di pagamento Stripe, "
        "catalogo multilingue (IT/EN/DE), distribuzione via QR code — è stata realizzata interamente "
        "con <b>investimento personale del proponente</b>, prima e indipendentemente dalla presente "
        "richiesta di agevolazione. Quella infrastruttura rappresenta la prova concreta di fattibilità "
        "del modello e il punto di partenza per la fase di crescita.",
        BODY))
    elems.append(Paragraph(
        "I <b>€ 18.000 richiesti al bando NIDI</b> riguardano esclusivamente gli sviluppi tecnologici "
        "necessari per sostenere l'espansione del mercato nei 12 mesi successivi all'avvio formale "
        "dell'impresa, e in particolare:",
        BODY))
    for item in [
        "<b>Area utente e storico acquisti</b> — profilo personale con accesso alle guide acquistate, "
        "download offline per uso senza connessione (funzionalità richiesta dai turisti stranieri).",
        "<b>Portale B2B per licenze istituzionali</b> — pannello di gestione per accordi con musei, "
        "comuni e parchi nazionali: caricamento contenuti, reportistica accessi, fatturazione automatica.",
        "<b>Integrazione API Viator e GetYourGuide</b> — connessione ai principali marketplace turistici "
        "mondiali per distribuzione automatizzata del catalogo e gestione degli ordini in entrata.",
        "<b>Infrastruttura cloud scalabile</b> — migrazione a server dedicati con CDN globale, gestione "
        "dei picchi di traffico stagionale (agosto, Pasqua, ponti), replica geografica dei file audio "
        "per ridurre la latenza per gli utenti nordeuropei.",
        "<b>Sistema di database avanzato</b> — architettura dati per gestire un catalogo in crescita "
        "(da 19 a 54+ guide), analisi comportamentale degli utenti, A/B testing sui percorsi di acquisto.",
        "<b>Dashboard analytics proprietaria</b> — reportistica in tempo reale per i partner (quanti "
        "turisti hanno scannerizzato, quanti hanno acquistato, conversione per struttura) come strumento "
        "di fidelizzazione della rete distributiva.",
    ]:
        elems.append(bp(item))
    elems.append(KeepTogether([
        Spacer(1, 0.25*cm),
        Paragraph(
            "Questi sviluppi non sono presenti nella piattaforma attuale e non potranno essere realizzati "
            "senza un investimento dedicato. Sono indispensabili per portare Localis da una fase di "
            "validazione del mercato (oggi: 8 partner, 19 guide) a una piattaforma commercialmente "
            "scalabile (target anno 1: 50 partner, 6 nuove zone).",
            BODY),
        Spacer(1, 0.3*cm),
        Paragraph(
            "In aggiunta al piano investimenti, NIDI prevede un contributo separato di <b>€ 10.000</b> "
            "per le spese di gestione dei primi 6 mesi (coworking, utenze, connettività, abbonamenti software). "
            "<b>Agevolazione totale ricevuta: € 60.000.</b>", HIGHLIGHT),
    ]))
    return elems

def section_6():
    GREEN_LIGHT = colors.HexColor("#dcfce7")
    elems = [
        PageBreak(),
        Paragraph("6. PIANO FINANZIARIO — PROIEZIONI 3 ANNI", H1), hr(),

        # ── Baseline pre-investimento ─────────────────────────────────────────
        Paragraph("Baseline pre-investimento (rete attuale — 8 partner attivi)", H2),
        Paragraph(
            "Alla data di presentazione della domanda Localis dispone già di 8 partner "
            "operativi distribuiti su 4 zone (Bari, Gargano, Valle d'Itria, Polignano a Mare), "
            "incluso l'InfoPoint Turistico ufficiale di Bari — canale ad alto volume attivato "
            "a giugno 2026. Le proiezioni seguenti partono da questa base reale, non da ipotesi teoriche.", BODY),
        Spacer(1, 0.2*cm),
    ]

    base_data = [
        ["Cluster", "Partner", "Logica conversione", "Acquisti/anno", "Ricavo stimato"],
        ["Hotel Gargano",
         "Il Giardino (33 cam.)\nBluemarine (70 cam.)\naprile–ottobre",
         "2.970 gruppi ospiti/anno\n× 6% conv. (turisti in loco)",
         "178", "€ 1.335"],
        ["B&B Bari",
         "London Bar B&B\n(Principe 152 + Marchese 124\n+ Chicche di Carola — 6 cam.)",
         "1.095 notti/anno\n× 8% conv. (ospiti in città)",
         "88", "€ 660"],
        ["Bar e negozi Bari",
         "London Bar (7 QR bancone+tavoli)\nPaesaggi (vetrina centro)",
         "~30 turisti/giorno esposti\n× 2% conv.",
         "219", "€ 1.642"],
        ["InfoPoint Turistico Bari",
         "InfoPoint Piazza Ferrarese 29\n(canale ufficiale turismo)",
         "~80 turisti/giorno\n× 3% conv.",
         "876", "€ 6.570"],
        ["Valle d'Itria / Polignano",
         "Casale Madre (Ostuni)\nMare in Casa (Polignano a Mare)",
         "360 cam.+notti/anno\n× 8% conv.",
         "58", "€ 435"],
        ["TOTALE BASELINE", "8 partner attivi — 4 zone", "—", "1.419", "€ 10.642"],
    ]
    base_extra = [
        ("BACKGROUND", (0,-1), (-1,-1), BLUE_LIGHT),
        ("FONTNAME",   (0,-1), (-1,-1), "Helvetica-Bold"),
        ("TEXTCOLOR",  (0,-1), (-1,-1), BLUE_DARK),
        ("FONTNAME",   (0,0),  (-1,0),  "Helvetica-Bold"),
        ("VALIGN",     (0,0),  (-1,-1), "TOP"),
        ("FONTSIZE",   (0,0),  (-1,-1), 8),
        ("LEADING",    (0,0),  (-1,-1), 11),
    ]
    elems.append(tbl(base_data,
        [3.2*cm, 3.8*cm, 4.2*cm, 1.8*cm, W-13*cm],
        base_extra))

    elems.append(Spacer(1, 0.4*cm))

    # ── Ipotesi di crescita ───────────────────────────────────────────────────
    elems.append(Paragraph("Ipotesi di crescita post-investimento", H2))
    for h in [
        "Partner attivi a fine anno: 50 (anno 1) · 150 (anno 2) · 300 (anno 3)",
        "Prezzo medio acquisto: € 8,00 (anno 1) · € 8,50 (anno 2) · € 9,00 (anno 3)",
        "Canali aggiuntivi anno 2: GetYourGuide / Viator · Google Ads con SEO maturo",
        "Canale B2B anno 3: licenze contenuti a musei, comuni, parchi nazionali",
    ]:
        elems.append(bp(h))

    elems.append(Spacer(1, 0.3*cm))
    elems.append(Paragraph("Dettaglio acquisti per canale", H2))

    canali_data = [
        ["Canale",                   "Anno 1",  "Anno 2",  "Anno 3"],
        ["Rete QR partner (hotels, B&B, bar)", "500",  "1.400", "3.500"],
        ["Online diretto (ads + SEO)",          "400",  "800",   "2.000"],
        ["GetYourGuide / Viator",               "—",    "200",   "500"],
        ["B2B (licenze musei/comuni)",          "—",    "—",     "3 lic."],
        ["Acquisti consumer totali",            "900",  "2.400", "6.000"],
    ]
    canali_extra = [
        ("BACKGROUND", (0,-1), (-1,-1), BLUE_LIGHT),
        ("FONTNAME",   (0,-1), (-1,-1), "Helvetica-Bold"),
    ]
    elems.append(tbl(canali_data,
        [7*cm, (W-7*cm)/3, (W-7*cm)/3, (W-7*cm)/3],
        canali_extra))

    elems.append(Spacer(1, 0.3*cm))
    elems.append(Paragraph("Conto economico previsionale", H2))

    fin_data = [
        ["Voce",                         "Anno 1",   "Anno 2",   "Anno 3"],
        ["Acquisti totali (n.)",          "900",      "2.400",    "6.000"],
        ["Prezzo medio / acquisto",       "€ 8,00",   "€ 8,50",   "€ 9,00"],
        ["Ricavi consumer",               "€ 7.200",  "€ 20.400", "€ 54.000"],
        ["Ricavi B2B (licenze)",          "—",        "—",        "€ 4.500"],
        ["Ricavi totali",                 "€ 7.200",  "€ 20.400", "€ 58.500"],
        ["Costi variabili (~8%)",         "€ 580",    "€ 1.630",  "€ 4.680"],
        ["Costi fissi annui",             "€ 8.000",  "€ 10.000", "€ 12.000"],
        ["Utile lordo",                   "− € 1.380","€ 8.770",  "€ 41.820"],
        ["Rimborso prestito NIDI",        "€ 5.000",  "€ 5.000",  "€ 5.000"],
        ["Utile netto dopo rimborso",     "− € 6.380","€ 3.770",  "€ 36.820"],
    ]
    bold_rows = [
        (5,  "BACKGROUND", BLUE_LIGHT),
        (8,  "BACKGROUND", BLUE_LIGHT),
        (10, "BACKGROUND", GREEN_LIGHT),
    ]
    extra = []
    for row, prop, col in bold_rows:
        extra += [(prop, (0,row), (-1,row), col),
                  ("FONTNAME", (0,row), (-1,row), "Helvetica-Bold")]
    elems.append(tbl(fin_data,
        [6.5*cm, (W-6.5*cm)/3, (W-6.5*cm)/3, (W-6.5*cm)/3],
        extra))

    elems.append(Spacer(1, 0.3*cm))
    elems.append(Paragraph(
        "<b>Anno 1</b> in perdita contenuta (−€1.380 lordo): fisiologico nella fase di "
        "espansione della rete — il deficit è interamente coperto dal contributo NIDI "
        "per le spese di gestione (€10.000). La baseline reale (€10.642 acquisti/anno già oggi) "
        "compressa rispetto alle proiezioni perché l'InfoPoint e i nuovi partner Valle d'Itria "
        "sono operativi solo da giugno 2026. "
        "<b>Break-even operativo stimato al mese 14 circa</b> — anticipato rispetto alla "
        "stima precedente grazie all'allargamento della rete a 4 zone. "
        "Il prestito NIDI (€25.000 a tasso zero, €5.000/anno × 5 anni) diventa "
        "sostenibile dall'anno 2 con €3.770 di utile netto residuo.", BODY))
    return elems

def section_partner():
    FOTO_DIR         = r"C:\Users\Admin\Desktop\Bari_foto\Bar London"
    GIARDINO_DIR     = r"C:\Users\Admin\Desktop\Bari_foto\partner\Il giardino"
    # Foto scelte: bancone (impatto visivo) + tavoli multipli (scalabilità)
    foto = [
        ("WhatsApp Image 2026-05-26 at 09.00.43.jpeg",
         "London Bar, Bari — totem Localis sul bancone accanto al POS"),
        ("WhatsApp Image 2026-05-26 at 09.00.44 (1).jpeg",
         "London Bar, Bari — più totem Localis sui tavoli: modello già scalato"),
        ("WhatsApp Image 2026-05-26 at 09.00.44 (3).jpeg",
         "London Bar, Bari — QR Localis integrato al tavolo accanto al bancone"),
    ]

    elems = [
        PageBreak(),
        Paragraph("9. RETE PARTNER ATTIVI — PROVE DI MERCATO", H1), hr(),
        Paragraph(
            "Il modello distributivo Localis è già operativo alla data della domanda, "
            "con <b>8 partner attivi in 4 zone</b> (Bari, Gargano, Valle d'Itria, Polignano a Mare). "
            "A giugno 2026 è stato attivato l'<b>InfoPoint Turistico ufficiale di Bari</b> "
            "(Piazza del Ferrarese 29), canale ad alto volume che intercetta turisti già "
            "in cerca di informazioni sul territorio. "
            "I materiali QR code sono posizionati stabilmente presso strutture ricettive, "
            "commerciali e canali istituzionali.", BODY),
        Spacer(1, 0.2*cm),
    ]

    partner_lista = [
        ["Partner", "Tipo", "Città / Zona", "Attivo da"],
        ["London Bar",                      "Bar (7 QR bancone+tavoli)",     "Bari",                       "mag 2026"],
        ["London Bar B&B",                  "B&B (3 strutture — 6 camere)",  "Bari",                       "mag 2026"],
        ["Paesaggi",                        "Negozio / vetrina centro",      "Bari",                       "mag 2026"],
        ["Il Giardino Albergo Rist.",        "Hotel+ristorante (33 cam.)",    "Lido del Sole, Rodi Garganico", "mag 2026"],
        ["Residence Bluemarine",            "Residence (70 cam.)",           "Lido del Sole, Rodi Garganico", "mag 2026"],
        ["InfoPoint Turistico Bari ★",      "Info point ufficiale turismo",  "Piazza Ferrarese 29, Bari",  "giu 2026"],
        ["Casale Madre",                    "B&B",                           "Ostuni (Valle d'Itria)",     "giu 2026"],
        ["Mare in Casa — Dimora Luxury",    "B&B luxury",                    "Polignano a Mare",           "giu 2026"],
    ]
    partner_extra = [
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [WHITE, GRAY_LIGHT]),
    ]
    elems.append(tbl(partner_lista, [4.5*cm, 3.8*cm, 4.2*cm, W-12.5*cm], partner_extra))
    elems.append(Spacer(1, 0.3*cm))

    img_w = (W - 0.6*cm) / 2   # 2 foto per riga

    # Prima foto da sola, grande — massimo impatto
    path0 = os.path.join(FOTO_DIR, foto[0][0])
    try:
        pil = PILImage.open(path0)
        pw, ph = pil.size
        ratio = ph / pw
        img0 = Image(path0, width=W*0.55, height=W*0.55*ratio)
        cap0 = Paragraph(foto[0][1], BODY_SMALL)
        row0 = Table([[img0, cap0]], colWidths=[W*0.55, W*0.45 - 0.4*cm])
        row0.setStyle(TableStyle([
            ("VALIGN",  (0,0), (-1,-1), "MIDDLE"),
            ("LEFTPADDING",  (1,0), (1,0), 10),
            ("RIGHTPADDING", (0,0), (0,0), 0),
        ]))
        elems.append(row0)
    except Exception:
        pass

    elems.append(Spacer(1, 0.4*cm))

    # Foto 2 e 3 affiancate
    img_cells = []
    cap_cells = []
    for fname, caption in foto[1:]:
        path = os.path.join(FOTO_DIR, fname)
        try:
            pil = PILImage.open(path)
            pw, ph = pil.size
            ratio = ph / pw
            h = img_w * ratio
            img_cells.append(Image(path, width=img_w, height=h))
            cap_cells.append(Paragraph(caption, BODY_SMALL))
        except Exception:
            img_cells.append(Spacer(1, 1))
            cap_cells.append(Paragraph("", BODY_SMALL))

    if img_cells:
        tbl_imgs = Table([img_cells], colWidths=[img_w, img_w], rowHeights=None)
        tbl_imgs.setStyle(TableStyle([
            ("VALIGN", (0,0), (-1,-1), "TOP"),
            ("LEFTPADDING",  (0,0), (-1,-1), 0),
            ("RIGHTPADDING", (0,0), (-1,-1), 6),
        ]))
        tbl_caps = Table([cap_cells], colWidths=[img_w, img_w])
        tbl_caps.setStyle(TableStyle([
            ("VALIGN", (0,0), (-1,-1), "TOP"),
            ("LEFTPADDING",  (0,0), (-1,-1), 0),
            ("RIGHTPADDING", (0,0), (-1,-1), 6),
            ("TOPPADDING",   (0,0), (-1,-1), 3),
        ]))
        elems.append(tbl_imgs)
        elems.append(tbl_caps)

    elems.append(Spacer(1, 0.4*cm))

    # --- Il Giardino Albergo Ristorante ---
    elems.append(Paragraph("Il Giardino Albergo Ristorante — Lido del Sole, Rodi Garganico", H2))
    elems.append(Spacer(1, 0.2*cm))
    foto_giardino = [
        ("WhatsApp Image 2026-05-30 at 21.09.04.jpeg",
         "Il Giardino, Rodi Garganico — materiale Localis alla reception: 33 camere raggiungibili"),
        ("WhatsApp Image 2026-05-30 at 21.09.18.jpeg",
         "Il Giardino, Rodi Garganico — Localis esposto nel ristorante, intercetta turisti a tavola"),
    ]
    giardino_cells = []
    giardino_caps  = []
    for fname, caption in foto_giardino:
        path = os.path.join(GIARDINO_DIR, fname)
        try:
            pil = PILImage.open(path)
            pw, ph = pil.size
            ratio = ph / pw
            h = img_w * ratio
            giardino_cells.append(Image(path, width=img_w, height=h))
            giardino_caps.append(Paragraph(caption, BODY_SMALL))
        except Exception:
            giardino_cells.append(Spacer(1, 1))
            giardino_caps.append(Paragraph("", BODY_SMALL))

    if giardino_cells:
        tbl_g = Table([giardino_cells], colWidths=[img_w, img_w])
        tbl_g.setStyle(TableStyle([
            ("VALIGN", (0,0), (-1,-1), "TOP"),
            ("LEFTPADDING",  (0,0), (-1,-1), 0),
            ("RIGHTPADDING", (0,0), (-1,-1), 6),
        ]))
        tbl_gc = Table([giardino_caps], colWidths=[img_w, img_w])
        tbl_gc.setStyle(TableStyle([
            ("VALIGN", (0,0), (-1,-1), "TOP"),
            ("LEFTPADDING",  (0,0), (-1,-1), 0),
            ("RIGHTPADDING", (0,0), (-1,-1), 6),
            ("TOPPADDING",   (0,0), (-1,-1), 3),
        ]))
        elems.append(tbl_g)
        elems.append(tbl_gc)

    elems.append(Spacer(1, 0.4*cm))
    elems.append(Paragraph(
        "Le foto documentano la presenza fisica di Localis presso il <b>London Bar</b> a Bari "
        "(7 QR code sul bancone e ai tavoli) e presso <b>Il Giardino Albergo Ristorante</b> "
        "a Lido del Sole, Rodi Garganico (33 camere + ristorante). "
        "Entrambi i partner hanno accettato di esporre il materiale Localis volontariamente, "
        "senza corrispettivo economico — prova diretta della validità del modello. "
        "A giugno 2026 la rete si è estesa all'<b>InfoPoint Turistico ufficiale di Bari</b> "
        "e a strutture di Ostuni e Polignano a Mare, confermando la scalabilità del modello "
        "distributivo su zone geografiche diverse.",
        HIGHLIGHT))
    return elems


def section_7():
    elems = [
        PageBreak(),
        Paragraph("10. IMPATTO TERRITORIALE", H1), hr(),
        Paragraph(
            "Localis genera valore diretto e misurabile sul territorio pugliese, "
            "con un impatto che va oltre il semplice prodotto turistico:", BODY),
        Spacer(1, 0.1*cm),
        Paragraph("Impatto economico diretto", H2),
    ]
    for i in [
        "Committenza continuativa a voci narranti locali: attori, speaker e professionisti audio pugliesi retribuiti per ogni guida prodotta",
        "Revenue share 25% per ogni struttura partner: reddito passivo diretto per hotel, B&B e operatori locali",
        "Rete distributiva che privilegia strutture indipendenti e familiari — non catene alberghiere",
    ]:
        elems.append(bp(i))
    elems.append(Spacer(1, 0.1*cm))
    elems.append(Paragraph("Redistribuzione dei flussi turistici", H2))
    for i in [
        "Valorizzazione attiva di borghi minori e aree interne sistematicamente esclusi dai circuiti mainstream: Daunia, Gargano profondo, Puglia rurale medievale",
        "Riduzione della concentrazione turistica sulle mete sature (Alberobello, Polignano) a favore di destinazioni con minore pressione antropica",
        "Allungamento della stagione turistica: le guide funzionano tutto l'anno, non solo nei mesi estivi, incentivando il turismo fuori stagione nei borghi interni",
        "Visibilità internazionale (DE / UK / NL / FR) per luoghi che non hanno risorse per promuoversi autonomamente sui mercati esteri",
    ]:
        elems.append(bp(i))
    elems.append(Spacer(1, 0.1*cm))
    elems.append(Paragraph("Valore culturale e identitario", H2))
    for i in [
        "Documentazione e trasmissione di storie locali, tradizioni orali e memorie di comunità che rischiano di andare perdute",
        "Narrazione in tre lingue di un patrimonio culturale spesso accessibile solo ai residenti — apertura al mondo senza snaturamento",
        "Modello scalabile: ogni nuova guida prodotta è un asset permanente che genera valore senza costi aggiuntivi di replica",
    ]:
        elems.append(bp(i))
    elems.append(Spacer(1, 0.2*cm))
    elems.append(Paragraph(
        "Localis è uno strumento di <b>politica culturale applicata</b>: non racconta solo dove andare, "
        "ma perché certi luoghi meritano attenzione — e lo fa nella lingua del turista che ha i soldi "
        "per arrivarci.", HIGHLIGHT))
    return elems

def section_8():
    elems = [
        PageBreak(),
        Paragraph("11. SINTESI DELLA RICHIESTA", H1), hr(),
    ]
    sum_data = [
        ["Voce", "Dettaglio"],
        ["Richiedente",              "Loconsole Domenico — Ditta Individuale"],
        ["Sede operativa",           "Bari (BA) — Puglia"],
        ["Settore ATECO",            "90.01.09 — Altre rappresentazioni artistiche"],
        ["Investimento totale",      "€ 50.000"],
        ["Contributo fondo perduto", "€ 25.000 (50% dell'investimento)"],
        ["Prestito agevolato 0%",    "€ 25.000 (50%) — rimborso €5.000/anno × 5 anni"],
        ["Contributo gestione",      "€ 10.000 aggiuntivo (primi 6 mesi)"],
        ["Agevolazione NIDI totale", "€ 60.000"],
    ]
    extra = [
        ("BACKGROUND", (0,-1), (-1,-1), BLUE_LIGHT),
        ("FONTNAME",   (0,-1), (-1,-1), "Helvetica-Bold"),
        ("TEXTCOLOR",  (0,-1), (-1,-1), BLUE_DARK),
        ("FONTSIZE",   (0,-1), (-1,-1), 10),
    ]
    elems.append(tbl(sum_data, [5.5*cm, W-5.5*cm], extra))
    elems.append(Spacer(1, 0.6*cm))
    elems.append(hr(BLUE_DARK, 0.8))
    elems.append(Spacer(1, 0.2*cm))
    elems.append(Paragraph(
        "localis.guide  ·  info@localis.guide  ·  Bari, Puglia  ·  Giugno 2026",
        FOOTER_STYLE))
    return elems

# ── Numerazione pagine ────────────────────────────────────────────────────────
def add_page_number(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(GRAY_MID)
    page_num = canvas.getPageNumber()
    if page_num > 1:
        canvas.drawCentredString(A4[0]/2, 1.2*cm, f"Localis · Business Plan NIDI Puglia · pag. {page_num-1}")
        canvas.setStrokeColor(colors.HexColor("#e2e8f0"))
        canvas.setLineWidth(0.3)
        canvas.line(2*cm, 1.6*cm, A4[0]-2*cm, 1.6*cm)
    canvas.restoreState()

# ── Build ─────────────────────────────────────────────────────────────────────
def build():
    doc = SimpleDocTemplate(
        OUTPUT,
        pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm,
        topMargin=2*cm, bottomMargin=2.2*cm,
        title="Business Plan Localis — NIDI Puglia",
        author="Loconsole Domenico",
        subject="Domanda agevolazione NIDI Regione Puglia",
    )

    story = []
    story += cover_page()
    story += section_1()
    story += section_2()
    story += section_3()
    story += section_4()
    story += section_5()
    story += section_6()
    story += section_partner()
    story += section_7()
    story += section_8()

    doc.build(story, onFirstPage=add_page_number, onLaterPages=add_page_number)
    print(f"PDF generato: {OUTPUT}")

if __name__ == "__main__":
    build()
