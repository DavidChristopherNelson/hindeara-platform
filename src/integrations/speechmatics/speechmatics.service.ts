// src/integrations/speechmatics/speechmatics.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RealtimeClient } from '@speechmatics/real-time-client';
import { createSpeechmaticsJWT } from '@speechmatics/auth';

@Injectable()
export class SpeechmaticsService {
  private readonly logger = new Logger(SpeechmaticsService.name);
  private readonly apiKey: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('SPEECHMATICS_API_KEY');
    if (!this.apiKey) {
      this.logger.warn('SPEECHMATICS_API_KEY not configured');
    }
  }

  async transcribeAudio(audioBuffer: Buffer, locale: string): Promise<string> {
    this.logger.log(
      `Starting SpeechMatics transcription for locale: ${locale}`,
    );
    this.logger.log(`Audio buffer size: ${audioBuffer.length} bytes`);

    if (!this.apiKey) {
      this.logger.error('SpeechMatics API key not configured');
      throw new Error('SpeechMatics API key not configured');
    }

    try {
      this.logger.log('Creating SpeechMatics JWT token...');
      const token = await createSpeechmaticsJWT({
        type: 'rt',
        apiKey: this.apiKey,
      });
      this.logger.log('JWT token created successfully');

      return new Promise<string>((resolve, reject) => {
        const transcriptions: string[] = [];
        let isCompleted = false;
        let client: RealtimeClient | null = null;

        this.logger.log('Creating RealtimeClient...');
        client = new RealtimeClient();

        const mappedLanguage = this.mapLocaleToLanguage(locale);
        this.logger.log(
          `Mapped locale '${locale}' to language '${mappedLanguage}'`,
        );

        // Detect audio format and use appropriate configuration
        const audioFormat = this.detectAudioFormat(audioBuffer);
        this.logger.log(
          `Detected audio format: ${JSON.stringify(audioFormat)}`,
        );

        const config = {
          transcription_config: {
            language: mappedLanguage,
            enable_partials: false,
            max_delay: 2,
            enable_entities: false,
            diarization: 'none' as const,
            operating_point: 'enhanced' as const,
          },
          audio_format: audioFormat,
        };

        this.logger.log(
          'SpeechMatics config:',
          JSON.stringify(config, null, 2),
        );

        client.addEventListener('receiveMessage', (event) => {
          const message = event.data;
          this.logger.log(`Received message: ${message.message}`);

          if (message.message === 'AddTranscript') {
            this.logger.log('Processing AddTranscript message...');
            // Extract transcript from results
            const transcript = message.results
              ?.map((result) => result.alternatives?.[0]?.content || '')
              .filter(Boolean)
              .join(' ');

            this.logger.log(`Extracted transcript: "${transcript}"`);

            if (transcript) {
              transcriptions.push(transcript);
              this.logger.log(
                `Added transcript to collection. Total transcripts: ${transcriptions.length}`,
              );
            }
          } else if (message.message === 'Error') {
            this.logger.error('SpeechMatics transcription error:', message);
            if (!isCompleted) {
              isCompleted = true;
              this.logger.error(
                `Rejecting promise due to SpeechMatics error: ${message.reason}`,
              );
              reject(
                new Error(
                  `SpeechMatics transcription failed: ${message.reason}`,
                ),
              );
            }
          } else if (message.message === 'EndOfTranscript') {
            this.logger.log('Received EndOfTranscript message');
            if (!isCompleted) {
              isCompleted = true;
              const finalTranscription = transcriptions.join(' ').trim();
              this.logger.log(`Final transcription: "${finalTranscription}"`);
              this.logger.log(`Transcription completed successfully`);
              resolve(finalTranscription);
            }
          } else {
            this.logger.log(`Unhandled message type: ${message.message}`);
          }
        });

        this.logger.log('Starting SpeechMatics session...');
        // Start the session
        client
          .start(token, config)
          .then(() => {
            this.logger.log('SpeechMatics session started successfully');
            this.logger.log(
              `Sending audio data (${audioBuffer.length} bytes)...`,
            );
            // Send audio data
            client!.sendAudio(audioBuffer);
            this.logger.log('Audio data sent successfully');

            this.logger.log('Stopping recognition...');
            // End the session
            client!.stopRecognition();
            this.logger.log('Recognition stopped');
          })
          .catch((error) => {
            this.logger.error('SpeechMatics start error:', error);
            if (!isCompleted) {
              isCompleted = true;
              this.logger.error(
                `Rejecting promise due to start error: ${error.message}`,
              );
              reject(new Error(`SpeechMatics start failed: ${error.message}`));
            }
          });
      });
    } catch (error) {
      this.logger.error('SpeechMatics service error:', error);
      throw new Error(
        `SpeechMatics transcription failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private detectAudioFormat(audioBuffer: Buffer): any {
    // Check if it's a WebM file (common for browser recordings)
    if (audioBuffer.length >= 4) {
      const header = audioBuffer.subarray(0, 4);
      const webmHeader = Buffer.from([0x1A, 0x45, 0xDF, 0xA3]);
      if (Buffer.compare(header, webmHeader) === 0) {
        this.logger.log('Detected WebM audio format');
        return {
          type: 'file' as const,
        };
      }
    }

    // Check if it's an MP4 file
    if (audioBuffer.length >= 8) {
      const header = audioBuffer.subarray(4, 8);
      const mp4Header = Buffer.from([0x66, 0x74, 0x79, 0x70]); // 'ftyp'
      if (Buffer.compare(header, mp4Header) === 0) {
        this.logger.log('Detected MP4 audio format');
        return {
          type: 'file' as const,
        };
      }
    }

    // Check if it's base64 encoded (common for browser recordings)
    const isBase64 = /^[A-Za-z0-9+/]*={0,2}$/.test(
      audioBuffer.toString('ascii', 0, Math.min(100, audioBuffer.length)),
    );
    if (isBase64) {
      this.logger.log('Detected base64 encoded audio, treating as file format');
      return {
        type: 'file' as const,
      };
    }

    // Default to raw PCM with more conservative settings
    this.logger.log('Using default raw PCM format');
    return {
      type: 'raw' as const,
      encoding: 'pcm_s16le' as const, // 16-bit signed PCM instead of 32-bit float
      sample_rate: 16000,
    };
  }

  private mapLocaleToLanguage(locale: string): string {
    this.logger.log(`Mapping locale: ${locale}`);
    const localeMap: Record<string, string> = {
      'en': 'en',
      'en-US': 'en',
      'en-GB': 'en',
      'hi': 'hi',
      'hi-IN': 'hi',
      'ur': 'ur',
      'ur-PK': 'ur',
      'bn': 'bn',
      'bn-IN': 'bn',
      'ta': 'ta',
      'ta-IN': 'ta',
      'te': 'hi', // Telugu not supported, fallback to Hindi
      'te-IN': 'hi',
      'mr': 'mr',
      'mr-IN': 'mr',
      'gu': 'hi', // Gujarati not supported, fallback to Hindi
      'gu-IN': 'hi',
      'kn': 'hi', // Kannada not supported, fallback to Hindi
      'kn-IN': 'hi',
      'ml': 'hi', // Malayalam not supported, fallback to Hindi
      'ml-IN': 'hi',
      'pa': 'hi', // Punjabi not supported, fallback to Hindi
      'pa-IN': 'hi',
      'or': 'hi', // Odia not supported, fallback to Hindi
      'or-IN': 'hi',
      'as': 'hi', // Assamese not supported, fallback to Hindi
      'as-IN': 'hi',
      'ne': 'hi', // Nepali not supported, fallback to Hindi
      'ne-NP': 'hi',
      'si': 'hi', // Sinhala not supported, fallback to Hindi
      'si-LK': 'hi',
    };

    const mappedLanguage = localeMap[locale] || 'hi'; // Default to Hindi instead of English
    this.logger.log(`Mapped '${locale}' to '${mappedLanguage}'`);
    return mappedLanguage;
  }
}
