import { Controller, Post, Body } from '@nestjs/common';
import { ChatGPTService } from './chatgpt.service';
import { ChatMessage } from './chatgpt.types';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LogMethod } from 'src/common/decorators/log-method.decorator';

@ApiTags('chatgpt')
@Controller('chatgpt')
export class ChatGPTController {
  constructor(private readonly chatGPTService: ChatGPTService) {}

  @Post('/chat')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'What is the capital of France?',
        },
      },
      required: ['message'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'AI-generated reply from ChatGPT',
    schema: {
      type: 'object',
      properties: {
        reply: {
          type: 'string',
          example: 'The capital of France is Paris.',
        },
      },
    },
  })
  @LogMethod()
  async chat(@Body('message') message: string) {
    const messages: ChatMessage[] = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: message },
    ] as const;

    const reply = await this.chatGPTService.sendMessage(messages);
    return { reply };
  }
}
