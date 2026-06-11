# Deduplica l'archivio audio locale contro il mirror R2 appena scaricato.
# Regola: si elimina SOLO ciò che è identico (sha256) a una copia archiviata;
# tutto ciò che differisce va in storico/, mai cancellato.
import hashlib
import shutil
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
MIRROR = REPO / "private" / "audio" / "r2-mirror" / "guides"
R2A = REPO / "r2_audio"
CHUNKS = REPO / "chunks"
STORICO = REPO / "private" / "audio" / "storico" / "versioni-precedenti"
BACKUP_OLD = REPO / "private" / "audio" / "_backup-r2"
CASTING = REPO / "private" / "audio" / "casting"

deleted, archived, chunks_moved, kept = [], [], [], []


def sha(p: Path) -> str:
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for blk in iter(lambda: f.read(1 << 20), b""):
            h.update(blk)
    return h.hexdigest()


def same(a: Path, b: Path) -> bool:
    return a.exists() and b.exists() and a.stat().st_size == b.stat().st_size and sha(a) == sha(b)


# 1. r2_audio/{slug}/ residui: full-{lang} vs mirror
if R2A.exists():
    for d in sorted(p for p in R2A.iterdir() if p.is_dir()):
        slug = d.name
        fulls = sorted(d.glob("full-*.mp3"))
        results = {f: same(f, MIRROR / slug / f"{slug}-{f.stem.split('-')[1]}.mp3") for f in fulls}
        if fulls and all(results.values()):
            for f in fulls:
                deleted.append(str(f.relative_to(REPO)))
                f.unlink()
            for cd in sorted(d.glob("chunks-*")):
                lang = cd.name.split("-")[1]
                target = CHUNKS / f"{slug}-{lang}"
                if target.exists():
                    kept.append(f"{cd.relative_to(REPO)} NON spostata: {target.name} esiste già in chunks/")
                else:
                    shutil.move(str(cd), str(target))
                    chunks_moved.append(target.name)
            if not any(d.iterdir()):
                d.rmdir()
            else:
                kept.append(f"{d.relative_to(REPO)}: residui non gestiti -> storico")
                STORICO.mkdir(parents=True, exist_ok=True)
                shutil.move(str(d), str(STORICO / slug))
        else:
            STORICO.mkdir(parents=True, exist_ok=True)
            shutil.move(str(d), str(STORICO / slug))
            archived.append(slug)

# 2. _backup-r2 piatto vs mirror
if BACKUP_OLD.exists():
    for f in sorted(BACKUP_OLD.glob("*.mp3")):
        name = f.stem  # {slug}-{lang} oppure _test...
        if name.startswith("_"):
            dest = CASTING / "test-bitrate" / f.name
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(f), str(dest))
            chunks_moved.append(f"casting/{f.name}")
            continue
        slug, lang = name.rsplit("-", 1)
        if same(f, MIRROR / slug / f.name):
            deleted.append(str(f.relative_to(REPO)))
            f.unlink()
        else:
            dest = STORICO / "_backup-r2" / f.name
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(f), str(dest))
            archived.append(f"_backup-r2/{f.name}")
    if not any(BACKUP_OLD.iterdir()):
        BACKUP_OLD.rmdir()

# 3. produzione/varie-guides vs master di zona
VG = REPO / "private" / "audio" / "produzione" / "varie-guides"
PROD = REPO / "private" / "audio" / "produzione"
pairs = {
    "bari-tavola-rachele-completa-it.mp3": PROD / "bari" / "bari-tavola" / "bari-tavola-rachele-completa-it.mp3",
    "gargano-paesi-it.mp3": PROD / "gargano" / "gargano-paesi" / "gargano-paesi-it.mp3",
    "gargano-paesi-en.mp3": PROD / "gargano" / "gargano-paesi" / "gargano-paesi-en.mp3",
    "gargano-paesi-de.mp3": PROD / "gargano" / "gargano-paesi" / "gargano-paesi-de.mp3",
}
if VG.exists():
    for name, master in pairs.items():
        f = VG / name
        if f.exists() and same(f, master):
            deleted.append(str(f.relative_to(REPO)))
            f.unlink()
    if not any(VG.iterdir()):
        VG.rmdir()

print(f"ELIMINATI (identici a copia archiviata): {len(deleted)}")
for x in deleted:
    print("  -", x)
print(f"SPOSTATI IN STORICO (diversi dall'online): {len(archived)}")
for x in archived:
    print("  ~", x)
print(f"CHUNKS/CASTING CONSOLIDATI: {len(chunks_moved)}")
for x in chunks_moved:
    print("  +", x)
for x in kept:
    print("  !", x)
