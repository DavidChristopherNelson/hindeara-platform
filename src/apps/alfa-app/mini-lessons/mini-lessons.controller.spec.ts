import { Test, TestingModule } from '@nestjs/testing';
import { MiniLessonsController } from './mini-lessons.controller';
import { MiniLessonsService } from './mini-lessons.service';

describe('MiniLessonsController', () => {
  let controller: MiniLessonsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MiniLessonsController],
      providers: [MiniLessonsService],
    }).compile();

    controller = module.get<MiniLessonsController>(MiniLessonsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
