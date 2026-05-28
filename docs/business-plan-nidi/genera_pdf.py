from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, Image
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
    borderPad=0)

H2 = s("H2",
    fontSize=11, leading=15, textColor=BLUE_MID,
    fontName="Helvetica-Bold", spaceBefore=12, spaceAfter=4)

BODY = s("Body",
    fontSize=9.5, leading=15, textColor=BLACK,
    fontName="Helvetica", alignment=TA_JUSTIFY, spaceAfter=4)

BODY_SMALL = s("BodySmall",
    fontSize=8.5, leading=13, textColor=GRAY_MID,
    fontName="Helvetica", alignment=TA_LEFT)

BULLET = s("Bullet",
    fontSize=9.5, leading=15, textColor=BLACK,
    fontName="Helvetica", leftIndent=14, spaceAfter=2,
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
        ["Data", "Maggio 2026"],
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
            "narrazioni originali recitate da voci locali autentiche.", BODY),
        Paragraph(
            "Il modello è interamente digitale: nessun magazzino, nessun personale fisso. La distribuzione "
            "avviene tramite QR code posizionati nei punti di accoglienza turistica — hotel, ristoranti, "
            "B&B, musei, infopoint. Il turista scansiona, acquista e ascolta in totale autonomia.", BODY),
        Spacer(1, 0.3*cm),
        Paragraph("Prodotto già sviluppato alla data della domanda:", H2),
    ]
    items = [
        "4 guide Bari: Bari Vecchia, Porto Vecchio, Basilica San Nicola, Tre Teatri",
        "3 guide Valle d'Itria: Alberobello, Locorotondo, Martina Franca",
        "6 guide Gargano in produzione: Vieste, Isole Tremiti, Foresta Umbra, Laghi di Lesina/Varano, Gargano Sacro, Gargano Nord",
        "Versioni multilingue IT / EN / DE avviate su tutte le guide",
        "Sito web attivo: localis.guide — player integrato, nessuna app da scaricare",
        "Pricing a 3 livelli: €4,99 (base) · €9,99 (standard) · €14,99 (completa)",
    ]
    for i in items:
        elems.append(bp(i))
    return elems

def section_2():
    elems = [
        Spacer(1, 0.4*cm),
        Paragraph("2. PROFILO DEL RICHIEDENTE", H1), hr(),
        Paragraph(
            "<b>Loconsole Domenico</b>, nato a Bari, 59 anni, residente a Bari. Disoccupato.", BODY),
        Paragraph(
            "Conoscenza profonda del territorio pugliese e della sua storia culturale. Ha collaborato "
            "attivamente allo sviluppo dei contenuti della piattaforma Localis nella fase preliminare, "
            "contribuendo alla ideazione dei percorsi narrativi e alla supervisione dei testi. "
            "Madrelingua italiano; la sua voce e la sua conoscenza del territorio costituiscono la "
            "fonte primaria di autenticità dei contenuti.", BODY),
        Paragraph(
            "<b>Motivazione:</b> valorizzare il patrimonio culturale pugliese attraverso uno strumento "
            "digitale accessibile, generando reddito stabile da un'attività che non richiede strutture "
            "fisiche né personale dipendente, compatibile con la gestione individuale.", BODY),
    ]
    return elems

