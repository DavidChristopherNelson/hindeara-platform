// src/integrations/chatgpt/chatgpt.service.ts
import type { ChatCompletion } from 'openai/resources/chat';
import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
/* eslint-disable @typescript-eslint/no-require-imports --
 * form-data is CommonJS-only (export =) so this is the correct form. */
import FormData = require('form-data');
/* eslint-enable @typescript-eslint/no-require-imports */
import { LogMethod } from 'src/common/decorators/log-method.decorator';
import {
  PlainStringResponseSchema,
  ToolCallBooleanResponseSchema,
} from './chatgpt.schema';

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

@Injectable()
export class ChatGPTService {
  private readonly apiUrl = 'https://api.openai.com/v1/chat/completions';
  private readonly apiKey = process.env.OPENAI_API_KEY ?? '';
  private readonly log = new Logger(ChatGPTService.name);

  @LogMethod()
  async sendMessage({
    userPrompt,
    roleContent = 'You are a helpful assistant that speaks in informal language like a child does. The student is the same age as you.',
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
    const payload = {
      model,
      messages: [
        { role: 'system', content: roleContent },
        { role: 'user', content: userPrompt },
      ],
    };

    let setResponseLanguage: string;
    switch (locale) {
      case 'en':
        setResponseLanguage =
          'Provide all answers in English (en-US) using the Roman script.';
        break;
      case 'hi':
        setResponseLanguage =
          'सभी उत्तर हिंदी (hi-IN) में देवनागरी लिपि का उपयोग करके दें। अंग्रेज़ी या रोमन लिपि का प्रयोग न करें।';
        break;
      default:
        throw new Error(`Unknown language detected. locale = ${locale}`);
    }

    console.log(`tool: ${tool}`);

    switch (tool) {
      case 'boolean':
        console.log('switch getBooleanFromAI');
        return this.getBooleanFromAI(payload);
      case 'string':
        payload.messages.unshift({
          role: 'system',
          content: setResponseLanguage,
        });
        return this.getStringFromAI(payload);
      default:
        throw new Error('Invalid AI call.');
    }
  }

  @LogMethod()
  private async getBooleanFromAI(
    payload: Record<string, unknown>,
  ): Promise<boolean> {
    payload.tools = tools;
    payload.tool_choice = {
      type: 'function',
      function: { name: 'boolean' },
    };
    const response = await this.callOpenAI(payload);
    if (!ToolCallBooleanResponseSchema.safeParse(response.data).success) {
      throw new Error(
        `OpenAI's response data structure does not match ToolCallBooleanResponseSchema. response.data: ${JSON.stringify(response.data)}`,
      );
    }

    const message = response.data.choices[0].message;
    if (!message.tool_calls?.[0]?.function?.arguments) {
      throw new Error(
        `OpenAI did not return the data structure requested in the tool. message: ${JSON.stringify(message)}`,
      );
    }
    const rawArgs = message.tool_calls[0].function.arguments;
    const parsed = JSON.parse(rawArgs) as { response: boolean };
    return parsed.response;
  }

  @LogMethod()
  private async getStringFromAI(
    payload: Record<string, unknown>,
  ): Promise<string> {
    const response = await this.callOpenAI(payload);
    if (!PlainStringResponseSchema.safeParse(response).success) {
      throw new Error('Unexpected response structure from OpenAI');
    }
    const content = response.data.choices[0].message.content;
    if (content === null) {
      throw new Error('OpenAI returned null content');
    }
    return content;
  }

  @LogMethod()
  private async callOpenAI(
    payload: Record<string, unknown>,
  ): Promise<AxiosResponse<ChatCompletion>> {
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };

    try {
      return await axios.post(this.apiUrl, payload, {
        headers,
        timeout: 10000,
      });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        throw new Error(`OpenAI request failed: ${err.message}`);
      }
      throw new Error('OpenAI request failed: unknown error');
    }
  }

  @LogMethod()
  async transcribeAudio(
    audio: Buffer,
    locale: string,
    model: string = 'gpt-4o-transcribe',
  ): Promise<string> {
    /* Build multipart/form-data body ---------------------------------- */
    const form = new FormData();
    form.append('file', audio, {
      filename: 'audio.webm',
      contentType: 'audio/webm',
    });
    form.append('model', model);
    form.append('response_format', 'json');
    form.append('language', locale);

    /* Compose headers -------------------------------------------------- */
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      ...form.getHeaders(),
    };

    type TranscriptionResponse = { text: string };

    const { data } = await axios.post<TranscriptionResponse>(
      'https://api.openai.com/v1/audio/transcriptions',
      form,
      { headers, timeout: 20_000 },
    );

    if (typeof data?.text !== 'string') {
      throw new Error('Unexpected transcription response');
    }
    return data.text.trim();
  }
}
