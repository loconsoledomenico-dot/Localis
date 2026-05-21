#!/usr/bin/env python3
"""
Localis audio guide generator.

Reads a narrative .txt/.md script split by "=====" chapter separators,
calls ElevenLabs TTS per chapter, concatenates MP3 chunks into a single
full-it.mp3 ready for R2 upload. SSML <break time="X.Xs"/> tags inside
the script are passed through to ElevenLabs (supported by the
eleven_multilingual_v2 model).

Usage:
  python scripts/generate-guide.py <slug> <script_path> [--lang it|en] [--voice luigi|domenico] [--dry-run] [--model eleven_multilingual_v2]

Examples:
  python scripts/generate-guide.py bari-vecchia bari-vecchia-guida-completa.txt
  python scripts/generate-guide.py bari-vecchia bari-vecchia-guida-completa.txt --voice luigi --dry-run
"""
from __future__ import annotations

import argparse
import os
import re
import sys
import time
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

REPO_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(REPO_ROOT / ".env")

MIN_CHAPTER_CHARS = 250  # skip file headers and meta-blocks; real chapters are >600 chars

CHAPTER_SEP_RE = re.compile(r"^={3,}\s*$", re.MULTILINE)
VOICE_TAG_RE = re.compile(r"^\s*voice\s*:\s*(\S+)\s*$", re.IGNORECASE)
ELEVENLABS_CHAR_LIMIT = 4800  # safe under the 5000 hard limit for multilingual_v2

# Voice tuning from spec (Professional Voice Cloning, narrative tone)
VOICE_SETTINGS = {
    "stability": 0.55,
    "similarity_boost": 0.85,
    "style": 0.20,
    "use_speaker_boost": True,
}

# ElevenLabs Library voice IDs — public (not secrets). Mapped by short name.
# Use lowercase keys to match `voice: name` script tags and --voice CLI arg.
VOICE_MAP: dict[str, str] = {
    # Italian — male narrative
    "gian":     "pwvkOXKI34DbjtR6yUk5",  # GianP — narrative, pleasant, standard
    "valerio":  "f8NAZK1ciwrVujah7clz",  # Valerio — warm storyteller, romanesco
    "brando":   "ovchBcE0QzMVMrtS8r4T",  # Brando — atmospheric, suspense/mystery
    "paolo":    "mcMi8FJDhg35bMpWHv2R",  # Paolo — dynamic radio voice
    "raffaele": "YGp1lBJLaHhfIFT0yeDE",  # RaffaeleR — steady calm corporate deep
    # Italian — female narrative
    "tiziana":  "RXoaSpLaWTEckJgPUBG3",  # Tiziana — smart friendly radio, travel
    "beatrice": "UnOINkXZ3yK4vVg3Iayj",  # Beatrice — warm reassuring refined
    "manuela":  "oVJbgLwL0s5pk9e2U6QH",  # Manuela — warm clear versatile
    "sami":     "b8jhBTcGAq4kQGWmKprT",  # Sami — news anchorwoman, documentaries
    # Italian — male silky narrator (added 2026-05-19)
    "dante":    "q2LDrL29FLqRR3XanHLq",  # Dante — premium deep, smooth, silky tone
    # Italian — female, added 2026-05-21 for guide-06 + guide-04
    "angelina": "MLpDWJvrjFIdb63xbJp8",  # Angelina — mature warm storyteller (Rosa la Perpetua, Bari Sotterranea)
    "maruzzeja":"zzBa3JLSQKDusYxegeHf",  # Maruzzeja — calabrese, natural warm, expressive fun (Rachele, Il Meglio di Bari)
    # English — narrative
    "george":   "JBFqnCBsd6RMkjVDRZzb",  # George — british warm captivating storyteller
    "jeff":     "rqeqvyUEJUTgWU0eqxXO",  # Jeff — american deep storytelling, cinematic energy
    "roger":    "CwhRBWXzGAHq8TQ4Fs17",  # Roger — laid-back, casual, american middle-aged
    "alice":    "Xb7hH8MSUJpSbSDYk0k2",  # Alice — british female, clear engaging educator
    "brian":    "nPczCjzI2devNBz1zQrb",  # Brian — deep american male narrator
    "charlie":  "IKne3meq5aSn9XLyUdCD",  # Charlie — deep confident energetic, australian
    "matilda":  "XrExE9yKIg1WjnnlVkGX",  # Matilda — american female knowledgeable
    "callum":   "N2lVS1w4EtoT3dr4eOWO",  # Callum — husky trickster, gravelly american
}