def section_3():
    elems = [
        Spacer(1, 0.4*cm),
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
    elems.append(Spacer(1, 0.3*cm))
    elems.append(Paragraph("Vantaggi competitivi di Localis", H2))
    for v in [
        "Voci narranti locali autentiche — non sintesi vocale generica",
        "Multilingue nativo (IT/EN/DE) — unico nel segmento Puglia profonda",
        "Nessuna app da scaricare: accesso immediato via browser + QR code",
        "Copertura di borghi minori e aree interne non presenti su nessun competitor",
        "Modello distributivo capillare tramite rete di strutture ricettive partner",
    ]:
        elems.append(bp(v))
    return elems

def section_4():
    elems = [
        Spacer(1, 0.4*cm),
        Paragraph("4. PIANO OPERATIVO", H1), hr(),
    ]
    fasi = [
        ("Fase 1 — Avvio (mesi 1–6)", [
            "Costituzione ditta individuale e apertura P.IVA (ATECO 90.01.09 — altre rappresentazioni artistiche)",
            "Completamento guide Gargano (6 percorsi) in IT/EN/DE",
            "Sviluppo sistema pagamento integrato e player mobile ottimizzato",
            "Distribuzione QR code in 200 strutture ricettive: Bari, Valle d'Itria, Gargano",
            "Attivazione canali marketing: Google Ads, Meta Ads, TikTok turismo",
        ]),
        ("Fase 2 — Consolidamento (mesi 7–18)", [
            "Lancio zona Lecce/Salento (6 nuove guide)",
            "Accordi con agenzie di viaggio incoming pugliesi",
            "Inserimento su piattaforme di distribuzione turistica (Viator, GetYourGuide)",
            "Versione francese (FR) delle guide già esistenti",
            "Attivazione abbonamenti per strutture ricettive (modello white label)",
        ]),
        ("Fase 3 — Espansione (mesi 19–36)", [
            "Estensione a Matera e Basilicata",
            "Partnership con Puglia Promozione / Agenzia del Turismo Regionale",
            "Modello B2B: licenza contenuti a musei, comuni, parchi nazionali",
        ]),
    ]
    for titolo, punti in fasi:
        elems.append(Paragraph(titolo, H2))
        for p in punti:
            elems.append(bp(p))
    return elems

def section_5():
    elems = [
        Spacer(1, 0.4*cm),
        Paragraph("5. PIANO DEGLI INVESTIMENTI — € 50.000", H1), hr(),
    ]
    inv_data = [
        ["Voce di Spesa", "Importo", "Descrizione"],
        ["Attrezzatura tecnica",       "€ 4.500",  "Laptop pro, hard disk NAS, microfoni studio, interfaccia audio"],
        ["Sviluppo piattaforma",       "€ 18.000", "Player, pagamenti, area utente, analytics — sviluppatore freelance 12 mesi"],
        ["Produzione contenuti audio", "€ 8.500",  "Guide Gargano + Lecce: voci, regia, post-produzione, traduzione DE/EN"],
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
    elems.append(tbl(inv_data, [4.2*cm, 2.2*cm, W-6.4*cm], extra_style))
    elems.append(Spacer(1, 0.3*cm))
    elems.append(Paragraph(
        "In aggiunta al piano investimenti, NIDI prevede un contributo separato di <b>€ 10.000</b> "
        "per le spese di gestione dei primi 6 mesi (coworking, utenze, connettività, abbonamenti software). "
        "<b>Agevolazione totale ricevuta: € 60.000.</b>", HIGHLIGHT))
    return elems

def section_6():
    GREEN_LIGHT = colors.HexColor("#dcfce7")
    elems = [
        Spacer(1, 0.4*cm),
        Paragraph("6. PIANO FINANZIARIO — PROIEZIONI 3 ANNI", H1), hr(),

        # ── Baseline pre-investimento ─────────────────────────────────────────
        Paragraph("Baseline pre-investimento (rete attuale — 8 partner attivi)", H2),
        Paragraph(
            "Alla data di presentazione della domanda Localis dispone già di 8 partner "
            "operativi distribuiti su Bari e Gargano. Le proiezioni seguenti partono da "
            "questa base reale, non da ipotesi teoriche.", BODY),
        Spacer(1, 0.2*cm),
    ]

    base_data = [
        ["Cluster", "Partner", "Logica conversione", "Acquisti/anno", "Ricavo stimato"],
        ["Hotel Gargano",
         "Il Giardino (28 cam.)\nBlue Marine (70 cam.)\naprile–ottobre",
         "2.970 gruppi ospiti/anno\n× 6% conv. (turisti in loco)",
         "178", "€ 1.958"],
        ["B&B Bari",
         "Principe 152 (3 cam.)\nMarchese 124 (2 cam.)\nChicche di Carola (1 cam.)",
         "876 gruppi/anno\n× 10% conv. (ospiti in città)",
         "88", "€ 660"],
        ["Bar e negozi Bari",
         "London Bar\nBrunoCaffè\nPaesaggi Loconsole",
         "~20 turisti/giorno esposti\n× 2% conv.",
         "146", "€ 1.095"],
        ["TOTALE BASELINE", "8 partner attivi", "—", "412", "€ 3.713"],
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
        "costruzione della rete — il deficit è interamente coperto dal contributo NIDI "
        "per le spese di gestione (€10.000). "
        "<b>Break-even operativo al mese 16 circa.</b> "
        "Il prestito NIDI (€25.000 a tasso zero, €5.000/anno × 5 anni) diventa "
        "sostenibile dall'anno 2 con €3.770 di utile netto residuo.", BODY))
    return elems

def section_partner():
    FOTO_DIR = r"C:\Users\Admin\Desktop\Bari_foto\Bar London"
    # Foto scelte: bancone (impatto visivo) + tavoli multipli (scalabilità)
    foto = [
        ("WhatsApp Image 2026-05-26 at 09.00.43.jpeg",
         "London Bar, Bari — totem Localis sul bancone accanto al POS"),
        ("WhatsApp Image 2026-05-26 at 09.00.44 (1).jpeg",
         "BrunoCaffè, Bari — più totem Localis sui tavoli: modello già scalato"),
        ("WhatsApp Image 2026-05-26 at 09.00.44 (3).jpeg",
         "BrunoCaffè, Bari — QR Localis integrato nel tavolo accanto al brand caffè"),
    ]

    elems = [
        Spacer(1, 0.4*cm),
        Paragraph("9. RETE PARTNER ATTIVI — PROVE DI MERCATO", H1), hr(),
        Paragraph(
            "Il modello distributivo Localis è già operativo alla data della domanda, "
            "con <b>8 partner attivi</b> tra Bari e Gargano. "
            "I materiali QR code con cornice professionale sono posizionati stabilmente "
            "presso strutture ricettive e commerciali, con esposizione continuativa "
            "al flusso di turisti.", BODY),
        Spacer(1, 0.2*cm),
    ]

    partner_lista = [
        ["Partner", "Tipo", "Città / Zona"],
        ["London Bar",                  "Bar / caffè",          "Bari"],
        ["BrunoCaffè",                  "Bar / caffè",          "Bari"],
        ["Paesaggi di Loconsole Patrizia", "Negozio fiori",     "Bari"],
        ["B&B Principe 152",            "B&B (3 camere)",       "Bari"],
        ["B&B Marchese 124",            "B&B (2 camere)",       "Bari"],
        ["Chicche di Carola",           "B&B (1 camera)",       "Bari"],
        ["Il Giardino Albergo Rist.",   "Hotel+ristorante (28 cam.)", "Lido del Sole, Rodi Garganico"],
        ["Residence Blue Marine",       "Residence (70 cam.)",  "Lido del Sole, Rodi Garganico"],
    ]
    partner_extra = [
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [WHITE, GRAY_LIGHT]),
    ]
    elems.append(tbl(partner_lista, [5.5*cm, 4*cm, W-9.5*cm], partner_extra))
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
    elems.append(Paragraph(
        "Le foto documentano la presenza fisica di Localis presso <b>London Bar</b> e "
        "<b>BrunoCaffè</b> a Bari. Entrambe le strutture hanno accettato di esporre il "
        "materiale Localis volontariamente, senza corrispettivo economico — prova diretta "
        "della validità e dell'accettazione del modello da parte degli operatori locali.",
        HIGHLIGHT))
    return elems


def section_7():
    elems = [
        Spacer(1, 0.4*cm),
        Paragraph("10. IMPATTO TERRITORIALE", H1), hr(),
        Paragraph(
            "Localis genera valore diretto e misurabile sul territorio pugliese:", BODY),
    ]
    for i in [
        "Committenza a voci narranti locali: attori, speaker e professionisti audio pugliesi",
        "Rete distributiva di strutture ricettive locali (B&B, agriturismi, hotel, ristoranti)",
        "Valorizzazione di borghi minori e aree interne — Valle d'Itria, Gargano interno — spesso esclusi dai circuiti mainstream",
        "Visibilità internazionale del patrimonio culturale pugliese su turisti DE / UK / NL",
        "Modello replicabile: espandibile a tutta la Puglia senza aumentare i costi fissi",
    ]:
        elems.append(bp(i))
    return elems

def section_8():
    elems = [
        Spacer(1, 0.4*cm),
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
        "localis.guide  ·  info@localis.guide  ·  Bari, Puglia  ·  Maggio 2026",
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
