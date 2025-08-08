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
import https from 'node:https';                              // ✨ NEW
import { LogMethod } from 'src/common/decorators/log-method.decorator';

/*──────────────────────*
 *  Types & type-guards
 *──────────────────────*/
interface WordAlt { content: string }
interface TranscriptResult { type: 'word' | 'punctuation'; alternatives: WordAlt[] }
interface AddTranscriptMsg { message: 'AddTranscript'; results: TranscriptResult[] }
interface EndMsg { message: 'EndOfTranscript' }
interface ErrorMsg { message: 'Error'; [k: string]: unknown }
type ReceiveMsg = AddTranscriptMsg | EndMsg | ErrorMsg;

const isAddTranscript = (d: unknown): d is AddTranscriptMsg =>
  !!d && (d as Record<string, unknown>).message === 'AddTranscript';
const isErrorMsg = (d: unknown): d is ErrorMsg =>
  !!d && (d as Record<string, unknown>).message === 'Error';

/*──────────────────────*
 *  Minimal SDK view
 *──────────────────────*/
type SpeechmaticsClient = {
  addEventListener(type: 'receiveMessage', l: (e: MessageEvent) => void): void;
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
  private static readonly STREAM_URL = 'https://media-ice.musicradio.com/LBCUKMP3';

  /** Transcribe ~2 s of the LBC UK MP3 stream */
  @LogMethod()
  async transcribeAudio(_: Buffer, locale: string): Promise<string> {
    /* 1. API-key check */
    const apiKey = process.env.SPEECHMATICS_API_KEY;
    if (!apiKey) throw new Error('Missing Speechmatics API key');

    /* 2. Client & transcript collector */
    const client = new RealtimeClient() as unknown as SpeechmaticsClient;
    let text = '';
    const transcriptDone = new Promise<string>((resolve, reject) => {
      client.addEventListener('receiveMessage', ({ data }: MessageEvent) => {
        const msg = data as ReceiveMsg;
        if (isAddTranscript(msg)) {
          for (const r of msg.results) {
            if (r.type === 'word') text += ' ';
            text += r.alternatives[0].content;
          }
        } else if ((msg as EndMsg).message === 'EndOfTranscript') resolve(text.trim());
        else if (isErrorMsg(msg)) reject(new Error(JSON.stringify(msg)));
      });
    });

    /* 3. JWT & start session (MP3 autodetect) */
    const jwt = (await createSpeechmaticsJWT({
      type: 'rt',
      apiKey,
      ttl: 60,
    })) as string;
    await client.start(jwt, {
      transcription_config: {
        language: locale || 'hi',
        operating_point: 'enhanced',
        max_delay: 1.0,
      },
    });

    /* 4. Stream exactly 2 s of audio, then stop */
    await new Promise<void>((resolve, reject) => {
      const req = https.get(SpeechmaticsService.STREAM_URL, (res) => {
        res.on('data', (chunk) => void client.sendAudio(chunk as Buffer));
        setTimeout(() => {
          client
            .stopRecognition({ noTimeout: true })
            .then(resolve)
            .catch(reject);
          req.destroy();
        }, 2_000);
      });
      req.on('error', reject);
    });

    /* 5. Return transcript once EndOfTranscript received */
    return transcriptDone;
  }
}
