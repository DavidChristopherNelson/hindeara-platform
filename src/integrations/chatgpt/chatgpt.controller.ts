import { Controller, Post, Body } from '@nestjs/common';
import { ChatGPTService } from './chatgpt.service';
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
  async chat(@Body('message') userPrompt: string) {
    return this.chatGPTService.sendMessage(userPrompt);
  }

  @Post('/chat/boolean')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Is Paris the capital of France?' },
      },
      required: ['message'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'AI-generated reply (boolean)',
    schema: {
      type: 'object',
      properties: { reply: { type: 'boolean', example: true } },
    },
  })
  @LogMethod()
  async chatBoolean(@Body('message') userPrompt: string) {
    return this.chatGPTService.sendMessage(
      userPrompt,
      'You are a helpful assistant.',
      'boolean',
    );
  }
}
