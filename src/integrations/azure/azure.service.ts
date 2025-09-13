import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { spawn } from 'child_process';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ffmpegPath = require('ffmpeg-static') as string;

@Injectable()
export class AzureSttService {
  private readonly logger = new Logger(AzureSttService.name);
  private readonly apiKey: string | undefined;
  private readonly region: string | undefined;
  private readonly timeoutMs: number;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('AZURE_SPEECH_KEY');
    this.region = this.configService.get<string>('AZURE_SPEECH_REGION');

    if (!this.apiKey) this.logger.warn('AZURE_SPEECH_KEY not configured');
    if (!this.region) this.logger.warn('AZURE_SPEECH_REGION not configured');

    // Get the timeout
    const raw = this.configService.get<string>('AZURE_TIMEOUT');
    const parsed = Number(raw);
    this.timeoutMs = Number.isFinite(parsed) && parsed > 0 ? parsed : 2000;
    this.logger.log(`- AZURE_TIMEOUT: ${this.timeoutMs} ms`);
  }

  async transcribeAudio(audioBuffer: Buffer, locale: string): Promise<string> {
    this.logger.log(`Starting Azure STT transcription for locale: ${locale}`);
    this.logger.log(`Audio buffer size: ${audioBuffer.length} bytes`);

    if (!this.apiKey || !this.region) {
      this.logger.error('Azure Speech credentials not configured');
      throw new Error('Azure Speech credentials not configured');
    }

    try {
      const language = this.mapLocaleToLanguage(locale);
      let contentType = this.detectContentType(audioBuffer);

      // Azure REST does not accept WebM containers. Transcode to 16kHz mono PCM WAV.
      let payload = audioBuffer;
      if (contentType.startsWith('audio/webm') || contentType === 'audio/mp4') {
        this.logger.log(
          `Transcoding input (${contentType}) to 16kHz mono PCM WAV for Azure`,
        );
        payload = await this.transcodeToWav(audioBuffer);
        contentType = 'audio/wav; codecs=audio/pcm';
        this.logger.log(
          `Transcode complete. New payload size: ${payload.length} bytes`,
        );
      }

      // REST realtime recognition endpoint (conversation mode)
      const url = new URL(
        `https://${this.region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1`,
      );
      url.searchParams.set('language', language);
      url.searchParams.set('format', 'detailed');

      this.logger.log(
        `Azure STT request → ${url.toString()} (Content-Type='${contentType}')`,
      );

      const { data } = await axios.post<AzureRecognitionResponse>(
        url.toString(),
        payload,
        {
          headers: {
            'Ocp-Apim-Subscription-Key': this.apiKey,
            'Ocp-Apim-Subscription-Region': this.region,
            'Content-Type': contentType,
            Accept: 'application/json',
          },
          timeout: this.timeoutMs,
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        },
      );

      const transcript = this.extractTranscript(data);
      this.logger.log(`Azure transcript: "${transcript}"`);
      return transcript;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const statusText = error.response?.statusText;
        const body =
          typeof error.response?.data === 'string'
            ? error.response?.data
            : JSON.stringify(error.response?.data);
        this.logger.error(
          `Azure STT error: status=${status} ${statusText ?? ''} body=${body ?? ''}`,
        );
        throw new Error(`Azure STT failed (${status} ${statusText ?? ''})`);
      }
      this.logger.error('Azure STT service error:', error);
      throw new Error(
        `Azure STT transcription failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async transcodeToWav(input: Buffer): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      try {
        const ff = spawn(ffmpegPath, [
          '-hide_banner',
          '-loglevel',
          'error',
          '-i',
          'pipe:0',
          '-ac',
          '1', // mono
          '-ar',
          '16000', // 16 kHz
          '-f',
          'wav',
          '-acodec',
          'pcm_s16le',
          'pipe:1',
        ]);

        const chunks: Buffer[] = [];

        ff.stdout.on('data', (chunk: Buffer) => chunks.push(chunk));
        ff.stderr.on('data', (errChunk: Buffer) => {
          // Keep stderr for debugging; do not reject immediately unless process exits non-zero
          this.logger.debug(`[ffmpeg] ${errChunk.toString('utf8')}`);
        });
        ff.on('error', (err) => reject(err));
        ff.on('close', (code) => {
          if (code !== 0) return reject(new Error(`ffmpeg exited with code ${code}`));
          resolve(Buffer.concat(chunks));
        });

        ff.stdin.write(input);
        ff.stdin.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private extractTranscript(data: AzureRecognitionResponse): string {
    // Common shapes across Azure STT REST responses
    const detailedAlt = (data as any)?.NBest?.[0]?.Display;
    if (typeof detailedAlt === 'string' && detailedAlt.trim()) {
      return detailedAlt.trim();
    }

    const displayText = (data as any)?.DisplayText;
    if (typeof displayText === 'string' && displayText.trim()) {
      return displayText.trim();
    }

    const simpleText = (data as any)?.text || (data as any)?.Transcription;
    if (typeof simpleText === 'string' && simpleText.trim()) {
      return simpleText.trim();
    }

    return '';
  }

  private detectContentType(audioBuffer: Buffer): string {
    // WebM (EBML) header
    if (audioBuffer.length >= 4) {
      const header = audioBuffer.subarray(0, 4);
      const webmHeader = Buffer.from([0x1a, 0x45, 0xdf, 0xa3]);
      if (Buffer.compare(header, webmHeader) === 0) {
        return 'audio/webm; codecs=opus';
      }
    }

    // MP4/ISO Base Media ('ftyp') starts at byte 4
    if (audioBuffer.length >= 8) {
      const header = audioBuffer.subarray(4, 8);
      const mp4Header = Buffer.from([0x66, 0x74, 0x79, 0x70]);
      if (Buffer.compare(header, mp4Header) === 0) {
        // Some clients may record AAC in MP4 container
        return 'audio/mp4';
      }
    }

    // Default to webm+opus which is common for browser recordings
    return 'audio/webm; codecs=opus';
  }

  private mapLocaleToLanguage(locale: string): string {
    this.logger.log(`Mapping locale for Azure: ${locale}`);
    const localeMap: Record<string, string> = {
      en: 'en-US',
      'en-US': 'en-US',
      'en-GB': 'en-GB',
      hi: 'hi-IN',
      'hi-IN': 'hi-IN',
      ur: 'ur-IN',
      'ur-PK': 'ur-PK',
      bn: 'bn-IN',
      'bn-IN': 'bn-IN',
      ta: 'ta-IN',
      'ta-IN': 'ta-IN',
      te: 'te-IN',
      'te-IN': 'te-IN',
      mr: 'mr-IN',
      'mr-IN': 'mr-IN',
      gu: 'gu-IN',
      'gu-IN': 'gu-IN',
      kn: 'kn-IN',
      'kn-IN': 'kn-IN',
      ml: 'ml-IN',
      'ml-IN': 'ml-IN',
      pa: 'pa-IN',
      'pa-IN': 'pa-IN',
      or: 'or-IN',
      'or-IN': 'or-IN',
      as: 'as-IN',
      'as-IN': 'as-IN',
      ne: 'ne-NP',
      'ne-NP': 'ne-NP',
      si: 'si-LK',
      'si-LK': 'si-LK',
    };

    const mapped = localeMap[locale] || 'hi-IN';
    this.logger.log(`Mapped '${locale}' to '${mapped}' for Azure`);
    return mapped;
  }
}

interface AzureRecognitionResponse {
  RecognitionStatus?: string;
  DisplayText?: string;
  Duration?: number;
  Offset?: number;
  NBest?: Array<{
    Confidence?: number;
    Lexical?: string;
    ITN?: string;
    MaskedITN?: string;
    Display?: string;
  }>;
  text?: string;
}


