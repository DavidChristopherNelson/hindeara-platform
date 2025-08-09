import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import type FormDataType from 'form-data';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const FormData = require('form-data') as typeof FormDataType;

@Injectable()
export class SarvamService {
  private readonly logger = new Logger(SarvamService.name);
  private readonly apiKey: string | undefined;
  private readonly baseUrl: string = 'https://api.sarvam.ai';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('SARVAM_API_KEY');
    if (!this.apiKey) {
      this.logger.warn('SARVAM_API_KEY not configured');
    }
  }

  async transcribeAudio(audioBuffer: Buffer, locale: string): Promise<string> {
    this.logger.log(
      `Starting Sarvam (Saarika) transcription for locale: ${locale}`,
    );
    this.logger.log(`Audio buffer size: ${audioBuffer.length} bytes`);

    if (!this.apiKey) {
      this.logger.error('Sarvam API key not configured');
      throw new Error('Sarvam API key not configured');
    }

    try {
      const languageCode = this.mapLocaleToLanguage(locale);
      const model = 'saarika:v2.5';
      const contentType = this.detectContentType(audioBuffer);

      const form = new FormData();
      form.append('file', audioBuffer, {
        filename: this.suggestFilename(contentType),
        contentType,
      });
      // Keep request minimal; additional config can be appended when needed
      form.append('language_code', languageCode);
      form.append('model', model);

      const url = `${this.baseUrl}/speech-to-text`;
      this.logger.log(
        `Sarvam request → ${url} (language_code='${languageCode}', model='${model}')`,
      );

      const { data } = await axios.post<SarvamSttResponse>(url, form, {
        headers: {
          // Support both header styles seen in docs/in the wild
          'api-subscription-key': this.apiKey,
          Authorization: `Bearer ${this.apiKey}`,
          ...form.getHeaders(),
        },
        timeout: 30_000,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });

      // Try common shapes for transcript payloads
      const transcriptSource: string | undefined =
        data?.transcript ||
        data?.text ||
        data?.output?.[0]?.transcript ||
        data?.results?.[0]?.transcript;

      const transcript = (transcriptSource ?? '').trim();

      this.logger.log(`Sarvam transcript: "${transcript}"`);
      return transcript;
    } catch (error) {
      this.logger.error('Sarvam service error:', error);
      throw new Error(
        `Sarvam transcription failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private mapLocaleToLanguage(locale: string): string {
    this.logger.log(`Mapping locale for Sarvam: ${locale}`);
    // Favor regional codes where likely supported; fallback to en-IN
    const localeMap: Record<string, string> = {
      en: 'en-IN',
      'en-US': 'en-IN',
      'en-GB': 'en-IN',
      hi: 'hi-IN',
      'hi-IN': 'hi-IN',
      ur: 'ur-IN',
      'ur-PK': 'ur-IN',
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
      ne: 'ne-IN',
      'ne-NP': 'ne-IN',
      si: 'si-LK',
      'si-LK': 'si-LK',
    };

    const mapped = localeMap[locale] || 'en-IN';
    this.logger.log(`Mapped '${locale}' to '${mapped}' for Sarvam`);
    return mapped;
  }

  private detectContentType(audioBuffer: Buffer): string {
    // WebM (EBML) header
    if (audioBuffer.length >= 4) {
      const header = audioBuffer.subarray(0, 4);
      const webmHeader = Buffer.from([0x1a, 0x45, 0xdf, 0xa3]);
      if (Buffer.compare(header, webmHeader) === 0) {
        return 'audio/webm';
      }
    }
    // MP4/ISO Base Media ('ftyp') starts at byte 4
    if (audioBuffer.length >= 8) {
      const header = audioBuffer.subarray(4, 8);
      const mp4Header = Buffer.from([0x66, 0x74, 0x79, 0x70]);
      if (Buffer.compare(header, mp4Header) === 0) {
        return 'audio/mp4';
      }
    }
    return 'audio/webm';
  }

  private suggestFilename(contentType: string): string {
    switch (contentType) {
      case 'audio/webm':
        return 'audio.webm';
      case 'audio/mp4':
        return 'audio.mp4';
      default:
        return 'audio.webm';
    }
  }
}

interface SarvamSttResponse {
  transcript?: string;
  text?: string;
  output?: Array<{ transcript?: string }>;
  results?: Array<{ transcript?: string }>;
}
