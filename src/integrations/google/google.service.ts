// src/integrations/google/google.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SpeechClient } from '@google-cloud/speech';

@Injectable()
export class GoogleService {
  private readonly logger = new Logger(GoogleService.name);
  private readonly speechClient: SpeechClient | null;
  private readonly projectId: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.projectId = this.configService.get<string>('GOOGLE_CLOUD_PROJECT_ID');
    const keyFilename = this.configService.get<string>('GOOGLE_CLOUD_KEY_FILE');
    
    this.logger.log('Google Cloud configuration:');
    this.logger.log(`- Project ID: ${this.projectId || 'NOT SET'}`);
    this.logger.log(`- Key File: ${keyFilename || 'NOT SET'}`);
    
    if (!this.projectId) {
      this.logger.error('GOOGLE_CLOUD_PROJECT_ID not configured - Google service will fail');
    }
    
    if (!keyFilename) {
      this.logger.error('GOOGLE_CLOUD_KEY_FILE not configured - Google service will fail');
    }

    // Initialize speech client as null initially
    this.speechClient = null;

    // Only try to initialize if we have the required configuration
    if (this.projectId && keyFilename) {
      try {
        // Resolve the key file path if it contains environment variables
        const resolvedKeyFilename = keyFilename.replace(/\$\{PWD\}/g, process.cwd());
        this.logger.log(`Resolved key file path: ${resolvedKeyFilename}`);
        
        // Check if the key file exists
        const fs = require('fs');
        if (!fs.existsSync(resolvedKeyFilename)) {
          this.logger.error(`Google Cloud key file not found: ${resolvedKeyFilename}`);
          return;
        }
        
        // Initialize Google Cloud Speech client
        this.speechClient = new SpeechClient({
          projectId: this.projectId,
          keyFilename: resolvedKeyFilename,
        });
        this.logger.log('Google Cloud Speech client initialized successfully');
      } catch (error) {
        this.logger.error('Failed to initialize Google Cloud Speech client:', error);
        this.logger.error('Google service will be disabled due to initialization failure');
        this.speechClient = null;
      }
    } else {
      this.logger.warn('Google Cloud Speech client not initialized due to missing configuration');
    }
  }

  async transcribeAudio(audioBuffer: Buffer, locale: string): Promise<string> {
    this.logger.log(
      `Starting Google Speech-to-Text transcription for locale: ${locale}`,
    );
    this.logger.log(`Audio buffer size: ${audioBuffer.length} bytes`);

    if (!this.projectId) {
      this.logger.error('Google Cloud Project ID not configured');
      throw new Error('Google Cloud Project ID not configured');
    }

    if (!this.speechClient) {
      this.logger.warn('Google Cloud Speech client not initialized - returning empty transcript');
      return '';
    }

    try {
      const mappedLanguage = this.mapLocaleToLanguage(locale);
      this.logger.log(
        `Mapped locale '${locale}' to language '${mappedLanguage}'`,
      );

      // Configure the request for enhanced model with lowest latency
      const request = {
        audio: {
          content: audioBuffer.toString('base64'),
        },
        config: {
          encoding: 'WEBM_OPUS' as const, // Most common for browser recordings
          sampleRateHertz: 48000, // Standard for WebM
          languageCode: mappedLanguage,
          model: 'latest_long' as const, // Enhanced model for better accuracy
          useEnhanced: true, // Use enhanced model
          enableAutomaticPunctuation: true,
          enableWordTimeOffsets: false, // Disable for lower latency
          enableWordConfidence: false, // Disable for lower latency
          enableSeparateRecognitionPerChannel: false,
          maxAlternatives: 1, // Only return the best result
          profanityFilter: false,
          speechContexts: [],
        },
      };

      this.logger.log(
        'Google Speech-to-Text config:',
        JSON.stringify(request.config, null, 2),
      );

      // Perform the transcription
      this.logger.log('Sending request to Google Speech-to-Text...');
      this.logger.log(`Request audio content length: ${request.audio.content.length} characters`);
      
      const [response] = await this.speechClient.recognize(request);
      
      this.logger.log('Received response from Google Speech-to-Text');
      this.logger.log(`Response results count: ${response.results?.length || 0}`);

      if (!response.results || response.results.length === 0) {
        this.logger.warn(
          'No transcription results received from Google Speech-to-Text',
        );
        return '';
      }

      // Extract the transcript from the results
      const transcript = response.results
        .map(result => result.alternatives?.[0]?.transcript || '')
        .filter(Boolean)
        .join(' ');

      this.logger.log(`Final transcription: "${transcript}"`);
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
        }`,
      );
    }
  }

  private mapLocaleToLanguage(locale: string): string {
    this.logger.log(`Mapping locale: ${locale}`);
    
    const localeMap: Record<string, string> = {
      'en': 'en-US',
      'en-US': 'en-US',
      'en-GB': 'en-GB',
      'hi': 'hi-IN',
      'hi-IN': 'hi-IN',
      'ur': 'ur-PK',
      'ur-PK': 'ur-PK',
      'bn': 'bn-IN',
      'bn-IN': 'bn-IN',
      'ta': 'ta-IN',
      'ta-IN': 'ta-IN',
      'te': 'te-IN',
      'te-IN': 'te-IN',
      'mr': 'mr-IN',
      'mr-IN': 'mr-IN',
      'gu': 'gu-IN',
      'gu-IN': 'gu-IN',
      'kn': 'kn-IN',
      'kn-IN': 'kn-IN',
      'ml': 'ml-IN',
      'ml-IN': 'ml-IN',
      'pa': 'pa-IN',
      'pa-IN': 'pa-IN',
      'or': 'or-IN',
      'or-IN': 'or-IN',
      'as': 'as-IN',
      'as-IN': 'as-IN',
      'ne': 'ne-NP',
      'ne-NP': 'ne-NP',
      'si': 'si-LK',
      'si-LK': 'si-LK',
    };

    const mappedLanguage = localeMap[locale] || 'en-US';
    this.logger.log(`Mapped '${locale}' to '${mappedLanguage}'`);
    return mappedLanguage;
  }
}