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
      const response: AxiosResponse<ChatCompletionResponse> = await axios.post(
        this.apiUrl,
        {
          model: 'gpt-4',
          messages,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const reply = response.data.choices[0]?.message?.content;
      if (!reply) {
        throw new Error('No reply returned from ChatGPT');
      }
      return reply;
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'message' in error) {
        this.logger.error(
          'Failed to call ChatGPT API',
          (error as { message: string }).message,
        );
      } else {
        this.logger.error('Unknown error calling ChatGPT API');
      }
      throw error;
    }
  }
}
