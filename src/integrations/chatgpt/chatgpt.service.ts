import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import { ChatCompletionResponse, ChatMessage } from './chatgpt.types';
import { LogMethod } from 'src/common/decorators/log-method.decorator';

@Injectable()
export class ChatGPTService {
  private readonly logger = new Logger(ChatGPTService.name);
  private readonly apiUrl = 'https://api.openai.com/v1/chat/completions';
  private readonly apiKey = process.env.OPENAI_API_KEY;

  @LogMethod()
  async sendMessage(messages: ChatMessage[]): Promise<string> {
    try {
      const response = await this.callOpenAI(messages);
      return this.extractReply(response);
    } catch (error: unknown) {
      this.handleError(error);
      throw error;
    }
  }

  private async callOpenAI(
    messages: ChatMessage[],
  ): Promise<AxiosResponse<ChatCompletionResponse>> {
    const payload = {
      model: 'gpt-3.5-turbo',
      messages,
    };

    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };

    return axios.post(this.apiUrl, payload, { headers });
  }

  private extractReply(
    response: AxiosResponse<ChatCompletionResponse>,
  ): string {
    const reply = response.data.choices[0]?.message?.content;
    if (!reply) {
      throw new Error('No reply returned from ChatGPT');
    }
    return reply;
  }

  private handleError(error: unknown): void {
    if (this.isErrorWithMessage(error)) {
      const typedError = error as { message: string };
      this.logger.error('Failed to call ChatGPT API', typedError.message);
    } else {
      this.logger.error('Unknown error calling ChatGPT API');
    }
  }

  private isErrorWithMessage(error: unknown): error is { message: string } {
    return (
      typeof error === 'object' &&
      error !== null &&
      typeof (error as { message?: unknown }).message === 'string'
    );
  }
}
