import { Module } from '@nestjs/common';
import { EvaluateController } from './evaluate.controller';

@Module({
  controllers: [EvaluateController],
})
export class StateModule {}
