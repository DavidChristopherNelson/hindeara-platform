import { Injectable } from '@nestjs/common';
import { CreateMiniLessonDto } from './dto/create-mini-lesson.dto';
import { MiniLesson } from './entities/mini-lesson.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class MiniLessonsService {
  constructor(
    @InjectRepository(MiniLesson)
    private miniLessonRepository: Repository<MiniLesson>,
  ) {}

  async create(createMiniLessonDto: CreateMiniLessonDto): Promise<MiniLesson> {
    const miniLesson = this.miniLessonRepository.create(createMiniLessonDto);
    return this.miniLessonRepository.save(miniLesson);
  }

  async findAll(): Promise<MiniLesson[]> {
    return this.miniLessonRepository.find();
  }

  async findOne(id: number): Promise<MiniLesson | null> {
    return this.miniLessonRepository.findOne({ where: { id } });
  }

  async remove(id: number): Promise<void> {
    await this.miniLessonRepository.delete(id);
  }
}
