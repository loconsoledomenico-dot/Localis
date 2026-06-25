#!/usr/bin/env bash
# Reel "Pomodori appesi di Puglia" -> gruppo Localis
# Input: 5 immagini in scripts/reel-pomodori/src/ (01.jpg .. 05.jpg)
# Output: scripts/reel-pomodori/reel-pomodori-base.mp4  (9:16, ~20s, NO audio)
# L'audio trending va aggiunto in-app (Instagram/FB) per la reach.
set -euo pipefail

FFMPEG="$(command -v ffmpeg || true)"
[ -z "$FFMPEG" ] && [ -x "/c/ffmpeg/bin/ffmpeg.exe" ] && FFMPEG="/c/ffmpeg/bin/ffmpeg.exe"
[ -z "$FFMPEG" ] && { echo "ffmpeg non trovato"; exit 1; }

HERE="$(cd "$(dirname "$0")" && pwd)"
SRC="$HERE/reel-pomodori/src"
OUT="$HERE/reel-pomodori"
TMP="$OUT/tmp"
mkdir -p "$TMP"

FONT='C\:/Windows/Fonts/arialbd.ttf'   # Arial Bold (escape ':' per il filtro)
DUR=4.5                                  # durata per foto (s)
FPS=30
XF=0.6                                   # durata crossfade (s)
FRAMES=$(awk "BEGIN{print int($DUR*$FPS)}")   # frame totali per clip

# ---- 1) clip animati (zoompan/Ken Burns) + testo per ogni foto ----
make_clip () {                           # $1=indice  $2=testo  $3=zoom-in?(1/0)  $4=fontsize
  local idx="$1" txt="$2" zin="$3" fs="${4:-56}"
  local zexpr
  if [ "$zin" = "1" ]; then zexpr="min(zoom+0.0012,1.18)"; else zexpr="if(eq(on,1),1.18,max(zoom-0.0012,1.0))"; fi
  "$FFMPEG" -y -loop 1 -i "$SRC/${idx}.png" -filter_complex \
"[0:v]scale=1620:2880:force_original_aspect_ratio=increase,crop=1620:2880,\
zoompan=z='${zexpr}':d=${FRAMES}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=${FPS},\
drawtext=fontfile='${FONT}':text='${txt}':fontcolor=white:fontsize=${fs}:line_spacing=10:box=1:boxcolor=black@0.45:boxborderw=26:x=(w-text_w)/2:y=h*0.13" \
    -frames:v "$FRAMES" -c:v libx264 -pix_fmt yuv420p -r "$FPS" "$TMP/clip${idx}.mp4"
}

make_clip 01 "NOT decoration."              1 78
make_clip 02 "No fridge. Just sun + string." 0 54
make_clip 03 "Months later, sweet and intense." 1 52
make_clip 04 "Winter lunch in the Puglia sun." 0 54
make_clip 05 "Food. Music. Stories."         1 72

# CTA bruciata sull'ultimo clip (seconda riga, in basso)
"$FFMPEG" -y -i "$TMP/clip05.mp4" -filter_complex \
"drawtext=fontfile='${FONT}':text='Join the group - one story / week':fontcolor=white:fontsize=58:box=1:boxcolor=black@0.55:boxborderw=22:x=(w-text_w)/2:y=h*0.80" \
  -c:v libx264 -pix_fmt yuv420p -r "$FPS" "$TMP/clip05cta.mp4"
mv "$TMP/clip05cta.mp4" "$TMP/clip05.mp4"

# ---- 2) crossfade chain ----
o1=$(awk "BEGIN{print $DUR-$XF}")
o2=$(awk "BEGIN{print 2*$DUR-2*$XF}")
o3=$(awk "BEGIN{print 3*$DUR-3*$XF}")
o4=$(awk "BEGIN{print 4*$DUR-4*$XF}")

"$FFMPEG" -y \
  -i "$TMP/clip01.mp4" -i "$TMP/clip02.mp4" -i "$TMP/clip03.mp4" \
  -i "$TMP/clip04.mp4" -i "$TMP/clip05.mp4" -filter_complex \
"[0][1]xfade=transition=fade:duration=${XF}:offset=${o1}[a];\
[a][2]xfade=transition=fade:duration=${XF}:offset=${o2}[b];\
[b][3]xfade=transition=fade:duration=${XF}:offset=${o3}[c];\
[c][4]xfade=transition=fade:duration=${XF}:offset=${o4}[v]" \
  -map "[v]" -c:v libx264 -pix_fmt yuv420p -r "$FPS" "$OUT/reel-pomodori-base.mp4"

echo "OK -> $OUT/reel-pomodori-base.mp4"
