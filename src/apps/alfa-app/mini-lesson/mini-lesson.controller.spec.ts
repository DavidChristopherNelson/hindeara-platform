import { Test, TestingModule } from '@nestjs/testing';
import { MiniLessonController } from './mini-lesson.controller';
import { MiniLessonService } from './mini-lesson.service';

describe('MiniLessonController', () => {
  let controller: MiniLessonController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MiniLessonController],
      providers: [MiniLessonService],
    }).compile();

    controller = module.get<MiniLessonController>(MiniLessonController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
