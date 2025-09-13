import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import type FormDataType from 'form-data';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const FormData = require('form-data') as typeof FormDataType;

@Injectable()
export class ReverieService {
  private readonly logger = new Logger(ReverieService.name);
  private readonly apiKey: string | undefined;
  private readonly appId: string | undefined;
  private readonly baseUrl: string;
  private readonly sttPath: string;
  private readonly domain: string;
  private readonly timeoutMs: number;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('REVERIE_API_KEY');
    this.appId = this.configService.get<string>('REVERIE_APP_ID');
    this.baseUrl =
      this.configService.get<string>('REVERIE_BASE_URL')?.replace(/\/$/, '') ||
      'https://revapi.reverieinc.com';
    this.sttPath = this.configService.get<string>('REVERIE_STT_PATH') || '/';
    this.domain = this.configService.get<string>('REVERIE_DOMAIN') || 'generic';

    if (!this.apiKey) this.logger.warn('REVERIE_API_KEY not configured');
    if (!this.appId) this.logger.warn('REVERIE_APP_ID not configured');

    // Get the timeout
    const raw = this.configService.get<string>('REVERIE_TIMEOUT');
    const parsed = Number(raw);
    this.timeoutMs = Number.isFinite(parsed) && parsed > 0 ? parsed : 2000;
    this.logger.log(`- REVERIE_TIMEOUT: ${this.timeoutMs} ms`);
  }

  async transcribeAudio(audioBuffer: Buffer, locale: string): Promise<string> {
    this.logger.log(`Starting Reverie STT transcription for locale: ${locale}`);
    this.logger.log(`Audio buffer size: ${audioBuffer.length} bytes`);

    if (!this.apiKey || !this.appId) {
      this.logger.error('Reverie credentials not configured');
      throw new Error('Reverie credentials not configured');
    }

    try {
      const languageCode = this.mapLocaleToLanguage(locale);
      const contentType = this.detectContentType(audioBuffer);

      // Prefer multipart form as commonly used by STT batch endpoints
      const form = new FormData();
      form.append('audio_file', audioBuffer, {
        filename: this.suggestFilename(contentType),
        contentType,
      });
      // Some deployments accept parameters as headers; we set them in headers below.

      const url = `${this.baseUrl}${this.sttPath}`;
      this.logger.log(
        `Reverie request → ${url} (src_lang='${languageCode}', domain='${this.domain}', contentType='${contentType}')`,
      );

      const { data } = await axios.post<ReverieSttResponse>(url, form, {
        headers: {
          // Reverie requires both app id and api key (header names are case-sensitive in some setups)
          'REV-APP-ID': this.appId,
          'REV-API-KEY': this.apiKey,
          'REV-APPNAME': 'stt_file',
          src_lang: languageCode,
          domain: this.domain,
          ...form.getHeaders(),
        },
        timeout: this.timeoutMs,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });

      const transcriptSource: string | undefined =
        data?.text ||
        data?.transcript ||
        data?.result ||
        data?.output?.[0]?.transcript ||
        data?.results?.[0]?.transcript;

      const transcript = (transcriptSource ?? '').trim();

      this.logger.log(`Reverie transcript: "${transcript}"`);
      return transcript;
    } catch (error) {
      // Provide actionable error details without leaking secrets
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const statusText = error.response?.statusText;
        const body =
          typeof error.response?.data === 'string'
            ? error.response?.data
            : JSON.stringify(error.response?.data);
        this.logger.error(
          `Reverie STT error: status=${status} ${statusText ?? ''} body=${body ?? ''}`,
        );
        throw new Error(
          `Reverie STT failed (${status} ${statusText ?? ''})`,
        );
      }
      this.logger.error('Reverie STT service error:', error);
      throw new Error(
        `Reverie transcription failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private mapLocaleToLanguage(locale: string): string {
    this.logger.log(`Mapping locale for Reverie: ${locale}`);
    // Reverie expects short language codes like 'hi', 'en'
    const localeMap: Record<string, string> = {
      en: 'en',
      'en-US': 'en',
      'en-GB': 'en',
      hi: 'hi',
      'hi-IN': 'hi',
      ur: 'ur',
      'ur-PK': 'ur',
      bn: 'bn',
      'bn-IN': 'bn',
      ta: 'ta',
      'ta-IN': 'ta',
      te: 'te',
      'te-IN': 'te',
      mr: 'mr',
      'mr-IN': 'mr',
      gu: 'gu',
      'gu-IN': 'gu',
      kn: 'kn',
      'kn-IN': 'kn',
      ml: 'ml',
      'ml-IN': 'ml',
      pa: 'pa',
      'pa-IN': 'pa',
      or: 'or',
      'or-IN': 'or',
      as: 'as',
      'as-IN': 'as',
      ne: 'ne',
      'ne-NP': 'ne',
      si: 'si',
      'si-LK': 'si',
    };

    const mapped = localeMap[locale] || 'en';
    this.logger.log(`Mapped '${locale}' to '${mapped}' for Reverie`);
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

interface ReverieSttResponse {
  text?: string;
  transcript?: string;
  result?: string;
  output?: Array<{ transcript?: string }>;
  results?: Array<{ transcript?: string }>;
}
