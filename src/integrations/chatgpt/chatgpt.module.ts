import { Module } from '@nestjs/common';
import { ChatGPTService } from './chatgpt.service';
import { ChatGPTController } from './chatgpt.controller';

@Module({
  controllers: [ChatGPTController],
  providers: [ChatGPTService],
  exports: [ChatGPTService],
})
export class ChatGPTModule {}
