import OpenAI, { toFile } from 'openai';
import type { ChatCompletion } from 'openai/resources/chat/completions';
import { Injectable, Logger } from '@nestjs/common';
import { LogMethod } from 'src/common/decorators/log-method.decorator';
import {
  localeFallback,
  isTimeout,
  recordTooShortMsg,
  parseBooleanResponse,
  parseStringResponse,
} from './chatgpt.utils';

/*───────────────────────────────*
 *  Retry / timeout config
 *───────────────────────────────*/
const MAX_RETRIES = 3;
const ATTEMPT_TIMEOUT_MS = 3000;
const SDK_TIMEOUT_MS = MAX_RETRIES * ATTEMPT_TIMEOUT_MS + 1000;

/*───────────────────────────────*
 *  Guard for <0.1 s clips (~2 400 B)
 *───────────────────────────────*/
const MIN_AUDIO_BYTES = 5000;

/* ──────────────────────────────────────────────────────────────
 *  OpenAI function-call tool definitions
 * ──────────────────────────────────────────────────────────────*/
const tools = [
  {
    type: 'function',
    function: {
      name: 'boolean',
      parameters: {
        type: 'object',
        properties: { response: { type: 'boolean' } },
        required: ['response'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'string',
      parameters: {
        type: 'object',
        properties: { response: { type: 'string' } },
        required: ['response'],
      },
    },
  },
] as const;

type ToolName = 'string' | 'boolean';

/* ──────────────────────────────────────────────────────────────
 *  Service
 * ──────────────────────────────────────────────────────────────*/
@Injectable()
export class ChatGPTService {
  private readonly openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: SDK_TIMEOUT_MS,
  });
  private readonly log = new Logger(ChatGPTService.name);

  /* ============================================================
   *  Public: chat completion helper
   * ============================================================*/
  @LogMethod()
  async sendMessage({
    userPrompt,
    roleContent = `You are a helpful assistant that speaks in informal language like a child does. The student is the same age as you. Avoid saying 'तू'`,
    model = 'gpt-4o',
    tool = 'string',
    locale = 'en',
  }: {
    userPrompt: string;
    roleContent?: string;
    model?: string;
    tool?: ToolName;
    locale?: string;
  }): Promise<string | boolean> {
    const payload: Record<string, unknown> = {
      model,
      messages: [
        { role: 'system', content: roleContent },
        { role: 'user', content: userPrompt },
      ],
    };

    if (tool === 'string') {
      (payload.messages as unknown[]).unshift({
        role: 'system',
        content:
          locale === 'hi'
            ? 'सभी उत्तर हिंदी (hi-IN) में देवनागरी लिपि का उपयोग करके दें। अंग्रेज़ी या रोमन लिपि का प्रयोग न करें।'
            : 'Provide all answers in English (en-US) using the Roman script.',
      });
    }

    return tool === 'boolean'
      ? this.getBooleanFromAI(payload)
      : this.getStringFromAI(payload, locale);
  }

  /* ============================================================
   *  Public: audio transcription helper
   * ============================================================*/
  @LogMethod()
  async transcribeAudio(
    audio: Buffer,
    locale: string,
    model = 'gpt-4o-transcribe',
  ): Promise<string> {
    /* ---- guard: clip too short → skip OpenAI call -------------- */
    if (audio.byteLength < MIN_AUDIO_BYTES) {
      this.log.warn(
        `Audio buffer ${audio.byteLength} B < min ${MIN_AUDIO_BYTES} B – prompt user`,
      );
      return recordTooShortMsg(locale);
    }

    try {
      const { text } = await this.openai.audio.transcriptions.create({
        file: await toFile(audio, 'audio.webm'),
        model,
        language: locale,
        response_format: 'json',
      });

      if (typeof text !== 'string') throw new Error('Unexpected response');
      return text.trim();
    } catch (err) {
      if (isTimeout(err)) {
        this.log.warn('Transcription timed out – returning fallback text');
        return localeFallback(locale);
      }
      throw err;
    }
  }

  /* ============================================================
   *  Internal helpers
   * ============================================================*/
  @LogMethod()
  private async getBooleanFromAI(
    payload: Record<string, unknown>,
  ): Promise<boolean> {
    Object.assign(payload, {
      tools,
      tool_choice: { type: 'function', function: { name: 'boolean' } },
    });

    try {
      const { data } = await this.callOpenAI(payload);
      return parseBooleanResponse(data);
    } catch (err) {
      if (isTimeout(err)) {
        this.log.warn('Completion timed out - falling back to false');
        return false;
      }
      throw err;
    }
  }

  @LogMethod()
  private async getStringFromAI(
    payload: Record<string, unknown>,
    locale: string,
  ): Promise<string> {
    try {
      const { data } = await this.callOpenAI(payload);
      return parseStringResponse(data);
    } catch (err) {
      if (isTimeout(err)) {
        this.log.warn('Completion timed out - returning fallback text');
        return localeFallback(locale);
      }
      throw err;
    }
  }

  /* ============================================================
   *  Low-level OpenAI call with retry + per-attempt timeout
   * ============================================================*/
  @LogMethod()
  private async callOpenAI(
    payload: Record<string, unknown>,
  ): Promise<{ data: ChatCompletion }> {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), ATTEMPT_TIMEOUT_MS);

      try {
        const data = await this.openai.chat.completions.create(
          payload as never,
          { signal: controller.signal },
        );
        clearTimeout(timer);
        return { data };
      } catch (err) {
        clearTimeout(timer);

        if (!isTimeout(err) || attempt === MAX_RETRIES) {
          const message =
            err instanceof Error ? err.message : 'unknown OpenAI SDK error';
          throw new Error(`OpenAI request failed: ${message}`);
        }

        this.log.warn(
          `OpenAI timeout (attempt ${attempt}/${MAX_RETRIES}) - retrying`,
        );
      }
    }

    throw new Error('Retry loop exited unexpectedly');
  }
}
