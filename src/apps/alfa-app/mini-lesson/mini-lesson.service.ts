import { Injectable } from '@nestjs/common';
import { CreateMiniLessonDto } from './dto/create-mini-lesson.dto';
import { UpdateMiniLessonDto } from './dto/update-mini-lesson.dto';

@Injectable()
export class MiniLessonService {
  create(createMiniLessonDto: CreateMiniLessonDto) {
    return 'This action adds a new miniLesson';
  }

  findAll() {
    return `This action returns all miniLesson`;
  }

  findOne(id: number) {
    return `This action returns a #${id} miniLesson`;
  }

  update(id: number, updateMiniLessonDto: UpdateMiniLessonDto) {
    return `This action updates a #${id} miniLesson`;
  }

  remove(id: number) {
    return `This action removes a #${id} miniLesson`;
  }
}
