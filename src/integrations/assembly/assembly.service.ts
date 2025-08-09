import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class AssemblyService {
  private readonly logger = new Logger(AssemblyService.name);
  private readonly apiKey: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('ASSEMBLYAI_API_KEY');
    if (!this.apiKey) {
      this.logger.warn('ASSEMBLYAI_API_KEY not configured');
    }
  }

  async transcribeAudio(audioBuffer: Buffer, locale: string): Promise<string> {
    this.logger.log(`Starting AssemblyAI transcription for locale: ${locale}`);
    this.logger.log(`Audio buffer size: ${audioBuffer.length} bytes`);

    if (!this.apiKey) {
      this.logger.error('AssemblyAI API key not configured');
      throw new Error('AssemblyAI API key not configured');
    }

    try {
      // 1) Upload audio
      const uploadUrl = await this.uploadAudio(audioBuffer);

      // 2) Request transcription
      const languageCode = this.mapLocaleToLanguage(locale);
      const transcriptId = await this.createTranscript(uploadUrl, languageCode);

      // 3) Poll for completion
      const text = await this.pollTranscript(transcriptId);
      this.logger.log(`AssemblyAI transcript: "${text}"`);
      return text;
    } catch (error) {
      this.logger.error('AssemblyAI service error:', error);
      throw new Error(
        `AssemblyAI transcription failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async uploadAudio(audioBuffer: Buffer): Promise<string> {
    this.logger.log('Uploading audio to AssemblyAI...');
    const { data }: { data: UploadResponse } = await axios.post(
      'https://api.assemblyai.com/v2/upload',
      audioBuffer,
      {
        headers: {
          authorization: this.apiKey as string,
          'content-type': 'application/octet-stream',
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        timeout: 30_000,
      },
    );

    const uploadUrl: string | undefined = data?.upload_url;
    if (!uploadUrl) {
      throw new Error('AssemblyAI upload failed: missing upload_url');
    }
    this.logger.log(`Uploaded. Upload URL: ${uploadUrl}`);
    return uploadUrl;
  }

  private async createTranscript(
    uploadUrl: string,
    languageCode: string,
  ): Promise<string> {
    this.logger.log(
      `Creating transcript (language='${languageCode}', punctuate=true, format_text=true)...`,
    );
    const { data }: { data: CreateTranscriptResponse } = await axios.post(
      'https://api.assemblyai.com/v2/transcript',
      {
        audio_url: uploadUrl,
        language_code: languageCode,
        punctuate: true,
        format_text: true,
      },
      {
        headers: {
          authorization: this.apiKey as string,
          'content-type': 'application/json',
        },
        timeout: 15_000,
      },
    );

    const id: string | undefined = data?.id;
    if (!id) {
      throw new Error('AssemblyAI transcript creation failed: missing id');
    }
    this.logger.log(`Transcript created. ID: ${id}`);
    return id;
  }

  private async pollTranscript(id: string): Promise<string> {
    this.logger.log('Polling transcript status...');
    const startedAt = Date.now();
    const MAX_WAIT_MS = 30_000; // keep similar to other integrations
    const POLL_INTERVAL_MS = 1_000;

    const deadline = startedAt + MAX_WAIT_MS;
    while (Date.now() <= deadline) {
      const { data }: { data: PollTranscriptResponse } = await axios.get(
        `https://api.assemblyai.com/v2/transcript/${id}`,
        {
          headers: { authorization: this.apiKey as string },
          timeout: 10_000,
        },
      );

      const status = data.status;
      if (status === 'completed') {
        const text: string = (data.text ?? '').toString().trim();
        return text;
      }
      if (status === 'error') {
        const errMsg = data.error || 'Unknown error';
        throw new Error(`AssemblyAI returned error status: ${errMsg}`);
      }

      await this.sleep(POLL_INTERVAL_MS);
    }
    throw new Error('AssemblyAI polling timed out');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private mapLocaleToLanguage(locale: string): string {
    this.logger.log(`Mapping locale for AssemblyAI: ${locale}`);
    const localeMap: Record<string, string> = {
      en: 'en',
      'en-US': 'en_us',
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

    const mapped = localeMap[locale] || 'en_us';
    this.logger.log(`Mapped '${locale}' to '${mapped}' for AssemblyAI`);
    return mapped;
  }
}
/** AssemblyAI upload response */
interface UploadResponse {
  upload_url: string;
}

/** AssemblyAI create transcript response */
interface CreateTranscriptResponse {
  id: string;
}

/** AssemblyAI poll transcript response */
interface PollTranscriptResponse {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'error';
  text?: string;
  error?: string;
}
