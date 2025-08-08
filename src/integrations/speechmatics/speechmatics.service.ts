// src/integrations/speechmatics/speechmatics.service.ts
/* eslint-disable
  @typescript-eslint/no-unsafe-call,
*/
/*───────────────────────────────────────────────────────────────
 *  src/integrations/speechmatics/speechmatics.service.ts
 *───────────────────────────────────────────────────────────────*/
import 'dotenv/config';
import { Injectable, Logger } from '@nestjs/common';
import { createSpeechmaticsJWT } from '@speechmatics/auth';
import { RealtimeClient } from '@speechmatics/real-time-client';

/*──────────────────────*
 *  Narrow message types
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

/* Guards */
const isAddTranscript = (d: unknown): d is AddTranscriptMsg =>
  !!d && (d as Record<string, unknown>).message === 'AddTranscript';
const isErrorMsg = (d: unknown): d is ErrorMsg =>
  !!d && (d as Record<string, unknown>).message === 'Error';

/*──────────────*
 *  Extra cast
 *──────────────*/
// our own view of the JS-only SDK
type SpeechmaticsClient = {
  addEventListener(
    type: 'receiveMessage',
    listener: (evt: MessageEvent) => void,
  ): void;
  start(jwt: string, cfg: unknown): Promise<void>;
  sendAudio(buf: Buffer): Promise<void>;
  end(): Promise<void>;
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

    /* 2. Client */
    const client = new RealtimeClient() as unknown as SpeechmaticsClient;
    let transcript = '';

    /* 3. Handle events */
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

    /* 5. Start session */
    await client.start(jwt, {
      transcription_config: {
        language: locale || 'en',
        operating_point: 'enhanced',
        max_delay: 1.0,
      },
    });

    /* 6. Send buffer & close */
    await client.sendAudio(audio);
    await client.end();

    return transcript.trim();
  }
}
