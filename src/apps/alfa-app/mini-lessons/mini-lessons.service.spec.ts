import { Test, TestingModule } from '@nestjs/testing';
import { MiniLessonsService } from './mini-lessons.service';

describe('MiniLessonsService', () => {
  let service: MiniLessonsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MiniLessonsService],
    }).compile();

    service = module.get<MiniLessonsService>(MiniLessonsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