# Cost: ElevenLabs Creator plan = $22/mo for 100k chars. ~$0.00022 per char.
COST_PER_CHAR_USD = 22.0 / 100_000


@dataclass
class Chapter:
    index: int
    title: str
    text: str
    voice: str | None = None  # short name; falls back to CLI --voice if None

    @property
    def char_count(self) -> int:
        # Strip SSML tags for accurate billing estimate
        return len(re.sub(r"<[^>]+>", "", self.text))


def parse_chapters(raw: str) -> list[Chapter]:
    """Split on `=====` separators. Each block may begin with a `voice: <name>`
    line that overrides the default CLI voice for that chapter only."""
    blocks = [b.strip() for b in CHAPTER_SEP_RE.split(raw) if b.strip()]
    chapters = []
    for i, block in enumerate(blocks):
        lines = [l.rstrip() for l in block.splitlines()]
        title = next((l for l in lines if l and not re.fullmatch(r"-{3,}", l)), f"Section {i+1}")
        body_lines = [l for l in lines if not re.fullmatch(r"-{3,}", l)]
        if body_lines and body_lines[0] == title:
            body_lines = body_lines[1:]
        voice_override: str | None = None
        kept: list[str] = []
        for line in body_lines:
            m = VOICE_TAG_RE.match(line)
            if m and voice_override is None:
                voice_override = m.group(1).lower()
                continue
            kept.append(line)
        text = "\n".join(kept).strip()
        if not text:
            continue
        billable = len(re.sub(r"<[^>]+>", "", text))
        if billable < MIN_CHAPTER_CHARS:
            print(f"[skip header] section {i} ({billable} chars): {title!r}", file=sys.stderr)
            continue
        chapters.append(Chapter(index=len(chapters), title=title, text=text, voice=voice_override))
    return chapters


def split_long_chapter(chapter: Chapter, char_limit: int) -> list[str]:
    """If a chapter exceeds the ElevenLabs limit, split on paragraph breaks."""
    if chapter.char_count <= char_limit:
        return [chapter.text]
    paragraphs = re.split(r"\n\s*\n", chapter.text)
    chunks, current = [], ""
    for para in paragraphs:
        if len(current) + len(para) + 2 <= char_limit:
            current = (current + "\n\n" + para).strip() if current else para
        else:
            if current:
                chunks.append(current)
            current = para
    if current:
        chunks.append(current)
    return chunks


def resolve_voice_id(voice_arg: str) -> tuple[str, str]:
    """Resolve voice short name → (label, voice_id).
    Order: VOICE_MAP (hardcoded Library IDs) → .env override (NAME_VOICE_ID)."""
    key = voice_arg.lower().strip()
    if key in VOICE_MAP:
        return (key, VOICE_MAP[key])
    env_var = f"{voice_arg.upper()}_VOICE_ID"
    voice_id = os.getenv(env_var)
    if voice_id:
        return (env_var, voice_id)
    raise SystemExit(
        f"\n[ERR] Unknown voice {voice_arg!r}.\n"
        f"      Known names: {', '.join(sorted(VOICE_MAP))}\n"
        f"      Or add to .env: {env_var}=xxxxxxxxxxxxxxxxxxxx\n"
    )


