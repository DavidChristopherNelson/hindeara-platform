// src/integrations/chatgpt/chatgpt.service.ts
import OpenAI, { toFile } from 'openai';
import type { ChatCompletion } from 'openai/resources/chat/completions';
import { Injectable, Logger } from '@nestjs/common';
import { LogMethod } from 'src/common/decorators/log-method.decorator';
import {
  localeFallback,
  isTimeout,
  parseBooleanResponse,
  parseStringResponse,
} from './chatgpt.utils';

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
    timeout: 10_000,
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
        this.log.warn('Completion timed out – falling back to `false`');
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
        this.log.warn('Completion timed out – returning fallback text');
        return localeFallback(locale);
      }
      throw err;
    }
  }

  /** Wrapper so rest of service can stay unchanged */
  @LogMethod()
  private async callOpenAI(
    payload: Record<string, unknown>,
  ): Promise<{ data: ChatCompletion }> {
    try {
      const completion = await this.openai.chat.completions.create(
        payload as never,
      );
      return { data: completion };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'unknown OpenAI SDK error';
      throw new Error(`OpenAI request failed: ${message}`);
    }
  }
}
