import { Module } from '@nestjs/common';
import { MiniLessonsService } from './mini-lessons.service';
import { MiniLessonsController } from './mini-lessons.controller';

@Module({
  controllers: [MiniLessonsController],
  providers: [MiniLessonsService],
})
export class MiniLessonsModule {}
