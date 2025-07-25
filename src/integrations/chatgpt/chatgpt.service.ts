// src/integrations/chatgpt/chatgpt.service.ts
import OpenAI, { toFile } from 'openai';
import type { ChatCompletion } from 'openai/resources/chat/completions';
import { Injectable, Logger } from '@nestjs/common';
import { LogMethod } from 'src/common/decorators/log-method.decorator';
import {
  PlainStringResponseSchema,
  ToolCallBooleanResponseSchema,
} from './chatgpt.schema';

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
    timeout: 10_000, // SDK will abort after 10 s
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

    /* Force language of response when expecting plain text -------- */
    if (tool === 'string') {
      const setResponseLanguage =
        locale === 'hi'
          ? 'सभी उत्तर हिंदी (hi-IN) में देवनागरी लिपि का उपयोग करके दें। अंग्रेज़ी या रोमन लिपि का प्रयोग न करें।'
          : 'Provide all answers in English (en-US) using the Roman script.';
      (payload.messages as unknown[]).unshift({
        role: 'system',
        content: setResponseLanguage,
      });
    }

    /* Route to correct helper ------------------------------------- */
    switch (tool) {
      case 'boolean':
        return this.getBooleanFromAI(payload);
      case 'string':
        return this.getStringFromAI(payload, locale);
      default:
        throw new Error('Invalid AI call.');
    }
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

      if (typeof text !== 'string') {
        throw new Error('Unexpected transcription response');
      }
      return text.trim();
    } catch (err) {
      if (this.isTimeout(err)) {
        this.log.warn('Transcription timed out - returning empty string');
        if (locale === 'hi') {
          return 'कुछ गलत हो गया है। दोबारा कोशिश करें।';
        } else {
          return 'Something went wrong. Please try again.';
        }
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
    payload.tools = tools;
    payload.tool_choice = {
      type: 'function',
      function: { name: 'boolean' },
    };
    try {
      const response = await this.callOpenAI(payload);
      if (!ToolCallBooleanResponseSchema.safeParse(response.data).success) {
        throw new Error(
          `OpenAI response does not match ToolCallBooleanResponseSchema. data: ${JSON.stringify(
            response.data,
          )}`,
        );
      }

      const message = response.data.choices[0].message;
      const rawArgs = message.tool_calls?.[0]?.function?.arguments;
      if (!rawArgs) {
        throw new Error('OpenAI did not return expected tool arguments');
      }
      const parsed = JSON.parse(rawArgs) as { response: boolean };
      return parsed.response;
    } catch (err) {
      if (this.isTimeout(err)) {
        this.log.warn('Completion timed out - falling back to `false`');
        return false; // default
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
      const response = await this.callOpenAI(payload);
      if (!PlainStringResponseSchema.safeParse(response).success) {
        throw new Error('Unexpected response structure from OpenAI');
      }
      const content = response.data.choices[0].message.content;
      if (content === null) {
        throw new Error('OpenAI returned null content');
      }
      return content;
    } catch (err) {
      if (this.isTimeout(err)) {
        this.log.warn('Completion timed out - returning empty string');
        if (locale === 'hi') {
          return 'कुछ गलत हो गया है। दोबारा कोशिश करें।';
        } else {
          return 'Something went wrong. Please try again.';
        }
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
        payload as never, // casting keeps call-site unchanged
      );
      return { data: completion };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'unknown OpenAI SDK error';
      throw new Error(`OpenAI request failed: ${message}`);
    }
  }

  /* ============================================================
   *  Helpers
   * ============================================================*/
  private isTimeout(err: unknown): boolean {
    if (err && typeof err === 'object') {
      const e = err as { name?: string; message?: string };
      return (
        (!!e.name && e.name.toLowerCase().includes('timeout')) ||
        (!!e.message && e.message.toLowerCase().includes('timeout')) ||
        (!!e.name && e.name.toLowerCase().includes('abort'))
      );
    }
    return false;
  }
}
