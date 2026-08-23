@echo off
REM Digest giornaliero Localis - lanciato da Windows Task Scheduler alle 08:00.
REM Auth GA4 via service account (non scade). Log in private\daily-digest.log.
setlocal
set PYTHONIOENCODING=utf-8
cd /d "%~dp0.."

REM Il service account atteso da scripts\google-auth.mjs (private\localis-outreach-*.json)
REM non e' presente in questa copia: usiamo quello dell'outreach, stessa property GA4.
if not defined GA4_SERVICE_ACCOUNT_FILE (
  set "GA4_SERVICE_ACCOUNT_FILE=%CD%\marketing\outreach\credentials\google-service-account.json"
)
if not defined DIGEST_TO (
  echo [ERRORE] DIGEST_TO non impostata: nessun destinatario. >> private\daily-digest.log
  exit /b 1
)

echo. >> private\daily-digest.log
echo ===== %DATE% %TIME% ===== >> private\daily-digest.log
"C:\Program Files\nodejs\node.exe" scripts\daily-digest.mjs --send >> private\daily-digest.log 2>&1
if errorlevel 1 echo [ERRORE] uscita %errorlevel% >> private\daily-digest.log
endlocal
