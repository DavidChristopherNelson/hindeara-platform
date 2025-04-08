import { Test, TestingModule } from '@nestjs/testing';
import { HindearaEventsController } from './hindeara-events.controller';
import { HindearaEventsService } from './hindeara-events.service';

describe('HindearaEventsController', () => {
  let controller: HindearaEventsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HindearaEventsController],
      providers: [HindearaEventsService],
    }).compile();

    controller = module.get<HindearaEventsController>(HindearaEventsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
