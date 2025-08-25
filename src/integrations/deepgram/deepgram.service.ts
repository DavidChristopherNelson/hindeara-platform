import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class DeepgramService {
  private readonly logger = new Logger(DeepgramService.name);
  private readonly apiKey: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('DEEPGRAM_API_KEY');
    if (!this.apiKey) {
      this.logger.warn('DEEPGRAM_API_KEY not configured');
    }
  }

  async transcribeAudio(audioBuffer: Buffer, locale: string): Promise<string> {
    this.logger.log(`Starting Deepgram transcription for locale: ${locale}`);
    this.logger.log(`Audio buffer size: ${audioBuffer.length} bytes`);

    if (!this.apiKey) {
      this.logger.error('Deepgram API key not configured');
      throw new Error('Deepgram API key not configured');
    }

    try {
      const contentType = this.detectContentType(audioBuffer);
      const language = this.mapLocaleToLanguage(locale);

      const url = new URL('https://api.deepgram.com/v1/listen');
      url.searchParams.set('model', 'nova-2');
      url.searchParams.set('language', language);
      url.searchParams.set('smart_format', 'true');
      url.searchParams.set('punctuate', 'true');

      this.logger.log(`Deepgram request → ${url.toString()}`);
      this.logger.log(`Deepgram Content-Type: ${contentType}`);

      const { data } = await axios.post<DeepgramResponse>(
        url.toString(),
        audioBuffer,
        {
          headers: {
            Authorization: `Token ${this.apiKey}`,
            'Content-Type': contentType,
          },
          timeout: 5000,
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        },
      );

      const transcriptSource: string | undefined =
        data?.results?.channels?.[0]?.alternatives?.[0]?.transcript;
      const cleaned = (transcriptSource ?? '').trim();

      this.logger.log(`Deepgram transcript: "${cleaned}"`);
      return cleaned;
    } catch (error) {
      this.logger.error('Deepgram service error:', error);
      throw new Error(
        `Deepgram transcription failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
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

    // Default to webm if unknown; Deepgram accepts many containers
    return 'audio/webm';
  }

  private mapLocaleToLanguage(locale: string): string {
    this.logger.log(`Mapping locale for Deepgram: ${locale}`);
    const localeMap: Record<string, string> = {
      en: 'en',
      'en-US': 'en-US',
      'en-GB': 'en-GB',
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

    const mapped = localeMap[locale] || 'en-US';
    this.logger.log(`Mapped '${locale}' to '${mapped}' for Deepgram`);
    return mapped;
  }
}

interface DeepgramResponse {
  results?: {
    channels?: Array<{
      alternatives?: Array<{ transcript?: string }>;
    }>;
  };
}
