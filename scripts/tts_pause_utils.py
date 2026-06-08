import re
import subprocess
from pathlib import Path
from tempfile import TemporaryDirectory

import imageio_ffmpeg


BREAK_RE = re.compile(r'<break\s+time="([\d.]+)s"\s*/?>', re.IGNORECASE)
OTHER_TAG_RE = re.compile(r'<(?!break\b)[^>]+>', re.IGNORECASE)


def normalize_inline_breaks(text: str) -> str:
    text = re.sub(r"\n\s*\n+", " [[PAUSE:1.20]] ", text)
    text = text.replace("\n", " ")

    def repl(match: re.Match[str]) -> str:
        seconds = float(match.group(1))
        if seconds < 0.55:
            return " "
        if seconds < 0.95:
            return ", "
        if seconds < 1.20:
            return ". "
        return f" [[PAUSE:{seconds:.2f}]] "

    text = BREAK_RE.sub(repl, text)
    text = OTHER_TAG_RE.sub("", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"\s+([,.;:!?])", r"\1", text)
    text = re.sub(r"([.!?])\s*,\s*", r"\1 ", text)
    text = re.sub(r"([.!?]){2,}", r"\1", text)
    text = re.sub(r",\s*\.", ".", text)
    return text.strip()


def build_tts_plan(text: str) -> list[tuple[str, str | float]]:
    plan: list[tuple[str, str | float]] = []
    normalized = normalize_inline_breaks(text)
    parts = re.split(r"\[\[PAUSE:([\d.]+)\]\]", normalized)
    for idx, part in enumerate(parts):
        if idx % 2 == 1:
            seconds = float(part)
            if seconds > 0:
                plan.append(("pause", seconds))
            continue
        speech = re.sub(r"\s+", " ", part).strip()
        if speech:
            plan.append(("speech", speech))
    return plan


def ffmpeg_exe() -> str:
    return imageio_ffmpeg.get_ffmpeg_exe()


def make_silence_mp3(dest: Path, seconds: float, bitrate: str = "192k") -> None:
    cmd = [
        ffmpeg_exe(),
        "-y",
        "-f",
        "lavfi",
        "-i",
        "anullsrc=r=44100:cl=mono",
        "-t",
        f"{seconds:.2f}",
        "-c:a",
        "libmp3lame",
        "-b:a",
        bitrate,
        str(dest),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg silence generation failed: {result.stderr.strip()}")


def concat_mp3_files(parts: list[Path], dest: Path, bitrate: str = "192k") -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    with TemporaryDirectory(prefix="tts-concat-") as tmpdir:
        list_path = Path(tmpdir) / "inputs.txt"
        lines = []
        for path in parts:
            resolved = str(path.resolve()).replace("'", "''")
            lines.append(f"file '{resolved}'\n")
        list_path.write_text("".join(lines), encoding="utf-8")
        cmd = [
            ffmpeg_exe(),
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(list_path),
            "-c:a",
            "libmp3lame",
            "-b:a",
            bitrate,
            str(dest),
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            raise RuntimeError(f"ffmpeg concat failed: {result.stderr.strip()}")
