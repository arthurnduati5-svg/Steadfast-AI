# Railway Voice QA (Arabic + Swahili)

## Purpose
- Validate STT accuracy and TTS startup/naturalness on Railway staging before production rollout.
- Produce a machine-readable report for regressions (`docs/voice-qa-report.json` by default).

## Prerequisites
- Railway staging URL for frontend (example: `https://your-frontend.up.railway.app`).
- Valid student/admin bearer token for authenticated voice endpoints.
- Local fixture audio files copied to `qa-fixtures/audio/` and referenced from `docs/voice-qa-suite.example.json`.
- Optional but recommended: `ffprobe` installed (for MP3 duration and chars/sec pace checks).

## Configure Suite
- Copy `docs/voice-qa-suite.example.json` and adjust:
1. STT fixture files and expected transcripts.
2. TTS texts, voice, speed, and thresholds (`maxStartMs`, `minCharsPerSec`, `maxCharsPerSec`).

## Run
```bash
BASE_URL="https://your-frontend.up.railway.app" \
TOKEN="YOUR_BEARER_TOKEN" \
SUITE_FILE="docs/voice-qa-suite.example.json" \
OUTPUT_FILE="docs/voice-qa-report.json" \
node docs/voice-qa-runner.mjs
```

## Output
- Console prints summary totals and failed cases.
- Each case opens and closes a real authenticated voice session so quota and balance checks stay active during QA.
- JSON report includes:
1. Per-case STT latency and WER.
2. Per-case TTS start latency and pace metrics.
3. Overall pass/fail summary.

## Release Gate (Recommended)
1. `failed = 0`
2. Arabic and Swahili STT `WER <= 0.25`
3. TTS `startMs <= 2500` for both languages
4. No backend `LatencyThresholdAlert` critical spikes during the QA window
