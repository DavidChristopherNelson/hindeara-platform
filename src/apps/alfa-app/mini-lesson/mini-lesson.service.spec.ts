import { Test, TestingModule } from '@nestjs/testing';
import { MiniLessonService } from './mini-lesson.service';

describe('MiniLessonService', () => {
  let service: MiniLessonService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MiniLessonService],
    }).compile();

    service = module.get<MiniLessonService>(MiniLessonService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