def generate_chunk_mp3(client, text: str, voice_id: str, model: str, out_path: Path) -> None:
    audio_iter = client.text_to_speech.convert(
        voice_id=voice_id,
        text=text,
        model_id=model,
        output_format="mp3_44100_128",
        voice_settings=VOICE_SETTINGS,
    )
    with open(out_path, "wb") as f:
        for chunk in audio_iter:
            f.write(chunk)


def concat_mp3_files(parts: list[Path], dest: Path) -> None:
    """Concatenate MP3 chunks into a single playable file.

    Naive binary concat produces an MP3 whose declared duration in the VBR/Xing
    header is only the first chunk's length — browsers then misbehave on seek
    (chapter clicks restart from 0, progress bar wraps, etc).

    Use ffmpeg (`-c copy`) to re-multiplex the audio data into a single MP3
    stream with a correct frame index, no re-encoding.
    """
    try:
        import imageio_ffmpeg
        ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        print("  [WARN] imageio-ffmpeg not installed — falling back to binary concat.")
        print("         Result MP3 will have broken VBR header (player seek issues).")
        print("         Install: pip install imageio-ffmpeg")
        with open(dest, "wb") as out:
            for p in parts:
                out.write(p.read_bytes())
        return

    import subprocess
    concat_input = "concat:" + "|".join(str(p).replace("\\", "/") for p in parts)
    cmd = [ffmpeg, "-y", "-loglevel", "error", "-i", concat_input, "-c:a", "copy", str(dest)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise SystemExit(f"[ERR] ffmpeg concat failed: {r.stderr.strip()}")


def main() -> int:
    ap = argparse.ArgumentParser(description="Generate Localis audio guide via ElevenLabs.")
    ap.add_argument("slug", help="Guide slug, e.g. bari-vecchia")
    ap.add_argument("script_path", help="Path to source .txt/.md (relative to repo root or absolute)")
    ap.add_argument("--lang", default="it", choices=["it", "en"])
    ap.add_argument("--voice", default="luigi", help="Voice key in .env (luigi|domenico|...)")
    ap.add_argument("--model", default="eleven_multilingual_v2",
                    help="ElevenLabs model id (eleven_multilingual_v2|eleven_turbo_v2_5|eleven_v3)")
    ap.add_argument("--dry-run", action="store_true", help="Parse + estimate cost, no API calls")
    args = ap.parse_args()

    script_path = Path(args.script_path)
    if not script_path.is_absolute():
        script_path = REPO_ROOT / script_path
    if not script_path.exists():
        raise SystemExit(f"[ERR] Script not found: {script_path}")

    raw = script_path.read_text(encoding="utf-8")
    chapters = parse_chapters(raw)
    if not chapters:
        raise SystemExit(f"[ERR] No chapters found in {script_path} (expected '=====' separators)")

    out_dir = REPO_ROOT / "r2_audio" / args.slug
    chunks_dir = out_dir / f"chunks-{args.lang}"
    chunks_dir.mkdir(parents=True, exist_ok=True)

    print(f"\n=== Localis · {args.slug} · {args.lang} · default voice={args.voice} ===")
    print(f"Script: {script_path}")
    print(f"Model:  {args.model}")
    print(f"Chapters: {len(chapters)}")

    total_chars = 0
    chunk_plan: list[tuple[Chapter, list[str]]] = []
    voices_used: dict[str, int] = {}
    for ch in chapters:
        sub_chunks = split_long_chapter(ch, ELEVENLABS_CHAR_LIMIT)
        chunk_plan.append((ch, sub_chunks))
        total_chars += ch.char_count
        suffix = f" ({len(sub_chunks)} sub-chunks)" if len(sub_chunks) > 1 else ""
        voice_label = ch.voice or args.voice
        voices_used[voice_label] = voices_used.get(voice_label, 0) + ch.char_count
        print(f"  [{ch.index:02d}] {ch.title:<38} voice={voice_label:<10} {ch.char_count:>5} chars{suffix}")

    print(f"\nVoices used: {', '.join(f'{v}({c} chars)' for v, c in sorted(voices_used.items()))}")

    est_cost = total_chars * COST_PER_CHAR_USD
    est_minutes = total_chars / 900  # ~150 wpm * 6 chars/word
    print(f"\nTotal billable chars: {total_chars}")
    print(f"Estimated cost: ~${est_cost:.2f} USD ({total_chars/100_000*100:.1f}% of monthly Creator quota)")
    print(f"Estimated audio length: ~{est_minutes:.1f} min")

    if args.dry_run:
        print("\n[DRY RUN] No API calls made. Re-run without --dry-run to generate audio.")
        return 0

    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        raise SystemExit("[ERR] Missing ELEVENLABS_API_KEY in .env")

    # Validate all voice names referenced (default + per-chapter overrides) up-front
    default_label, default_voice_id = resolve_voice_id(args.voice)
    voice_id_cache: dict[str, str] = {args.voice.lower(): default_voice_id}
    for ch in chapters:
        if ch.voice and ch.voice not in voice_id_cache:
            _label, vid = resolve_voice_id(ch.voice)
            voice_id_cache[ch.voice] = vid

    print(f"\nDefault voice: {default_label} ({default_voice_id[:6]}...{default_voice_id[-4:]})")
    print(f"Output: {out_dir / f'full-{args.lang}.mp3'}")
    print()

    from elevenlabs.client import ElevenLabs
    client = ElevenLabs(api_key=api_key)

    generated_parts: list[Path] = []
    timeline: list[tuple[str, float]] = []  # (chapter_title, cumulative_seconds)
    cumulative_bytes = 0
    BITRATE_BPS = 128_000  # mp3_44100_128 → 128 kbps → 16000 bytes/s

    t0 = time.time()
    for ch, sub_chunks in chunk_plan:
        chapter_start_bytes = cumulative_bytes
        ch_voice_label = ch.voice or args.voice.lower()
        ch_voice_id = voice_id_cache[ch_voice_label]
        for sub_idx, sub_text in enumerate(sub_chunks):
            chunk_name = f"{ch.index:02d}_{sub_idx:02d}.mp3"
            chunk_path = chunks_dir / chunk_name
            if chunk_path.exists() and chunk_path.stat().st_size > 1024:
                print(f"  [skip] {chunk_name} (already generated, {chunk_path.stat().st_size} bytes)")
            else:
                print(f"  [gen ] {chunk_name} · {ch.title} · voice={ch_voice_label} · {len(sub_text)} chars ...",
                      end=" ", flush=True)
                t_chunk = time.time()
                generate_chunk_mp3(client, sub_text, ch_voice_id, args.model, chunk_path)
                print(f"OK ({time.time()-t_chunk:.1f}s, {chunk_path.stat().st_size} bytes)")
            generated_parts.append(chunk_path)
            cumulative_bytes += chunk_path.stat().st_size
        chapter_start_seconds = chapter_start_bytes * 8 / BITRATE_BPS
        timeline.append((ch.title, chapter_start_seconds))

    final_mp3 = out_dir / f"full-{args.lang}.mp3"
    concat_mp3_files(generated_parts, final_mp3)
    final_size = final_mp3.stat().st_size
    final_duration = final_size * 8 / BITRATE_BPS

    print(f"\n=== Done in {time.time()-t0:.1f}s ===")
    print(f"Output: {final_mp3}  ({final_size:,} bytes, ~{final_duration/60:.1f} min)")

    print("\n=== Chapter timeline (paste into MDX frontmatter) ===")
    print("chapters:")
    for title, start_s in timeline:
        print(f"  - title_it: {title!r}")
        print(f"    title_en: \"\"  # TODO translate")
        print(f"    start_seconds: {int(start_s)}")
    print(f"duration_seconds: {int(final_duration)}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
