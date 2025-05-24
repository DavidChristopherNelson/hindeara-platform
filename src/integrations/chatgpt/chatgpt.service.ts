import type { ChatCompletion } from 'openai/resources/chat';
import { Injectable } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
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

    console.log(`tool: ${tool}`);
    switch (tool) {
      case 'boolean':
        console.log('switch getBooleanFromAI');
        return this.getBooleanFromAI(payload);
      case 'string':
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
    return axios.post(this.apiUrl, payload, { headers });
  }
}
