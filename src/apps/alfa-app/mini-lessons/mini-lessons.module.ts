import { Module } from '@nestjs/common';
import { MiniLessonsService } from './mini-lessons.service';
import { MiniLessonsController } from './mini-lessons.controller';
import { MiniLesson } from './entities/mini-lesson.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PhonemesModule } from '../phonemes/phonemes.module';

@Module({
  imports: [TypeOrmModule.forFeature([MiniLesson]), PhonemesModule],
  controllers: [MiniLessonsController],
  providers: [MiniLessonsService],
  exports: [MiniLessonsService],
})
export class MiniLessonsModule {}
