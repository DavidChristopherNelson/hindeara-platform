import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class AzureSttService {
  private readonly logger = new Logger(AzureSttService.name);
  private readonly apiKey: string | undefined;
  private readonly region: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('AZURE_SPEECH_KEY');
    this.region = this.configService.get<string>('AZURE_SPEECH_REGION');

    if (!this.apiKey) this.logger.warn('AZURE_SPEECH_KEY not configured');
    if (!this.region) this.logger.warn('AZURE_SPEECH_REGION not configured');
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
      const contentType = this.detectContentType(audioBuffer);

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
        audioBuffer,
        {
          headers: {
            'Ocp-Apim-Subscription-Key': this.apiKey,
            'Ocp-Apim-Subscription-Region': this.region,
            'Content-Type': contentType,
            Accept: 'application/json',
          },
          timeout: 30_000,
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


