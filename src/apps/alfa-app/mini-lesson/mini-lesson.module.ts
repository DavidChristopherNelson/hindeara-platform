import { Module } from '@nestjs/common';
import { MiniLessonService } from './mini-lesson.service';
import { MiniLessonController } from './mini-lesson.controller';

@Module({
  controllers: [MiniLessonController],
  providers: [MiniLessonService],
})
export class MiniLessonModule {}
