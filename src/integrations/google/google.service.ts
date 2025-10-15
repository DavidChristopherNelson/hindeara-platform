// src/integrations/google/google.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SpeechClient } from '@google-cloud/speech';
import * as fs from 'fs';

type GcpEncoding = 'WEBM_OPUS' | 'OGG_OPUS' | 'ENCODING_UNSPECIFIED';

@Injectable()
export class GoogleService {
  private readonly logger = new Logger(GoogleService.name);
  private readonly speechClient: SpeechClient | null;
  private readonly projectId: string | undefined;
  private readonly timeoutMs: number;

  constructor(private readonly configService: ConfigService) {
    this.projectId = this.configService.get<string>('GOOGLE_CLOUD_PROJECT_ID');

    const raw = this.configService.get<string>('GOOGLE_CLOUD_TIMEOUT');
    const parsed = Number(raw);
    this.timeoutMs = Number.isFinite(parsed) && parsed > 0 ? parsed : 2000;
    this.logger.log(`- GOOGLE_CLOUD_TIMEOUT: ${this.timeoutMs} ms`);

    // Prefer Application Default Credentials via env var set in main.ts ensureGoogleCredentials()
    const keyPathFromEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    this.logger.log('Google Cloud configuration:');
    this.logger.log(
      `- Project ID: ${this.projectId || 'NOT SET (will use ADC value if present)'}`
    );
    this.logger.log(
      `- GOOGLE_APPLICATION_CREDENTIALS: ${keyPathFromEnv || 'NOT SET'}`
    );

    this.speechClient = null;

    try {
      if (!keyPathFromEnv) {
        this.logger.warn(
          'GOOGLE_APPLICATION_CREDENTIALS not set; relying on default ADC resolution'
        );
      } else if (!fs.existsSync(keyPathFromEnv)) {
        this.logger.error(
          `GOOGLE_APPLICATION_CREDENTIALS file not found: ${keyPathFromEnv}`
        );
        return;
      }

      this.speechClient = new SpeechClient(
        this.projectId ? { projectId: this.projectId } : {}
      );
      this.logger.log('Google Cloud Speech client initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Google Cloud Speech client:', error);
      this.logger.error(
        'Google service will be disabled due to initialization failure'
      );
      this.speechClient = null;
    }
  }

  async transcribeAudio(audioBuffer: Buffer, locale: string): Promise<string> {
    this.logger.log(
      `Starting Google Speech-to-Text transcription for locale: ${locale}`
    );
    this.logger.log(`Audio buffer size: ${audioBuffer.length} bytes`);

    if (!this.speechClient) {
      this.logger.warn(
        'Google Cloud Speech client not initialized - returning empty transcript'
      );
      return '';
    }

    try {
      const languageCode = this.mapLocaleToLanguage(locale);

      // NEW: detect input container & map to GCP encoding
      const container = this.detectContainer(audioBuffer); // 'webm' | 'ogg' | 'mp4'
      const { encoding, sampleRateHertz } = this.mapContainerToGcpEncoding(container);

      const audioContentB64 = audioBuffer.toString('base64');

      // Build config dynamically (omit sampleRate for MP4 so GCP can infer)
      const config: any = {
        encoding,                   // WEBM_OPUS | OGG_OPUS | ENCODING_UNSPECIFIED
        languageCode,               // e.g. 'hi-IN'
        model: 'latest_long',       // enhanced model
        useEnhanced: true,
        enableAutomaticPunctuation: true,
        enableWordTimeOffsets: false,
        enableWordConfidence: false,
        enableSeparateRecognitionPerChannel: false,
        maxAlternatives: 1,
        profanityFilter: false,
        speechContexts: [],
      };
      if (typeof sampleRateHertz === 'number') {
        config.sampleRateHertz = sampleRateHertz; // keep 48k for opus-in-webm/ogg
      }

      const request = {
        audio: { content: audioContentB64 },
        config,
      };

      this.logger.log(
        'Google Speech-to-Text config:',
        JSON.stringify(request.config, null, 2)
      );

      this.logger.log('Sending request to Google Speech-to-Text...');
      this.logger.log(
        `Request audio content length: ${request.audio.content.length} characters`
      );

      const [response] = await this.speechClient.recognize(request, {
        timeout: this.timeoutMs,
      });

      this.logger.log('Received response from Google Speech-to-Text');
      this.logger.log(
        `Response results count: ${response.results?.length || 0}`
      );

      if (!response.results || response.results.length === 0) {
        this.logger.warn('No transcription results received from Google STT');
        return '';
      }

      const transcript = response.results
        .map((r) => r.alternatives?.[0]?.transcript || '')
        .filter(Boolean)
        .join(' ');

      this.logger.log(`######## Google Final transcription: "${transcript}"`);
      this.logger.log('Google Speech-to-Text transcription completed successfully');

      return transcript;
    } catch (error) {
      this.logger.error('Google Speech-to-Text service error:', error);
      this.logger.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error(
        `Google Speech-to-Text transcription failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private mapLocaleToLanguage(locale: string): string {
    this.logger.log(`Mapping locale: ${locale}`);

    const localeMap: Record<string, string> = {
      en: 'en-US',
      'en-US': 'en-US',
      'en-GB': 'en-GB',
      hi: 'hi-IN',
      'hi-IN': 'hi-IN',
      ur: 'ur-PK',
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

    const mappedLanguage = localeMap[locale] || 'en-US';
    this.logger.log(`Mapped '${locale}' to '${mappedLanguage}'`);
    return mappedLanguage;
  }

  /**
   * Minimal header sniffing to detect container.
   * - WebM: EBML header 0x1A45DFA3 at start
   * - MP4 : 'ftyp' at offset 4
   * - Ogg : 'OggS' at start
   */
  private detectContainer(buf: Buffer): 'webm' | 'mp4' | 'ogg' {
    if (buf.length >= 4) {
      // WebM (EBML)
      const ebml = Buffer.from([0x1a, 0x45, 0xdf, 0xa3]);
      if (buf.subarray(0, 4).equals(ebml)) return 'webm';

      // Ogg 'OggS'
      if (buf.subarray(0, 4).toString('ascii') === 'OggS') return 'ogg';
    }
    if (buf.length >= 8) {
      // MP4 'ftyp' at offset 4
      if (buf.subarray(4, 8).toString('ascii') === 'ftyp') return 'mp4';
    }
    // Default to webm as it’s the most common browser recording format
    return 'webm';
  }

  /**
   * Map container → Google STT encoding + (optional) sample rate.
   * For MP4 we let Google infer (AAC may be 44100/48000), so omit sampleRateHertz.
   */
  private mapContainerToGcpEncoding(container: 'webm' | 'ogg' | 'mp4'): {
    encoding: GcpEncoding;
    sampleRateHertz?: number;
  } {
    switch (container) {
      case 'webm':
        return { encoding: 'WEBM_OPUS', sampleRateHertz: 48000 };
      case 'ogg':
        return { encoding: 'OGG_OPUS', sampleRateHertz: 48000 };
      case 'mp4':
        return { encoding: 'ENCODING_UNSPECIFIED' }; // let GCP infer from container
      default:
        return { encoding: 'WEBM_OPUS', sampleRateHertz: 48000 };
    }
  }
}
