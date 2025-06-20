#!/usr/bin/env python3
"""
Real-time transcription of all .mp3/.ogg files in current dir
using Speechmatics RT WebSocket API.
Produces one <name>.txt and a combined all_transcripts_realtime.txt.
"""

from __future__ import annotations
import asyncio
import json
import os
import tempfile
from glob import glob
from pathlib import Path

import soundfile as sf
import websockets
from pydub import AudioSegment

API_KEY = os.getenv("SPEECHMATICS_KEY")
if not API_KEY:
    raise SystemExit("❌  SPEECHMATICS_KEY not set in environment.")

LANG = "hi"
RT_URL = f"wss://rt.api.speechmatics.com/v2?auth_token={API_KEY}"
MASTER = Path("all_transcripts_realtime.txt")
MASTER.write_text("", encoding="utf-8")  # truncate

CHUNK_MS = 20
SAMPLE_RATE = 16_000
SAMPLES_PER_CHUNK = SAMPLE_RATE * CHUNK_MS // 1000


async def transcribe_file(path: Path) -> str:
    """Convert file to 16-kHz mono PCM and stream to Speechmatics RT."""
    with tempfile.NamedTemporaryFile(suffix=".wav") as tmp:
        AudioSegment.from_file(path) \
            .set_frame_rate(SAMPLE_RATE).set_channels(1).set_sample_width(2) \
            .export(tmp.name, format="wav")
        pcm, _ = sf.read(tmp.name, dtype="int16")

    async with websockets.connect(RT_URL) as ws:
        await ws.send(json.dumps({
            "type": "transcription",
            "transcription_config": {
                "language": LANG,
                "format_text": True
            }
        }))

        pcm_bytes = pcm.tobytes()
        for i in range(0, len(pcm), SAMPLES_PER_CHUNK):
            await ws.send(pcm_bytes[i*2:(i + SAMPLES_PER_CHUNK)*2])
            await asyncio.sleep(CHUNK_MS / 1000)

        await ws.send(json.dumps({"type": "AudioFinished"}))

        transcript = ""
        async for message in ws:
            msg = json.loads(message)
            if msg.get("type") == "FinalTranscript":
                transcript += msg["channel"]["alternatives"][0]["transcript"]
            if msg.get("type") == "EndOfTranscript":
                break

    return transcript.strip()


async def main() -> None:
    """Loop through all audio files and transcribe them."""
    files = [Path(p) for p in glob("*.[mM][pP]3")] + \
            [Path(p) for p in glob("*.[oO][gG][gG]")]
    if not files:
        print("No audio files found.")
        return

    for file in files:
        print(f"▶  {file.name}")
        transcript = await transcribe_file(file)
        file.with_suffix(".txt").write_text(transcript + "\n", encoding="utf-8")
        MASTER.write_text(
            MASTER.read_text(encoding="utf-8")
            + f"\n===== {file.name} =====\n{transcript}\n",
            encoding="utf-8"
        )
        print(f"    → {transcript[:60]}…")


if __name__ == "__main__":
    asyncio.run(main())
