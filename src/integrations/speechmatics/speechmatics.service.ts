/* eslint-disable
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-call,
  @typescript-eslint/no-unsafe-member-access,
  @typescript-eslint/no-unsafe-argument
*/
/*───────────────────────────────────────────────────────────────
 *  src/integrations/speechmatics/speechmatics.service.ts
 *───────────────────────────────────────────────────────────────*/
import 'dotenv/config';
import { Injectable, Logger } from '@nestjs/common';
import { createSpeechmaticsJWT } from '@speechmatics/auth';
import { RealtimeClient } from '@speechmatics/real-time-client';
import * as fs from 'fs/promises';
import * as path from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import { execFile as _execFile } from 'child_process';
import { promisify } from 'util';
import * as ffmpegStatic from 'ffmpeg-static';
const execFile = promisify(_execFile);
const ffmpegPath =
  typeof ffmpegStatic === 'string'
    ? (ffmpegStatic as unknown as string)
    : (ffmpegStatic as { default?: string }).default || '';

/*──────────────────────*
 *  Types & type-guards
 *──────────────────────*/
interface WordAlt {
  content: string;
}
interface TranscriptResult {
  type: 'word' | 'punctuation';
  alternatives: WordAlt[];
}
interface AddTranscriptMsg {
  message: 'AddTranscript';
  results: TranscriptResult[];
}
interface ErrorMsg {
  message: 'Error';
  [k: string]: unknown;
}
type ReceiveMsg = AddTranscriptMsg | ErrorMsg;

const isAddTranscript = (d: unknown): d is AddTranscriptMsg =>
  !!d && (d as Record<string, unknown>).message === 'AddTranscript';
const isErrorMsg = (d: unknown): d is ErrorMsg =>
  !!d && (d as Record<string, unknown>).message === 'Error';

/*──────────────*
 *  Minimal SDK view
 *──────────────*/
type SpeechmaticsClient = {
  addEventListener(
    type: 'receiveMessage',
    listener: (evt: MessageEvent) => void,
  ): void;
  start(jwt: string, cfg: unknown): Promise<void>;
  sendAudio(buf: Buffer): Promise<void>;
  stopRecognition(opts?: { noTimeout?: boolean }): Promise<void>;
};

/*──────────────────────*
 *  Service
 *──────────────────────*/
@Injectable()
export class SpeechmaticsService {
  private readonly logger = new Logger(SpeechmaticsService.name);

  /** Transcribe < 60 s of audio and return plain text */
  async transcribeAudio(audio: Buffer, locale: string): Promise<string> {
    /* 1. Check env */
    const apiKey = process.env.SPEECHMATICS_API_KEY;
    if (!apiKey) {
      this.logger.error('SPEECHMATICS_API_KEY missing');
      throw new Error('Missing Speechmatics API key');
    }

    /* 2. 🔄 Decode input → mono 16-kHz PCM (s16le) */
    const inPath = path.join(tmpdir(), `${randomUUID()}.ogg`);
    const outPath = path.join(tmpdir(), `${randomUUID()}.pcm`);
    await fs.writeFile(inPath, audio);
    await execFile(ffmpegPath, [
      '-y',
      '-i',
      inPath,
      '-ac',
      '1',
      '-ar',
      '16000',
      '-f',
      's16le',
      '-acodec',
      'pcm_s16le',
      outPath,
    ]);
    const pcmBuf = await fs.readFile(outPath);
    void fs.unlink(inPath).catch(() => {});
    void fs.unlink(outPath).catch(() => {});

    /* 3. Client */
    const client = new RealtimeClient() as unknown as SpeechmaticsClient;
    let transcript = '';

    client.addEventListener('receiveMessage', (evt: MessageEvent) => {
      const data = evt.data as unknown as ReceiveMsg;
      if (isAddTranscript(data)) {
        for (const r of data.results)
          transcript += `${r.alternatives[0].content} `;
      } else if (isErrorMsg(data)) {
        this.logger.error(`Speechmatics error: ${JSON.stringify(data)}`);
      }
    });

    /* 4. Short-lived JWT */
    const jwt = (await createSpeechmaticsJWT({
      type: 'rt',
      apiKey,
      ttl: 60,
    })) as string;

    /* 5. Start session — audio_format must be top-level */
    await client.start(jwt, {
      audio_format: {
        type: 'raw',
        encoding: 'pcm_s16le',
        sample_rate: 16000,
      },
      transcription_config: {
        language: locale || 'en',
        operating_point: 'enhanced',
        max_delay: 1.0,
      },
    });

    /* 6. Stream PCM & close */
    await client.sendAudio(pcmBuf);
    await client.stopRecognition({ noTimeout: true });

    return transcript.trim();
  }
}
