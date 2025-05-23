import type { ChatCompletion } from 'openai/resources/chat';
import { Injectable } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import { LogMethod } from 'src/common/decorators/log-method.decorator';
import {
  StringResponseSchema,
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

interface ToolMap {
  boolean: boolean;
  string: string;
}

@Injectable()
export class ChatGPTService {
  private readonly apiUrl = 'https://api.openai.com/v1/chat/completions';
  private readonly apiKey = process.env.OPENAI_API_KEY ?? '';

  @LogMethod()
  async sendMessage(
    userPrompt: string,
    roleContent: string = 'You are a helpful assistant.',
    tool: ToolName = 'string',
  ): Promise<string | boolean> {
    const payload = {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: roleContent },
        { role: 'user', content: userPrompt },
      ],
    };

    switch (tool) {
      case 'boolean':
        return this.getBooleanFromAI(payload);
      case 'string':
        return this.getStringFromAI(payload);
      default:
        throw new Error('Invalid AI call.');
    }
  }

  private async getResponseFromAI(
    payload: Record<string, unknown>,
    tool: ToolName,
  ): Promise<boolean> {
    payload.tools = tools;
    payload.tool_choice = {
      type: 'function',
      function: `${tool}`,
    };
    const response = await this.callOpenAI(payload);
    if (!ToolCallBooleanResponseSchema.safeParse(response).success) {
      throw new Error('Unexpected response structure from OpenAI');
    }

    const message = response.data.choices[0].message;
    if (!message.tool_calls?.[0]?.function?.arguments) {
      throw new Error('Unexpected response structure from OpenAI');
    }
    const rawArgs = message.tool_calls[0].function.arguments;
    const parsed = JSON.parse(rawArgs) as { response: boolean };
    return parsed.response;
  }

  private async getStringFromAI(
    payload: Record<string, unknown>,
  ): Promise<string> {
    const response = await this.callOpenAI(payload);
    if (!StringResponseSchema.safeParse(response).success) {
      throw new Error('Unexpected response structure from OpenAI');
    }
    const message = response.data.choices[0].message;
    if (!message.tool_calls?.[0]?.function?.arguments) {
      throw new Error('Unexpected response structure from OpenAI');
    }
    const rawArgs = message.tool_calls[0].function.arguments;
    const parsed = JSON.parse(rawArgs) as { response: string };
    return parsed.response;
  }

  private async callOpenAI(
    payload: Record<string, unknown>,
  ): Promise<AxiosResponse<ChatCompletion>> {
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
    return axios.post(this.apiUrl, payload, { headers });
  }
}
